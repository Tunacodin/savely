package expo.modules.floatingbubble

import android.util.Log
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

object SavelyLog {
    private val entries = ArrayDeque<String>()
    private const val MAX = 300
    private val fmt = SimpleDateFormat("HH:mm:ss.SSS", Locale.getDefault())

    fun d(tag: String, msg: String) {
        Log.d("SavelyBubble", "[$tag] $msg")
        add("D", tag, msg)
    }

    fun e(tag: String, msg: String, t: Throwable? = null) {
        Log.e("SavelyBubble", "[$tag] $msg", t)
        add("E", tag, if (t != null) "$msg | ${t.javaClass.simpleName}: ${t.message}" else msg)
    }

    fun w(tag: String, msg: String) {
        Log.w("SavelyBubble", "[$tag] $msg")
        add("W", tag, msg)
    }

    @Synchronized
    private fun add(level: String, tag: String, msg: String) {
        val ts = fmt.format(Date())
        entries.addLast("$ts $level/$tag: $msg")
        if (entries.size > MAX) entries.removeFirst()
    }

    @Synchronized
    fun getAll(): String = entries.joinToString("\n")

    @Synchronized
    fun clear() = entries.clear()
}
