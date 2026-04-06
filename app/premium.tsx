import { ScrollView, View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MingCuteIcon } from "@/components/ui/mingcute-icon";
import { useSavedItemsStore } from "@/store/saved-items";

export default function PremiumScreen() {
  const router = useRouter();
  const subscription = useSavedItemsStore((s) => s.subscription);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center  px-5 py-4">
        <Pressable onPress={() => router.back()} className="mr-3">
          <MingCuteIcon name="arrow-left-line" size={24} color="#000000" />
        </Pressable>
        <Text className="font-sans-semibold text-xl text-zinc-900">Premium</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-10"
        showsVerticalScrollIndicator={false}
      >
        {/* Icon Badge */}
        <View className="items-center mt-8 mb-6">
          <View className="w-20 h-20 rounded-full bg-primary-100 items-center justify-center">
            <MingCuteIcon name="star-line" size={40} color="#6366F1" />
          </View>
        </View>

        {/* Title */}
        <View className="px-5 mb-8">
          <Text className="font-sans-bold text-3xl text-zinc-900 mb-2 text-center">
            Savely Premium
          </Text>
          <Text className="font-sans text-base text-zinc-600 text-center leading-6">
            Dijital hafızanızın tüm gücünü açığa çıkarın
          </Text>
        </View>

        {/* Current Status */}
        <View className="px-5 mb-8">
          <View className="bg-primary-50 rounded-2xl p-5 border border-primary-200">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="font-sans-medium text-sm text-primary-700">
                Geçerli Plan
              </Text>
              <View className="px-3 py-1 rounded-full bg-primary-600">
                <Text className="font-sans-semibold text-xs text-white">
                  {subscription.tier === "pro" ? "PRO" : "FREE"}
                </Text>
              </View>
            </View>
            <Text className="font-sans text-sm text-primary-900">
              {subscription.currentPlan?.features.slice(0, 2).join(" • ")}
            </Text>
          </View>
        </View>

        {/* Features */}
        <View className="px-5 mb-8">
          <Text className="font-sans-semibold text-lg text-zinc-900 mb-4">
            Premium Özellikleri
          </Text>
          <View className="gap-3">
            {subscription.currentPlan?.features.map((feature, index) => (
              <View key={index} className="flex-row items-start gap-3">
                <View className="mt-1">
                  <MingCuteIcon
                    name="check-circle-line"
                    size={20}
                    color="#16A34A"
                  />
                </View>
                <Text className="flex-1 font-sans text-base text-zinc-800 pt-0.5">
                  {feature}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* CTA Button */}
        <View className="px-5">
          <Pressable
            onPress={() => router.push("/premium-plan")}
            className="bg-primary-500 rounded-2xl py-4 items-center mb-4"
          >
            <Text className="font-sans-semibold text-base text-white">
              {subscription.tier === "pro" ? "Plan Yönet" : "Premium'a Geç"}
            </Text>
          </Pressable>

          <Text className="font-sans text-xs text-zinc-500 text-center leading-5">
            Abonielik otomatik olarak yenilenir. İstediğiniz zaman iptal
            edebilirsiniz.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
