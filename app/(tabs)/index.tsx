import { View, Text, ScrollView, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { SaveItemCard } from "@/components/save-item-card";
import { openItemDetail } from "@/components/global-bottom-sheet";
import { useSavedItemsStore } from "@/store/saved-items";
import { useThemeColors } from "@/hooks/use-theme";
import type { SavedItem } from "@/types";

export default function HomeScreen() {
  const { t } = useTranslation();
  const savedItems = useSavedItemsStore((s) => s.items);
  const { width } = useWindowDimensions();
  const c = useThemeColors();
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
        : (item.aspectRatio ?? 1);
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
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={["top"]}>
      {/* Top Bar */}
      <View
        style={{
          height: 64,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
        }}
      >
        <Text style={{ fontFamily: "Rubik_500Medium", fontSize: 20, color: c.textPrimary }}>
          {t("home.title")}
        </Text>
      </View>

      {/* Masonry Grid */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row" style={{ gap }}>
          <View className="flex-1" style={{ gap }}>
            {leftColumn.map((item) => (
              <SaveItemCard key={item.id} item={item} width={cardWidth} onPress={() => openItemDetail(item)} />
            ))}
          </View>
          <View className="flex-1" style={{ gap }}>
            {rightColumn.map((item) => (
              <SaveItemCard key={item.id} item={item} width={cardWidth} onPress={() => openItemDetail(item)} />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
