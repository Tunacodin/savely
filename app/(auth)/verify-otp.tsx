import { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { MingCuteIcon } from "@/components/ui/mingcute-icon";
import { supabase } from "@/lib/supabase";
import { useThemeColors } from "@/hooks/use-theme";

const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export default function VerifyOtpScreen() {
  const router = useRouter();
  const { email, type } = useLocalSearchParams<{ email: string; type?: string }>();
  const { t } = useTranslation();
  const c = useThemeColors();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const inputRef = useRef<TextInput>(null);

  // Countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Auto-focus
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  const handleVerify = useCallback(async () => {
    if (code.length !== CODE_LENGTH) return;
    Keyboard.dismiss();
    setLoading(true);
    try {
      const otpType = type === "reset" ? "recovery" : "signup";
      const { error } = await supabase.auth.verifyOtp({
        email: email!,
        token: code,
        type: otpType as any,
      });
      if (error) {
        Alert.alert(t("auth.invalidCode"), t("auth.invalidCodeMessage"));
        setCode("");
      } else if (type === "reset") {
        router.replace({
          pathname: "/(auth)/new-password" as any,
        });
      }
      // signup verify: onAuthStateChange in _layout will handle redirect
    } catch {
      Alert.alert(t("common.error"), t("auth.genericError"));
    } finally {
      setLoading(false);
    }
  }, [code, email, type, router, t]);

  // Auto-submit when 6 digits entered
  useEffect(() => {
    if (code.length === CODE_LENGTH) handleVerify();
  }, [code, handleVerify]);

  const handleResend = useCallback(async () => {
    if (cooldown > 0) return;
    try {
      if (type === "reset") {
        await supabase.auth.resetPasswordForEmail(email!);
      } else {
        await supabase.auth.resend({ type: "signup", email: email! });
      }
      setCooldown(RESEND_COOLDOWN);
      Alert.alert(t("auth.codeSent"), t("auth.codeSentMessage"));
    } catch {
      Alert.alert(t("common.error"), t("auth.genericError"));
    }
  }, [cooldown, email, type, t]);

  const digits = code.split("");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 8 }}>
        {/* Back */}
        <Pressable onPress={() => router.back()} style={{ marginBottom: 32, alignSelf: "flex-start" }}>
          <MingCuteIcon name="left-line" size={24} color={c.textPrimary} />
        </Pressable>

        {/* Title */}
        <Text style={{ fontFamily: "Rubik_600SemiBold", fontSize: 28, color: c.textPrimary, marginBottom: 8 }}>
          {t("auth.verifyEmail")}
        </Text>
        <Text style={{ fontFamily: "Rubik_400Regular", fontSize: 15, color: c.textSecondary, marginBottom: 40, lineHeight: 22 }}>
          {t("auth.verifyEmailDesc", { email })}
        </Text>

        {/* Code input area */}
        <Pressable onPress={() => inputRef.current?.focus()} style={{ marginBottom: 32 }}>
          <View style={{ position: "relative" }}>
            {/* Digit boxes */}
            <View style={{ flexDirection: "row", justifyContent: "center", gap: 10 }}>
              {Array.from({ length: CODE_LENGTH }).map((_, i) => {
                const isFilled = i < digits.length;
                const isActive = i === digits.length;
                return (
                  <View
                    key={i}
                    style={{
                      width: 48,
                      height: 56,
                      borderRadius: 14,
                      backgroundColor: c.surfaceAlt,
                      borderWidth: isActive ? 2 : 1.5,
                      borderColor: isActive ? c.textPrimary : c.border,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: "Rubik_600SemiBold",
                        fontSize: 24,
                        color: c.textPrimary,
                      }}
                    >
                      {isFilled ? digits[i] : ""}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Invisible input on top for paste support */}
            <TextInput
              ref={inputRef}
              value={code}
              onChangeText={(text) => setCode(text.replace(/[^0-9]/g, "").slice(0, CODE_LENGTH))}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete="one-time-code"
              maxLength={CODE_LENGTH}
              caretHidden
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                color: "transparent",
                backgroundColor: "transparent",
                fontSize: 1,
              }}
            />
          </View>
        </Pressable>

        {/* Verify button */}
        <Pressable
          onPress={handleVerify}
          disabled={loading || code.length !== CODE_LENGTH}
          style={{
            height: 56,
            borderRadius: 16,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: code.length === CODE_LENGTH ? c.buttonPrimary : c.skeleton,
            marginBottom: 20,
          }}
        >
          {loading ? (
            <ActivityIndicator color={c.buttonPrimaryText} />
          ) : (
            <Text style={{ fontFamily: "Rubik_500Medium", fontSize: 16, color: code.length === CODE_LENGTH ? c.buttonPrimaryText : c.textTertiary }}>
              {t("auth.verify")}
            </Text>
          )}
        </Pressable>

        {/* Resend */}
        <Pressable onPress={handleResend} disabled={cooldown > 0} style={{ alignItems: "center" }}>
          <Text style={{ fontFamily: "Rubik_400Regular", fontSize: 14, color: cooldown > 0 ? c.textTertiary : c.textPrimary }}>
            {cooldown > 0
              ? t("auth.resendIn", { seconds: cooldown })
              : t("auth.resendCode")}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
