package expo.modules.floatingbubble

import android.animation.Animator
import android.animation.AnimatorListenerAdapter
import android.animation.ValueAnimator
import android.content.Context
import android.graphics.*
import android.graphics.drawable.GradientDrawable
import android.os.Handler
import android.os.Looper
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.view.animation.OvershootInterpolator
import kotlin.math.abs

class BubbleView(context: Context) : View(context) {

    // Callback receives the screen coordinates where the bubble was released
    var onDrop: ((screenX: Float, screenY: Float) -> Unit)? = null

    private var wm: WindowManager? = null
    private var params: WindowManager.LayoutParams? = null

    // ---- Paint objects ----
    private val bgPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = PRIMARY_COLOR
        style = Paint.Style.FILL
        setShadowLayer(10f, 0f, 4f, Color.argb(80, 0, 0, 0))
    }
    private val iconPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.WHITE
        style = Paint.Style.STROKE
        strokeWidth = 3.5f
        strokeCap = Paint.Cap.ROUND
        strokeJoin = Paint.Join.ROUND
    }
    private val checkPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.WHITE
        style = Paint.Style.STROKE
        strokeWidth = 4f
        strokeCap = Paint.Cap.ROUND
        strokeJoin = Paint.Join.ROUND
    }
    private val pulsePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = PRIMARY_COLOR
        style = Paint.Style.FILL
    }
    private val spinnerPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.WHITE
        style = Paint.Style.STROKE
        strokeWidth = 3f
        strokeCap = Paint.Cap.ROUND
    }

    // ---- State ----
    private enum class State { IDLE, DRAGGING, ANALYZING, SUCCESS, ERROR }
    private var state = State.IDLE

    private var pulseScale = 1f
    private var checkProgress = 0f
    private var spinnerAngle = 0f

    private var touchStartX = 0f
    private var touchStartY = 0f
    private var startParamX = 0
    private var startParamY = 0
    private var isDragging = false

    private var pulseAnimator: ValueAnimator? = null
    private var successAnimator: ValueAnimator? = null
    private val handler = Handler(Looper.getMainLooper())
    private val spinnerTick = object : Runnable {
        override fun run() {
            spinnerAngle = (spinnerAngle + 14f) % 360f
            invalidate()
            if (state == State.ANALYZING) handler.postDelayed(this, 16)
        }
    }

    companion object {
        private val PRIMARY_COLOR = Color.parseColor("#6366f1")
        private val SUCCESS_COLOR = Color.parseColor("#22c55e")
        private val ERROR_COLOR = Color.parseColor("#ef4444")
    }

    fun attachToWindowManager(wm: WindowManager, params: WindowManager.LayoutParams) {
        this.wm = wm
        this.params = params
        setLayerType(LAYER_TYPE_SOFTWARE, null)
    }

    fun setAnalyzing(analyzing: Boolean) {
        state = if (analyzing) State.ANALYZING else State.IDLE
        if (analyzing) startPulse() else stopPulse()
        invalidate()
    }

    fun showSuccess() {
        stopPulse()
        state = State.SUCCESS
        bgPaint.color = SUCCESS_COLOR
        checkProgress = 0f
        successAnimator?.cancel()
        successAnimator = ValueAnimator.ofFloat(0f, 1f).apply {
            duration = 700
            addUpdateListener {
                checkProgress = it.animatedValue as Float
                invalidate()
            }
            addListener(object : AnimatorListenerAdapter() {
                override fun onAnimationEnd(animation: Animator) {
                    bgPaint.color = PRIMARY_COLOR
                    state = State.IDLE
                    snapToEdge()
                    invalidate()
                }
            })
            start()
        }
    }

    fun showError() {
        stopPulse()
        state = State.ERROR
        bgPaint.color = ERROR_COLOR
        invalidate()
        handler.postDelayed({
            bgPaint.color = PRIMARY_COLOR
            state = State.IDLE
            snapToEdge()
            invalidate()
        }, 800)
    }

    override fun onDraw(canvas: Canvas) {
        val cx = width / 2f
        val cy = height / 2f
        val r = cx - 4f

        when (state) {
            State.IDLE, State.ERROR -> {
                bgPaint.alpha = 200
                canvas.drawCircle(cx, cy, r, bgPaint)
                drawBookmark(canvas, cx, cy, r * 0.42f)
            }
            State.DRAGGING -> {
                bgPaint.alpha = 255
                canvas.drawCircle(cx, cy, r, bgPaint)
                drawBookmark(canvas, cx, cy, r * 0.42f)
            }
            State.ANALYZING -> {
                pulsePaint.alpha = (55 * (2f - pulseScale)).toInt().coerceIn(0, 55)
                canvas.drawCircle(cx, cy, r * pulseScale.coerceAtMost(1.5f), pulsePaint)
                bgPaint.alpha = 255
                canvas.drawCircle(cx, cy, r, bgPaint)
                val oval = RectF(cx - r * 0.45f, cy - r * 0.45f, cx + r * 0.45f, cy + r * 0.45f)
                canvas.drawArc(oval, spinnerAngle, 270f, false, spinnerPaint)
            }
            State.SUCCESS -> {
                bgPaint.alpha = 255
                canvas.drawCircle(cx, cy, r, bgPaint)
                drawCheckmark(canvas, cx, cy, r * 0.38f, checkProgress)
            }
        }
    }

    private fun drawBookmark(canvas: Canvas, cx: Float, cy: Float, s: Float) {
        val path = Path().apply {
            moveTo(cx - s * 0.65f, cy - s)
            lineTo(cx + s * 0.65f, cy - s)
            lineTo(cx + s * 0.65f, cy + s)
            lineTo(cx, cy + s * 0.35f)
            lineTo(cx - s * 0.65f, cy + s)
            close()
        }
        canvas.drawPath(path, iconPaint)
    }

    private fun drawCheckmark(canvas: Canvas, cx: Float, cy: Float, r: Float, progress: Float) {
        if (progress <= 0f) return
        val midX = cx - r * 0.1f
        val midY = cy + r * 0.25f
        val startX = cx - r * 0.65f
        val startY = cy + r * 0.05f
        val endX = cx + r * 0.65f
        val endY = cy - r * 0.6f
        val p1 = (progress * 2f).coerceAtMost(1f)
        val p2 = ((progress * 2f) - 1f).coerceAtLeast(0f)
        val path = Path().apply {
            moveTo(startX, startY)
            lineTo(lerp(startX, midX, p1), lerp(startY, midY, p1))
            if (p2 > 0f) lineTo(lerp(midX, endX, p2), lerp(midY, endY, p2))
        }
        canvas.drawPath(path, checkPaint)
    }

    private fun lerp(a: Float, b: Float, t: Float) = a + (b - a) * t

    private fun startPulse() {
        pulseAnimator?.cancel()
        pulseScale = 1f
        pulseAnimator = ValueAnimator.ofFloat(1f, 1.45f).apply {
            duration = 750
            repeatMode = ValueAnimator.REVERSE
            repeatCount = ValueAnimator.INFINITE
            addUpdateListener { pulseScale = it.animatedValue as Float; invalidate() }
            start()
        }
        handler.post(spinnerTick)
    }

    private fun stopPulse() {
        pulseAnimator?.cancel()
        handler.removeCallbacks(spinnerTick)
        pulseScale = 1f
    }

    override fun onTouchEvent(event: MotionEvent): Boolean {
        val p = params ?: return false
        val w = wm ?: return false
        return when (event.action) {
            MotionEvent.ACTION_DOWN -> {
                touchStartX = event.rawX
                touchStartY = event.rawY
                startParamX = p.x
                startParamY = p.y
                isDragging = false
                true
            }
            MotionEvent.ACTION_MOVE -> {
                val dx = event.rawX - touchStartX
                val dy = event.rawY - touchStartY
                if (!isDragging && (abs(dx) > 8f || abs(dy) > 8f)) {
                    isDragging = true
                    state = State.DRAGGING
                    bgPaint.alpha = 255
                    invalidate()
                }
                if (isDragging) {
                    p.x = (startParamX + dx.toInt()).coerceAtLeast(0)
                    p.y = (startParamY + dy.toInt()).coerceAtLeast(0)
                    w.updateViewLayout(this, p)
                }
                true
            }
            MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                if (isDragging) {
                    // Pass raw screen coordinates so the service can find the card at this point
                    onDrop?.invoke(event.rawX, event.rawY)
                } else {
                    state = State.IDLE
                    invalidate()
                }
                isDragging = false
                true
            }
            else -> super.onTouchEvent(event)
        }
    }

    fun snapToEdge() {
        val p = params ?: return
        val w = wm ?: return
        val screenWidth = resources.displayMetrics.widthPixels
        val targetX = if (p.x + width / 2 < screenWidth / 2) -width / 4 else screenWidth - width + width / 4
        ValueAnimator.ofInt(p.x, targetX).apply {
            duration = 350
            interpolator = OvershootInterpolator(0.8f)
            addUpdateListener {
                p.x = it.animatedValue as Int
                try { w.updateViewLayout(this@BubbleView, p) } catch (_: Throwable) {}
            }
            start()
        }
    }

    fun cleanup() {
        stopPulse()
        successAnimator?.cancel()
        handler.removeCallbacksAndMessages(null)
    }
}
