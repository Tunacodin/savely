import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MingCuteIcon } from "@/components/ui/mingcute-icon";
import { useSavedItemsStore } from "@/store/saved-items";

export default function CollectionsScreen() {
  const collections = useSavedItemsStore((s) => s.collections);
  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* Header */}
      <View className="px-4 py-3 border-b border-gray-100">
        <Text className="font-sans-medium text-2xl text-zinc-800">
          Koleksiyonlar
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-20"
        showsVerticalScrollIndicator={false}
      >
        {collections.map((collection) => (
          <Pressable
            key={collection.id}
            className="flex-row items-center gap-4 self-stretch px-4 py-3"
          >
            {/* Emoji Avatar */}
            <View
              className="w-24 h-24 rounded-3xl items-center justify-center"
              style={{ backgroundColor: collection.bgColor }}
            >
              <Text className="text-5xl">{collection.emoji}</Text>
            </View>

            {/* Info */}
            <View className="flex-1">
              <Text className="font-sans-medium text-base text-zinc-800">
                {collection.name}
              </Text>
              <Text className="font-sans-bold text-sm text-zinc-400 mt-0.5">
                {collection.itemCount} içerik
              </Text>
            </View>

            {/* More Button */}
            <Pressable className="w-8 h-8 items-center justify-center">
              <MingCuteIcon
                name="more-2-line"
                size={22}
                color="#000000"
              />
            </Pressable>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
