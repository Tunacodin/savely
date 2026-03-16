import { useState } from "react";
import { View, Text, TextInput, Pressable, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { MingCuteIcon } from "@/components/ui/mingcute-icon";
import { PlatformBadge, type PlatformName } from "@/components/ui/platform-badge";

// Recent searches data
const RECENT_SEARCHES = [
  { id: "1", label: "Yazlık krem kombin önerisi" },
  { id: "2", label: "Kremalı Mantarlı Tavuk" },
  { id: "3", label: "Doğru Güneş Kremi Nasıl" },
  { id: "4", label: "Güneş Kremi" },
  { id: "5", label: "Old money yazlık chino pantolon polo" },
];

// Search results data
interface SearchResult {
  id: string;
  category: string;
  title: string;
  description: string;
  thumbnail: string;
  platform: PlatformName;
}

const MOCK_RESULTS: SearchResult[] = [
  {
    id: "1",
    category: "Kombin Önerileri",
    title: "Yazlık krem kombin önerisi",
    description: "Old money yazlık chino pantolon - polo..",
    thumbnail: "https://picsum.photos/seed/combin/200",
    platform: "youtube",
  },
  {
    id: "2",
    category: "Yemek Tarifleri",
    title: "Kremalı Mantarlı Tavuk Tarifi",
    description: "Old money yazlık chino pantolon - polo..",
    thumbnail: "https://picsum.photos/seed/food/200",
    platform: "instagram",
  },
  {
    id: "3",
    category: "Kombin Önerileri",
    title: "Doğru Güneş Kremi Nasıl Seçilir?",
    description: "Old money yazlık chino pantolon - polo..",
    thumbnail: "https://picsum.photos/seed/sunscreen/200",
    platform: "medium",
  },
];

function RecentSearchItem({
  label,
  onPress,
  onRemove,
}: {
  label: string;
  onPress: () => void;
  onRemove: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between px-6 py-5 h-[60px]"
    >
      <View className="flex-row items-center gap-3 flex-1">
        <MingCuteIcon name="time-line" size={20} color="#A1A1AA" />
        <Text className="font-sans text-base text-zinc-600" numberOfLines={1}>
          {label}
        </Text>
      </View>
      <Pressable onPress={onRemove} hitSlop={8}>
        <MingCuteIcon name="close-line" size={20} color="#A1A1AA" />
      </Pressable>
    </Pressable>
  );
}

function SearchResultItem({ item }: { item: SearchResult }) {
  return (
    <Pressable className="flex-row items-center px-4 py-2 gap-3 h-[88px]">
      <View className="w-[72px] h-[72px]">
        <View className="w-full h-full rounded-xl overflow-hidden">
          <Image
            source={item.thumbnail}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        </View>
        <View className="absolute -bottom-1 -left-1">
          <PlatformBadge platform={item.platform} size="md" />
        </View>
      </View>
      <View className="flex-1 justify-center gap-3">
        <Text className="font-sans-medium text-xs text-zinc-600">
          {item.category}
        </Text>
        <Text
          className="font-sans-medium text-base text-zinc-800"
          numberOfLines={1}
        >
          {item.title}
        </Text>
        <Text className="font-sans text-sm text-zinc-400" numberOfLines={1}>
          {item.description}
        </Text>
      </View>
    </Pressable>
  );
}

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState(RECENT_SEARCHES);

  const isActive = query.length > 0;

  const removeRecentSearch = (id: string) => {
    setRecentSearches((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* Top Bar - Search Input */}
      <View className="px-4 py-5 h-16 bg-white">
        <View className="flex-row items-center justify-between bg-zinc-100 rounded-xl px-3 h-11 gap-2">
          <View className="flex-row items-center gap-2 flex-1">
            <MingCuteIcon name="search-line" size={20} color="#A1A1AA" />
            <TextInput
              className="flex-1 font-sans text-base text-zinc-800"
              placeholder="Ara"
              placeholderTextColor="#A1A1AA"
              value={query}
              onChangeText={setQuery}
            />
          </View>
          {isActive && (
            <Pressable onPress={() => setQuery("")}>
              <MingCuteIcon name="close-line" size={20} color="#A1A1AA" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Content */}
      {isActive ? (
        <FlatList
          data={MOCK_RESULTS}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <SearchResultItem item={item} />}
          contentContainerClassName="py-0.5 gap-1"
        />
      ) : (
        <FlatList
          data={recentSearches}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RecentSearchItem
              label={item.label}
              onPress={() => setQuery(item.label)}
              onRemove={() => removeRecentSearch(item.id)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}
