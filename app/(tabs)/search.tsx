import { useState, useMemo } from "react";
import { View, Text, TextInput, Pressable, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import { MingCuteIcon } from "@/components/ui/mingcute-icon";
import { PlatformBadge } from "@/components/ui/platform-badge";
import { openItemDetail } from "@/components/global-bottom-sheet";
import { useSavedItemsStore } from "@/store/saved-items";
import { useThemeColors } from "@/hooks/use-theme";
import type { SavedItem } from "@/types";

function RecentSearchItem({
  label,
  onPress,
  onRemove,
  colors,
}: {
  label: string;
  onPress: () => void;
  onRemove: () => void;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, height: 56 }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
        <MingCuteIcon name="time-line" size={20} color={colors.textTertiary} />
        <Text style={{ fontFamily: "Rubik_400Regular", fontSize: 15, color: colors.textMuted }} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <Pressable onPress={onRemove} hitSlop={8}>
        <MingCuteIcon name="close-line" size={20} color={colors.textTertiary} />
      </Pressable>
    </Pressable>
  );
}

function SearchResultItem({
  item,
  collectionName,
  colors,
}: {
  item: SavedItem;
  collectionName?: string;
  colors: ReturnType<typeof useThemeColors>;
}) {
  const imageSource = item.imageUrl
    ? typeof item.imageUrl === "number"
      ? item.imageUrl
      : { uri: item.imageUrl as string }
    : null;

  return (
    <Pressable
      onPress={() => openItemDetail(item)}
      style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, gap: 14 }}
    >
      {/* Thumbnail */}
      <View style={{ width: 76, height: 76 }}>
        <View style={{ width: 76, height: 76, borderRadius: 14, overflow: "hidden", backgroundColor: colors.surfaceAlt }}>
          {imageSource && (
            <Image
              source={imageSource}
              style={{ width: 76, height: 76 }}
              contentFit="cover"
            />
          )}
        </View>
        <View style={{ position: "absolute", bottom: -4, left: -4 }}>
          <PlatformBadge platform={item.platform} size="md" />
        </View>
      </View>

      {/* Text */}
      <View style={{ flex: 1, justifyContent: "center", gap: 4 }}>
        {collectionName && (
          <Text style={{ fontFamily: "Rubik_500Medium", fontSize: 12, color: colors.textSecondary }}>
            {collectionName}
          </Text>
        )}
        <Text
          style={{ fontFamily: "Rubik_500Medium", fontSize: 16, color: colors.text }}
          numberOfLines={2}
        >
          {item.title.split("#")[0].trim()}
        </Text>
      </View>
    </Pressable>
  );
}

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const { t } = useTranslation();
  const c = useThemeColors();

  const items = useSavedItemsStore((s) => s.items);
  const collections = useSavedItemsStore((s) => s.collections);
  const recentSearches = useSavedItemsStore((s) => s.recentSearches);
  const addRecentSearch = useSavedItemsStore((s) => s.addRecentSearch);
  const removeRecentSearch = useSavedItemsStore((s) => s.removeRecentSearch);

  const isActive = query.trim().length > 0;

  const results = useMemo(() => {
    if (!isActive) return [];
    const q = query.toLowerCase();
    return items.filter((item) => item.title.toLowerCase().includes(q));
  }, [query, items, isActive]);

  const getCollectionName = (collectionId?: string) => {
    if (!collectionId) return undefined;
    return collections.find((c) => c.id === collectionId)?.name;
  };

  const handleSearch = (term: string) => {
    setQuery(term);
    addRecentSearch(term);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={["top"]}>
      {/* Search Bar */}
      <View style={{ height: 64, paddingHorizontal: 16, justifyContent: "center" }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: c.surfaceAlt,
            borderRadius: 12,
            paddingHorizontal: 12,
            height: 44,
            gap: 8,
          }}
        >
          <MingCuteIcon name="search-line" size={20} color={c.textTertiary} />
          <TextInput
            style={{ flex: 1, fontFamily: "Rubik_400Regular", fontSize: 16, color: c.text }}
            placeholder={t("search.placeholder")}
            placeholderTextColor={c.textTertiary}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => { if (query.trim()) addRecentSearch(query.trim()); }}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {isActive && (
            <Pressable onPress={() => setQuery("")} hitSlop={8}>
              <MingCuteIcon name="close-line" size={20} color={c.textTertiary} />
            </Pressable>
          )}
        </View>
      </View>

      {isActive ? (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SearchResultItem
              item={item}
              collectionName={getCollectionName(item.collectionId)}
              colors={c}
            />
          )}
          contentContainerStyle={{ paddingVertical: 4 }}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingTop: 60 }}>
              <Text style={{ fontFamily: "Rubik_400Regular", fontSize: 15, color: c.textTertiary }}>
                {t("search.noResults")}
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={recentSearches}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <RecentSearchItem
              label={item}
              onPress={() => handleSearch(item)}
              onRemove={() => removeRecentSearch(item)}
              colors={c}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}
