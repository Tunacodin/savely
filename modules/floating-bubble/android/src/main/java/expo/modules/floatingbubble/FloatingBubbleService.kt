package expo.modules.floatingbubble

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Build
import android.os.IBinder
import android.os.VibrationEffect
import android.os.Vibrator
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.widget.Toast
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.*
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

class FloatingBubbleService : Service() {

    companion object {
        @Volatile var isRunning = false
        @Volatile var instance: FloatingBubbleService? = null

        private const val NOTIF_CHANNEL = "savely_bubble"
        private const val NOTIF_ID = 9001
        private const val BUBBLE_DP = 56
    }

    private lateinit var wm: WindowManager
    private var bubbleView: BubbleView? = null
    private var dimView: View? = null
    private var pickerOverlay: CollectionPickerOverlay? = null
    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())
    private var collections = listOf<SharedStore.CollectionData>()

    override fun onCreate() {
        super.onCreate()
        isRunning = true
        instance = this
        wm = getSystemService(WINDOW_SERVICE) as WindowManager
        createNotificationChannel()
        startForeground(NOTIF_ID, buildNotification())
        collections = SharedStore.getCollections(this)
        SavelyLog.d("Service", "onCreate — collections=${collections.size}, a11y=${SavelyAccessibilityService.instance != null}")
        addBubble()
    }

    override fun onDestroy() {
        super.onDestroy()
        isRunning = false
        instance = null
        scope.cancel()
        bubbleView?.cleanup()
        removeBubble()
        removeDim()
        SavelyLog.d("Service", "onDestroy")
    }

    override fun onBind(intent: Intent?): IBinder? = null

    fun refreshCollections() {
        collections = SharedStore.getCollections(this)
    }

    // ---- Bubble lifecycle ----

    private fun addBubble() {
        val sizePx = dpToPx(BUBBLE_DP)
        val bubble = BubbleView(this)
        bubble.onDrop = { screenX, screenY -> onBubbleDropped(screenX, screenY) }

        val lp = bubbleLp(sizePx)
        wm.addView(bubble, lp)
        bubbleView = bubble
        bubble.attachToWindowManager(wm, lp)
        bubble.snapToEdge()
    }

    private fun removeBubble() {
        try { bubbleView?.let { wm.removeView(it) } } catch (_: Throwable) {}
        bubbleView = null
    }

    private fun addDim() {
        val dim = View(this).also { it.setBackgroundColor(0x88000000.toInt()) }
        val lp = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT,
            overlayType(),
            // No FLAG_NOT_TOUCHABLE → dim layer consumes touch events, blocking underlying app
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT,
        ).apply { gravity = Gravity.TOP or Gravity.START }
        wm.addView(dim, lp)
        dimView = dim
    }

    private fun removeDim() {
        try { dimView?.let { wm.removeView(it) } } catch (_: Throwable) {}
        dimView = null
    }

    // ---- Drop handler ----

    private fun onBubbleDropped(screenX: Float, screenY: Float) {
        val a11y = SavelyAccessibilityService.instance
        SavelyLog.d("Drop", "dropped at ($screenX,$screenY) — a11yInstance=${a11y != null}")
        vibrate(40)
        bubbleView?.setAnalyzing(true)
        addDim()

        scope.launch {
            // Step 1: Detect card at drop coordinates (accessibility tree inspection)
            val detected = withContext(Dispatchers.IO) {
                if (a11y == null) {
                    SavelyLog.e("Drop", "SavelyAccessibilityService.instance is null — service not connected")
                    null
                } else {
                    val result = a11y.detectContentAtPoint(screenX.toInt(), screenY.toInt())
                    SavelyLog.d("Drop", "detectContentAtPoint → url=${result?.url} title=${result?.title} platform=${result?.platform}")
                    result
                }
            }

            if (detected == null) {
                bubbleView?.setAnalyzing(false)
                bubbleView?.showError()
                removeDim()
                val msg = if (a11y == null)
                    "Erişilebilirlik servisi bağlı değil. Ayarlardan Savely servisini kapatıp tekrar açın."
                else
                    "İçerik algılanamadı. Desteklenen bir uygulama üzerinde dene (Instagram, YouTube, Twitter…)"
                SavelyLog.w("Drop", "detection failed — a11yNull=${a11y == null}")
                Toast.makeText(this@FloatingBubbleService, msg, Toast.LENGTH_LONG).show()
                return@launch
            }

            // Step 2: Enrich with network metadata if we have a real (non-synthetic) URL
            val meta = withContext(Dispatchers.IO) {
                val syntheticDomains = listOf("youtube.com", "instagram.com", "x.com", "linkedin.com", "maps.google", "savely.app")
                val isSyntheticUrl = syntheticDomains.any {
                    detected.url == "https://www.$it" || detected.url == "https://$it"
                }

                if (!isSyntheticUrl && detected.imageUrl == null) {
                    SavelyLog.d("Enrich", "fetching metadata for ${detected.url}")
                    try {
                        val fetched = MetadataFetcher.fetch(detected.url)
                        SavelyLog.d("Enrich", "done — image=${fetched.imageUrl != null} title=${fetched.title}")
                        fetched.copy(
                            title = detected.title ?: fetched.title,
                            description = detected.description ?: fetched.description,
                        )
                    } catch (t: Throwable) {
                        SavelyLog.e("Enrich", "failed", t)
                        detected
                    }
                } else {
                    SavelyLog.d("Enrich", "skipping network fetch (synthetic=${isSyntheticUrl})")
                    detected
                }
            }

            bubbleView?.setAnalyzing(false)
            removeDim()

            SavelyLog.d("Drop", "collections=${collections.size} — ${if (collections.isEmpty()) "saving directly" else "showing picker"}")
            if (collections.isEmpty()) {
                saveItem(meta, null)
            } else {
                showPicker(meta)
            }
        }
    }

    // ---- Collection picker ----

    private fun showPicker(meta: ContentMetadata) {
        pickerOverlay?.dismiss()
        val sorted = sortedCollections()
        val overlay = CollectionPickerOverlay(
            context = this,
            wm = wm,
            metadata = meta,
            collections = sorted,
            onSelected = { collectionId ->
                saveItem(meta, collectionId)
            },
            onNewCollection = { name ->
                scope.launch(Dispatchers.IO) {
                    SavelyLog.d("NewCol", "creating collection name=$name")
                    val newId = createCollection(name)
                    SavelyLog.d("NewCol", "created id=$newId")
                    if (newId != null) {
                        collections = SharedStore.getCollections(this@FloatingBubbleService)
                    }
                    saveItem(meta, newId)
                }
            },
            onDismiss = {
                pickerOverlay = null
                bubbleView?.snapToEdge()
            },
        )
        overlay.show()
        pickerOverlay = overlay
    }

    private fun sortedCollections(): List<SharedStore.CollectionData> {
        val recents = SharedStore.getRecentCollectionIds(this)
        if (recents.isEmpty()) return collections
        val sorted = mutableListOf<SharedStore.CollectionData>()
        recents.forEach { id -> collections.find { it.id == id }?.let { sorted.add(it) } }
        collections.forEach { c -> if (sorted.none { it.id == c.id }) sorted.add(c) }
        return sorted
    }

    // ---- Save ----

    private fun saveItem(meta: ContentMetadata, collectionId: String?) {
        scope.launch(Dispatchers.IO) {
            if (collectionId != null) SharedStore.recordRecentCollection(this@FloatingBubbleService, collectionId)
            val saved = trySaveDirect(meta, collectionId)
            if (!saved) SharedStore.appendToQueue(this@FloatingBubbleService, meta.url, collectionId)
            withContext(Dispatchers.Main) {
                vibrate(90)
                bubbleView?.showSuccess()
            }
        }
    }

    private fun trySaveDirect(meta: ContentMetadata, collectionId: String?): Boolean {
        val token = SharedStore.accessToken(this)
        val userId = SharedStore.userId(this)
        val baseUrl = SharedStore.supabaseUrl(this)
        val anonKey = SharedStore.anonKey(this)
        SavelyLog.d("Save", "token=${token != null} userId=${userId != null} baseUrl=${baseUrl != null} collectionId=$collectionId")
        if (token == null || userId == null || baseUrl == null || anonKey == null) return false
        return try {
            val metaObj = JSONObject().apply {
                meta.title?.let { put("ogTitle", it) }
                meta.description?.let { put("ogDescription", it) }
                meta.imageUrl?.let { put("ogImage", it) }
                meta.siteName?.let { put("siteName", it) }
            }
            val body = JSONObject().apply {
                put("user_id", userId)
                put("url", meta.url)
                put("title", meta.title ?: "")
                put("platform", meta.platform)
                put("content_type", "link")
                put("aspect_ratio", 1)
                put("is_enriched", meta.title != null)
                put("metadata", metaObj)
                if (collectionId != null) put("collection_id", collectionId)
            }.toString()
            val conn = (URL("$baseUrl/rest/v1/saved_items").openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                connectTimeout = 8000
                readTimeout = 10000
                doOutput = true
                setRequestProperty("Content-Type", "application/json")
                setRequestProperty("apikey", anonKey)
                setRequestProperty("Authorization", "Bearer $token")
                setRequestProperty("Prefer", "return=minimal")
            }
            conn.outputStream.use { it.write(body.toByteArray(Charsets.UTF_8)) }
            val code = conn.responseCode
            conn.disconnect()
            SavelyLog.d("Save", "API response=$code")
            code in 200..299
        } catch (t: Throwable) {
            SavelyLog.e("Save", "API request failed", t)
            false
        }
    }

    // ---- New collection via API ----

    private fun createCollection(name: String): String? {
        val token = SharedStore.accessToken(this)
        val userId = SharedStore.userId(this)
        val baseUrl = SharedStore.supabaseUrl(this)
        val anonKey = SharedStore.anonKey(this)
        if (token == null || userId == null || baseUrl == null || anonKey == null) return null
        return try {
            val body = JSONObject().apply {
                put("user_id", userId)
                put("name", name)
                put("emoji", "📁")
                put("bg_color", "#4a4a5a")
                put("item_count", 0)
            }.toString()
            val conn = (URL("$baseUrl/rest/v1/collections").openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                connectTimeout = 8000
                readTimeout = 10000
                doOutput = true
                setRequestProperty("Content-Type", "application/json")
                setRequestProperty("apikey", anonKey)
                setRequestProperty("Authorization", "Bearer $token")
                setRequestProperty("Prefer", "return=representation")
            }
            conn.outputStream.use { it.write(body.toByteArray(Charsets.UTF_8)) }
            val code = conn.responseCode
            if (code in 200..299) {
                val response = conn.inputStream.bufferedReader().readText()
                conn.disconnect()
                val arr = JSONArray(response)
                if (arr.length() > 0) arr.getJSONObject(0).optString("id").takeIf { it.isNotEmpty() } else null
            } else {
                conn.disconnect()
                SavelyLog.e("NewCol", "API error $code")
                null
            }
        } catch (t: Throwable) {
            SavelyLog.e("NewCol", "API failed", t)
            null
        }
    }

    // ---- Helpers ----

    private fun vibrate(ms: Long) {
        try {
            val v = getSystemService(VIBRATOR_SERVICE) as Vibrator
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                v.vibrate(VibrationEffect.createOneShot(ms, VibrationEffect.DEFAULT_AMPLITUDE))
            } else {
                @Suppress("DEPRECATION") v.vibrate(ms)
            }
        } catch (_: Throwable) {}
    }

    private fun dpToPx(dp: Int) = (dp * resources.displayMetrics.density).toInt()

    private fun overlayType() =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        else
            @Suppress("DEPRECATION") WindowManager.LayoutParams.TYPE_PHONE

    private fun bubbleLp(sizePx: Int) = WindowManager.LayoutParams(
        sizePx, sizePx,
        overlayType(),
        WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                or WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN
                or WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
        PixelFormat.TRANSLUCENT,
    ).apply {
        gravity = Gravity.TOP or Gravity.START
        x = 0
        y = 500
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val ch = NotificationChannel(NOTIF_CHANNEL, "Savely Bubble", NotificationManager.IMPORTANCE_LOW).apply {
                description = "Floating bubble for saving content"
                setShowBadge(false)
            }
            (getSystemService(NOTIFICATION_SERVICE) as NotificationManager).createNotificationChannel(ch)
        }
    }

    private fun buildNotification(): Notification =
        NotificationCompat.Builder(this, NOTIF_CHANNEL)
            .setContentTitle("Savely aktif")
            .setContentText("Kaydetmek için baloncuğu içeriğin üzerine sürükle")
            .setSmallIcon(android.R.drawable.ic_menu_save)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .build()
}
