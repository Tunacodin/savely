package expo.modules.floatingbubble

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.content.ClipboardManager
import android.graphics.Rect
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

        private val SOCIAL_NATIVE_PKGS = setOf(
            "instagram", "twitter", "youtube", "linkedin", "tiktok"
        )
    }

    override fun onServiceConnected() {
        instance = this
        serviceInfo = AccessibilityServiceInfo().apply {
            eventTypes = AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED or AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED
            feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
            packageNames = null
            notificationTimeout = 500
            flags = AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS
        }
        SavelyLog.d("A11y", "onServiceConnected — service is live")
    }

    override fun onDestroy() {
        SavelyLog.d("A11y", "onDestroy — service disconnected")
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
        val root = try { rootInActiveWindow } catch (t: Throwable) {
            SavelyLog.e("A11y", "rootInActiveWindow threw", t); return null
        }
        if (root == null) { SavelyLog.w("A11y", "rootInActiveWindow is null"); return null }

        val pkg = root.packageName?.toString()
        if (pkg == null) { root.recycle(); SavelyLog.w("A11y", "pkg is null"); return null }

        SavelyLog.d("A11y", "detectContentAtPoint($screenX,$screenY) pkg=$pkg")

        return try {
            val screenWidth = resources.displayMetrics.widthPixels
            val minCardWidth = (screenWidth * 0.68).toInt()

            // Step 1: Browser URL bar — covers Chrome/Firefox viewing any website
            val browserUrl = findBrowserUrl(root, pkg)
            SavelyLog.d("A11y", "browserUrl=$browserUrl")

            // Step 2: Spatial card detection at touch point
            val cardTexts = mutableListOf<String>()
            val cardUrls = mutableListOf<String>()
            findCardAndCollect(root, screenX, screenY, minCardWidth, cardTexts, cardUrls, depth = 0)

            // Step 3: Merge URLs — browser URL has priority
            val allUrls = mutableListOf<String>()
            if (browserUrl != null) allUrls.add(browserUrl)
            cardUrls.forEach { if (it !in allUrls) allUrls.add(it) }

            // Step 4: Wide tree scan if still no URL found (catches native app deep links)
            if (allUrls.isEmpty()) {
                collectUrlsWide(root, allUrls, depth = 0)
                SavelyLog.d("A11y", "wide scan → ${allUrls.size} urls")
            }

            val pkgPlatform0 = platformFromPkg(pkg)

            // Step 5: Clipboard — native social apps check proactively regardless of allUrls state
            // because allUrls may contain CDN image URLs or caption links, not the actual post URL.
            // Browsers: clipboard only as last resort.
            if (pkgPlatform0 != "link") {
                val clipUrl = readClipboardUrl(pkg)
                if (clipUrl != null && clipUrl !in allUrls) {
                    // Insert at front so it beats CDN/caption URLs in findCanonicalUrl
                    allUrls.add(0, clipUrl)
                    SavelyLog.d("A11y", "clipboard proactive → $clipUrl")
                }
            } else if (allUrls.isEmpty()) {
                val clipUrl = readClipboardUrl(pkg)
                if (clipUrl != null) allUrls.add(clipUrl)
            }

            // Step 6: Auto trigger "More options → Copy link" when no specific post URL found yet
            if (pkgPlatform0 in SOCIAL_NATIVE_PKGS && !hasSpecificPostUrl(allUrls, pkgPlatform0)) {
                SavelyLog.d("A11y", "autoExtract: attempting for $pkg")
                val autoUrl = tryAutoExtractUrl(pkg, screenX, screenY)
                if (autoUrl != null && autoUrl !in allUrls) allUrls.add(0, autoUrl)
            }

            SavelyLog.d("A11y", "texts=${cardTexts.size} urls=${allUrls.size} | first=${cardTexts.firstOrNull()?.take(60)}")

            if (cardTexts.isEmpty() && allUrls.isEmpty()) {
                SavelyLog.w("A11y", "no content found at ($screenX,$screenY) in $pkg")
                return null
            }
            buildContentMetadata(cardTexts, allUrls, pkg)
        } finally {
            root.recycle()
        }
    }

    private fun findBrowserUrl(root: AccessibilityNodeInfo, pkg: String): String? {
        val urlBarId = when {
            pkg == "com.android.chrome" || pkg.startsWith("com.chrome.") -> "$pkg:id/url_bar"
            pkg.startsWith("org.mozilla.firefox") -> "$pkg:id/mozac_browser_toolbar_url_view"
            pkg == "com.sec.android.app.sbrowser" -> "$pkg:id/location_bar_edit_text"
            pkg.startsWith("com.microsoft.emmx") -> "$pkg:id/url_bar"
            pkg.startsWith("com.brave.browser") -> "$pkg:id/url_bar"
            pkg == "com.opera.browser" || pkg == "com.opera.mini.native" -> "$pkg:id/url_field"
            else -> return null
        }
        // Active window first
        extractUrlFromNodes(root.findAccessibilityNodeInfosByViewId(urlBarId))?.let { return it }
        // Fallback: search all windows (Chrome toolbar can be in a separate layer)
        return try {
            windows?.firstNotNullOfOrNull { window ->
                val r = window.root ?: return@firstNotNullOfOrNull null
                try { extractUrlFromNodes(r.findAccessibilityNodeInfosByViewId(urlBarId)) }
                finally { r.recycle() }
            }
        } catch (_: Throwable) { null }
    }

    private fun extractUrlFromNodes(nodes: List<AccessibilityNodeInfo>): String? {
        var found: String? = null
        for (node in nodes) {
            if (found == null) {
                val raw = node.contentDescription?.toString()?.trim()
                    ?: node.text?.toString()?.trim()
                if (raw != null && raw.isNotEmpty()) {
                    found = when {
                        raw.startsWith("https://") || raw.startsWith("http://") -> raw
                        raw.contains(".") && !raw.contains(" ") && raw.length > 5 -> "https://$raw"
                        else -> null
                    }
                }
            }
            node.recycle()
        }
        return found
    }

    private fun readClipboardUrl(pkg: String): String? {
        return try {
            val cm = getSystemService(CLIPBOARD_SERVICE) as ClipboardManager
            val clip = cm.primaryClip ?: return null
            if (clip.itemCount == 0) return null
            val text = clip.getItemAt(0).coerceToText(this).toString().trim()
            if (!text.startsWith("http://") && !text.startsWith("https://")) return null
            val platform = platformFromPkg(pkg)
            // For native social apps, verify clipboard URL matches platform
            if (platform != "link" && !matchesPlatform(text, platform)) return null
            SavelyLog.d("A11y", "clipboard fallback → $text")
            text
        } catch (_: Throwable) { null }
    }

    private fun collectUrlsWide(node: AccessibilityNodeInfo, urls: MutableList<String>, depth: Int) {
        if (depth > 10 || urls.size >= 5) return
        listOfNotNull(
            node.text?.toString()?.trim(),
            node.contentDescription?.toString()?.trim(),
        ).forEach { raw ->
            URL_RE.findAll(raw).map { it.value }
                .filter { it !in urls && !isImageUrl(it) }
                .forEach { urls.add(it) }
        }
        for (i in 0 until node.childCount) {
            val child = node.getChild(i) ?: continue
            collectUrlsWide(child, urls, depth + 1)
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
        val pkgPlatform = platformFromPkg(pkg)

        // Find canonical URL using pkg-derived platform for strategy hints
        val url = findCanonicalUrl(rawUrls, texts, pkgPlatform)

        // Re-derive platform from the actual URL (critical for browsers viewing social media)
        val platform = url?.let { MetadataFetcher.detectPlatform(it) }?.takeIf { it != "link" }
            ?: pkgPlatform

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

        val imageUrl = rawUrls.firstOrNull { isImageUrl(it) }

        return ContentMetadata(
            url = url ?: syntheticUrl(platform),
            title = title,
            description = description,
            imageUrl = imageUrl,
            siteName = siteNameFromPlatform(platform),
            platform = platform,
        )
    }

    private fun findCanonicalUrl(rawUrls: List<String>, texts: List<String>, platform: String): String? {
        val allText = texts.joinToString(" ")

        // 1. Direct URL in tree that matches platform (also handles browser URLs)
        rawUrls.firstOrNull { matchesPlatform(it, platform) }?.let { return it }

        // 2. For "link" platform (browsers), any https URL works
        if (platform == "link") {
            rawUrls.firstOrNull { it.startsWith("https://") }?.let { return it }
        }

        // 3. Construct from ID patterns found in text
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
        // CDN/media URLs (cdninstagram.com, pbs.twimg.com, etc.) must never be treated as post URLs
        if (isImageUrl(u)) return false
        return when (platform) {
            "youtube" -> u.contains("youtube.com") || u.contains("youtu.be")
            "instagram" -> u.contains("instagram.com")
            "twitter" -> u.contains("twitter.com") || u.contains("x.com")
            "linkedin" -> u.contains("linkedin.com")
            "maps" -> u.contains("maps.google") || u.contains("google.com/maps")
            else -> true
        }
    }

    private fun hasSpecificPostUrl(urls: List<String>, platform: String): Boolean {
        return urls.any { url ->
            when (platform) {
                "instagram" -> INSTAGRAM_RE.containsMatchIn(url)
                "youtube" -> YOUTUBE_RE.containsMatchIn(url)
                "twitter" -> TWITTER_RE.containsMatchIn(url)
                "linkedin" -> LINKEDIN_RE.containsMatchIn(url)
                else -> false
            }
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

    // ---- Auto URL extraction for native social apps ----

    private fun tryAutoExtractUrl(pkg: String, nearX: Int = -1, nearY: Int = -1): String? {
        val root = try { rootInActiveWindow } catch (_: Throwable) { return null } ?: return null
        return try {
            val moreBtn = findMoreOptionsButton(root, pkg, nearX, nearY)
            if (moreBtn == null) {
                SavelyLog.w("A11y", "autoExtract: no more-options button found")
                return null
            }
            SavelyLog.d("A11y", "autoExtract: clicking more-options")
            moreBtn.performAction(AccessibilityNodeInfo.ACTION_CLICK)
            Thread.sleep(700)

            val newRoot = try { rootInActiveWindow } catch (_: Throwable) { return null } ?: return null
            try {
                val copyLinkBtn = findCopyLinkButton(newRoot)
                if (copyLinkBtn == null) {
                    SavelyLog.w("A11y", "autoExtract: copy-link not found — dismissing menu")
                    performGlobalAction(GLOBAL_ACTION_BACK)
                    return null
                }
                SavelyLog.d("A11y", "autoExtract: clicking copy-link")
                copyLinkBtn.performAction(AccessibilityNodeInfo.ACTION_CLICK)
                Thread.sleep(300)
                // Menu closes automatically after "copy link" — no GLOBAL_ACTION_BACK needed here.
                // Pressing back after a successful copy would navigate the user away from the current page.

                val cm = getSystemService(CLIPBOARD_SERVICE) as ClipboardManager
                val clip = cm.primaryClip ?: return null
                if (clip.itemCount == 0) return null
                val text = clip.getItemAt(0).coerceToText(this).toString().trim()
                if (text.startsWith("http://") || text.startsWith("https://")) {
                    SavelyLog.d("A11y", "autoExtract: success → $text")
                    return text
                }
                null
            } finally {
                newRoot.recycle()
            }
        } finally {
            root.recycle()
        }
    }

    private fun findMoreOptionsButton(
        root: AccessibilityNodeInfo,
        pkg: String,
        nearX: Int = -1,
        nearY: Int = -1,
    ): AccessibilityNodeInfo? {
        val knownIds = when (pkg) {
            "com.instagram.android" -> listOf(
                "com.instagram.android:id/overflow_menu_icon",
                "com.instagram.android:id/row_feed_comment_like_action_bar_kebab",
            )
            "com.google.android.youtube" -> listOf(
                "com.google.android.youtube:id/menu_item_share",
            )
            "com.twitter.android", "com.x.android" -> listOf(
                "com.twitter.android:id/bar_share",
                "com.x.android:id/bar_share",
            )
            "com.linkedin.android" -> listOf(
                "com.linkedin.android:id/ntv_overflow_menu_button",
            )
            else -> emptyList()
        }
        for (id in knownIds) {
            try {
                val nodes = root.findAccessibilityNodeInfosByViewId(id)
                if (nodes.isNotEmpty()) {
                    // When multiple posts are visible in feed, pick the button closest to drop point
                    val btn = if (nodes.size == 1 || nearX < 0) {
                        val b = nodes[0]; nodes.drop(1).forEach { it.recycle() }; b
                    } else {
                        val best = nodes.minByOrNull { node ->
                            val r = Rect()
                            node.getBoundsInScreen(r)
                            val dx = r.centerX() - nearX
                            val dy = r.centerY() - nearY
                            dx * dx + dy * dy
                        }!!
                        nodes.filter { it !== best }.forEach { it.recycle() }
                        best
                    }
                    return btn
                }
            } catch (_: Throwable) {}
        }
        return findClickableByKeywords(root, listOf(
            "more options", "diğer seçenekler", "daha fazla seçenek",
            "share", "paylaş",
            "···", "...",
        ), depth = 0)
    }

    private fun findCopyLinkButton(root: AccessibilityNodeInfo): AccessibilityNodeInfo? {
        return findClickableByKeywords(root, listOf(
            "copy link", "bağlantıyı kopyala", "link kopyala", "linki kopyala",
            "copy url", "url kopyala",
        ), depth = 0)
    }

    private fun findClickableByKeywords(
        node: AccessibilityNodeInfo,
        keywords: List<String>,
        depth: Int,
    ): AccessibilityNodeInfo? {
        if (depth > 14) return null
        if (node.isClickable) {
            val combined = listOfNotNull(
                node.text?.toString(),
                node.contentDescription?.toString(),
            ).joinToString(" ").lowercase()
            if (keywords.any { combined.contains(it) }) return node
        }
        for (i in 0 until node.childCount) {
            val child = node.getChild(i) ?: continue
            val result = findClickableByKeywords(child, keywords, depth + 1)
            if (result != null) return result
        }
        return null
    }

    private fun isImageUrl(url: String): Boolean {
        val lower = url.lowercase()
        return lower.contains("cdninstagram.com") ||
               lower.contains("pbs.twimg.com") ||
               lower.contains("i.ytimg.com") ||
               lower.contains("scontent") ||
               lower.endsWith(".jpg") || lower.endsWith(".jpeg") ||
               lower.endsWith(".png") || lower.endsWith(".webp") ||
               lower.contains(".jpg?") || lower.contains(".jpeg?") ||
               lower.contains(".png?") || lower.contains(".webp?")
    }

    private fun dpToPx(dp: Int) = (dp * resources.displayMetrics.density).toInt()
}
