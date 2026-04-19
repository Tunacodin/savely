import { useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Image } from "expo-image";
import { MingCuteIcon } from "@/components/ui/mingcute-icon";
import { PlatformBadge } from "@/components/ui/platform-badge";
import type { PlatformName } from "@/components/ui/platform-badge";
import { PlatformLogo } from "@/components/onboarding/platform-logo";
import { useThemeColors } from "@/hooks/use-theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_COLLECTIONS, type DefaultCollection } from "@/constants/default-collections";

const TOTAL_PAGES = 5;

const PAGE_KEYS = [
  { title: "onboarding.page1Title", desc: "onboarding.page1Desc", button: "common.continue" },
  { title: "onboarding.page2Title", desc: "onboarding.page2Desc", button: "common.continue" },
  { title: "onboarding.page3Title", desc: "onboarding.page3Desc", button: "common.continue" },
  { title: "onboarding.page4Title", desc: "onboarding.page4Desc", button: "common.continue" },
  { title: "onboarding.collectionsTitle", desc: "onboarding.collectionsDesc", button: "onboarding.letsStart" },
];

export default function Onboarding() {
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [pagerHeight, setPagerHeight] = useState(0);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const router = useRouter();
  const c = useThemeColors();
  const { t, i18n } = useTranslation();

  const handleScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(e.nativeEvent.contentOffset.x / width);
      setActiveIndex(index);
    },
    [width]
  );

  const isLastPage = activeIndex === TOTAL_PAGES - 1;
  const canProceed = !isLastPage || selectedCollections.length >= 3;

  const toggleCollection = (slug: string) => {
    setSelectedCollections((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug);
      if (prev.length >= 3) return prev;
      return [...prev, slug];
    });
  };

  const goToNext = async () => {
    const next = activeIndex + 1;
    if (next < TOTAL_PAGES) {
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
      setActiveIndex(next);
    } else {
      if (selectedCollections.length < 3) return;
      // Save selections for after login
      await AsyncStorage.setItem("pending_collections", JSON.stringify(selectedCollections));
      router.replace("/(auth)/login");
    }
  };

  const goBack = () => {
    const prev = activeIndex - 1;
    if (prev >= 0) {
      scrollRef.current?.scrollTo({ x: prev * width, animated: true });
      setActiveIndex(prev);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      {/* Header */}
      <View
        style={{
          height: 48,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
        }}
      >
        {activeIndex > 0 ? (
          <Pressable onPress={goBack} hitSlop={8}>
            <MingCuteIcon name="left-line" size={24} color={c.textPrimary} />
          </Pressable>
        ) : (
          <Text
            style={{
              fontFamily: "Rubik_500Medium",
              fontSize: 20,
              color: c.textPrimary,
            }}
          >
            Savely
          </Text>
        )}
      </View>

      {/* Pager */}
      <View
        className="flex-1"
        onLayout={(e) => setPagerHeight(e.nativeEvent.layout.height)}
      >
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScrollEnd}
          scrollEventThrottle={16}
          scrollEnabled={activeIndex < TOTAL_PAGES - 1}
          style={{ flex: 1 }}
        >
          <View style={{ width, height: pagerHeight }}>
            <PlatformLogosPage />
          </View>
          <View style={{ width, height: pagerHeight }}>
            <ContentCardsPage width={width} />
          </View>
          <View style={{ width, height: pagerHeight }}>
            <SearchPage />
          </View>
          <View style={{ width, height: pagerHeight }}>
            <CategoriesPage />
          </View>
          <View style={{ width, height: pagerHeight }}>
            <CollectionPickerPage
              selected={selectedCollections}
              onToggle={toggleCollection}
              lang={(i18n.language as keyof DefaultCollection["name"]) || "tr"}
              c={c}
            />
          </View>
        </ScrollView>
      </View>

      {/* Footer */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 24, gap: 8 }}>
        <Text
          style={{
            fontFamily: "Rubik_600SemiBold",
            fontSize: 28,
            color: c.textPrimary,
            textAlign: "center",
          }}
        >
          {t(PAGE_KEYS[activeIndex].title)}
        </Text>
        <Text
          style={{
            fontFamily: "Rubik_400Regular",
            fontSize: 16,
            color: c.textSecondary,
            textAlign: "center",
            lineHeight: 24,
            marginBottom: 8,
          }}
        >
          {t(PAGE_KEYS[activeIndex].desc)}
        </Text>

        {/* Pagination Dots */}
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 6, marginBottom: 8 }}>
          {PAGE_KEYS.map((_, i) => (
            <View
              key={i}
              style={{
                height: 8,
                borderRadius: 4,
                backgroundColor: i === activeIndex ? c.textPrimary : c.border,
                width: i === activeIndex ? 16 : 8,
              }}
            />
          ))}
        </View>

        {/* Selected count badge */}
        {isLastPage && (
          <Text
            style={{
              fontFamily: "Rubik_500Medium",
              fontSize: 14,
              color: selectedCollections.length >= 3 ? c.textPrimary : c.textTertiary,
              textAlign: "center",
              marginBottom: 4,
            }}
          >
            {t("onboarding.collectionsSelected", { count: selectedCollections.length })}
          </Text>
        )}

        {/* Button */}
        <Pressable
          onPress={goToNext}
          disabled={!canProceed}
          style={{
            backgroundColor: canProceed ? c.buttonPrimary : c.skeleton,
            borderRadius: 16,
            height: 64,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              fontFamily: "Rubik_400Regular",
              fontSize: 16,
              color: canProceed ? c.buttonPrimaryText : c.textTertiary,
            }}
          >
            {t(PAGE_KEYS[activeIndex].button)}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

