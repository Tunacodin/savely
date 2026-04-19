import { View, Text, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import { MingCuteIcon } from "@/components/ui/mingcute-icon";
import type { PremiumPlan } from "@/types";

interface PlanSelectorRadioProps {
  plan: PremiumPlan;
  isSelected: boolean;
  onSelect: () => void;
  badge?: string;
}

export function PlanSelectorRadio({
  plan,
  isSelected,
  onSelect,
  badge,
}: PlanSelectorRadioProps) {
  const { t } = useTranslation();
  const isBilledYearly = plan.billingPeriod === "yearly";

  return (
    <Pressable
      onPress={onSelect}
      className={`flex-row items-center gap-4 p-4 rounded-2xl mb-3 border-2 ${
        isSelected
          ? "bg-zinc-900 border-zinc-800"
          : "bg-zinc-50 border-zinc-200"
      }`}
    >
      {/* Radio button */}
      <View
        className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
          isSelected ? "border-white" : "border-zinc-300"
        }`}
      >
        {isSelected && (
          <View className="w-3 h-3 rounded-full bg-white" />
        )}
      </View>

      {/* Plan details */}
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text
            className={`font-sans-semibold text-base ${
              isSelected ? "text-white" : "text-zinc-900"
            }`}
          >
            {isBilledYearly ? t("premium.yearly") : t("premium.monthly")}
          </Text>
          {badge && (
            <View className="bg-accent-500 rounded-full px-2 py-0.5">
              <Text className="font-sans-semibold text-xs text-white">
                {badge}
              </Text>
            </View>
          )}
        </View>
        <Text
          className={`font-sans text-sm ${
            isSelected ? "text-zinc-300" : "text-zinc-600"
          }`}
        >
          {isBilledYearly
            ? t("premium.moreEconomical")
            : t("premium.flexiblePricing")}
        </Text>
      </View>

      {/* Price */}
      <View className="items-end">
        <Text
          className={`font-sans-bold text-lg ${
            isSelected ? "text-white" : "text-zinc-900"
          }`}
        >
          ${plan.price.toFixed(2)}
        </Text>
        <Text
          className={`font-sans text-xs ${
            isSelected ? "text-zinc-300" : "text-zinc-600"
          }`}
        >
          /{isBilledYearly ? t("premium.perYear") : t("premium.perMonth")}
        </Text>
      </View>
    </Pressable>
  );
}
