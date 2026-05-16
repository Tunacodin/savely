package expo.modules.floatingbubble

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

// Accesses the same SharedPreferences files as expo.modules.sharingshortcuts,
// so credentials and queue are shared between the two native modules.
object SharedStore {

    data class CollectionData(
        val id: String,
        val name: String,
        val emoji: String,
        val bgColor: String,
    )

    // ---------- Credentials (mirrors CredentialStore in sharing-shortcuts) ----------

    private fun securePrefs(ctx: Context) = try {
        val key = MasterKey.Builder(ctx).setKeyScheme(MasterKey.KeyScheme.AES256_GCM).build()
        EncryptedSharedPreferences.create(
            ctx, "savely_secure", key,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
        )
    } catch (_: Throwable) {
        ctx.getSharedPreferences("savely_secure_fallback", Context.MODE_PRIVATE)
    }

    fun accessToken(ctx: Context) = securePrefs(ctx).getString("accessToken", null)
    fun userId(ctx: Context) = securePrefs(ctx).getString("userId", null)
    fun supabaseUrl(ctx: Context) = securePrefs(ctx).getString("supabaseUrl", null)
    fun anonKey(ctx: Context) = securePrefs(ctx).getString("anonKey", null)

    // ---------- Collections (set by JS, read by bubble service) ----------

    private fun colPrefs(ctx: Context) =
        ctx.getSharedPreferences("savely_bubble_collections", Context.MODE_PRIVATE)

    fun setCollections(ctx: Context, cols: List<CollectionData>) {
        val arr = JSONArray()
        cols.forEach { c ->
            arr.put(JSONObject().apply {
                put("id", c.id)
                put("name", c.name)
                put("emoji", c.emoji)
                put("bgColor", c.bgColor)
            })
        }
        colPrefs(ctx).edit().putString("collections", arr.toString()).apply()
    }

    fun getCollections(ctx: Context): List<CollectionData> {
        val json = colPrefs(ctx).getString("collections", "[]") ?: "[]"
        return try {
            val arr = JSONArray(json)
            (0 until arr.length()).map { i ->
                val o = arr.getJSONObject(i)
                CollectionData(
                    o.getString("id"),
                    o.getString("name"),
                    o.optString("emoji", "📁"),
                    o.optString("bgColor", "#f4f4f5"),
                )
            }
        } catch (_: Throwable) { emptyList() }
    }

    fun recordRecentCollection(ctx: Context, collectionId: String) {
        val prefs = colPrefs(ctx)
        val arr = try { JSONArray(prefs.getString("recent_ids", "[]") ?: "[]") } catch (_: Throwable) { JSONArray() }
        val list = mutableListOf(collectionId)
        for (i in 0 until arr.length()) {
            val id = arr.getString(i)
            if (id != collectionId) list.add(id)
            if (list.size >= 10) break
        }
        prefs.edit().putString("recent_ids", JSONArray(list).toString()).apply()
    }

    fun getRecentCollectionIds(ctx: Context): List<String> {
        val json = colPrefs(ctx).getString("recent_ids", "[]") ?: "[]"
        return try {
            val arr = JSONArray(json)
            (0 until arr.length()).map { arr.getString(it) }
        } catch (_: Throwable) { emptyList() }
    }

    // ---------- Pending queue (same file format as sharing-shortcuts SaveQueue) ----------

    private fun queueFile(ctx: Context) = File(ctx.filesDir, "savely_pending_queue.json")

    @Synchronized
    fun appendToQueue(ctx: Context, url: String, collectionId: String?) {
        val f = queueFile(ctx)
        val arr = if (f.exists()) {
            try { JSONArray(f.readText()) } catch (_: Throwable) { JSONArray() }
        } else JSONArray()
        arr.put(JSONObject().put("url", url).put("collectionId", collectionId ?: JSONObject.NULL))
        f.writeText(arr.toString())
    }
}
