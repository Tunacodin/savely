import { useCallback, useState } from "react";
import { View, Text, ScrollView, RefreshControl, useWindowDimensions } from "react-native";
import { useTranslation } from "react-i18next";
import { MingCuteIcon } from "@/components/ui/mingcute-icon";
import { SaveItemCard } from "@/components/save-item-card";
import { openItemDetail } from "@/components/global-bottom-sheet";
import { useSavedItemsStore } from "@/store/saved-items";
import { useAuthStore } from "@/store/auth";
import { useThemeColors } from "@/hooks/use-theme";
import type { SavedItem } from "@/types";

export default function HomeScreen() {
  const { t } = useTranslation();
  const savedItems = useSavedItemsStore((s) => s.items);
  const loadUserData = useSavedItemsStore((s) => s.loadUserData);
  const userId = useAuthStore((s) => s.session?.user?.id);
  const { width } = useWindowDimensions();
  const c = useThemeColors();
  const padding = 16;
  const columnGap = 16;
  const rowGap = 12;
  const cardWidth = (width - padding * 2 - columnGap) / 2;
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    if (!userId) return;
    setRefreshing(true);
    try {
      await loadUserData(userId);
    } finally {
      setRefreshing(false);
    }
  }, [userId, loadUserData]);

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
      leftHeight += itemHeight + rowGap;
    } else {
      rightColumn.push(item);
      rightHeight += itemHeight + rowGap;
    }
  });

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      {/* Top Bar */}
      <View
        style={{
          height: 64,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          borderBottomWidth: 1.5,
          borderBottomColor: c.border,
        }}
      >
        <Text style={{ fontFamily: "Rubik_500Medium", fontSize: 20, lineHeight: 28, color: c.textPrimary }}>
          {t("home.title")}
        </Text>
      </View>

      {savedItems.length === 0 ? (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.textTertiary} />}
        >
          <MingCuteIcon name="bookmark-line" size={56} color={c.border} />
          <Text style={{ fontFamily: "Rubik_500Medium", fontSize: 18, color: c.textPrimary, marginTop: 20, textAlign: "center" }}>
            {t("home.emptyTitle")}
          </Text>
          <Text style={{ fontFamily: "Rubik_400Regular", fontSize: 14, color: c.textTertiary, marginTop: 8, textAlign: "center", lineHeight: 20 }}>
            {t("home.emptyDesc")}
          </Text>
        </ScrollView>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.textTertiary} />}
        >
          <View className="flex-row" style={{ gap: columnGap }}>
            <View className="flex-1" style={{ gap: rowGap }}>
              {leftColumn.map((item) => (
                <SaveItemCard key={item.id} item={item} width={cardWidth} onPress={() => openItemDetail(item)} />
              ))}
            </View>
            <View className="flex-1" style={{ gap: rowGap }}>
              {rightColumn.map((item) => (
                <SaveItemCard key={item.id} item={item} width={cardWidth} onPress={() => openItemDetail(item)} />
              ))}
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}
