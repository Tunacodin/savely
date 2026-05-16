package expo.modules.floatingbubble

import android.content.Context
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.text.TextUtils
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.widget.LinearLayout
import android.widget.TextView

class CollectionPickerOverlay(
    private val context: Context,
    private val wm: WindowManager,
    private val metadata: ContentMetadata,
    private val collections: List<SharedStore.CollectionData>,
    private val onSelected: (collectionId: String?) -> Unit,
) {

    private var rootView: View? = null
    private val dp = context.resources.displayMetrics.density

    fun show() {
        val root = buildRoot()
        val lp = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            else @Suppress("DEPRECATION") WindowManager.LayoutParams.TYPE_PHONE,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
            PixelFormat.TRANSLUCENT,
        ).apply { gravity = Gravity.BOTTOM }
        wm.addView(root, lp)
        rootView = root
        root.translationY = 300f
        root.animate().translationY(0f).setDuration(280).start()
    }

    fun dismiss() {
        val v = rootView ?: return
        rootView = null
        v.animate().translationY(400f).setDuration(220).withEndAction {
            try { wm.removeView(v) } catch (_: Throwable) {}
        }.start()
    }

    private fun buildRoot(): View {
        val MP = LinearLayout.LayoutParams.MATCH_PARENT
        val WC = LinearLayout.LayoutParams.WRAP_CONTENT

        val container = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            background = roundedBg(Color.parseColor("#1c1b22"), px(20f))
            setPadding(px(16f), px(10f), px(16f), px(28f))
        }

        // Drag handle
        container.addView(View(context).apply {
            background = roundedBg(Color.parseColor("#4a4a5a"), px(2f))
        }, llp(px(36f), px(4f)).also { it.gravity = Gravity.CENTER_HORIZONTAL; it.bottomMargin = px(14f) })

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
        val row = LinearLayout(context).apply { orientation = LinearLayout.HORIZONTAL }
        val topCols = collections.take(3)
        topCols.forEachIndexed { i, col ->
            val btn = buildCollectionBtn(col)
            val btnLp = llp(0, WC, 1f)
            if (i < topCols.lastIndex) btnLp.marginEnd = px(8f)
            row.addView(btn, btnLp)
        }
        container.addView(row, llp(MP, WC).also { it.bottomMargin = px(6f) })

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

    private fun buildCollectionBtn(col: SharedStore.CollectionData): View {
        val MP = LinearLayout.LayoutParams.MATCH_PARENT
        val WC = LinearLayout.LayoutParams.WRAP_CONTENT
        return LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            background = roundedBg(Color.parseColor("#2a2935"), px(12f))
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