/* ─── Page 1: Platform Logos ─── */

function PlatformLogosPage() {
  return (
    <View className="flex-1 items-center justify-center">
      <View className="relative" style={{ width: 300, height: 320 }}>
        {/* X - top center */}
        <View className="absolute" style={{ top: 10, left: 120 }}>
          <PlatformLogo name="x" size={48} />
        </View>

        {/* YouTube - upper right */}
        <View className="absolute" style={{ top: 60, right: 0 }}>
          <PlatformLogo name="youtube" size={48} />
        </View>

        {/* Airbnb - left */}
        <View className="absolute" style={{ top: 90, left: 0 }}>
          <PlatformLogo name="airbnb" size={48} />
        </View>

        {/* Savely icon - center */}
        <View className="absolute" style={{ top: 125, left: 112 }}>
          <View className="w-[72px] h-[72px] bg-neutral-100 rounded-2xl items-center justify-center">
            <MingCuteIcon name="pic-line" size={32} color="#A1A1AA" />
          </View>
        </View>

        {/* TikTok - right */}
        <View className="absolute" style={{ top: 175, right: 5 }}>
          <PlatformLogo name="tiktok" size={44} />
        </View>

        {/* Pinterest - lower left */}
        <View className="absolute" style={{ top: 195, left: 20 }}>
          <PlatformLogo name="pinterest" size={48} />
        </View>

        {/* Instagram - bottom center-right */}
        <View className="absolute" style={{ bottom: 10, left: 145 }}>
          <PlatformLogo name="instagram" size={44} />
        </View>
      </View>
    </View>
  );
}

/* ─── Page 2: Content Cards ─── */

const CONTENT_CARDS = {
  left: [
    {
      title: "Kenan Yıldız Gol Sevinci",
      imageSource: require("@/assets/images/mock/kenan-yildiz-youtube.jpg"),
      platform: "youtube" as PlatformName,
      height: 220,
    },
    {
      title: "Crossfit Egzersizleri",
      imageSource: require("@/assets/images/mock/crossfit-instagram.jpg"),
      platform: "instagram" as PlatformName,
      height: 180,
    },
  ],
  right: [
    {
      title: "Siyah Beyaz Oturma Odası",
      imageSource: require("@/assets/images/mock/siyah-beyaz-oda.jpg"),
      platform: "pinterest" as PlatformName,
      height: 130,
    },
    {
      title: "Fit Akşam Yemeği Tabağı",
      imageSource: require("@/assets/images/mock/fit-aksam-yemegi.jpg"),
      platform: "tiktok" as PlatformName,
      height: 200,
    },
  ],
};

function ContentCardsPage({ width }: { width: number }) {
  return (
    <View className="flex-1 px-5 overflow-hidden">
      <View className="flex-row gap-2 flex-1">
        {/* Left column */}
        <View className="flex-1 gap-2">
          {CONTENT_CARDS.left.map((card, i) => (
            <ContentCard key={i} card={card} />
          ))}
        </View>

        {/* Right column */}
        <View className="flex-1 gap-2">
          {CONTENT_CARDS.right.map((card, i) => (
            <ContentCard key={i} card={card} />
          ))}
        </View>
      </View>
    </View>
  );
}

