import { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Alert, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { MingCuteIcon } from "@/components/ui/mingcute-icon";
import { useSavedItemsStore } from "@/store/saved-items";
import { useShallow } from "zustand/react/shallow";
import { useAuthStore } from "@/store/auth";
import { useThemeColors, type ThemeColors } from "@/hooks/use-theme";
import { useThemeStore } from "@/store/theme";
import { supabase } from "@/lib/supabase";
import { setLanguage, LANGUAGES, type AppLanguage } from "@/lib/i18n";

function MenuItem({
  label,
  onPress,
  dark,
  c,
}: {
  label: string;
  onPress?: () => void;
  dark?: boolean;
  c: ThemeColors;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        height: 64,
        borderRadius: 16,
        backgroundColor: dark ? c.buttonPrimary : c.surface,
      }}
    >
      <Text
        style={{
          fontFamily: "Rubik_400Regular",
          fontSize: 16,
          color: dark ? c.buttonPrimaryText : c.textPrimary,
        }}
      >
        {label}
      </Text>
      <MingCuteIcon
        name={dark ? "sparkles-fill" : "right-small-line"}
        size={24}
        color={dark ? c.buttonPrimaryText : c.textPrimary}
      />
    </Pressable>
  );
}

function NameEditor({
  name,
  userId,
  profile,
  setProfile,
  c,
}: {
  name: string;
  userId?: string;
  profile: any;
  setProfile: (p: any) => void;
  c: ThemeColors;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);

  // Sync value when name prop changes (e.g. after profile fetch)
  useEffect(() => { setValue(name); }, [name]);

  const handleSave = useCallback(async () => {
    const trimmed = value.trim();
    if (!trimmed || !userId) {
      setValue(name);
      setEditing(false);
      return;
    }
    setEditing(false);
    if (trimmed !== name) {
      await supabase.from("profiles").update({ display_name: trimmed }).eq("id", userId);
      if (profile) setProfile({ ...profile, display_name: trimmed });
    }
  }, [value, name, userId, profile, setProfile]);

  if (editing) {
    return (
      <TextInput
        value={value}
        onChangeText={setValue}
        onBlur={handleSave}
        onSubmitEditing={handleSave}
        autoFocus
        selectTextOnFocus
        style={{
          fontFamily: "Rubik_500Medium",
          fontSize: 20,
          color: c.textPrimary,
          textAlign: "center",
          borderBottomWidth: 1.5,
          borderBottomColor: c.textPrimary,
          paddingBottom: 4,
          minWidth: 120,
        }}
      />
    );
  }

  return (
    <Pressable onPress={() => { setValue(name); setEditing(true); }} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <Text style={{ fontFamily: "Rubik_500Medium", fontSize: 20, color: c.textPrimary }}>
        {name}
      </Text>
      <MingCuteIcon name="edit-2-line" size={16} color={c.textTertiary} />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const c = useThemeColors();
  const themeMode = useThemeStore((s) => s.mode);
  const setThemeMode = useThemeStore((s) => s.setMode);
  const { items, collections } = useSavedItemsStore(
    useShallow((s) => ({ items: s.items, collections: s.collections }))
  );
  const { profile, user, signOut, setProfile } = useAuthStore();
  const [langModalVisible, setLangModalVisible] = useState(false);

  const pickAvatar = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    if (!user) return;

    try {
      const uri = result.assets[0].uri;
      const ext = uri.split(".").pop() || "jpg";
      const path = `${user.id}/avatar.${ext}`;

      const response = await fetch(uri);
      const blob = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();

      await supabase.storage
        .from("avatars")
        .upload(path, new Uint8Array(arrayBuffer), {
          contentType: `image/${ext}`,
          upsert: true,
        });

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const avatarUrl = `${data.publicUrl}?t=${Date.now()}`;

      await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", user.id);
      if (profile) setProfile({ ...profile, avatar_url: avatarUrl });
    } catch {
      Alert.alert(t("common.error"), t("auth.genericError"));
    }
  }, [user, profile, setProfile, t]);

  const isDark = themeMode === "dark" || (themeMode === "system" && c.statusBar === "light");
  const currentLang = LANGUAGES.find((l) => l.key === i18n.language) ?? LANGUAGES[0];

  const toggleTheme = useCallback(() => {
    setThemeMode(isDark ? "light" : "dark");
  }, [isDark, setThemeMode]);

  const handleSelectLanguage = useCallback(async (lang: AppLanguage) => {
    await setLanguage(lang);
    setLangModalVisible(false);
  }, []);

  const insets = useSafeAreaInsets();

  return (
      <View style={{ flex: 1, backgroundColor: c.background }}>
        {/* Top Bar */}
        <View
          style={{
            height: 56,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-end",
            paddingHorizontal: 16,
            gap: 6,
          }}
        >
          {/* Language */}
          <Pressable
            onPress={() => setLangModalVisible(true)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              height: 36,
              paddingHorizontal: 12,
              borderRadius: 12,
              backgroundColor: c.surface,
              gap: 6,
            }}
          >
            <Text style={{ fontSize: 14 }}>{currentLang.flag}</Text>
            <Text
              style={{
                fontFamily: "Rubik_500Medium",
                fontSize: 13,
                color: c.textPrimary,
              }}
            >
              {currentLang.key.toUpperCase()}
            </Text>
          </Pressable>

          {/* Theme Toggle */}
          <Pressable
            onPress={toggleTheme}
            style={{
              width: 36,
              height: 36,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MingCuteIcon
              name={isDark ? "sun-line" : "moon-line"}
              size={22}
              color={c.textPrimary}
            />
          </Pressable>
        </View>

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {/* Profile Card */}
          <View style={{ alignItems: "center", paddingTop: 16, gap: 16 }}>
            <Pressable onPress={pickAvatar} style={{ position: "relative" }}>
              <View
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 60,
                  overflow: "hidden",
                  backgroundColor: c.surfaceAlt,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {profile?.avatar_url ? (
                  <Image
                    source={{ uri: profile.avatar_url }}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                  />
                ) : (
                  <MingCuteIcon name="user-3-line" size={48} color={c.textTertiary} />
                )}
              </View>
              {/* Edit badge */}
              <View
                style={{
                  position: "absolute",
                  bottom: 2,
                  right: 2,
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: c.surfaceAlt,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 3,
                  borderColor: c.background,
                }}
              >
                <MingCuteIcon name="camera-line" size={14} color={c.textPrimary} />
              </View>
            </Pressable>
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontFamily: "Rubik_500Medium", fontSize: 20, color: c.textPrimary }}>
                {profile?.display_name ?? user?.email?.split("@")[0] ?? t("profile.user")}
              </Text>
              <Text
                style={{
                  fontFamily: "Rubik_500Medium",
                  fontSize: 14,
                  color: c.textTertiary,
                  marginTop: 4,
                }}
              >
                {profile?.email ?? user?.email ?? ""}
              </Text>
            </View>
          </View>

          {/* Stats */}
          <View
            style={{
              flexDirection: "row",
              paddingHorizontal: 16,
              gap: 16,
              marginTop: 24,
            }}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: c.surface,
                borderRadius: 16,
                paddingVertical: 16,
                paddingHorizontal: 20,
              }}
            >
              <Text
                style={{
                  fontFamily: "Rubik_500Medium",
                  fontSize: 12,
                  color: c.textTertiary,
                }}
              >
                {t("profile.savedContent")}
              </Text>
              <Text
                style={{
                  fontFamily: "Rubik_500Medium",
                  fontSize: 32,
                  color: c.textPrimary,
                  marginTop: 4,
                }}
              >
                {items.length}
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: c.surface,
                borderRadius: 16,
                paddingVertical: 16,
                paddingHorizontal: 20,
              }}
            >
              <Text
                style={{
                  fontFamily: "Rubik_500Medium",
                  fontSize: 12,
                  color: c.textTertiary,
                }}
              >
                {t("profile.collection")}
              </Text>
              <Text
                style={{
                  fontFamily: "Rubik_500Medium",
                  fontSize: 32,
                  color: c.textPrimary,
                  marginTop: 4,
                }}
              >
                {collections.length}
              </Text>
            </View>
          </View>

          {/* Menu Items */}
          <View style={{ paddingHorizontal: 16, marginTop: 24, gap: 12 }}>
            <MenuItem
              label={t("profile.goPremium")}
              dark
              c={c}
              onPress={() => router.push("/premium-plan")}
            />
            <MenuItem
              label={t("profile.accountSettings")}
              c={c}
              onPress={() => router.push("/account-settings")}
            />
            <MenuItem
              label={t("notifications.title")}
              c={c}
              onPress={() => router.push("/notification-settings")}
            />
            <MenuItem label={t("profile.privacyPolicy")} c={c} />
            <MenuItem label={t("profile.termsOfService")} c={c} />
          </View>

          {/* Logout */}
          <View style={{ paddingHorizontal: 16, marginTop: 32, marginBottom: 40 }}>
            <Pressable
              onPress={() => signOut()}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                height: 56,
                borderRadius: 16,
                backgroundColor: c.errorBg,
                gap: 8,
              }}
            >
              <MingCuteIcon name="exit-line" size={20} color={c.error} />
              <Text
                style={{
                  fontFamily: "Rubik_500Medium",
                  fontSize: 16,
                  color: c.error,
                }}
              >
                {t("profile.logout")}
              </Text>
            </Pressable>
          </View>
        </ScrollView>

        {/* Language Modal */}
        <Modal
          visible={langModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setLangModalVisible(false)}
        >
          <Pressable style={{ flex: 1 }} onPress={() => setLangModalVisible(false)} />
          <View style={{ backgroundColor: c.sheetBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: insets.bottom + 16 }}>
            {/* Handle */}
            <View style={{ alignItems: "center", paddingTop: 12, paddingBottom: 4 }}>
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: c.handleIndicator }} />
            </View>
            <Text
              style={{
                fontFamily: "Rubik_600SemiBold",
                fontSize: 18,
                color: c.textPrimary,
                paddingHorizontal: 20,
                paddingTop: 8,
                paddingBottom: 16,
              }}
            >
              {t("profile.language")}
            </Text>
            {LANGUAGES.map((lang) => {
              const isSelected = i18n.language === lang.key;
              return (
                <Pressable
                  key={lang.key}
                  onPress={() => handleSelectLanguage(lang.key)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 20,
                    height: 56,
                    gap: 14,
                    backgroundColor: isSelected ? c.surface : "transparent",
                  }}
                >
                  <Text style={{ fontSize: 22 }}>{lang.flag}</Text>
                  <Text
                    style={{
                      flex: 1,
                      fontFamily: isSelected ? "Rubik_500Medium" : "Rubik_400Regular",
                      fontSize: 16,
                      color: c.textPrimary,
                    }}
                  >
                    {lang.label}
                  </Text>
                  {isSelected && (
                    <MingCuteIcon name="check-line" size={20} color={c.textPrimary} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </Modal>
      </View>
  );
}
