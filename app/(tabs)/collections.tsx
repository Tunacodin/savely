import { useMemo, useRef, useState, useCallback } from "react";
import { View, Text, ScrollView, RefreshControl, Pressable } from "react-native";
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { MingCuteIcon } from "@/components/ui/mingcute-icon";
import { useSavedItemsStore } from "@/store/saved-items";
import { useAuthStore } from "@/store/auth";
import { useThemeColors } from "@/hooks/use-theme";
import type { Collection } from "@/types";

type SortKey = "newest" | "oldest" | "mostItems" | "fewestItems" | "alphaAsc" | "alphaDesc";

const SORT_OPTIONS: { key: SortKey; labelKey: string; icon: string }[] = [
  { key: "newest", labelKey: "collections.sortNewest", icon: "time-line" },
  { key: "oldest", labelKey: "collections.sortOldest", icon: "time-line" },
  { key: "mostItems", labelKey: "collections.sortMostItems", icon: "folder-line" },
  { key: "fewestItems", labelKey: "collections.sortFewestItems", icon: "folder-line" },
  { key: "alphaAsc", labelKey: "collections.sortAlphaAsc", icon: "edit-2-line" },
  { key: "alphaDesc", labelKey: "collections.sortAlphaDesc", icon: "edit-2-line" },
];

function sortCollections(collections: Collection[], key: SortKey): Collection[] {
  const arr = [...collections];
  switch (key) {
    case "newest":
      return arr.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case "oldest":
      return arr.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    case "mostItems":
      return arr.sort((a, b) => b.itemCount - a.itemCount);
    case "fewestItems":
      return arr.sort((a, b) => a.itemCount - b.itemCount);
    case "alphaAsc":
      return arr.sort((a, b) => a.name.localeCompare(b.name));
    case "alphaDesc":
      return arr.sort((a, b) => b.name.localeCompare(a.name));
  }
}

export default function CollectionsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const collections = useSavedItemsStore((s) => s.collections);
  const loadUserData = useSavedItemsStore((s) => s.loadUserData);
  const userId = useAuthStore((s) => s.session?.user?.id);
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const sortSheetRef = useRef<BottomSheetModal>(null);
  const [sortKey, setSortKey] = useState<SortKey>("oldest");
  const [refreshing, setRefreshing] = useState(false);

  const sortedCollections = useMemo(
    () => sortCollections(collections, sortKey),
    [collections, sortKey]
  );

  const onRefresh = useCallback(async () => {
    if (!userId) return;
    setRefreshing(true);
    try {
      await loadUserData(userId);
    } finally {
      setRefreshing(false);
    }
  }, [userId, loadUserData]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        pressBehavior="close"
      />
    ),
    []
  );

  const handleSelectSort = (key: SortKey) => {
    setSortKey(key);
    sortSheetRef.current?.dismiss();
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      {/* Top Bar */}
      <View
        style={{
          height: 64,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          borderBottomWidth: 1.5,
          borderBottomColor: c.border,
        }}
      >
        <Text
          style={{ fontFamily: "Rubik_500Medium", fontSize: 20, lineHeight: 28, color: c.textPrimary }}
        >
          {t("collections.title")}
        </Text>
        <Pressable
          onPress={() => sortSheetRef.current?.present()}
          hitSlop={8}
          style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center" }}
        >
          <MingCuteIcon name="filter-line" size={22} color={c.textPrimary} />
        </Pressable>
      </View>

      {collections.length === 0 ? (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.textTertiary} />}
        >
          <MingCuteIcon name="folder-line" size={56} color={c.border} />
          <Text style={{ fontFamily: "Rubik_500Medium", fontSize: 18, color: c.textPrimary, marginTop: 20, textAlign: "center" }}>
            {t("collections.emptyTitle")}
          </Text>
          <Text style={{ fontFamily: "Rubik_400Regular", fontSize: 14, color: c.textTertiary, marginTop: 8, textAlign: "center", lineHeight: 20 }}>
            {t("collections.emptyDesc")}
          </Text>
        </ScrollView>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.textTertiary} />}
        >
          <View style={{ gap: 16, paddingHorizontal: 16 }}>
            {sortedCollections.map((collection) => (
              <Pressable
                key={collection.id}
                onPress={() => router.push({ pathname: "/collection-detail", params: { id: collection.id } } as any)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  height: 96,
                  gap: 16,
                }}
              >
                <View
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: collection.bgColor,
                    borderWidth: 1,
                    borderColor: c.border,
                  }}
                >
                  <Text style={{ fontSize: 48 }}>{collection.emoji}</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: "Rubik_500Medium",
                      fontSize: 16,
                      color: c.textPrimary,
                    }}
                  >
                    {collection.name}
                  </Text>
                  <Text
                    style={{
                      fontFamily: "Rubik_500Medium",
                      fontSize: 12,
                      color: c.textTertiary,
                      marginTop: 4,
                    }}
                  >
                    {t("collections.itemCount", { count: collection.itemCount })}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Sort bottom sheet */}
      <BottomSheetModal
        ref={sortSheetRef}
        enableDynamicSizing
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{ backgroundColor: c.handleIndicator, width: 40 }}
        backgroundStyle={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: c.sheetBg }}
      >
        <BottomSheetView style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: insets.bottom + 16 }}>
          <Text
            style={{
              fontFamily: "Rubik_600SemiBold",
              fontSize: 17,
              color: c.textPrimary,
              textAlign: "center",
              marginBottom: 16,
            }}
          >
            {t("collections.sortTitle")}
          </Text>

          <View style={{ gap: 4 }}>
            {SORT_OPTIONS.map((opt) => {
              const isSelected = sortKey === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => handleSelectSort(opt.key)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    height: 52,
                    paddingHorizontal: 14,
                    borderRadius: 14,
                    backgroundColor: isSelected ? c.surfaceAlt : "transparent",
                    gap: 12,
                  }}
                >
                  <Text
                    style={{
                      flex: 1,
                      fontFamily: "Rubik_500Medium",
                      fontSize: 16,
                      color: c.textPrimary,
                    }}
                  >
                    {t(opt.labelKey)}
                  </Text>
                  {isSelected && (
                    <MingCuteIcon name="check-line" size={20} color={c.textPrimary} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </View>
  );
}
