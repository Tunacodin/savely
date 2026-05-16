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
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

class FloatingBubbleService : Service() {

    companion object {
        @Volatile var isRunning = false
        @Volatile var instance: FloatingBubbleService? = null

        private const val NOTIF_CHANNEL = "savely_bubble"
        private const val NOTIF_ID = 9001
        private const val BUBBLE_DP = 62
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
        vibrate(40)
        bubbleView?.setAnalyzing(true)
        addDim()

        scope.launch {
            // Step 1: Detect card at drop coordinates (accessibility tree inspection)
            val detected = withContext(Dispatchers.IO) {
                SavelyAccessibilityService.instance?.detectContentAtPoint(screenX.toInt(), screenY.toInt())
            }

            if (detected == null) {
                bubbleView?.setAnalyzing(false)
                bubbleView?.showError()
                removeDim()
                Toast.makeText(
                    this@FloatingBubbleService,
                    "İçerik algılanamadı. Erişilebilirlik iznini kontrol et.",
                    Toast.LENGTH_SHORT,
                ).show()
                return@launch
            }

            // Step 2: Enrich with network metadata if we have a real (non-synthetic) URL
            val meta = withContext(Dispatchers.IO) {
                val syntheticDomains = listOf("youtube.com", "instagram.com", "x.com", "linkedin.com", "maps.google", "savely.app")
                val isSyntheticUrl = syntheticDomains.any {
                    detected.url == "https://www.$it" || detected.url == "https://$it"
                }

                if (!isSyntheticUrl && detected.imageUrl == null) {
                    // Try to enrich: fetch thumbnail/og:image via URL
                    try {
                        val fetched = MetadataFetcher.fetch(detected.url)
                        // Merge: prefer a11y title (faster), use network image
                        fetched.copy(
                            title = detected.title ?: fetched.title,
                            description = detected.description ?: fetched.description,
                        )
                    } catch (_: Throwable) { detected }
                } else {
                    detected
                }
            }

            bubbleView?.setAnalyzing(false)
            removeDim()

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
        val overlay = CollectionPickerOverlay(this, wm, meta, sorted) { collectionId ->
            pickerOverlay = null
            saveItem(meta, collectionId)
        }
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
        val token = SharedStore.accessToken(this) ?: return false
        val userId = SharedStore.userId(this) ?: return false
        val baseUrl = SharedStore.supabaseUrl(this) ?: return false
        val anonKey = SharedStore.anonKey(this) ?: return false
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
            code in 200..299
        } catch (_: Throwable) { false }
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
