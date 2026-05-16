package expo.modules.sharingshortcuts

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

object CredentialStore {
  private const val FILE = "savely_secure"

  private fun prefs(ctx: Context): SharedPreferences {
    return try {
      val key = MasterKey.Builder(ctx)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()
      EncryptedSharedPreferences.create(
        ctx,
        FILE,
        key,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
      )
    } catch (_: Throwable) {
      ctx.getSharedPreferences("${FILE}_fallback", Context.MODE_PRIVATE)
    }
  }

  fun set(ctx: Context, accessToken: String?, userId: String?, supabaseUrl: String?, anonKey: String?) {
    prefs(ctx).edit().apply {
      if (accessToken != null) putString("accessToken", accessToken) else remove("accessToken")
      if (userId != null) putString("userId", userId) else remove("userId")
      if (supabaseUrl != null) putString("supabaseUrl", supabaseUrl)
      if (anonKey != null) putString("anonKey", anonKey)
      apply()
    }
  }

  fun clear(ctx: Context) {
    prefs(ctx).edit().remove("accessToken").remove("userId").apply()
  }

  fun accessToken(ctx: Context) = prefs(ctx).getString("accessToken", null)
  fun userId(ctx: Context) = prefs(ctx).getString("userId", null)
  fun supabaseUrl(ctx: Context) = prefs(ctx).getString("supabaseUrl", null)
  fun anonKey(ctx: Context) = prefs(ctx).getString("anonKey", null)
}
