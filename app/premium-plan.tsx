import { useState, useCallback } from "react";
import { ScrollView, View, Text, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { MingCuteIcon } from "@/components/ui/mingcute-icon";
import { useSavedItemsStore } from "@/store/saved-items";
import { useShallow } from "zustand/react/shallow";
import { useThemeColors } from "@/hooks/use-theme";
import type { PremiumPlan } from "@/types";

export default function PremiumPlanScreen() {
  const router = useRouter();
  const c = useThemeColors();
  const { t } = useTranslation();
  const { availablePlans, subscription, upgradeToPremium } = useSavedItemsStore(
    useShallow((s) => ({
      availablePlans: s.availablePlans,
      subscription: s.subscription,
      upgradeToPremium: s.upgradeToPremium,
    }))
  );

  const proPlans = availablePlans.filter((p) => p.tier === "pro");
  const freePlan = availablePlans.find((p) => p.tier === "free");
  const yearlyPlan = proPlans.find((p) => p.billingPeriod === "yearly");
  const monthlyPlan = proPlans.find((p) => p.billingPeriod === "monthly");
  const savings = yearlyPlan && monthlyPlan
    ? Math.round((1 - yearlyPlan.price / (monthlyPlan.price * 12)) * 100)
    : 33;

  const [selectedPlan, setSelectedPlan] = useState<PremiumPlan | null>(yearlyPlan ?? null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUpgrade = useCallback(async () => {
    if (!selectedPlan) return;
    setIsProcessing(true);
    setTimeout(() => {
      upgradeToPremium(selectedPlan);
      setIsProcessing(false);
      router.back();
    }, 1500);
  }, [selectedPlan, upgradeToPremium, router]);

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
          {t("premium.choosePlan")}
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 16, gap: 16 }}>
          {/* Plan selector rows */}
          {yearlyPlan && (
            <Pressable
              onPress={() => setSelectedPlan(yearlyPlan)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: c.surfaceAlt,
                borderRadius: 12,
                padding: 16,
                gap: 12,
                borderWidth: selectedPlan?.id === yearlyPlan.id ? 1.5 : 0,
                borderColor: selectedPlan?.id === yearlyPlan.id ? c.textPrimary : "transparent",
              }}
            >
              <View
                style={{
                  width: 24, height: 24, borderRadius: 12,
                  borderWidth: 2,
                  borderColor: selectedPlan?.id === yearlyPlan.id ? c.textPrimary : c.border,
                  alignItems: "center", justifyContent: "center",
                }}
              >
                {selectedPlan?.id === yearlyPlan.id && (
                  <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: c.textPrimary }} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: "Rubik_400Regular", fontSize: 14, color: selectedPlan?.id === yearlyPlan.id ? c.textPrimary : c.textMuted }}>
                  {t("premium.yearly")}
                </Text>
                <Text style={{ fontFamily: "Rubik_600SemiBold", fontSize: 20, color: c.textPrimary }}>
                  {`$${(yearlyPlan.price / 12).toFixed(2)} /month`}
                </Text>
              </View>
              <View style={{ backgroundColor: c.buttonPrimary, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 }}>
                <Text style={{ fontFamily: "Rubik_400Regular", fontSize: 12, color: c.buttonPrimaryText }}>
                  {`-%${savings} off`}
                </Text>
              </View>
            </Pressable>
          )}
          {monthlyPlan && (
            <Pressable
              onPress={() => setSelectedPlan(monthlyPlan)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: c.surfaceAlt,
                borderRadius: 12,
                padding: 16,
                gap: 12,
                borderWidth: selectedPlan?.id === monthlyPlan.id ? 1.5 : 0,
                borderColor: selectedPlan?.id === monthlyPlan.id ? c.textPrimary : "transparent",
              }}
            >
              <View
                style={{
                  width: 24, height: 24, borderRadius: 12,
                  borderWidth: 2,
                  borderColor: selectedPlan?.id === monthlyPlan.id ? c.textPrimary : c.border,
                  alignItems: "center", justifyContent: "center",
                }}
              >
                {selectedPlan?.id === monthlyPlan.id && (
                  <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: c.textPrimary }} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: "Rubik_400Regular", fontSize: 14, color: selectedPlan?.id === monthlyPlan.id ? c.textPrimary : c.textMuted }}>
                  {t("premium.monthly")}
                </Text>
                <Text style={{ fontFamily: "Rubik_600SemiBold", fontSize: 20, color: c.textPrimary }}>
                  {`$${monthlyPlan.price.toFixed(2)} /month`}
                </Text>
              </View>
            </Pressable>
          )}

          {/* Plan cards */}
          <View style={{ flexDirection: "row", gap: 12 }}>
            {freePlan && (
              <View style={{ borderRadius: 16, padding: 20, backgroundColor: c.surface, flex: 1 }}>
                <Text style={{ fontFamily: "Rubik_600SemiBold", fontSize: 32, color: c.textPrimary, marginBottom: 4 }}>Free</Text>
                <Text style={{ fontFamily: "Rubik_400Regular", fontSize: 12, color: c.textMuted, marginBottom: 16, lineHeight: 16 }}>
                  {t("premium.freeDesc")}
                </Text>
                {freePlan.features.map((f, i) => (
                  <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <MingCuteIcon name="arrow-right-line" size={16} color={c.textPrimary} />
                    <Text style={{ fontFamily: "Rubik_400Regular", fontSize: 14, color: c.textPrimary }}>{f}</Text>
                  </View>
                ))}
              </View>
            )}
            {proPlans.length > 0 && (
              <View style={{ borderRadius: 16, padding: 20, backgroundColor: c.buttonPrimary, flex: 1 }}>
                <Text style={{ fontFamily: "Rubik_600SemiBold", fontSize: 32, color: c.buttonPrimaryText, marginBottom: 4 }}>Pro</Text>
                <Text style={{ fontFamily: "Rubik_400Regular", fontSize: 12, color: c.buttonSecondaryText, marginBottom: 16, lineHeight: 16 }}>
                  {t("premium.proDesc")}
                </Text>
                {proPlans[0].features.map((f, i) => (
                  <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <MingCuteIcon name="arrow-right-line" size={16} color={c.buttonPrimaryText} />
                    <Text style={{ fontFamily: "Rubik_400Regular", fontSize: 14, color: c.buttonPrimaryText }}>{f}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 16,
          backgroundColor: c.surface,
        }}
      >
        <Pressable
          onPress={handleUpgrade}
          disabled={!selectedPlan || isProcessing || subscription.tier === "pro"}
          style={{
            height: 64,
            borderRadius: 16,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor:
              selectedPlan && subscription.tier !== "pro" ? c.buttonPrimary : c.border,
          }}
        >
          {isProcessing ? (
            <ActivityIndicator color={c.buttonPrimaryText} />
          ) : (
            <Text
              style={{
                fontFamily: "Rubik_400Regular",
                fontSize: 16,
                color: c.buttonPrimaryText,
              }}
            >
              {subscription.tier === "pro" ? t("premium.alreadyPremium") : t("premium.upgradeToPremium")}
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
