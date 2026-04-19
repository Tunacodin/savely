import { useMemo, useState } from "react";
import { View, Text, Pressable, ScrollView, TextInput, useWindowDimensions } from "react-native";
import { useTranslation } from "react-i18next";
import { MingCuteIcon } from "@/components/ui/mingcute-icon";

const EMOJI_CATEGORY_KEYS = ["food", "movies", "books", "shopping", "travel", "sports", "music", "health", "other"] as const;

const EMOJI_DATA: Record<string, string[]> = {
  food: ["🍕", "🍔", "🍟", "🌭", "🍿", "🥓", "🥚", "🍳", "🧈", "🥞", "🧇", "🥐", "🍞", "🥖", "🥨", "🥯", "🧀", "🍗", "🍖", "🌮", "🌯", "🥙", "🥗", "🥘", "🍲", "🍛", "🍝", "🍜", "🍠", "🍢", "🍣", "🍤", "🍥", "🥠", "🥮", "🍱"],
  movies: ["🎬", "🎥", "📽️", "🎞️", "📹", "🎭", "🎪", "🎨", "🖼️"],
  books: ["📚", "📖", "📝", "📄", "📃", "📑", "📜", "📋"],
  shopping: ["🛍️", "🛒", "💳", "💰", "💸", "💵", "💴", "💶", "💷"],
  travel: ["✈️", "🚀", "🚁", "🚂", "🚃", "🚄", "🚅", "🚆", "🚇", "🚈", "🚉", "🚊", "🚝", "🚞", "🚋", "🚌", "🚍", "🚎", "🚐", "🚑", "🚒", "🚓", "🚔", "🚕", "🚖", "🚗", "🚘", "🚙", "🚚", "🚛", "🚜", "⛵", "🛶", "🚤", "🛳️", "⛴️", "🛥️"],
  sports: ["⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🥏", "🎱", "🪀", "🏓", "🏸", "🏒", "🏑", "🥍", "🏏", "🥅", "⛳", "⛸️", "🎣", "🎽", "🎿", "⛷️", "🏂", "🪂", "🏋️", "🤼", "🤸", "⛹️", "🤺", "🤾", "🏌️", "🏇", "🧘", "🏄", "🏊", "🤽", "🚣", "🧗", "🚴", "🚵", "🎯", "🪃", "🪁"],
  music: ["🎵", "🎶", "🎤", "🎧", "🎼", "🎹", "🥁", "🎷", "🎺", "🎸", "🪕", "🎻", "🎲", "🧩"],
  health: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🫰", "🤟", "🤘", "🤙", "👍", "👎"],
  other: ["📱", "💻", "⌨️", "🖱️", "🖨️", "📷", "📹", "🎥", "🎬", "📺", "📻", "🧮", "⏱️", "⏲️", "⏰", "🕰️"],
};

interface EmojiPickerProps {
  selectedEmoji: string;
  onSelectEmoji: (emoji: string) => void;
}

export function EmojiPicker({ selectedEmoji, onSelectEmoji }: EmojiPickerProps) {
  const { t } = useTranslation();
  const [searchText, setSearchText] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>(EMOJI_CATEGORY_KEYS[0]);
  const { width } = useWindowDimensions();

  const filteredEmojis = useMemo(() => {
    const categoryEmojis = EMOJI_DATA[activeCategory] || [];
    if (!searchText.trim()) return categoryEmojis;
    const query = searchText.toLowerCase();
    return categoryEmojis.filter((emoji) => emoji.toLowerCase().includes(query));
  }, [activeCategory, searchText]);

  const itemsPerRow = Math.floor((width - 40) / 50);

  return (
    <View className="bg-zinc-50 rounded-2xl overflow-hidden">
      {/* Search */}
      <View className="px-4 pt-3">
        <View className="flex-row items-center bg-white rounded-xl px-3 py-2 border border-zinc-200">
          <MingCuteIcon name="search-line" size={16} color="#A1A1AA" />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder={t("emojiPicker.search")}
            placeholderTextColor="#A1A1AA"
            className="flex-1 font-sans text-sm text-zinc-800 ml-2"
          />
        </View>
      </View>

      {/* Category Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-4 py-3"
        contentContainerClassName="gap-2"
      >
        {EMOJI_CATEGORY_KEYS.map((key) => (
          <Pressable
            key={key}
            onPress={() => {
              setActiveCategory(key);
              setSearchText("");
            }}
            className={`px-4 py-1.5 rounded-full ${
              activeCategory === key ? "bg-primary-500" : "bg-white border border-zinc-200"
            }`}
          >
            <Text
              className={`font-sans-medium text-xs ${
                activeCategory === key ? "text-white" : "text-zinc-700"
              }`}
            >
              {t(`emojiPicker.${key}`)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Emoji Grid */}
      <View className="px-4 pb-4">
        <View className="flex-row flex-wrap gap-2 justify-center">
          {filteredEmojis.map((emoji, index) => (
            <Pressable
              key={`${emoji}-${index}`}
              onPress={() => onSelectEmoji(emoji)}
              className={`w-12 h-12 items-center justify-center rounded-xl border-2 ${
                selectedEmoji === emoji
                  ? "border-primary-500 bg-primary-50"
                  : "border-zinc-200 bg-white"
              }`}
            >
              <Text className="text-2xl">{emoji}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}
