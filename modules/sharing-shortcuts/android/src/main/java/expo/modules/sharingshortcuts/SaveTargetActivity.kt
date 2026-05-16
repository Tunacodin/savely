package expo.modules.sharingshortcuts

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.widget.Toast

class SaveTargetActivity : Activity() {

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    overridePendingTransition(0, 0)

    val incoming = intent
    val sharedText = incoming?.getStringExtra(Intent.EXTRA_TEXT)
    val shortcutId = incoming?.getStringExtra(Intent.EXTRA_SHORTCUT_ID)
    val collectionId = shortcutId?.takeIf { it.startsWith("collection-") }?.removePrefix("collection-")

    val url = extractUrl(sharedText)
    val appCtx = applicationContext

    if (url == null) {
      val launch = packageManager.getLaunchIntentForPackage(packageName)
      launch?.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED
      if (launch != null) {
        if (collectionId != null) launch.putExtra("collectionId", collectionId)
        startActivity(launch)
      }
      finishAndRemove()
      return
    }

    finishAndRemove()

    Thread {
      val saved = SaveQueue.saveDirect(appCtx, url, collectionId)
      if (!saved) SaveQueue.append(appCtx, url, collectionId)
      Handler(Looper.getMainLooper()).post {
        val msg = if (saved) "Savely · Kaydedildi" else "Savely · Sıraya alındı"
        Toast.makeText(appCtx, msg, Toast.LENGTH_SHORT).show()
      }
    }.start()
  }

  private fun finishAndRemove() {
    finish()
    overridePendingTransition(0, 0)
  }

  private fun extractUrl(text: String?): String? {
    if (text.isNullOrBlank()) return null
    val regex = Regex("https?://[^\\s)]+", RegexOption.IGNORE_CASE)
    return regex.find(text)?.value ?: if (text.startsWith("http")) text.trim() else null
  }
}
