import { useState } from "react";
import { View, Text, Pressable, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import * as WebBrowser from "expo-web-browser";
import Svg, { Path, G, ClipPath, Rect, Defs } from "react-native-svg";
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

function AppleIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" fill={color} />
    </Svg>
  );
}

export default function LoginScreen() {
  const router = useRouter();
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const c = useThemeColors();

  const handleOAuth = async (provider: "google" | "apple") => {
    setLoadingProvider(provider);
    try {
      const redirectTo = "savely://auth/callback";

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;
      if (!data.url) throw new Error("No auth URL");

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      console.log("[OAuth] result type:", result.type);
      if (result.type === "success") console.log("[OAuth] result url:", result.url);

      if (result.type === "success" && result.url) {
        const url = new URL(result.url);
        const code = url.searchParams.get("code");
        console.log("[OAuth] code:", code);
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          console.log("[OAuth] exchangeCodeForSession error:", error);
          return;
        }
        const hash = url.hash.slice(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");
        console.log("[OAuth] hash accessToken:", !!accessToken, "refreshToken:", !!refreshToken);
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
          console.log("[OAuth] setSession error:", error);
        }
      }
    } catch (err: any) {
      Alert.alert("Hata", err.message ?? "Giri\u015f yap\u0131lamad\u0131.");
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 16, gap: 16 }}>
        <Text style={{ fontFamily: "Rubik_600SemiBold", fontSize: 32, color: c.textPrimary, marginBottom: 4 }}>
          Savely
        </Text>
        <Text style={{ fontFamily: "Rubik_400Regular", fontSize: 16, color: c.textSecondary, lineHeight: 24, marginBottom: 8 }}>
          {"Dijital d\u00fcnyan\u0131 y\u00f6netmeye ve her \u015feye tek noktadan eri\u015fmeye haz\u0131r m\u0131s\u0131n?"}
        </Text>

        <Pressable
          onPress={() => handleOAuth("google")}
          disabled={!!loadingProvider}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: c.surface,
            borderRadius: 16,
            height: 56,
            paddingHorizontal: 16,
            gap: 12,
            opacity: loadingProvider === "google" ? 0.7 : 1,
          }}
        >
          <View style={{ width: 20, height: 20 }}>
            {loadingProvider === "google" ? <ActivityIndicator size="small" color={c.textPrimary} /> : <GoogleIcon />}
          </View>
          <Text style={{ flex: 1, fontFamily: "Rubik_400Regular", fontSize: 16, color: c.textPrimary, textAlign: "center" }}>
            Google ile devam et
          </Text>
          <View style={{ width: 20 }} />
        </Pressable>

        <Pressable
          onPress={() => handleOAuth("apple")}
          disabled={!!loadingProvider}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: c.surface,
            borderRadius: 16,
            height: 56,
            paddingHorizontal: 16,
            gap: 12,
            opacity: loadingProvider === "apple" ? 0.7 : 1,
          }}
        >
          <View style={{ width: 20, height: 20 }}>
            {loadingProvider === "apple" ? <ActivityIndicator size="small" color={c.textPrimary} /> : <AppleIcon color={c.text} />}
          </View>
          <Text style={{ flex: 1, fontFamily: "Rubik_400Regular", fontSize: 16, color: c.textPrimary, textAlign: "center" }}>
            Apple ile devam et
          </Text>
          <View style={{ width: 20 }} />
        </Pressable>

        <Pressable onPress={() => router.push("/(auth)/email-login" as any)} style={{ alignItems: "center", marginTop: 8 }}>
          <Text style={{ fontFamily: "Rubik_400Regular", fontSize: 14, color: c.textTertiary }}>
            E-posta ile devam et
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
