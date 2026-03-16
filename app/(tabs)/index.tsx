import { View, Text, ScrollView, Pressable, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MingCuteIcon } from "@/components/ui/mingcute-icon";
import { SaveItemCard } from "@/components/save-item-card";
import { useSavedItemsStore } from "@/store/saved-items";
import { openFilterSheet } from "@/components/global-bottom-sheet";
import type { SavedItem } from "@/types";

export default function HomeScreen() {
  const savedItems = useSavedItemsStore((s) => s.items);
  const { width } = useWindowDimensions();
  const padding = 16;
  const gap = 12;
  const cardWidth = (width - padding * 2 - gap) / 2;

  // Split items into two columns balancing heights
  const leftColumn: SavedItem[] = [];
  const rightColumn: SavedItem[] = [];
  let leftHeight = 0;
  let rightHeight = 0;

  savedItems.forEach((item) => {
    const hasImage = !!item.imageUrl;
    const aspectRatio =
      item.metadata?.width && item.metadata?.height
        ? item.metadata.height / item.metadata.width
        : item.aspectRatio;
    const itemHeight = cardWidth * (hasImage ? aspectRatio : 0.55) + 40;
    if (leftHeight <= rightHeight) {
      leftColumn.push(item);
      leftHeight += itemHeight + gap;
    } else {
      rightColumn.push(item);
      rightHeight += itemHeight + gap;
    }
  });

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* Top Bar */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-zinc-100">
        <Text className="font-sans-medium text-2xl text-zinc-800">Anasayfa</Text>
        <Pressable className="w-9 h-9 items-center justify-center" onPress={() => { console.log("[Home] filter tapped"); openFilterSheet(); }}>
          <MingCuteIcon name="filter-line" size={22} color="#71717a" />
        </Pressable>
      </View>

      {/* Masonry Grid */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding, paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row" style={{ gap }}>
          <View className="flex-1" style={{ gap }}>
            {leftColumn.map((item) => (
              <SaveItemCard key={item.id} item={item} width={cardWidth} />
            ))}
          </View>
          <View className="flex-1" style={{ gap }}>
            {rightColumn.map((item) => (
              <SaveItemCard key={item.id} item={item} width={cardWidth} />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
