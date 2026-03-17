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
import { Image } from "expo-image";
import { MingCuteIcon } from "@/components/ui/mingcute-icon";
import { PlatformBadge } from "@/components/ui/platform-badge";
import type { PlatformName } from "@/components/ui/platform-badge";
import { PlatformLogo } from "@/components/onboarding/platform-logo";

const PAGES = [
  {
    title: "Dağınıklığa Son Ver",
    description:
      "Sosyal mecralarda kaybolan tüm o gönderileri, videoları ve yazıları Savely ile tek bir güvenli noktada birleştirin.",
    buttonText: "Devam et",
  },
  {
    title: "Dijital Arşivini Oluştur",
    description:
      "Favori içeriklerinizi kendi zevkinize göre kategorize edin. Karmaşayı bırakın ve size özel kütüphanenin tadını çıkarın.",
    buttonText: "Devam et",
  },
  {
    title: "Aradığını Hemen Bul",
    description:
      '"Nereye kaydetmiştim?" diye düşünmeyi bırakın. Gelişmiş arama ile binlerce içerik arasından istediğinize anında ulaşın.',
    buttonText: "Devam et",
  },
  {
    title: "Kontrol Sende Olsun",
    description:
      "Dijital dünyanı yönetmeye ve her şeye tek noktadan erişmeye hazırsan, kütüphaneni oluşturmaya hemen başla.",
    buttonText: "Hadi başlayalım!",
  },
];

export default function Onboarding() {
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [pagerHeight, setPagerHeight] = useState(0);
  const router = useRouter();

  const handleScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(e.nativeEvent.contentOffset.x / width);
      setActiveIndex(index);
    },
    [width]
  );

  const goToNext = () => {
    const next = activeIndex + 1;
    if (next < PAGES.length) {
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
      setActiveIndex(next);
    } else {
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
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-center px-5 py-3 relative">
        {activeIndex > 0 && (
          <Pressable onPress={goBack} className="absolute left-5 z-10">
            <MingCuteIcon name="left-line" size={24} />
          </Pressable>
        )}
        <Text className="text-lg font-sans-bold text-neutral-900">Savely</Text>
      </View>

      {/* Pager */}
      <View
        className="flex-1"
        onLayout={(e) => setPagerHeight(e.nativeEvent.layout.height)}
      >
        {pagerHeight > 0 && (
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScrollEnd}
            scrollEventThrottle={16}
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
          </ScrollView>
        )}
      </View>

      {/* Footer */}
      <View className="px-6 pb-4">
        <Text className="text-[26px] font-sans-bold text-neutral-900 text-center mb-2">
          {PAGES[activeIndex].title}
        </Text>
        <Text className="text-sm font-sans text-neutral-400 text-center leading-5 px-2 mb-6">
          {PAGES[activeIndex].description}
        </Text>

        {/* Pagination Dots */}
        <View className="flex-row justify-center items-center gap-1.5 mb-6">
          {PAGES.map((_, i) => (
            <View
              key={i}
              className={`h-2 rounded-full ${
                i === activeIndex ? "w-2 bg-neutral-900" : "w-2 bg-neutral-200"
              }`}
            />
          ))}
        </View>

        {/* Button */}
        <Pressable
          onPress={goToNext}
          className="bg-neutral-900 rounded-2xl py-4 items-center"
        >
          <Text className="text-white font-sans-semibold text-base">
            {PAGES[activeIndex].buttonText}
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
      imageUrl: "https://picsum.photos/seed/kenan-goal/400/520",
      platform: "youtube" as PlatformName,
      height: 220,
    },
    {
      title: "",
      imageUrl: "https://picsum.photos/seed/runner-track/400/480",
      platform: "instagram" as PlatformName,
      height: 180,
    },
  ],
  right: [
    {
      title: "Siyah Beyaz Oturma Odası",
      imageUrl: "https://picsum.photos/seed/living-room/400/260",
      platform: "pinterest" as PlatformName,
      height: 130,
    },
    {
      title: "Fit Akşam Yemeği Tabağı",
      imageUrl: "https://picsum.photos/seed/healthy-meal/400/500",
      platform: "tiktok" as PlatformName,
      height: 200,
    },
    {
      title: "",
      imageUrl: "",
      platform: "youtube" as PlatformName,
      height: 100,
      isGradient: true,
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
          {CONTENT_CARDS.right.map((card, i) =>
            card.isGradient ? (
              <View
                key={i}
                className="rounded-2xl bg-orange-400"
                style={{ height: card.height }}
              />
            ) : (
              <ContentCard key={i} card={card} />
            )
          )}
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
    imageUrl: string;
    platform: PlatformName;
    height: number;
  };
}) {
  return (
    <View>
      <View className="relative" style={{ height: card.height }}>
        <Image
          source={{ uri: card.imageUrl }}
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

const SEARCH_ITEMS: { imageUrl: string; platform: PlatformName }[] = [
  {
    imageUrl: "https://picsum.photos/seed/chicken-dish/200/200",
    platform: "youtube",
  },
  {
    imageUrl: "https://picsum.photos/seed/runner-athlete/200/200",
    platform: "instagram",
  },
  {
    imageUrl: "https://picsum.photos/seed/orange-sunset/200/200",
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
                source={{ uri: item.imageUrl }}
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
    imageUrl: "https://picsum.photos/seed/soup-bowl/200/200",
    bgColor: "#FFF5E6",
  },
  {
    imageUrl: "https://picsum.photos/seed/clapperboard/200/200",
    bgColor: "#F0F0F0",
  },
  {
    imageUrl: "https://picsum.photos/seed/polo-shirt/200/200",
    bgColor: "#E8F4FD",
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
              source={{ uri: card.imageUrl }}
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
