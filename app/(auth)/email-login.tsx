import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { MingCuteIcon } from "@/components/ui/mingcute-icon";
import { supabase } from "@/lib/supabase";
import { useThemeColors } from "@/hooks/use-theme";

export default function EmailLoginScreen() {
  const router = useRouter();
  const c = useThemeColors();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.toLowerCase().includes("invalid login credentials") || error.message.toLowerCase().includes("invalid")) {
            Alert.alert(t("auth.loginFailed"), t("auth.loginFailedMessage"));
          } else {
            Alert.alert(t("common.error"), error.message);
          }
        }
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) {
          if (error.message.toLowerCase().includes("already registered") || error.message.toLowerCase().includes("already exists")) {
            Alert.alert(t("auth.emailAlreadyRegistered"), t("auth.emailAlreadyRegisteredMessage"));
          } else {
            Alert.alert(t("common.error"), error.message);
          }
        } else if (data.user?.identities?.length === 0) {
          // User exists but Supabase returns fake success for security
          Alert.alert(t("auth.emailAlreadyRegistered"), t("auth.emailAlreadyRegisteredMessage"));
        } else if (data.user && !data.session) {
          // Email confirmation required — go to OTP screen
          router.push({
            pathname: "/(auth)/verify-otp" as any,
            params: { email, type: "signup" },
          });
        }
      }
    } catch (err: any) {
      Alert.alert(t("common.error"), err.message ?? t("auth.genericError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 8 }}>
          <Pressable onPress={() => router.back()} style={{ marginBottom: 32, alignSelf: "flex-start" }}>
            <MingCuteIcon name="left-line" size={24} color={c.textPrimary} />
          </Pressable>

          <Text style={{ fontFamily: "Rubik_600SemiBold", fontSize: 28, color: c.textPrimary, marginBottom: 8 }}>
            {isLogin ? t("auth.loginTitle") : t("auth.register")}
          </Text>
          <Text style={{ fontFamily: "Rubik_400Regular", fontSize: 15, color: c.textSecondary, marginBottom: 32 }}>
            {isLogin ? t("auth.loginSubtitle") : t("auth.registerFormSubtitle")}
          </Text>

          <Text style={{ fontFamily: "Rubik_500Medium", fontSize: 14, color: c.textPrimary, marginBottom: 8 }}>
            {t("auth.email")}
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder={t("auth.emailPlaceholder")}
            placeholderTextColor={c.textTertiary}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            style={{ backgroundColor: c.surfaceAlt, borderRadius: 14, paddingHorizontal: 16, height: 56, fontFamily: "Rubik_400Regular", fontSize: 16, color: c.textPrimary, marginBottom: 16 }}
          />

          <Text style={{ fontFamily: "Rubik_500Medium", fontSize: 14, color: c.textPrimary, marginBottom: 8 }}>
            {t("auth.password")}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: c.surfaceAlt, borderRadius: 14, height: 56, marginBottom: isLogin ? 12 : 32 }}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder={t("auth.passwordPlaceholder")}
              placeholderTextColor={c.textTertiary}
              secureTextEntry={!showPassword}
              style={{ flex: 1, fontFamily: "Rubik_400Regular", fontSize: 16, color: c.textPrimary, paddingHorizontal: 16, height: 56 }}
            />
            <Pressable onPress={() => setShowPassword(!showPassword)} style={{ paddingRight: 16 }} hitSlop={8}>
              <MingCuteIcon name={showPassword ? "eye-line" : "eye-close-line"} size={20} color={c.textTertiary} />
            </Pressable>
          </View>

          {/* Forgot password */}
          {isLogin && (
            <Pressable
              onPress={() => router.push("/(auth)/forgot-password" as any)}
              style={{ alignSelf: "flex-end", marginBottom: 20 }}
            >
              <Text style={{ fontFamily: "Rubik_400Regular", fontSize: 13, color: c.textTertiary }}>
                {t("auth.forgotPassword")}
              </Text>
            </Pressable>
          )}

          <Pressable
            onPress={handleSubmit}
            disabled={loading || !email || !password}
            style={{ height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: email && password ? c.buttonPrimary : c.skeleton, marginBottom: 16 }}
          >
            {loading ? (
              <ActivityIndicator color={c.buttonPrimaryText} />
            ) : (
              <Text style={{ fontFamily: "Rubik_400Regular", fontSize: 16, color: email && password ? c.buttonPrimaryText : c.textTertiary }}>
                {isLogin ? t("auth.login") : t("auth.register")}
              </Text>
            )}
          </Pressable>

          <Pressable onPress={() => setIsLogin(!isLogin)} style={{ alignItems: "center" }}>
            <Text style={{ fontFamily: "Rubik_400Regular", fontSize: 14, color: c.textTertiary }}>
              {isLogin ? `${t("auth.noAccount")} ` : `${t("auth.alreadyHaveAccount")} `}
              <Text style={{ color: c.textPrimary, fontFamily: "Rubik_500Medium" }}>
                {isLogin ? t("auth.register") : t("auth.login")}
              </Text>
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
