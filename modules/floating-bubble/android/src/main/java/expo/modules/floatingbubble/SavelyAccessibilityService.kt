package expo.modules.floatingbubble

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.graphics.Rect
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

class SavelyAccessibilityService : AccessibilityService() {

    companion object {
        @Volatile var instance: SavelyAccessibilityService? = null

        private val URL_RE = Regex("https?://[^\\s\"'<>]{8,}")
        private val INSTAGRAM_RE = Regex("instagram\\.com/(p|reel|tv|stories)/([A-Za-z0-9_-]+)")
        private val TWITTER_RE = Regex("(?:twitter|x)\\.com/[^/?\\s]+/status/(\\d+)")
        private val YOUTUBE_RE = Regex("(?:youtube\\.com/(?:watch\\?v=|shorts/)|youtu\\.be/)([A-Za-z0-9_-]{6,20})")
        private val LINKEDIN_RE = Regex("linkedin\\.com/(?:posts|feed/update|pulse)/([A-Za-z0-9_%.-]+)")
        private val USERNAME_RE = Regex("^@?[\\w.]{1,30}$")
        private val COUNT_RE = Regex("^[\\d.,]+[KMB]?\\s*(likes?|comments?|views?|followers?|reposts?|retweets?|shares?)$", RegexOption.IGNORE_CASE)
        private val TIME_RE = Regex("^(\\d+\\s*(s|m|h|d|w|mo|hr|min|sec|second|minute|hour|day|week|month)s?|just now|now)$", RegexOption.IGNORE_CASE)

        // Target packages we handle
        private val TARGET_PACKAGES = arrayOf(
            "com.instagram.android",
            "com.twitter.android",
            "com.x.android",
            "com.linkedin.android",
            "com.google.android.youtube",
            "com.google.android.apps.maps",
        )
    }

    override fun onServiceConnected() {
        instance = this
        serviceInfo = AccessibilityServiceInfo().apply {
            eventTypes = AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED or AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED
            feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
            packageNames = TARGET_PACKAGES
            notificationTimeout = 500
            flags = AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS
        }
    }

    override fun onDestroy() {
        instance = null
        super.onDestroy()
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent) {}
    override fun onInterrupt() {}

    // ---- Public API: called by FloatingBubbleService at drop moment ----

    /**
     * At the moment the bubble is dropped at (screenX, screenY),
     * find the content card under those coordinates and extract its data.
     * No clipboard, no share sheet — pure accessibility tree inspection.
     */
    fun detectContentAtPoint(screenX: Int, screenY: Int): ContentMetadata? {
        val root = try { rootInActiveWindow } catch (_: Throwable) { return null } ?: return null
        val pkg = root.packageName?.toString()
        if (pkg == null) { root.recycle(); return null }

        return try {
            val screenWidth = resources.displayMetrics.widthPixels
            val minCardWidth = (screenWidth * 0.68).toInt()

            val allTexts = mutableListOf<String>()
            val allUrls = mutableListOf<String>()

            // Walk the tree and find the smallest "card" node containing the touch point
            // Collect ALL text from that card's subtree
            findCardAndCollect(root, screenX, screenY, minCardWidth, allTexts, allUrls, depth = 0)

            if (allTexts.isEmpty() && allUrls.isEmpty()) return null
            buildContentMetadata(allTexts, allUrls, pkg)
        } finally {
            root.recycle()
        }
    }

    // ---- Tree Walking ----

    /**
     * Recursive DFS:
     * - If a node is a "card" (full-width, tall-enough, contains touch point) → collect its whole subtree
     * - Otherwise keep descending toward the touch point
     */
    private fun findCardAndCollect(
        node: AccessibilityNodeInfo,
        x: Int, y: Int,
        minCardWidth: Int,
        texts: MutableList<String>,
        urls: MutableList<String>,
        depth: Int,
    ) {
        if (depth > 14) return
        val rect = Rect()
        node.getBoundsInScreen(rect)
        if (!rect.contains(x, y)) return

        val isCard = rect.width() >= minCardWidth && rect.height() >= dpToPx(100)
        if (isCard) {
            // Found a candidate card — collect everything inside it
            collectSubtree(node, texts, urls, subDepth = 0)
            return
        }

        // Not a card yet — keep descending toward the touch point
        for (i in 0 until node.childCount) {
            val child = node.getChild(i) ?: continue
            findCardAndCollect(child, x, y, minCardWidth, texts, urls, depth + 1)
        }
    }

    /** Collect all text/URL strings from a node's full subtree */
    private fun collectSubtree(
        node: AccessibilityNodeInfo,
        texts: MutableList<String>,
        urls: MutableList<String>,
        subDepth: Int,
    ) {
        if (subDepth > 12) return

        listOfNotNull(
            node.text?.toString()?.trim(),
            node.contentDescription?.toString()?.trim(),
        ).filter { it.isNotBlank() && it.length > 1 }.forEach { raw ->
            URL_RE.findAll(raw).forEach { urls.add(it.value) }
            if (!texts.contains(raw)) texts.add(raw)
        }

        for (i in 0 until node.childCount) {
            val child = node.getChild(i) ?: continue
            collectSubtree(child, texts, urls, subDepth + 1)
        }
    }

