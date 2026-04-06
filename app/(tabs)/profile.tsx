import { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { MingCuteIcon } from "@/components/ui/mingcute-icon";
import { useSavedItemsStore } from "@/store/saved-items";
import { useShallow } from "zustand/react/shallow";
import { useAuthStore } from "@/store/auth";
import { useThemeColors, type ThemeColors } from "@/hooks/use-theme";
import { useThemeStore, type ThemeMode } from "@/store/theme";
import { setLanguage, type AppLanguage } from "@/lib/i18n";

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

export default function ProfileScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const c = useThemeColors();
  const themeMode = useThemeStore((s) => s.mode);
  const setThemeMode = useThemeStore((s) => s.setMode);
  const { items, collections } = useSavedItemsStore(
    useShallow((s) => ({ items: s.items, collections: s.collections }))
  );
  const { profile, user, signOut } = useAuthStore();

  const handleLanguageChange = async (lang: AppLanguage) => {
    await setLanguage(lang);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={["top"]}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={{ alignItems: "center", paddingTop: 32, gap: 16 }}>
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              overflow: "hidden",
              backgroundColor: c.surfaceAlt,
            }}
          >
            <Image
              source={profile?.avatar_url ? { uri: profile.avatar_url } : require("@/assets/images/icon.png")}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
            />
          </View>
          <View style={{ alignItems: "center" }}>
            <Text
              style={{
                fontFamily: "Rubik_500Medium",
                fontSize: 20,
                color: c.textPrimary,
              }}
            >
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

        {/* Theme Toggle */}
        <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              height: 64,
              borderRadius: 16,
              backgroundColor: c.surface,
            }}
          >
            <Text style={{ fontFamily: "Rubik_400Regular", fontSize: 16, color: c.textPrimary }}>
              {t("profile.theme")}
            </Text>
            <View style={{ flexDirection: "row", backgroundColor: c.surfaceAlt, borderRadius: 12, padding: 3 }}>
              {([
                { key: "light" as ThemeMode, icon: "sun-line" },
                { key: "system" as ThemeMode, icon: "cellphone-line" },
                { key: "dark" as ThemeMode, icon: "moon-line" },
              ]).map(({ key, icon }) => (
                <Pressable
                  key={key}
                  onPress={() => setThemeMode(key)}
                  style={{
                    width: 40,
                    height: 34,
                    borderRadius: 10,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: themeMode === key ? c.background : "transparent",
                  }}
                >
                  <MingCuteIcon
                    name={icon as any}
                    size={18}
                    color={themeMode === key ? c.text : c.textTertiary}
                  />
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* Language Selector */}
        <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              height: 64,
              borderRadius: 16,
              backgroundColor: c.surface,
            }}
          >
            <Text style={{ fontFamily: "Rubik_400Regular", fontSize: 16, color: c.textPrimary }}>
              {t("profile.language")}
            </Text>
            <View style={{ flexDirection: "row", backgroundColor: c.surfaceAlt, borderRadius: 12, padding: 3 }}>
              {([
                { key: "tr" as AppLanguage, label: "TR" },
                { key: "en" as AppLanguage, label: "EN" },
              ]).map(({ key, label }) => (
                <Pressable
                  key={key}
                  onPress={() => handleLanguageChange(key)}
                  style={{
                    width: 44,
                    height: 34,
                    borderRadius: 10,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: i18n.language === key ? c.background : "transparent",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Rubik_500Medium",
                      fontSize: 14,
                      color: i18n.language === key ? c.text : c.textTertiary,
                    }}
                  >
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View style={{ paddingHorizontal: 16, marginTop: 12, gap: 12 }}>
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
    </SafeAreaView>
  );
}
