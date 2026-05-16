import { useCallback } from "react";
import { View, Text, Pressable, ScrollView, Switch, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { MingCuteIcon } from "@/components/ui/mingcute-icon";
import { useThemeColors } from "@/hooks/use-theme";
import { useThemeStore, type ThemeMode } from "@/store/theme";
import { setLanguage, LANGUAGES, type AppLanguage } from "@/lib/i18n";
import { useBubble } from "@/hooks/use-bubble";

const THEME_OPTIONS: { key: ThemeMode; labelKey: string; icon: string }[] = [
  { key: "light", labelKey: "preferences.themeLight", icon: "sun-line" },
  { key: "dark", labelKey: "preferences.themeDark", icon: "moon-line" },
  { key: "system", labelKey: "preferences.themeSystem", icon: "settings-3-line" },
];

export default function PreferencesScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const c = useThemeColors();
  const themeMode = useThemeStore((s) => s.mode);
  const setThemeMode = useThemeStore((s) => s.setMode);
  const bubble = useBubble();

  const handleSelectLanguage = useCallback(async (lang: AppLanguage) => {
    await setLanguage(lang);
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={["top"]}>
      {/* Top Bar */}
      <View style={{ height: 64, flexDirection: "row", alignItems: "center", paddingHorizontal: 16, gap: 12 }}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <MingCuteIcon name="left-line" size={24} color={c.textPrimary} />
        </Pressable>
        <Text style={{ fontFamily: "Rubik_500Medium", fontSize: 20, color: c.textPrimary }}>
          {t("preferences.title")}
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, gap: 24 }}>
        {/* Theme */}
        <View style={{ gap: 12 }}>
          <Text style={{ fontFamily: "Rubik_500Medium", fontSize: 14, color: c.textTertiary, paddingHorizontal: 4 }}>
            {t("preferences.theme")}
          </Text>
          <View style={{ backgroundColor: c.surface, borderRadius: 16, overflow: "hidden" }}>
            {THEME_OPTIONS.map((opt, i) => {
              const isSelected = themeMode === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => setThemeMode(opt.key)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingHorizontal: 20,
                    height: 56,
                    borderTopWidth: i > 0 ? 1 : 0,
                    borderTopColor: c.divider,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <MingCuteIcon name={opt.icon} size={20} color={c.textPrimary} />
                    <Text style={{ fontFamily: "Rubik_400Regular", fontSize: 15, color: c.textPrimary }}>
                      {t(opt.labelKey)}
                    </Text>
                  </View>
                  <View style={{
                    width: 22, height: 22, borderRadius: 11,
                    borderWidth: 2,
                    borderColor: isSelected ? c.buttonPrimary : c.border,
                    alignItems: "center", justifyContent: "center",
                  }}>
                    {isSelected && (
                      <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: c.buttonPrimary }} />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Language */}
        <View style={{ gap: 12 }}>
          <Text style={{ fontFamily: "Rubik_500Medium", fontSize: 14, color: c.textTertiary, paddingHorizontal: 4 }}>
            {t("preferences.language")}
          </Text>
          <View style={{ backgroundColor: c.surface, borderRadius: 16, overflow: "hidden" }}>
            {LANGUAGES.map((lang, i) => {
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
                    borderTopWidth: i > 0 ? 1 : 0,
                    borderTopColor: c.divider,
                  }}
                >
                  <Text style={{ fontSize: 22 }}>{lang.flag}</Text>
                  <Text style={{
                    flex: 1,
                    fontFamily: isSelected ? "Rubik_500Medium" : "Rubik_400Regular",
                    fontSize: 15,
                    color: c.textPrimary,
                  }}>
                    {lang.label}
                  </Text>
                  <View style={{
                    width: 22, height: 22, borderRadius: 11,
                    borderWidth: 2,
                    borderColor: isSelected ? c.buttonPrimary : c.border,
                    alignItems: "center", justifyContent: "center",
                  }}>
                    {isSelected && (
                      <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: c.buttonPrimary }} />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
        {/* Savely Bubble – Android only */}
        {Platform.OS === "android" && (
          <View style={{ gap: 12 }}>
            <Text style={{ fontFamily: "Rubik_500Medium", fontSize: 14, color: c.textTertiary, paddingHorizontal: 4 }}>
              Savely Bubble
            </Text>
            <View style={{ backgroundColor: c.surface, borderRadius: 16, overflow: "hidden" }}>
              {/* Main toggle */}
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, height: 64 }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ fontFamily: "Rubik_500Medium", fontSize: 15, color: c.textPrimary }}>
                    Floating Bubble
                  </Text>
                  <Text style={{ fontFamily: "Rubik_400Regular", fontSize: 12, color: c.textTertiary }} numberOfLines={2}>
                    Herhangi bir uygulamada baloncuğu içeriğin üzerine sürükleyerek kaydet
                  </Text>
                </View>
                <Switch
                  value={bubble.running}
                  onValueChange={bubble.toggleBubble}
                  trackColor={{ true: c.buttonPrimary }}
                  disabled={bubble.checking || (!bubble.permissions.overlay && !bubble.running)}
                />
              </View>

              {/* Overlay permission row */}
              {!bubble.permissions.overlay && (
                <>
                  <View style={{ height: 1, backgroundColor: c.divider, marginHorizontal: 20 }} />
                  <Pressable
                    onPress={bubble.requestOverlayPermission}
                    style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, height: 56, gap: 12 }}
                  >
                    <MingCuteIcon name="alert-line" size={20} color="#f59e0b" />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: "Rubik_500Medium", fontSize: 14, color: c.textPrimary }}>
                        Ekran üstü izni ver
                      </Text>
                      <Text style={{ fontFamily: "Rubik_400Regular", fontSize: 12, color: c.textTertiary }}>
                        Bubble'ın diğer uygulamaların üstünde görünmesi için gerekli
                      </Text>
                    </View>
                    <MingCuteIcon name="right-line" size={18} color={c.textTertiary} />
                  </Pressable>
                </>
              )}

              {/* Accessibility permission row */}
              {!bubble.permissions.accessibility && (
                <>
                  <View style={{ height: 1, backgroundColor: c.divider, marginHorizontal: 20 }} />
                  <Pressable
                    onPress={bubble.requestAccessibilityPermission}
                    style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, height: 56, gap: 12 }}
                  >
                    <MingCuteIcon name="eye-line" size={20} color="#6366f1" />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: "Rubik_500Medium", fontSize: 14, color: c.textPrimary }}>
                        Erişilebilirlik iznini etkinleştir
                      </Text>
                      <Text style={{ fontFamily: "Rubik_400Regular", fontSize: 12, color: c.textTertiary }}>
                        Instagram, Twitter, LinkedIn, YouTube URL algılaması için önerilir
                      </Text>
                    </View>
                    <MingCuteIcon name="right-line" size={18} color={c.textTertiary} />
                  </Pressable>
                </>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
