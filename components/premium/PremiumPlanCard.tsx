import { View, Text } from "react-native";
import { useTranslation } from "react-i18next";
import type { PremiumPlan } from "@/types";
import { MingCuteIcon } from "@/components/ui/mingcute-icon";

interface PremiumPlanCardProps {
  plan: PremiumPlan;
  isSelected?: boolean;
  badge?: string;
}

export function PremiumPlanCard({
  plan,
  isSelected = false,
  badge,
}: PremiumPlanCardProps) {
  const { t } = useTranslation();
  const isPro = plan.tier === "pro";

  return (
    <View
      className={`rounded-3xl p-5 mb-4 border-2 ${
        isPro
          ? "bg-zinc-900 border-zinc-800"
          : "bg-white border-zinc-200"
      }`}
    >
      {/* Header with badge */}
      <View className="flex-row items-center justify-between mb-3">
        <Text
          className={`font-sans-bold text-3xl ${
            isPro ? "text-white" : "text-zinc-900"
          }`}
        >
          {plan.tier === "free" ? "Free" : "Pro"}
        </Text>
        {badge && (
          <View className="bg-accent-500 rounded-full px-3 py-1">
            <Text className="font-sans-semibold text-xs text-white">
              {badge}
            </Text>
          </View>
        )}
      </View>

      {/* Description */}
      <Text
        className={`font-sans text-sm leading-5 mb-4 ${
          isPro ? "text-zinc-300" : "text-zinc-600"
        }`}
      >
        {plan.tier === "free" ? t("premium.freeDesc") : t("premium.proDesc")}
      </Text>

      {/* Features */}
      <View className="gap-2">
        {plan.features.map((feature, index) => (
          <View key={index} className="flex-row items-center gap-3">
            <MingCuteIcon
              name="check-line"
              size={16}
              color={isPro ? "#FFFFFF" : "#000000"}
            />
            <Text
              className={`font-sans text-sm ${
                isPro ? "text-white" : "text-zinc-900"
              }`}
            >
              {feature}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
