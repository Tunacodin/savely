import { useCallback, useRef, useState, useEffect, useMemo, memo } from "react";
import { View, useWindowDimensions, Pressable, StyleSheet, Text } from "react-native";
import Animated from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  MingCuteIcon,
  type MingCuteIconName,
} from "@/components/ui/mingcute-icon";
import { useThemeColors } from "@/hooks/use-theme";

import HomeScreen from "./index";
import CollectionsScreen from "./collections";
import SearchScreen from "./search";
import ProfileScreen from "./profile";

const TAB_NAMES = ["index", "collections", "search", "profile"] as const;
const TAB_PATHS = ["/", "/collections", "/search", "/profile"] as const;
const TAB_ICONS: Record<(typeof TAB_NAMES)[number], MingCuteIconName> = {
  index: "home-2-line",
  collections: "folder-line",
  search: "search-line",
  profile: "user-3-line",
};
const MemoHome = memo(HomeScreen);
const MemoCollections = memo(CollectionsScreen);
const MemoSearch = memo(SearchScreen);
const MemoProfile = memo(ProfileScreen);
const TAB_COMPONENTS = [MemoHome, MemoCollections, MemoSearch, MemoProfile];

let persistedTabIndex = 0;

const TabPages = memo(function TabPages({ width }: { width: number }) {
  return (
    <>
      {TAB_COMPONENTS.map((Screen, i) => (
        <View key={TAB_NAMES[i]} style={{ width, flex: 1 }}>
          <Screen />
        </View>
      ))}
    </>
  );
});

export default function TabLayout() {
  const c = useThemeColors();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<Animated.ScrollView>(null);
  const pendingIdxRef = useRef(persistedTabIndex);
  const [activeIndex, setActiveIndex] = useState(persistedTabIndex);

  useEffect(() => {
    if (persistedTabIndex !== 0) {
      scrollRef.current?.scrollTo({ x: persistedTabIndex * width, animated: false });
    }
  }, [width]);

  const onMomentumEnd = useCallback(
    (e: { nativeEvent: { contentOffset: { x: number } } }) => {
      const idx = Math.round(e.nativeEvent.contentOffset.x / width);
      if (idx === pendingIdxRef.current) return;
      pendingIdxRef.current = idx;
      persistedTabIndex = idx;
      setActiveIndex(idx);
    },
    [width]
  );

  const goToTab = useCallback(
    (idx: number) => {
      const current = pendingIdxRef.current;
      if (idx === current) return;
      pendingIdxRef.current = idx;
      persistedTabIndex = idx;
      setActiveIndex(idx);

      if (Math.abs(idx - current) > 1) {
        const adjacent = idx > current ? idx - 1 : idx + 1;
        scrollRef.current?.scrollTo({ x: adjacent * width, animated: false });
        requestAnimationFrame(() => {
          scrollRef.current?.scrollTo({ x: idx * width, animated: true });
        });
      } else {
        scrollRef.current?.scrollTo({ x: idx * width, animated: true });
      }
    },
    [width]
  );

  const pages = useMemo(() => <TabPages width={width} />, [width]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={["top"]}>
      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}
        scrollEventThrottle={16}
        bounces={false}
        overScrollMode="never"
        style={{ flex: 1 }}
      >
        {pages}
      </Animated.ScrollView>

      <SwipeTabBar activeIndex={activeIndex} onSelect={goToTab} colors={c} />
    </SafeAreaView>
  );
}

const SwipeTabBar = memo(function SwipeTabBar({
  activeIndex,
  onSelect,
  colors: c,
}: {
  activeIndex: number;
  onSelect: (i: number) => void;
  colors: ReturnType<typeof useThemeColors>;
}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  const items: ({ type: "tab"; index: number } | { type: "fab" })[] = [];
  TAB_NAMES.forEach((_, i) => {
    if (i === 2) items.push({ type: "fab" });
    items.push({ type: "tab", index: i });
  });

  return (
    <>
      {menuOpen && (
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={() => setMenuOpen(false)}
        />
      )}

      {menuOpen && (
        <View
          style={{
            position: "absolute",
            bottom: insets.bottom + 80,
            alignSelf: "center",
            gap: 8,
            alignItems: "center",
          }}
        >
          <Pressable
            onPress={() => {
              setMenuOpen(false);
              router.push("/new-collection");
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              backgroundColor: c.buttonPrimary,
              borderRadius: 16,
              paddingHorizontal: 20,
              paddingVertical: 14,
            }}
          >
            <MingCuteIcon name="folder-add-line" size={20} color={c.buttonPrimaryText} />
            <Text style={{ fontFamily: "Rubik_400Regular", fontSize: 15, color: c.buttonPrimaryText }}>
              {t("collections.newCollection")}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              setMenuOpen(false);
              router.push("/save");
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              backgroundColor: c.buttonPrimary,
              borderRadius: 16,
              paddingHorizontal: 20,
              paddingVertical: 14,
            }}
          >
            <MingCuteIcon name="add-circle-line" size={20} color={c.buttonPrimaryText} />
            <Text style={{ fontFamily: "Rubik_400Regular", fontSize: 15, color: c.buttonPrimaryText }}>
              {t("saveForm.title")}
            </Text>
          </Pressable>
        </View>
      )}

      <View style={{ paddingBottom: insets.bottom, backgroundColor: c.tabBarBg, borderTopWidth: 1.5, borderTopColor: c.border }}>
        <View className="flex-row items-center px-4 pt-2">
          {items.map((item) => {
            if (item.type === "fab") {
              return (
                <Pressable
                  key="fab"
                  onPress={() => setMenuOpen((prev) => !prev)}
                  className="flex-1 items-center"
                >
                  <View
                    style={{ backgroundColor: c.fabBg, width: 56, height: 56, borderRadius: 28, marginTop: -16 }}
                    className="items-center justify-center"
                  >
                    <MingCuteIcon
                      name={menuOpen ? "close-line" : "add-line"}
                      size={24}
                      color={c.fabIcon}
                    />
                  </View>
                </Pressable>
              );
            }

            const name = TAB_NAMES[item.index];
            const isFocused = activeIndex === item.index;
            const iconName = TAB_ICONS[name];

            return (
              <Pressable
                key={name}
                className="flex-1 items-center py-3"
                onPress={() => {
                  setMenuOpen(false);
                  if (!isFocused) onSelect(item.index);
                }}
              >
                <MingCuteIcon
                  name={iconName}
                  size={24}
                  color={isFocused ? c.tabIconActive : c.tabIconInactive}
                />
              </Pressable>
            );
          })}
        </View>
      </View>
    </>
  );
});
