import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MingCuteIcon } from "@/components/ui/mingcute-icon";

export default function SearchScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* Header */}
      <View className="px-4 py-3 border-b border-zinc-100">
        <Text className="font-sans-medium text-2xl text-zinc-800">Ara</Text>
      </View>

      <View className="flex-1 items-center justify-center px-6">
        <MingCuteIcon name="search-line" size={48} color="#a1a1aa" />
        <Text className="mt-4 font-sans-semibold text-xl text-neutral-900">
          Ara
        </Text>
        <Text className="mt-1 font-sans text-sm text-neutral-500">
          Kaydedilenler arasinda ara
        </Text>
      </View>
    </SafeAreaView>
  );
}