function ContentCard({
  card,
}: {
  card: {
    title: string;
    imageSource: number;
    platform: PlatformName;
    height: number;
  };
}) {
  return (
    <View>
      <View className="relative" style={{ height: card.height }}>
        <Image
          source={card.imageSource}
          className="flex-1 rounded-2xl"
          contentFit="cover"
        />
        <View className="absolute bottom-2 left-2">
          <PlatformBadge platform={card.platform} size="md" />
        </View>
      </View>
      {card.title ? (
        <Text
          className="font-sans-medium text-xs text-neutral-800 mt-1.5 px-1"
          numberOfLines={1}
        >
          {card.title}
        </Text>
      ) : null}
    </View>
  );
}

/* ─── Page 3: Search Mockup ─── */

const SEARCH_ITEMS: { imageSource: number; platform: PlatformName }[] = [
  {
    imageSource: require("@/assets/images/mock/fit-aksam-yemegi.jpg"),
    platform: "youtube",
  },
  {
    imageSource: require("@/assets/images/mock/crossfit-instagram.jpg"),
    platform: "instagram",
  },
  {
    imageSource: require("@/assets/images/mock/goku-wallpaper.jpg"),
    platform: "pinterest",
  },
];

function SearchPage() {
  return (
    <View className="flex-1 justify-center px-6">
      <View className="bg-neutral-50 rounded-3xl p-4">
        {/* Search bar */}
        <View className="flex-row items-center bg-white rounded-xl px-3 py-2.5 mb-3 border border-neutral-100">
          <MingCuteIcon name="search-line" size={20} color="#A1A1AA" />
          <Text className="font-sans text-sm text-neutral-800 ml-2">
            Kremalı mantarlı tavuk
          </Text>
        </View>

        {/* Search results */}
        {SEARCH_ITEMS.map((item, i) => (
          <View key={i} className="flex-row items-center py-2.5">
            <View className="relative">
              <Image
                source={item.imageSource}
                className="w-16 h-16 rounded-xl"
                contentFit="cover"
              />
              <View className="absolute -bottom-1 -right-1">
                <PlatformBadge platform={item.platform} />
              </View>
            </View>
            <View className="flex-1 ml-3 gap-2.5">
              <View className="h-3 bg-neutral-200 rounded-full w-4/5" />
              <View className="h-3 bg-neutral-100 rounded-full w-3/5" />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

/* ─── Page 4: Categories Mockup ─── */

const CATEGORY_CARDS = [
  {
    imageSource: require("@/assets/images/mock/fit-aksam-yemegi.jpg"),
    bgColor: "#f7e9d5",
  },
  {
    imageSource: require("@/assets/images/mock/kenan-yildiz-youtube.jpg"),
    bgColor: "#ebebee",
  },
  {
    imageSource: require("@/assets/images/mock/old-money-kombin.jpg"),
    bgColor: "#e0f0ff",
  },
];

function CategoriesPage() {
  return (
    <View className="flex-1 justify-center px-6">
      <View className="gap-3">
        {CATEGORY_CARDS.map((card, i) => (
          <View
            key={i}
            className="flex-row items-center rounded-2xl p-3"
            style={{ backgroundColor: card.bgColor }}
          >
            <Image
              source={card.imageSource}
              className="w-20 h-20 rounded-xl"
              contentFit="cover"
            />
            <View className="flex-1 ml-3 gap-2.5">
              <View className="h-3 bg-neutral-300/40 rounded-full w-4/5" />
              <View className="h-3 bg-neutral-300/30 rounded-full w-3/5" />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

/* ─── Page 5: Collection Picker ─── */

function CollectionPickerPage({
  selected,
  onToggle,
  lang,
  c,
}: {
  selected: string[];
  onToggle: (slug: string) => void;
  lang: keyof DefaultCollection["name"];
  c: ReturnType<typeof useThemeColors>;
}) {
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {DEFAULT_COLLECTIONS.map((col) => {
          const isSelected = selected.includes(col.slug);
          const isDisabled = !isSelected && selected.length >= 3;
          return (
            <Pressable
              key={col.slug}
              onPress={() => onToggle(col.slug)}
              disabled={isDisabled}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 14,
                backgroundColor: isSelected ? c.buttonPrimary : c.surface,
                borderWidth: 1.5,
                borderColor: isSelected ? c.buttonPrimary : c.border,
                gap: 8,
                opacity: isDisabled ? 0.4 : 1,
              }}
            >
              <Text style={{ fontSize: 18 }}>{col.emoji}</Text>
              <Text
                style={{
                  fontFamily: "Rubik_500Medium",
                  fontSize: 14,
                  color: isSelected ? c.buttonPrimaryText : c.textPrimary,
                }}
              >
                {col.name[lang] || col.name.en}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}
