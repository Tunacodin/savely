import { View, Text, ScrollView, Pressable, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useSavedItemsStore } from "@/store/saved-items";
import { SaveItemCard } from "@/components/save-item-card";
import { openItemDetail } from "@/components/global-bottom-sheet";
import { MingCuteIcon } from "@/components/ui/mingcute-icon";
import { useThemeColors } from "@/hooks/use-theme";
import type { SavedItem } from "@/types";

export default function CollectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const c = useThemeColors();

  const collections = useSavedItemsStore((s) => s.collections);
  const allItems = useSavedItemsStore((s) => s.items);

  const collection = collections.find((col) => col.id === id);
  const items = allItems.filter((item) => item.collectionId === id);

  const padding = 16;
  const gap = 12;
  const cardWidth = (width - padding * 2 - gap) / 2;

  const leftColumn: SavedItem[] = [];
  const rightColumn: SavedItem[] = [];
  let leftHeight = 0;
  let rightHeight = 0;

  items.forEach((item) => {
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
          gap: 8,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <MingCuteIcon name="left-line" size={24} color={c.textPrimary} />
        </Pressable>
        <Text
          style={{
            flex: 1,
            fontFamily: "Rubik_500Medium",
            fontSize: 20,
            color: c.textPrimary,
          }}
          numberOfLines={1}
        >
          {collection?.name ?? t("collections.fallbackTitle")}
        </Text>
        <Pressable hitSlop={8}>
          <MingCuteIcon name="edit-2-line" size={22} color={c.textPrimary} />
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {items.length === 0 ? (
          <View style={{ alignItems: "center", paddingTop: 80 }}>
            <Text
              style={{
                fontFamily: "Rubik_400Regular",
                fontSize: 15,
                color: c.textTertiary,
              }}
            >
              {t("collections.empty")}
            </Text>
          </View>
        ) : (
          <View style={{ flexDirection: "row", gap }}>
            <View style={{ flex: 1, gap }}>
              {leftColumn.map((item) => (
                <SaveItemCard
                  key={item.id}
                  item={item}
                  width={cardWidth}
                  onPress={() => openItemDetail(item)}
                />
              ))}
            </View>
            <View style={{ flex: 1, gap }}>
              {rightColumn.map((item) => (
                <SaveItemCard
                  key={item.id}
                  item={item}
                  width={cardWidth}
                  onPress={() => openItemDetail(item)}
                />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