    // ---- Content parsing ----

    private fun buildContentMetadata(texts: List<String>, rawUrls: List<String>, pkg: String): ContentMetadata {
        val platform = platformFromPkg(pkg)

        // Try to find/construct a canonical URL
        val url = findCanonicalUrl(rawUrls, texts, platform)

        // Filter out noise (counts, timestamps, single chars, UI labels)
        val meaningful = texts.filter { isMeaningfulText(it) }

        // Author: first @handle or short all-word token
        val author = meaningful.firstOrNull { USERNAME_RE.matches(it.trimStart('@')) && it.length <= 32 }
            ?: texts.firstOrNull { it.startsWith("@") }

        // Title: longest single-line text that is not author/count/time
        val title = meaningful
            .filter { it != author && !it.startsWith("@") && it.length in 8..200 }
            .maxByOrNull { it.length }

        // Description: second-longest text (caption)
        val description = meaningful
            .filter { it != author && it != title && it.length > 10 }
            .maxByOrNull { it.length }
            ?.takeIf { it != title }

        return ContentMetadata(
            url = url ?: syntheticUrl(platform),
            title = title,
            description = description,
            imageUrl = null,
            siteName = siteNameFromPlatform(platform),
            platform = platform,
        )
    }

    private fun findCanonicalUrl(rawUrls: List<String>, texts: List<String>, platform: String): String? {
        val allText = texts.joinToString(" ")

        // 1. Direct URL in tree
        rawUrls.firstOrNull { matchesPlatform(it, platform) }?.let { return it }

        // 2. Construct from ID patterns found in text
        return when (platform) {
            "youtube" -> YOUTUBE_RE.find(allText)?.groupValues?.getOrNull(1)
                ?.let { "https://www.youtube.com/watch?v=$it" }

            "instagram" -> INSTAGRAM_RE.find(allText)?.value
                ?.let { "https://www.$it" }

            "twitter" -> TWITTER_RE.find(allText)?.value
                ?.let { "https://$it" }

            "linkedin" -> LINKEDIN_RE.find(allText)?.value
                ?.let { "https://www.$it" }

            else -> rawUrls.firstOrNull { it.startsWith("https://") }
        }
    }

    // ---- Helpers ----

    private fun isMeaningfulText(t: String): Boolean {
        if (t.length < 2) return false
        if (COUNT_RE.matches(t)) return false
        if (TIME_RE.matches(t)) return false
        val uiNoise = setOf(
            "Like", "Comment", "Share", "Save", "Follow", "Following",
            "Repost", "Retweet", "Reply", "More", "See more", "See less",
            "Verified", "Sponsored", "Ad", "Suggested", "Promoted",
            "Post", "Story", "Reel", "Watch", "Subscribe",
            "Trending", "For you", "Following",
        )
        if (uiNoise.any { t.equals(it, ignoreCase = true) }) return false
        return true
    }

    private fun matchesPlatform(url: String, platform: String): Boolean {
        val u = url.lowercase()
        return when (platform) {
            "youtube" -> u.contains("youtube.com") || u.contains("youtu.be")
            "instagram" -> u.contains("instagram.com")
            "twitter" -> u.contains("twitter.com") || u.contains("x.com")
            "linkedin" -> u.contains("linkedin.com")
            "maps" -> u.contains("maps.google") || u.contains("google.com/maps")
            else -> true
        }
    }

    private fun platformFromPkg(pkg: String) = when (pkg) {
        "com.instagram.android" -> "instagram"
        "com.twitter.android", "com.x.android" -> "twitter"
        "com.google.android.youtube" -> "youtube"
        "com.linkedin.android" -> "linkedin"
        "com.google.android.apps.maps" -> "maps"
        else -> "link"
    }

    private fun siteNameFromPlatform(platform: String) = when (platform) {
        "youtube" -> "YouTube"
        "instagram" -> "Instagram"
        "twitter" -> "Twitter"
        "linkedin" -> "LinkedIn"
        "maps" -> "Google Maps"
        else -> null
    }

    // Fallback URL when we only have platform but no specific post ID
    private fun syntheticUrl(platform: String) = when (platform) {
        "youtube" -> "https://www.youtube.com"
        "instagram" -> "https://www.instagram.com"
        "twitter" -> "https://www.x.com"
        "linkedin" -> "https://www.linkedin.com"
        "maps" -> "https://maps.google.com"
        else -> "https://savely.app"
    }

    private fun dpToPx(dp: Int) = (dp * resources.displayMetrics.density).toInt()
}
