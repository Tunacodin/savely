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

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const c = useThemeColors();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendCode = useCallback(async () => {
    if (!email.trim()) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (error) {
        Alert.alert(t("common.error"), error.message);
      } else {
        router.push({
          pathname: "/(auth)/verify-otp" as any,
          params: { email: email.trim(), type: "reset" },
        });
      }
    } catch {
      Alert.alert(t("common.error"), t("auth.genericError"));
    } finally {
      setLoading(false);
    }
  }, [email, router, t]);

  const isValid = email.trim().includes("@");

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
            {t("auth.forgotPassword")}
          </Text>
          <Text style={{ fontFamily: "Rubik_400Regular", fontSize: 15, color: c.textSecondary, marginBottom: 32, lineHeight: 22 }}>
            {t("auth.forgotPasswordDesc")}
          </Text>

          {/* Email */}
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
            style={{
              backgroundColor: c.surfaceAlt,
              borderRadius: 14,
              paddingHorizontal: 16,
              height: 56,
              fontFamily: "Rubik_400Regular",
              fontSize: 16,
              color: c.textPrimary,
              marginBottom: 32,
            }}
          />

          {/* Submit */}
          <Pressable
            onPress={handleSendCode}
            disabled={loading || !isValid}
            style={{
              height: 56,
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: isValid ? c.buttonPrimary : c.skeleton,
            }}
          >
            {loading ? (
              <ActivityIndicator color={c.buttonPrimaryText} />
            ) : (
              <Text style={{ fontFamily: "Rubik_500Medium", fontSize: 16, color: isValid ? c.buttonPrimaryText : c.textTertiary }}>
                {t("auth.sendResetCode")}
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
