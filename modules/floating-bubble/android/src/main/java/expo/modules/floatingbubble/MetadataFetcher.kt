package expo.modules.floatingbubble

import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder

data class ContentMetadata(
    val url: String,
    val title: String?,
    val description: String?,
    val imageUrl: String?,
    val siteName: String?,
    val platform: String,
)

object MetadataFetcher {

    private const val TIMEOUT = 8000
    private const val MAX_HEAD_BYTES = 24_000

    private val OG_TITLE = Regex("""<meta[^>]+property=["']og:title["'][^>]+content=["']([^"'<]+)["']""", RegexOption.IGNORE_CASE)
    private val OG_TITLE_ALT = Regex("""<meta[^>]+content=["']([^"'<]+)["'][^>]+property=["']og:title["']""", RegexOption.IGNORE_CASE)
    private val OG_DESC = Regex("""<meta[^>]+property=["']og:description["'][^>]+content=["']([^"'<]+)["']""", RegexOption.IGNORE_CASE)
    private val OG_DESC_ALT = Regex("""<meta[^>]+content=["']([^"'<]+)["'][^>]+property=["']og:description["']""", RegexOption.IGNORE_CASE)
    private val OG_IMAGE = Regex("""<meta[^>]+property=["']og:image["'][^>]+content=["']([^"'<]+)["']""", RegexOption.IGNORE_CASE)
    private val OG_IMAGE_ALT = Regex("""<meta[^>]+content=["']([^"'<]+)["'][^>]+property=["']og:image["']""", RegexOption.IGNORE_CASE)
    private val OG_SITE = Regex("""<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"'<]+)["']""", RegexOption.IGNORE_CASE)
    private val OG_SITE_ALT = Regex("""<meta[^>]+content=["']([^"'<]+)["'][^>]+property=["']og:site_name["']""", RegexOption.IGNORE_CASE)
    private val TITLE_TAG = Regex("""<title[^>]*>([^<]+)</title>""", RegexOption.IGNORE_CASE)

    fun fetch(url: String): ContentMetadata {
        val platform = detectPlatform(url)

        if (platform == "youtube") {
            val videoId = extractYouTubeId(url)
            val oembed = fetchYouTubeOembed(url)
            if (oembed != null) return oembed
            if (videoId != null) {
                return ContentMetadata(
                    url = url, title = null, description = null,
                    imageUrl = "https://img.youtube.com/vi/$videoId/hqdefault.jpg",
                    siteName = "YouTube", platform = platform,
                )
            }
        }

        val ogResult = fetchOgTags(url, platform)
        if (ogResult != null && (ogResult.title != null || ogResult.imageUrl != null)) return ogResult

        val microlink = fetchMicrolink(url, platform)
        if (microlink != null) return microlink

        return ContentMetadata(url = url, title = null, description = null, imageUrl = null, siteName = null, platform = platform)
    }

    private fun fetchYouTubeOembed(url: String): ContentMetadata? = try {
        val oembedUrl = "https://www.youtube.com/oembed?url=${URLEncoder.encode(url, "UTF-8")}&format=json"
        val json = getJson(oembedUrl) ?: return null
        ContentMetadata(
            url = url,
            title = json.optString("title").takeIf { it.isNotBlank() },
            description = null,
            imageUrl = json.optString("thumbnail_url").takeIf { it.isNotBlank() },
            siteName = "YouTube",
            platform = "youtube",
        )
    } catch (_: Throwable) { null }

