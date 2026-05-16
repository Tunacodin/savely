package expo.modules.floatingbubble

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

class CollectionRecord : Record {
    @Field var id: String = ""
    @Field var name: String = ""
    @Field var emoji: String = ""
    @Field var bgColor: String = "#f4f4f5"
}

class FloatingBubbleModule : Module() {

    override fun definition() = ModuleDefinition {
        Name("FloatingBubble")

        AsyncFunction("checkPermissions") { ->
            val ctx = appContext.reactContext ?: return@AsyncFunction mapOf("overlay" to false, "accessibility" to false)
            val hasOverlay = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) Settings.canDrawOverlays(ctx) else true
            val hasA11y = isA11yEnabled(ctx)
            mapOf("overlay" to hasOverlay, "accessibility" to hasA11y)
        }

        AsyncFunction("requestOverlayPermission") { ->
            val ctx = appContext.reactContext ?: return@AsyncFunction null
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(ctx)) {
                ctx.startActivity(Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:${ctx.packageName}")).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                })
            }
        }

        AsyncFunction("requestAccessibilityPermission") { ->
            val ctx = appContext.reactContext ?: return@AsyncFunction null
            ctx.startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            })
        }

        AsyncFunction("startBubble") { ->
            val ctx = appContext.reactContext ?: return@AsyncFunction null
            val hasOverlay = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) Settings.canDrawOverlays(ctx) else true
            if (!hasOverlay) return@AsyncFunction null
            val intent = Intent(ctx, FloatingBubbleService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) ctx.startForegroundService(intent) else ctx.startService(intent)
        }

        AsyncFunction("stopBubble") { ->
            val ctx = appContext.reactContext ?: return@AsyncFunction null
            ctx.stopService(Intent(ctx, FloatingBubbleService::class.java))
        }

        AsyncFunction("isBubbleRunning") { ->
            FloatingBubbleService.isRunning
        }

        AsyncFunction("updateCollections") { collections: List<CollectionRecord> ->
            val ctx = appContext.reactContext ?: return@AsyncFunction null
            SharedStore.setCollections(ctx, collections.map {
                SharedStore.CollectionData(it.id, it.name, it.emoji, it.bgColor)
            })
            FloatingBubbleService.instance?.refreshCollections()
        }

        AsyncFunction("getLogs") { ->
            SavelyLog.getAll()
        }

        AsyncFunction("clearLogs") { ->
            SavelyLog.clear()
        }
    }

    private fun isA11yEnabled(ctx: android.content.Context): Boolean {
        return try {
            if (Settings.Secure.getInt(ctx.contentResolver, Settings.Secure.ACCESSIBILITY_ENABLED) != 1) return false
            val services = Settings.Secure.getString(ctx.contentResolver, Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES) ?: return false
            services.contains("${ctx.packageName}/${SavelyAccessibilityService::class.java.name}")
        } catch (_: Throwable) { false }
    }
}
