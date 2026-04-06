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
import { MingCuteIcon } from "@/components/ui/mingcute-icon";
import { supabase } from "@/lib/supabase";
import { useThemeColors } from "@/hooks/use-theme";

export default function EmailLoginScreen() {
  const router = useRouter();
  const c = useThemeColors();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.toLowerCase().includes("invalid login credentials") || error.message.toLowerCase().includes("invalid")) {
            Alert.alert("Giri\u015f Ba\u015far\u0131s\u0131z", "E-posta veya \u015fifre hatal\u0131. L\u00fctfen bilgilerinizi kontrol edip tekrar deneyin.");
          } else {
            Alert.alert("Hata", error.message);
          }
        }
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) {
          if (error.message.toLowerCase().includes("already registered") || error.message.toLowerCase().includes("already exists")) {
            Alert.alert("Bu e-posta kay\u0131tl\u0131", "Bu e-posta adresi zaten kay\u0131tl\u0131. Giri\u015f yapmay\u0131 deneyin.");
          } else {
            Alert.alert("Hata", error.message);
          }
        }
      }
    } catch (err: any) {
      Alert.alert("Hata", err.message ?? "Bir hata olu\u015ftu.");
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
            {isLogin ? "Giri\u015f Yap" : "Kay\u0131t Ol"}
          </Text>
          <Text style={{ fontFamily: "Rubik_400Regular", fontSize: 15, color: c.textSecondary, marginBottom: 32 }}>
            {isLogin ? "E-posta ve \u015fifrenle devam et." : "Hesap olu\u015fturmak i\u00e7in bilgilerini gir."}
          </Text>

          <Text style={{ fontFamily: "Rubik_500Medium", fontSize: 14, color: c.textPrimary, marginBottom: 8 }}>
            E-Posta
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="ornek@email.com"
            placeholderTextColor={c.textTertiary}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            style={{ backgroundColor: c.surfaceAlt, borderRadius: 14, paddingHorizontal: 16, height: 56, fontFamily: "Rubik_400Regular", fontSize: 16, color: c.textPrimary, marginBottom: 16 }}
          />

          <Text style={{ fontFamily: "Rubik_500Medium", fontSize: 14, color: c.textPrimary, marginBottom: 8 }}>
            {"\u015eifre"}
          </Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
            placeholderTextColor={c.textTertiary}
            secureTextEntry
            style={{ backgroundColor: c.surfaceAlt, borderRadius: 14, paddingHorizontal: 16, height: 56, fontFamily: "Rubik_400Regular", fontSize: 16, color: c.textPrimary, marginBottom: 32 }}
          />

          <Pressable
            onPress={handleSubmit}
            disabled={loading || !email || !password}
            style={{ height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: email && password ? c.buttonPrimary : c.skeleton, marginBottom: 16 }}
          >
            {loading ? (
              <ActivityIndicator color={c.buttonPrimaryText} />
            ) : (
              <Text style={{ fontFamily: "Rubik_400Regular", fontSize: 16, color: email && password ? c.buttonPrimaryText : c.textTertiary }}>
                {isLogin ? "Giri\u015f Yap" : "Kay\u0131t Ol"}
              </Text>
            )}
          </Pressable>

          <Pressable onPress={() => setIsLogin(!isLogin)} style={{ alignItems: "center" }}>
            <Text style={{ fontFamily: "Rubik_400Regular", fontSize: 14, color: c.textTertiary }}>
              {isLogin ? "Hesab\u0131n yok mu? " : "Zaten hesab\u0131n var m\u0131? "}
              <Text style={{ color: c.textPrimary, fontFamily: "Rubik_500Medium" }}>
                {isLogin ? "Kay\u0131t Ol" : "Giri\u015f Yap"}
              </Text>
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
