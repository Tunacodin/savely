import { View, Text, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MingCuteIcon } from "@/components/ui/mingcute-icon";
import { useAuthStore } from "@/store/auth";
import { useThemeColors } from "@/hooks/use-theme";

export default function AccountSettingsScreen() {
  const router = useRouter();
  const { signOut, profile } = useAuthStore();
  const c = useThemeColors();

  function InfoField({ label, value }: { label: string; value: string }) {
    return (
      <View
        style={{
          backgroundColor: c.surface,
          borderRadius: 16,
          paddingHorizontal: 20,
          paddingVertical: 16,
          height: 80,
          justifyContent: "center",
        }}
      >
        <Text
          style={{ fontFamily: "Rubik_400Regular", fontSize: 14, color: c.textSecondary, marginBottom: 4 }}
        >
          {label}
        </Text>
        <Text
          style={{ fontFamily: "Rubik_400Regular", fontSize: 16, color: c.textPrimary }}
        >
          {value}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={["top"]}>
      {/* Top Bar */}
      <View
        style={{
          height: 64,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          gap: 12,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <MingCuteIcon name="left-line" size={24} color={c.textPrimary} />
        </Pressable>
        <Text
          style={{ fontFamily: "Rubik_500Medium", fontSize: 20, color: c.textPrimary }}
        >
          Hesap Ayarlar\u0131
        </Text>
      </View>

      {/* Info Fields */}
      <View style={{ paddingHorizontal: 16, gap: 12, marginTop: 8 }}>
        <InfoField label="Ad, Soyad" value={profile?.display_name ?? "\u2014"} />
        <InfoField label="Eposta" value={profile?.email ?? "\u2014"} />
        <InfoField label="\u015eifre" value="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" />
      </View>

      {/* Logout Button */}
      <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
        <Pressable
          onPress={() => {
            Alert.alert("\u00c7\u0131k\u0131\u015f Yap", "Hesab\u0131ndan \u00e7\u0131kmak istedi\u011fine emin misin?", [
              { text: "\u0130ptal", style: "cancel" },
              { text: "\u00c7\u0131k\u0131\u015f Yap", style: "destructive", onPress: () => { signOut(); router.replace("/(auth)/login"); } },
            ]);
          }}
          style={{
            backgroundColor: c.errorBg,
            borderRadius: 16,
            height: 64,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{ fontFamily: "Rubik_400Regular", fontSize: 16, color: c.error }}
          >
            {"\u00c7\u0131k\u0131\u015f Yap"}
          </Text>
        </Pressable>
      </View>

      {/* Delete Account */}
      <View style={{ alignItems: "center", marginTop: 20 }}>
        <Pressable>
          <Text
            style={{ fontFamily: "Rubik_400Regular", fontSize: 16, color: c.textTertiary }}
          >
            {"Hesab\u0131 Sil"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
