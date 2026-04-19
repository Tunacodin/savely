import { useState, useCallback } from "react";
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

export default function NewPasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const c = useThemeColors();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordsMatch = password.length >= 6 && password === confirmPassword;

  const handleReset = useCallback(async () => {
    if (!passwordsMatch) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        Alert.alert(t("auth.resetFailed"), t("auth.resetFailedMessage"));
      } else {
        Alert.alert(t("auth.resetSuccess"), t("auth.resetSuccessMessage"), [
          {
            text: t("auth.login"),
            onPress: () => router.replace("/(auth)/login" as any),
          },
        ]);
      }
    } catch {
      Alert.alert(t("common.error"), t("auth.genericError"));
    } finally {
      setLoading(false);
    }
  }, [password, passwordsMatch, router, t]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 8 }}>
          {/* Back */}
          <Pressable onPress={() => router.back()} style={{ marginBottom: 32, alignSelf: "flex-start" }}>
            <MingCuteIcon name="left-line" size={24} color={c.textPrimary} />
          </Pressable>

          {/* Title */}
          <Text style={{ fontFamily: "Rubik_600SemiBold", fontSize: 28, color: c.textPrimary, marginBottom: 8 }}>
            {t("auth.resetPassword")}
          </Text>
          <Text style={{ fontFamily: "Rubik_400Regular", fontSize: 15, color: c.textSecondary, marginBottom: 32, lineHeight: 22 }}>
            {t("auth.newPasswordPlaceholder")}
          </Text>

          {/* New Password */}
          <Text style={{ fontFamily: "Rubik_500Medium", fontSize: 14, color: c.textPrimary, marginBottom: 8 }}>
            {t("auth.newPassword")}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: c.surfaceAlt, borderRadius: 14, height: 56, marginBottom: 16 }}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder={t("auth.newPasswordPlaceholder")}
              placeholderTextColor={c.textTertiary}
              secureTextEntry={!showPassword}
              style={{ flex: 1, fontFamily: "Rubik_400Regular", fontSize: 16, color: c.textPrimary, paddingHorizontal: 16, height: 56 }}
            />
            <Pressable onPress={() => setShowPassword(!showPassword)} style={{ paddingRight: 16 }} hitSlop={8}>
              <MingCuteIcon name={showPassword ? "eye-line" : "eye-close-line"} size={20} color={c.textTertiary} />
            </Pressable>
          </View>

          {/* Confirm Password */}
          <Text style={{ fontFamily: "Rubik_500Medium", fontSize: 14, color: c.textPrimary, marginBottom: 8 }}>
            {t("auth.confirmPassword")}
          </Text>
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder={t("auth.confirmPasswordPlaceholder")}
            placeholderTextColor={c.textTertiary}
            secureTextEntry={!showPassword}
            style={{
              backgroundColor: c.surfaceAlt,
              borderRadius: 14,
              paddingHorizontal: 16,
              height: 56,
              fontFamily: "Rubik_400Regular",
              fontSize: 16,
              color: c.textPrimary,
              marginBottom: 8,
            }}
          />

          {/* Mismatch warning */}
          {confirmPassword.length > 0 && password !== confirmPassword && (
            <Text style={{ fontFamily: "Rubik_400Regular", fontSize: 13, color: c.error, marginBottom: 8 }}>
              {t("auth.passwordsDoNotMatch")}
            </Text>
          )}

          <View style={{ height: 16 }} />

          {/* Submit */}
          <Pressable
            onPress={handleReset}
            disabled={loading || !passwordsMatch}
            style={{
              height: 56,
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: passwordsMatch ? c.buttonPrimary : c.skeleton,
            }}
          >
            {loading ? (
              <ActivityIndicator color={c.buttonPrimaryText} />
            ) : (
              <Text style={{ fontFamily: "Rubik_500Medium", fontSize: 16, color: passwordsMatch ? c.buttonPrimaryText : c.textTertiary }}>
                {t("auth.resetPassword")}
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
