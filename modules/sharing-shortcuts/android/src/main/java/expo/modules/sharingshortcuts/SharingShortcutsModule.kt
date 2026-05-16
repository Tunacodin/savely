package expo.modules.sharingshortcuts

import android.app.Activity
import android.content.ComponentName
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import androidx.core.content.pm.ShortcutInfoCompat
import androidx.core.content.pm.ShortcutManagerCompat
import androidx.core.graphics.drawable.IconCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

class CollectionShortcutRecord : Record {
  @Field var id: String = ""
  @Field var name: String = ""
  @Field var emoji: String = ""
  @Field var bgColor: String = "#f4f4f5"
}

class CredentialsRecord : Record {
  @Field var accessToken: String? = null
  @Field var userId: String? = null
  @Field var supabaseUrl: String? = null
  @Field var anonKey: String? = null
}

private const val SHORTCUT_PREFIX = "collection-"
private const val SHARE_TARGET_CATEGORY = "com.savelyapp.savely.category.SHARE_TARGET"
private const val EXTRA_KEY = "collectionId"
private const val SAVE_TARGET_CLASS = "expo.modules.sharingshortcuts.SaveTargetActivity"

class SharingShortcutsModule : Module() {

  override fun definition() = ModuleDefinition {
    Name("SharingShortcuts")

    AsyncFunction("pushCollectionShortcuts") { collections: List<CollectionShortcutRecord> ->
      val ctx = appContext.reactContext ?: return@AsyncFunction null
      val targetComponent = ComponentName(ctx.packageName, SAVE_TARGET_CLASS)

      val shortcuts = collections.mapIndexed { index, c ->
        val launchIntent = Intent(Intent.ACTION_SEND).apply {
          type = "text/plain"
          component = targetComponent
          putExtra(EXTRA_KEY, c.id)
        }

        ShortcutInfoCompat.Builder(ctx, "$SHORTCUT_PREFIX${c.id}")
          .setShortLabel(truncate(c.name, 10))
          .setLongLabel(truncate(c.name, 25))
          .setIcon(IconCompat.createWithAdaptiveBitmap(buildIcon(c.emoji, c.bgColor)))
          .setIntent(launchIntent)
          .setLongLived(true)
          .setCategories(setOf(SHARE_TARGET_CATEGORY))
          .setRank(index)
          .build()
      }
      ShortcutManagerCompat.removeAllDynamicShortcuts(ctx)
      if (shortcuts.isNotEmpty()) {
        ShortcutManagerCompat.addDynamicShortcuts(ctx, shortcuts)
      }
      null
    }

    AsyncFunction("removeAllShortcuts") {
      val ctx = appContext.reactContext ?: return@AsyncFunction null
      ShortcutManagerCompat.removeAllDynamicShortcuts(ctx)
      null
    }

    AsyncFunction("consumeShortcutId") { ->
      val activity: Activity = appContext.currentActivity ?: return@AsyncFunction null
      val intent = activity.intent ?: return@AsyncFunction null
      val id = intent.getStringExtra(Intent.EXTRA_SHORTCUT_ID)
      if (id != null) {
        intent.removeExtra(Intent.EXTRA_SHORTCUT_ID)
        return@AsyncFunction id
      }
      val collectionId = intent.getStringExtra(EXTRA_KEY) ?: return@AsyncFunction null
      intent.removeExtra(EXTRA_KEY)
      "$SHORTCUT_PREFIX$collectionId"
    }

    AsyncFunction("setCredentials") { creds: CredentialsRecord ->
      val ctx = appContext.reactContext ?: return@AsyncFunction null
      CredentialStore.set(ctx, creds.accessToken, creds.userId, creds.supabaseUrl, creds.anonKey)
      null
    }

    AsyncFunction("clearCredentials") {
      val ctx = appContext.reactContext ?: return@AsyncFunction null
      CredentialStore.clear(ctx)
      null
    }

    AsyncFunction("drainPendingItems") { ->
      val ctx = appContext.reactContext ?: return@AsyncFunction emptyList<Map<String, Any?>>()
      SaveQueue.drainAll(ctx).map {
        mapOf("url" to it.url, "collectionId" to it.collectionId)
      }
    }
  }

  private fun truncate(s: String, max: Int) = if (s.length <= max) s else s.substring(0, max).trimEnd() + "…"

  private fun buildIcon(emoji: String, bgColorHex: String): Bitmap {
    val size = 108
    val bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)

    val bg = Paint(Paint.ANTI_ALIAS_FLAG).apply {
      color = try { Color.parseColor(bgColorHex) } catch (_: Throwable) { Color.parseColor("#f4f4f5") }
      style = Paint.Style.FILL
    }
    canvas.drawRect(RectF(0f, 0f, size.toFloat(), size.toFloat()), bg)

    val text = emoji.ifEmpty { "📁" }
    val textPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
      textSize = 56f
      textAlign = Paint.Align.CENTER
    }
    val baseline = size / 2f - (textPaint.descent() + textPaint.ascent()) / 2f
    canvas.drawText(text, size / 2f, baseline, textPaint)

    return bitmap
  }
}
