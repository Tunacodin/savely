package expo.modules.sharingshortcuts

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL

data class PendingItem(val url: String, val collectionId: String?)

object SaveQueue {
  private const val FILE_NAME = "savely_pending_queue.json"

  private fun queueFile(ctx: Context) = File(ctx.filesDir, FILE_NAME)

  @Synchronized
  fun append(ctx: Context, url: String, collectionId: String?) {
    val arr = readArray(ctx)
    val obj = JSONObject().put("url", url).put("collectionId", collectionId ?: JSONObject.NULL)
    arr.put(obj)
    queueFile(ctx).writeText(arr.toString())
  }

  @Synchronized
  fun drainAll(ctx: Context): List<PendingItem> {
    val arr = readArray(ctx)
    val out = mutableListOf<PendingItem>()
    for (i in 0 until arr.length()) {
      val o = arr.getJSONObject(i)
      val cid = if (o.isNull("collectionId")) null else o.optString("collectionId")
      out.add(PendingItem(o.getString("url"), cid))
    }
    queueFile(ctx).delete()
    return out
  }

  private fun readArray(ctx: Context): JSONArray {
    val f = queueFile(ctx)
    if (!f.exists()) return JSONArray()
    return try {
      JSONArray(f.readText())
    } catch (_: Throwable) {
      JSONArray()
    }
  }

  fun saveDirect(ctx: Context, url: String, collectionId: String?): Boolean {
    val accessToken = CredentialStore.accessToken(ctx) ?: return false
    val userId = CredentialStore.userId(ctx) ?: return false
    val baseUrl = CredentialStore.supabaseUrl(ctx) ?: return false
    val anonKey = CredentialStore.anonKey(ctx) ?: return false

    val platform = detectPlatform(url)

    val body = JSONObject().apply {
      put("user_id", userId)
      put("url", url)
      put("title", "")
      put("platform", platform)
      put("content_type", "link")
      put("aspect_ratio", 1)
      put("metadata", JSONObject())
      put("is_enriched", false)
      if (collectionId != null) put("collection_id", collectionId)
    }.toString()

    return try {
      val conn = (URL("$baseUrl/rest/v1/saved_items").openConnection() as HttpURLConnection).apply {
        requestMethod = "POST"
        connectTimeout = 8000
        readTimeout = 10000
        doOutput = true
        setRequestProperty("Content-Type", "application/json")
        setRequestProperty("apikey", anonKey)
        setRequestProperty("Authorization", "Bearer $accessToken")
        setRequestProperty("Prefer", "return=minimal")
      }
      conn.outputStream.use { it.write(body.toByteArray(Charsets.UTF_8)) }
      val code = conn.responseCode
      conn.disconnect()
      code in 200..299
    } catch (_: Throwable) {
      false
    }
  }

  private fun detectPlatform(url: String): String {
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
      else -> "link"
    }
  }
}
