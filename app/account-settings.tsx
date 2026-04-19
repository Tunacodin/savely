import { useState, useCallback } from "react";
import { View, Text, TextInput, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { MingCuteIcon } from "@/components/ui/mingcute-icon";
import { useAuthStore } from "@/store/auth";
import { useThemeColors } from "@/hooks/use-theme";
import { supabase } from "@/lib/supabase";

export default function AccountSettingsScreen() {
  const router = useRouter();
  const { signOut, profile, user, setProfile } = useAuthStore();
  const c = useThemeColors();
  const { t } = useTranslation();

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(profile?.display_name ?? "");

  const handleSaveName = useCallback(async () => {
    const trimmed = nameValue.trim();
    setEditingName(false);
    if (!trimmed || !user) return;
    if (trimmed === profile?.display_name) return;

    await supabase.from("profiles").update({ display_name: trimmed }).eq("id", user.id);
    if (profile) setProfile({ ...profile, display_name: trimmed });
  }, [nameValue, user, profile, setProfile]);

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
          {t("accountSettings.title")}
        </Text>
      </View>

      {/* Info Fields */}
      <View style={{ paddingHorizontal: 16, gap: 12, marginTop: 8 }}>
        {/* Name - Editable */}
        <Pressable
          onPress={() => { setNameValue(profile?.display_name ?? ""); setEditingName(true); }}
          style={{
            backgroundColor: c.surface,
            borderRadius: 16,
            paddingHorizontal: 20,
            paddingVertical: 16,
            height: 80,
            justifyContent: "center",
          }}
        >
          <Text style={{ fontFamily: "Rubik_400Regular", fontSize: 14, color: c.textSecondary, marginBottom: 4 }}>
            {t("accountSettings.fullName")}
          </Text>
          {editingName ? (
            <TextInput
              value={nameValue}
              onChangeText={setNameValue}
              onBlur={handleSaveName}
              onSubmitEditing={handleSaveName}
              autoFocus
              style={{ fontFamily: "Rubik_400Regular", fontSize: 16, color: c.textPrimary, padding: 0, margin: 0 }}
            />
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={{ fontFamily: "Rubik_400Regular", fontSize: 16, color: c.textPrimary }}>
                {profile?.display_name || "\u2014"}
              </Text>
              <MingCuteIcon name="edit-2-line" size={16} color={c.textTertiary} />
            </View>
          )}
        </Pressable>

        {/* Email - Read only */}
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
          <Text style={{ fontFamily: "Rubik_400Regular", fontSize: 14, color: c.textSecondary, marginBottom: 4 }}>
            {t("accountSettings.email")}
          </Text>
          <Text style={{ fontFamily: "Rubik_400Regular", fontSize: 16, color: c.textPrimary }}>
            {profile?.email ?? "\u2014"}
          </Text>
        </View>

        {/* Password - Read only */}
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
          <Text style={{ fontFamily: "Rubik_400Regular", fontSize: 14, color: c.textSecondary, marginBottom: 4 }}>
            {t("accountSettings.password")}
          </Text>
          <Text style={{ fontFamily: "Rubik_400Regular", fontSize: 16, color: c.textPrimary }}>
            {"\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"}
          </Text>
        </View>
      </View>

      {/* Logout Button */}
      <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
        <Pressable
          onPress={() => {
            Alert.alert(t("profile.logout"), t("accountSettings.logoutConfirm"), [
              { text: t("common.cancel"), style: "cancel" },
              { text: t("profile.logout"), style: "destructive", onPress: () => { signOut(); router.replace("/(auth)/login"); } },
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
          <Text style={{ fontFamily: "Rubik_400Regular", fontSize: 16, color: c.error }}>
            {t("profile.logout")}
          </Text>
        </Pressable>
      </View>

      {/* Delete Account */}
      <View style={{ alignItems: "center", marginTop: 20 }}>
        <Pressable>
          <Text style={{ fontFamily: "Rubik_400Regular", fontSize: 16, color: c.textTertiary }}>
            {t("accountSettings.deleteAccount")}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
