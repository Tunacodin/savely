import { useMemo, useState, useCallback } from "react";
import { View, Text, Pressable, ScrollView, TextInput, useWindowDimensions } from "react-native";
import { MingCuteIcon } from "@/components/ui/mingcute-icon";

const EMOJI_CATEGORIES = {
  "Yemek": ["🍕", "🍔", "🍟", "🌭", "🍿", "🥓", "🥚", "🍳", "🧈", "🥞", "🧇", "🥐", "🍞", "🥖", "🥨", "🥯", "🧀", "🍗", "🍖", "🌮", "🌯", "🥙", "🥗", "🥘", "🍲", "🍛", "🍝", "🍜", "🍝", "🍠", "🍢", "🍣", "🍤", "🍥", "🥠", "🥮", "🍱", "🍛", "🍣", "🍢"],
  "Filmler": ["🎬", "🎥", "📽️", "🎞️", "📹", "🎭", "🎪", "🎨", "🖼️"],
  "Kitaplar": ["📚", "📖", "📝", "📄", "📃", "📑", "📜", "📋"],
  "Alışveriş": ["🛍️", "🛒", "💳", "💰", "💸", "💵", "💴", "💶", "💷"],
  "Seyahat": ["✈️", "🚀", "🚁", "🚂", "🚃", "🚄", "🚅", "🚆", "🚇", "🚈", "🚉", "🚊", "🚝", "🚞", "🚋", "🚌", "🚍", "🚎", "🚐", "🚑", "🚒", "🚓", "🚔", "🚕", "🚖", "🚗", "🚘", "🚙", "🚚", "🚛", "🚜", "⛵", "🛶", "🚤", "🛳️", "⛴️", "🛥️"],
  "Spor": ["⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🥏", "🎱", "🪀", "🏓", "🏸", "🏒", "🏑", "🥍", "🏏", "🥅", "⛳", "⛸️", "🎣", "🎽", "🎿", "⛷️", "🏂", "🪂", "🏋️", "🤼", "🤸", "⛹️", "🤺", "🤾", "🏌️", "🏇", "🧘", "🏄", "🏊", "🤽", "🚣", "🧗", "🚴", "🚵", "🎯", "🪃", "🪁"],
  "Müzik": ["🎵", "🎶", "🎤", "🎧", "🎼", "🎹", "🥁", "🎷", "🎺", "🎸", "🪕", "🎻", "🎲", "🧩"],
  "Sağlık": ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🫰", "🤟", "🤘", "🤙", "👍", "👎"],
  "Diğer": ["📱", "💻", "⌨️", "🖱️", "🖨️", "📷", "📹", "🎥", "🎬", "📺", "📻", "🧮", "⏱️", "⏲️", "⏰", "🕰️"],
};

interface EmojiPickerProps {
  selectedEmoji: string;
  onSelectEmoji: (emoji: string) => void;
}

export function EmojiPicker({ selectedEmoji, onSelectEmoji }: EmojiPickerProps) {
  const [searchText, setSearchText] = useState("");
  const [activeCategory, setActiveCategory] = useState("Yemek");
  const { width } = useWindowDimensions();

  const categories = Object.keys(EMOJI_CATEGORIES) as (keyof typeof EMOJI_CATEGORIES)[];

  const filteredEmojis = useMemo(() => {
    const categoryEmojis = EMOJI_CATEGORIES[activeCategory as keyof typeof EMOJI_CATEGORIES] || [];
    if (!searchText.trim()) return categoryEmojis;
    
    const query = searchText.toLowerCase();
    return categoryEmojis.filter((emoji) =>
      emoji.toLowerCase().includes(query)
    );
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
            placeholder="Emoji ara..."
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
        {categories.map((category) => (
          <Pressable
            key={category}
            onPress={() => {
              setActiveCategory(category);
              setSearchText("");
            }}
            className={`px-4 py-1.5 rounded-full ${
              activeCategory === category ? "bg-primary-500" : "bg-white border border-zinc-200"
            }`}
          >
            <Text
              className={`font-sans-medium text-xs ${
                activeCategory === category ? "text-white" : "text-zinc-700"
              }`}
            >
              {category}
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