    private fun fetchOgTags(url: String, platform: String): ContentMetadata? = try {
        val conn = (URL(url).openConnection() as HttpURLConnection).apply {
            connectTimeout = TIMEOUT
            readTimeout = TIMEOUT
            setRequestProperty("User-Agent", "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)")
            setRequestProperty("Accept", "text/html,application/xhtml+xml")
            instanceFollowRedirects = true
        }
        if (conn.responseCode !in 200..299) { conn.disconnect(); return null }

        val sb = StringBuilder()
        var bytesRead = 0
        val reader = BufferedReader(InputStreamReader(conn.inputStream, Charsets.UTF_8))
        var line: String?
        while (reader.readLine().also { line = it } != null && bytesRead < MAX_HEAD_BYTES) {
            sb.appendLine(line)
            bytesRead += line?.length ?: 0
            if (line?.contains("</head>", ignoreCase = true) == true) break
        }
        reader.close()
        conn.disconnect()

        val html = sb.toString()
        ContentMetadata(
            url = url,
            title = (OG_TITLE.find(html) ?: OG_TITLE_ALT.find(html))?.groupValues?.getOrNull(1)?.trim()
                ?: TITLE_TAG.find(html)?.groupValues?.getOrNull(1)?.trim(),
            description = (OG_DESC.find(html) ?: OG_DESC_ALT.find(html))?.groupValues?.getOrNull(1)?.trim(),
            imageUrl = (OG_IMAGE.find(html) ?: OG_IMAGE_ALT.find(html))?.groupValues?.getOrNull(1)?.trim(),
            siteName = (OG_SITE.find(html) ?: OG_SITE_ALT.find(html))?.groupValues?.getOrNull(1)?.trim(),
            platform = platform,
        )
    } catch (_: Throwable) { null }

    private fun fetchMicrolink(url: String, platform: String): ContentMetadata? = try {
        val apiUrl = "https://api.microlink.io/?url=${URLEncoder.encode(url, "UTF-8")}"
        val json = getJson(apiUrl) ?: return null
        if (json.optString("status") != "success") return null
        val d = json.optJSONObject("data") ?: return null
        val image = d.optJSONObject("image")?.optString("url")?.takeIf { it.isNotBlank() }
            ?: d.optJSONObject("logo")?.optString("url")?.takeIf { it.isNotBlank() }
        ContentMetadata(
            url = url,
            title = d.optString("title").takeIf { it.isNotBlank() },
            description = d.optString("description").takeIf { it.isNotBlank() },
            imageUrl = image,
            siteName = d.optString("publisher").takeIf { it.isNotBlank() },
            platform = platform,
        )
    } catch (_: Throwable) { null }

    private fun getJson(url: String): JSONObject? {
        val conn = (URL(url).openConnection() as HttpURLConnection).apply {
            connectTimeout = TIMEOUT
            readTimeout = TIMEOUT
            setRequestProperty("User-Agent", "Savely/1.0")
        }
        return try {
            if (conn.responseCode !in 200..299) return null
            JSONObject(conn.inputStream.bufferedReader().readText())
        } catch (_: Throwable) { null } finally { conn.disconnect() }
    }

    private fun extractYouTubeId(url: String): String? {
        val patterns = listOf(
            Regex("youtube\\.com/watch\\?v=([A-Za-z0-9_-]+)"),
            Regex("youtu\\.be/([A-Za-z0-9_-]+)"),
            Regex("youtube\\.com/shorts/([A-Za-z0-9_-]+)"),
        )
        for (p in patterns) {
            return p.find(url)?.groupValues?.getOrNull(1) ?: continue
        }
        return null
    }

    fun detectPlatform(url: String): String {
        val u = url.lowercase()
        return when {
            u.contains("youtube.com") || u.contains("youtu.be") -> "youtube"
            u.contains("instagram.com") -> "instagram"
            u.contains("tiktok.com") -> "tiktok"
            u.contains("twitter.com") || u.contains("x.com") -> "twitter"
            u.contains("reddit.com") -> "reddit"
            u.contains("pinterest.com") -> "pinterest"
            u.contains("linkedin.com") -> "linkedin"
            u.contains("facebook.com") || u.contains("fb.com") -> "facebook"
            u.contains("threads.net") -> "threads"
            u.contains("spotify.com") -> "spotify"
            u.contains("maps.google") || u.contains("google.com/maps") -> "maps"
            else -> "link"
        }
    }
}
