import { useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { MingCuteIcon } from "@/components/ui/mingcute-icon";
import { useThemeColors } from "@/hooks/use-theme";
import { useNotificationStore, type NotificationFrequency } from "@/store/notifications";
import { useAuthStore } from "@/store/auth";
import { useSavedItemsStore } from "@/store/saved-items";
import { supabase } from "@/lib/supabase";

interface CategoryMatch {
  slug: string;
  displayName: string;
  icon: string;
}

const FREQUENCY_OPTIONS: { key: NotificationFrequency; labelKey: string }[] = [
  { key: "low", labelKey: "notifications.frequencyLow" },
  { key: "normal", labelKey: "notifications.frequencyNormal" },
  { key: "high", labelKey: "notifications.frequencyHigh" },
];

const PAUSE_OPTIONS = [
  { days: 1, labelKey: "notifications.pause1Day" },
  { days: 3, labelKey: "notifications.pause3Days" },
  { days: 7, labelKey: "notifications.pause1Week" },
];

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const c = useThemeColors();
  const user = useAuthStore((s) => s.user);
  const collections = useSavedItemsStore((s) => s.collections);
  const { preferences, loadPreferences, updatePreferences, toggleCategory, pauseNotifications, resumeNotifications } = useNotificationStore();
  const [matchedCategories, setMatchedCategories] = useState<CategoryMatch[]>([]);

  useEffect(() => {
    if (user) loadPreferences(user.id);
  }, [user]);

  // Load categories and match with user collections
  useEffect(() => {
    async function matchCategories() {
      const { data: categories } = await supabase
        .from("default_categories")
        .select("slug, display_name, keywords, icon")
        .eq("is_active", true);

      if (!categories) return;

      const matched = new Set<string>();
      const results: CategoryMatch[] = [];

      for (const col of collections) {
        const name = col.name.toLowerCase();
        for (const cat of categories) {
          if (matched.has(cat.slug)) continue;
          for (const kw of cat.keywords) {
            if (name.includes(kw.toLowerCase())) {
              results.push({ slug: cat.slug, displayName: cat.display_name, icon: cat.icon });
              matched.add(cat.slug);
              break;
            }
          }
        }
      }
      setMatchedCategories(results);
    }
    matchCategories();
  }, [collections]);

  const isPaused = preferences.pausedUntil && new Date(preferences.pausedUntil) > new Date();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={["top"]}>
      {/* Top Bar */}
      <View style={{ height: 64, flexDirection: "row", alignItems: "center", paddingHorizontal: 16, gap: 12 }}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <MingCuteIcon name="left-line" size={24} color={c.textPrimary} />
        </Pressable>
        <Text style={{ fontFamily: "Rubik_500Medium", fontSize: 20, color: c.textPrimary }}>
          {t("notifications.title")}
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, gap: 24 }}>
        {/* Master Toggle */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: c.surface, borderRadius: 16, paddingHorizontal: 20, height: 64 }}>
          <Text style={{ fontFamily: "Rubik_400Regular", fontSize: 16, color: c.textPrimary }}>
            {t("notifications.enabled")}
          </Text>
          <Switch
            value={preferences.enabled}
            onValueChange={(val) => updatePreferences({ enabled: val })}
            trackColor={{ false: c.border, true: c.buttonPrimary }}
          />
        </View>

        {/* Frequency */}
        {preferences.enabled && (
          <>
            <View style={{ gap: 12 }}>
              <Text style={{ fontFamily: "Rubik_500Medium", fontSize: 14, color: c.textTertiary, paddingHorizontal: 4 }}>
                {t("notifications.frequency")}
              </Text>
              <View style={{ backgroundColor: c.surface, borderRadius: 16, overflow: "hidden" }}>
                {FREQUENCY_OPTIONS.map((opt, i) => (
                  <Pressable
                    key={opt.key}
                    onPress={() => updatePreferences({ frequency: opt.key })}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingHorizontal: 20,
                      height: 52,
                      borderTopWidth: i > 0 ? 1 : 0,
                      borderTopColor: c.divider,
                    }}
                  >
                    <Text style={{ fontFamily: "Rubik_400Regular", fontSize: 15, color: c.textPrimary }}>
                      {t(opt.labelKey)}
                    </Text>
                    <View style={{
                      width: 22, height: 22, borderRadius: 11,
                      borderWidth: 2,
                      borderColor: preferences.frequency === opt.key ? c.buttonPrimary : c.border,
                      alignItems: "center", justifyContent: "center",
                    }}>
                      {preferences.frequency === opt.key && (
                        <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: c.buttonPrimary }} />
                      )}
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Category Opt-outs */}
            {matchedCategories.length > 0 && (
              <View style={{ gap: 12 }}>
                <Text style={{ fontFamily: "Rubik_500Medium", fontSize: 14, color: c.textTertiary, paddingHorizontal: 4 }}>
                  {t("notifications.categoryNotifications")}
                </Text>
                <View style={{ backgroundColor: c.surface, borderRadius: 16, overflow: "hidden" }}>
                  {matchedCategories.map((cat, i) => {
                    const isEnabled = !preferences.categoryOptOuts.includes(cat.slug);
                    return (
                      <View
                        key={cat.slug}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          paddingHorizontal: 20,
                          height: 52,
                          borderTopWidth: i > 0 ? 1 : 0,
                          borderTopColor: c.divider,
                        }}
                      >
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                          <Text style={{ fontSize: 18 }}>{cat.icon}</Text>
                          <Text style={{ fontFamily: "Rubik_400Regular", fontSize: 15, color: c.textPrimary }}>
                            {cat.displayName}
                          </Text>
                        </View>
                        <Switch
                          value={isEnabled}
                          onValueChange={() => toggleCategory(cat.slug)}
                          trackColor={{ false: c.border, true: c.buttonPrimary }}
                        />
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Pause */}
            <View style={{ gap: 12 }}>
              <Text style={{ fontFamily: "Rubik_500Medium", fontSize: 14, color: c.textTertiary, paddingHorizontal: 4 }}>
                {t("notifications.pauseNotifications")}
              </Text>
              {isPaused ? (
                <View style={{ backgroundColor: c.surface, borderRadius: 16, padding: 20, gap: 12 }}>
                  <Text style={{ fontFamily: "Rubik_400Regular", fontSize: 14, color: c.textSecondary }}>
                    {t("notifications.pauseActive", {
                      date: new Date(preferences.pausedUntil!).toLocaleDateString("tr-TR", { day: "numeric", month: "long" }),
                    })}
                  </Text>
                  <Pressable
                    onPress={() => resumeNotifications()}
                    style={{ height: 44, borderRadius: 12, backgroundColor: c.buttonPrimary, alignItems: "center", justifyContent: "center" }}
                  >
                    <Text style={{ fontFamily: "Rubik_500Medium", fontSize: 14, color: c.buttonPrimaryText }}>
                      {t("notifications.resume")}
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <View style={{ flexDirection: "row", gap: 10 }}>
                  {PAUSE_OPTIONS.map((opt) => (
                    <Pressable
                      key={opt.days}
                      onPress={() => pauseNotifications(opt.days)}
                      style={{ flex: 1, height: 44, borderRadius: 12, backgroundColor: c.surface, alignItems: "center", justifyContent: "center" }}
                    >
                      <Text style={{ fontFamily: "Rubik_400Regular", fontSize: 14, color: c.textPrimary }}>
                        {t(opt.labelKey)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
