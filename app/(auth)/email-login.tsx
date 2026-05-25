import { useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import * as WebBrowser from "expo-web-browser";
import * as AppleAuthentication from "expo-apple-authentication";
import Svg, { Path } from "react-native-svg";
import { supabase } from "@/lib/supabase";
import { useThemeColors } from "@/hooks/use-theme";

WebBrowser.maybeCompleteAuthSession();

function GoogleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <Path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <Path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <Path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </Svg>
  );
}

export default function EmailLoginScreen() {
  const c = useThemeColors();
  const { t } = useTranslation();
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingApple, setLoadingApple] = useState(false);

  const handleGoogle = async () => {
    setLoadingGoogle(true);
    try {
      const redirectTo = "savely://auth/callback";
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error) throw error;
      if (!data.url) throw new Error("No auth URL");
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type === "success" && result.url) {
        const url = new URL(result.url);
        const code = url.searchParams.get("code");
        if (code) {
          await supabase.auth.exchangeCodeForSession(code);
          return;
        }
        const params = new URLSearchParams(url.hash.slice(1));
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");
        if (accessToken && refreshToken) {
          await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        }
      }
    } catch (err: any) {
      Alert.alert(t("common.error"), err.message ?? t("auth.loginError"));
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleApple = async () => {
    setLoadingApple(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) throw new Error("No identity token");
      const { error } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: credential.identityToken,
      });
      if (error) throw error;
    } catch (err: any) {
      if (err.code !== "ERR_REQUEST_CANCELED") {
        Alert.alert(t("common.error"), err.message ?? t("auth.loginError"));
      }
    } finally {
      setLoadingApple(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      <View style={{ flex: 1, paddingHorizontal: 24, justifyContent: "center", paddingBottom: 48 }}>
        <Text style={{ fontFamily: "Rubik_600SemiBold", fontSize: 32, color: c.textPrimary, marginBottom: 8 }}>
          {t("auth.loginTitle")}
        </Text>
        <Text style={{ fontFamily: "Rubik_400Regular", fontSize: 16, color: c.textSecondary, marginBottom: 40 }}>
          {t("auth.loginSubtitle")}
        </Text>

        <Pressable
          onPress={handleGoogle}
          disabled={loadingGoogle || loadingApple}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: c.surface,
            borderRadius: 16,
            height: 56,
            paddingHorizontal: 16,
            gap: 12,
            opacity: loadingGoogle ? 0.7 : 1,
          }}
        >
          <View style={{ width: 20, height: 20 }}>
            {loadingGoogle ? <ActivityIndicator size="small" color={c.textPrimary} /> : <GoogleIcon />}
          </View>
          <Text style={{ flex: 1, fontFamily: "Rubik_400Regular", fontSize: 16, color: c.textPrimary, textAlign: "center" }}>
            {t("auth.continueWithGoogle")}
          </Text>
          <View style={{ width: 20 }} />
        </Pressable>

        {Platform.OS === "ios" && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={
              c.background === "#ffffff" || c.background === "#FFFFFF"
                ? AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
                : AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
            }
            cornerRadius={16}
            style={{ height: 56, marginTop: 16 }}
            onPress={handleApple}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
