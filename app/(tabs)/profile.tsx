import { useCallback, useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Alert } from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { MingCuteIcon } from "@/components/ui/mingcute-icon";
import { useSavedItemsStore } from "@/store/saved-items";
import { useShallow } from "zustand/react/shallow";
import { useAuthStore } from "@/store/auth";
import { useThemeColors, type ThemeColors } from "@/hooks/use-theme";
import { supabase } from "@/lib/supabase";

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
        paddingHorizontal: 16,
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
  const { t } = useTranslation();
  const c = useThemeColors();
  const { items, collections } = useSavedItemsStore(
    useShallow((s) => ({ items: s.items, collections: s.collections }))
  );
  const { profile, user, setProfile } = useAuthStore();

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

  return (
      <View style={{ flex: 1, backgroundColor: c.background }}>
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {/* Profile Card */}
          <View style={{ alignItems: "center", paddingTop: 32, gap: 24 }}>
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
                  borderWidth: 2,
                  borderColor: c.textPrimary,
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
            <View style={{ alignItems: "center", gap: 20 }}>
              <Text style={{ fontFamily: "Rubik_500Medium", fontSize: 20, color: c.textPrimary }}>
                {profile?.display_name ?? user?.email?.split("@")[0] ?? t("profile.user")}
              </Text>
              <Text
                style={{
                  fontFamily: "Rubik_500Medium",
                  fontSize: 14,
                  color: c.textTertiary,
                  textAlign: "center",
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
              gap: 20,
              marginTop: 24,
            }}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: c.surface,
                borderRadius: 24,
                padding: 24,
                gap: 20,
              }}
            >
              <Text
                style={{
                  fontFamily: "Rubik_500Medium",
                  fontSize: 12,
                  color: c.textTertiary,
                  textAlign: "center",
                }}
              >
                {t("profile.savedContent")}
              </Text>
              <Text
                style={{
                  fontFamily: "Rubik_500Medium",
                  fontSize: 32,
                  color: c.textPrimary,
                  textAlign: "center",
                }}
              >
                {items.length}
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: c.surface,
                borderRadius: 24,
                padding: 24,
                gap: 20,
              }}
            >
              <Text
                style={{
                  fontFamily: "Rubik_500Medium",
                  fontSize: 12,
                  color: c.textTertiary,
                  textAlign: "center",
                }}
              >
                {t("profile.collection")}
              </Text>
              <Text
                style={{
                  fontFamily: "Rubik_500Medium",
                  fontSize: 32,
                  color: c.textPrimary,
                  textAlign: "center",
                }}
              >
                {collections.length}
              </Text>
            </View>
          </View>

          {/* Menu Items */}
          <View style={{ paddingHorizontal: 16, marginTop: 24, gap: 16 }}>
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
              label={t("profile.preferences")}
              c={c}
              onPress={() => router.push("/preferences")}
            />
            <MenuItem
              label={t("notifications.title")}
              c={c}
              onPress={() => router.push("/notification-settings")}
            />
            <MenuItem label={t("profile.privacyPolicy")} c={c} />
            <MenuItem label={t("profile.termsOfService")} c={c} />
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
  );
}
