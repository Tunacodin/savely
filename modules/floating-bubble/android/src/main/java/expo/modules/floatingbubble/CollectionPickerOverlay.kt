package expo.modules.floatingbubble

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Outline
import android.graphics.Paint
import android.graphics.Path
import android.graphics.PixelFormat
import android.graphics.RectF
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.text.TextUtils
import android.view.Gravity
import android.view.KeyEvent
import android.view.View
import android.view.ViewOutlineProvider
import android.view.WindowManager
import android.view.inputmethod.EditorInfo
import android.view.inputmethod.InputMethodManager
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import java.net.HttpURLConnection
import java.net.URL

class CollectionPickerOverlay(
    private val context: Context,
    private val wm: WindowManager,
    private val metadata: ContentMetadata,
    private val collections: List<SharedStore.CollectionData>,
    private val onSelected: (collectionId: String?) -> Unit,
    private val onNewCollection: ((name: String) -> Unit)? = null,
    private val onDismiss: (() -> Unit)? = null,
) {
    private var backdropView: View? = null
    private var rootView: View? = null
    private val dp = context.resources.displayMetrics.density

    fun show() {
        addBackdrop()
        val root = buildRoot()
        val lp = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            overlayType(),
            WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
            PixelFormat.TRANSLUCENT,
        ).apply {
            gravity = Gravity.BOTTOM
            softInputMode = WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE
        }
        wm.addView(root, lp)
        rootView = root
        root.isFocusableInTouchMode = true
        root.requestFocus()
        root.translationY = 300f
        root.animate().translationY(0f).setDuration(280).start()
    }

    fun dismiss() {
        if (rootView == null) return
        val v = rootView
        rootView = null
        try { backdropView?.let { wm.removeView(it) } } catch (_: Throwable) {}
        backdropView = null
        onDismiss?.invoke()
        v?.animate()?.translationY(400f)?.setDuration(220)?.withEndAction {
            try { wm.removeView(v) } catch (_: Throwable) {}
        }?.start()
    }

    private fun addBackdrop() {
        val v = View(context).apply {
            isClickable = true
            setOnClickListener { dismiss() }
        }
        val lp = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT,
            overlayType(),
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
            PixelFormat.TRANSLUCENT,
        )
        wm.addView(v, lp)
        backdropView = v
    }

    private fun buildRoot(): View {
        val MP = LinearLayout.LayoutParams.MATCH_PARENT
        val WC = LinearLayout.LayoutParams.WRAP_CONTENT

        val container = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            background = roundedBg(Color.parseColor("#1c1b22"), px(20f).toFloat())
            setPadding(px(16f), px(10f), px(16f), px(28f))
            clipToOutline = true
            outlineProvider = object : ViewOutlineProvider() {
                override fun getOutline(view: View, outline: Outline) {
                    outline.setRoundRect(0, 0, view.width, view.height, px(20f).toFloat())
                }
            }
            isFocusableInTouchMode = true
            setOnKeyListener { _, keyCode, event ->
                if (keyCode == KeyEvent.KEYCODE_BACK && event.action == KeyEvent.ACTION_UP) {
                    dismiss()
                    true
                } else false
            }
        }

        // Drag handle
        container.addView(View(context).apply {
            background = roundedBg(Color.parseColor("#4a4a5a"), px(2f).toFloat())
        }, llp(px(36f), px(4f)).also { it.gravity = Gravity.CENTER_HORIZONTAL; it.bottomMargin = px(10f) })

        // Image preview (full-width, white bg for letterboxing)
        if (!metadata.imageUrl.isNullOrBlank()) {
            container.addView(
                buildImagePreview(),
                llp(MP, px(192f)).also { it.marginStart = -px(16f); it.marginEnd = -px(16f); it.bottomMargin = px(14f) }
            )
        }

        // Content title preview
        if (!metadata.title.isNullOrBlank()) {
            container.addView(TextView(context).apply {
                text = metadata.title
                setTextColor(Color.parseColor("#e5e7eb"))
                textSize = 13f
                maxLines = 2
                ellipsize = TextUtils.TruncateAt.END
            }, llp(MP, WC).also { it.bottomMargin = px(14f) })
        }

        // Section label
        container.addView(TextView(context).apply {
            text = "Koleksiyon seç"
            setTextColor(Color.parseColor("#6b7280"))
            textSize = 11f
        }, llp(MP, WC).also { it.bottomMargin = px(8f) })

        // Collection buttons row (top 3)
        if (collections.isNotEmpty()) {
            val row = LinearLayout(context).apply { orientation = LinearLayout.HORIZONTAL }
            val topCols = collections.take(3)
            topCols.forEachIndexed { i, col ->
                val btn = buildCollectionBtn(col)
                val btnLp = llp(0, WC, 1f)
                if (i < topCols.lastIndex) btnLp.marginEnd = px(8f)
                row.addView(btn, btnLp)
            }
            container.addView(row, llp(MP, WC).also { it.bottomMargin = px(4f) })
        }

        // New collection section
        container.addView(buildNewCollectionSection(), llp(MP, WC).also { it.topMargin = px(4f) })

        // "Save without collection" link
        container.addView(TextView(context).apply {
            text = "Koleksiyonsuz kaydet"
            setTextColor(Color.parseColor("#6b7280"))
            textSize = 12f
            gravity = Gravity.CENTER
            setPadding(0, px(8f), 0, 0)
            isClickable = true
            isFocusable = true
            setOnClickListener { dismiss(); onSelected(null) }
        }, llp(MP, WC))

        return container
    }

    private fun buildNewCollectionSection(): View {
        val MP = LinearLayout.LayoutParams.MATCH_PARENT
        val WC = LinearLayout.LayoutParams.WRAP_CONTENT

        val section = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
        }

        val newColBtn = TextView(context).apply {
            text = "+ Yeni Koleksiyon"
            setTextColor(Color.parseColor("#6366f1"))
            textSize = 13f
            gravity = Gravity.CENTER
            setPadding(0, px(10f), 0, px(6f))
            isClickable = true
            isFocusable = true
        }

        val inputRow = LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            visibility = View.GONE
            background = roundedBg(Color.parseColor("#2a2935"), px(12f).toFloat())
            setPadding(px(4f), px(4f), px(4f), px(4f))
        }

        val editText = EditText(context).apply {
            hint = "Koleksiyon adı"
            setTextColor(Color.parseColor("#f3f4f6"))
            setHintTextColor(Color.parseColor("#6b7280"))
            textSize = 14f
            background = null
            setPadding(px(10f), px(10f), px(8f), px(10f))
            maxLines = 1
            imeOptions = EditorInfo.IME_ACTION_DONE
        }

        val createBtn = TextView(context).apply {
            text = "Oluştur"
            setTextColor(Color.WHITE)
            textSize = 13f
            setPadding(px(12f), px(10f), px(12f), px(10f))
            background = roundedBg(Color.parseColor("#6366f1"), px(8f).toFloat())
            isClickable = true
            isFocusable = true
        }

        val submitNew = {
            val name = editText.text.toString().trim()
            if (name.isNotEmpty()) {
                val imm = context.getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
                imm.hideSoftInputFromWindow(editText.windowToken, 0)
                onNewCollection?.invoke(name)
                dismiss()
            }
        }

        createBtn.setOnClickListener { submitNew() }
        editText.setOnEditorActionListener { _, actionId, _ ->
            if (actionId == EditorInfo.IME_ACTION_DONE) { submitNew(); true } else false
        }

        newColBtn.setOnClickListener {
            newColBtn.visibility = View.GONE
            inputRow.visibility = View.VISIBLE
            editText.requestFocus()
            val imm = context.getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
            imm.showSoftInput(editText, InputMethodManager.SHOW_IMPLICIT)
        }

        inputRow.addView(editText, llp(0, WC, 1f))
        inputRow.addView(createBtn, llp(WC, WC).also { it.marginStart = px(6f) })
        section.addView(newColBtn, llp(MP, WC))
        section.addView(inputRow, llp(MP, WC).also { it.topMargin = px(2f) })
        return section
    }

    private fun buildCollectionBtn(col: SharedStore.CollectionData): View {
        val MP = LinearLayout.LayoutParams.MATCH_PARENT
        val WC = LinearLayout.LayoutParams.WRAP_CONTENT
        return LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            background = roundedBg(Color.parseColor("#2a2935"), px(12f).toFloat())
            setPadding(px(8f), px(14f), px(8f), px(14f))
            isClickable = true
            isFocusable = true
            setOnClickListener { dismiss(); onSelected(col.id) }

            addView(TextView(context).apply {
                text = col.emoji.ifEmpty { "📁" }
                textSize = 22f
                gravity = Gravity.CENTER
            }, llp(MP, WC).also { it.bottomMargin = px(4f) })

            addView(TextView(context).apply {
                text = col.name
                setTextColor(Color.parseColor("#f3f4f6"))
                textSize = 11f
                gravity = Gravity.CENTER
                maxLines = 1
                ellipsize = TextUtils.TruncateAt.END
            })
        }
    }

    private fun buildImagePreview(): View {
        val container = FrameLayout(context).apply {
            setBackgroundColor(Color.WHITE)
        }

        val imageView = ImageView(context).apply {
            scaleType = ImageView.ScaleType.FIT_CENTER
            setBackgroundColor(Color.WHITE)
        }
        container.addView(imageView, FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.MATCH_PARENT
        ))

        buildPlatformBadge()?.let { badge ->
            val badgeSize = px(28f)
            container.addView(badge, FrameLayout.LayoutParams(badgeSize, badgeSize).apply {
                gravity = Gravity.BOTTOM or Gravity.START
                setMargins(px(10f), 0, 0, px(10f))
            })
        }

        metadata.imageUrl?.let { url ->
            Thread {
                val bmp = loadBitmap(url)
                Handler(Looper.getMainLooper()).post {
                    if (bmp != null) imageView.setImageBitmap(bmp)
                }
            }.start()
        }

        return container
    }

    private fun buildPlatformBadge(): View? {
        data class Style(val color: Int, val isYoutube: Boolean = false)
        val style = when (metadata.platform) {
            "youtube"   -> Style(Color.parseColor("#FF0000"), isYoutube = true)
            "instagram" -> Style(Color.parseColor("#E1306C"))
            "twitter"   -> Style(Color.parseColor("#1DA1F2"))
            "linkedin"  -> Style(Color.parseColor("#0077B5"))
            "tiktok"    -> Style(Color.BLACK)
            "spotify"   -> Style(Color.parseColor("#1DB954"))
            else -> return null
        }
        val letter = when (metadata.platform) {
            "instagram" -> "In"; "twitter" -> "X"; "linkedin" -> "in"
            "tiktok" -> "Tt"; "spotify" -> "S"; else -> null
        }

        val badgeColor = style.color
        val isYt = style.isYoutube
        return object : View(context) {
            private val bgPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = badgeColor }
            private val fgPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                color = Color.WHITE
                this.style = Paint.Style.FILL
            }
            private val textPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                color = Color.WHITE
                textAlign = Paint.Align.CENTER
            }
            init { setLayerType(LAYER_TYPE_SOFTWARE, null) }

            override fun onDraw(canvas: Canvas) {
                val w = width.toFloat(); val h = height.toFloat()
                val r = px(5f).toFloat()
                canvas.drawRoundRect(RectF(0f, 0f, w, h), r, r, bgPaint)
                if (isYt) {
                    val path = Path()
                    val cx = w * 0.56f; val cy = h * 0.5f; val s = minOf(w, h) * 0.27f
                    path.moveTo(cx - s, cy - s * 1.2f)
                    path.lineTo(cx + s * 1.1f, cy)
                    path.lineTo(cx - s, cy + s * 1.2f)
                    path.close()
                    canvas.drawPath(path, fgPaint)
                } else if (letter != null) {
                    textPaint.textSize = h * 0.42f
                    canvas.drawText(letter, w / 2f, h / 2f + textPaint.textSize * 0.35f, textPaint)
                }
            }
        }
    }

    private fun loadBitmap(url: String): Bitmap? {
        return try {
            val conn = URL(url).openConnection() as HttpURLConnection
            conn.connectTimeout = 6000
            conn.readTimeout = 8000
            conn.instanceFollowRedirects = true
            conn.setRequestProperty("User-Agent", "Mozilla/5.0")
            if (conn.responseCode in 200..299) BitmapFactory.decodeStream(conn.inputStream) else null
        } catch (_: Throwable) { null }
    }

    private fun overlayType() =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        else @Suppress("DEPRECATION") WindowManager.LayoutParams.TYPE_PHONE

    private fun roundedBg(color: Int, cornerPx: Float): GradientDrawable =
        GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            setColor(color)
            cornerRadius = cornerPx
        }

    private fun px(dp: Float) = (dp * this.dp).toInt()
    private fun llp(w: Int, h: Int) = LinearLayout.LayoutParams(w, h)
    private fun llp(w: Int, h: Int, weight: Float) = LinearLayout.LayoutParams(w, h, weight)
}
