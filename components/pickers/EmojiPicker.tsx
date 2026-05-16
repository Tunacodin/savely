import { useMemo, useState } from "react";
import { View, Text, Pressable, TextInput, useWindowDimensions } from "react-native";
import { useTranslation } from "react-i18next";
import { MingCuteIcon } from "@/components/ui/mingcute-icon";
import { useThemeColors } from "@/hooks/use-theme";

interface EmojiEntry {
  emoji: string;
  keywords: string[];
}

const EMOJIS: EmojiEntry[] = [
  // Food & Drink
  { emoji: "🍕", keywords: ["pizza"] },
  { emoji: "🍔", keywords: ["burger", "hamburger"] },
  { emoji: "🌮", keywords: ["taco"] },
  { emoji: "🍣", keywords: ["sushi", "japon"] },
  { emoji: "🍜", keywords: ["ramen", "noodles", "makarna"] },
  { emoji: "🍝", keywords: ["pasta", "spaghetti", "makarna"] },
  { emoji: "🥗", keywords: ["salad", "salata"] },
  { emoji: "🍰", keywords: ["cake", "pasta", "kek"] },
  { emoji: "🍩", keywords: ["donut", "donat"] },
  { emoji: "🍫", keywords: ["chocolate", "çikolata"] },
  { emoji: "☕", keywords: ["coffee", "kahve"] },
  { emoji: "🍺", keywords: ["beer", "bira"] },
  { emoji: "🍷", keywords: ["wine", "şarap"] },
  { emoji: "🍸", keywords: ["cocktail", "kokteyl", "drink", "içki"] },
  { emoji: "🥑", keywords: ["avocado", "avokado"] },
  { emoji: "🍎", keywords: ["apple", "elma", "fruit", "meyve"] },

  // Movies / Entertainment
  { emoji: "🎬", keywords: ["movie", "film", "sinema", "cinema"] },
  { emoji: "🎥", keywords: ["camera", "kamera", "video"] },
  { emoji: "📺", keywords: ["tv", "television", "televizyon", "dizi", "show"] },
  { emoji: "🎭", keywords: ["theater", "tiyatro", "drama"] },
  { emoji: "🍿", keywords: ["popcorn", "patlamış mısır", "cinema"] },

  // Music
  { emoji: "🎵", keywords: ["music", "müzik", "note", "nota"] },
  { emoji: "🎧", keywords: ["headphones", "kulaklık", "music"] },
  { emoji: "🎤", keywords: ["mic", "microphone", "mikrofon", "karaoke"] },
  { emoji: "🎸", keywords: ["guitar", "gitar"] },
  { emoji: "🎹", keywords: ["piano"] },
  { emoji: "🥁", keywords: ["drum", "davul"] },

  // Books / Learning
  { emoji: "📚", keywords: ["books", "kitaplar", "library"] },
  { emoji: "📖", keywords: ["book", "kitap", "read", "oku"] },
  { emoji: "📝", keywords: ["note", "notes", "notlar", "yazı"] },
  { emoji: "✏️", keywords: ["pencil", "kalem", "write"] },
  { emoji: "🎓", keywords: ["graduation", "mezuniyet", "education", "eğitim", "school"] },
  { emoji: "🧠", keywords: ["brain", "beyin", "learning", "öğrenme"] },
  { emoji: "💡", keywords: ["idea", "fikir", "lamp", "ampul"] },

  // Shopping / Money
  { emoji: "🛍️", keywords: ["shopping", "alışveriş", "bag"] },
  { emoji: "🛒", keywords: ["cart", "sepet", "shopping"] },
  { emoji: "💳", keywords: ["card", "kart", "credit", "kredi"] },
  { emoji: "💰", keywords: ["money", "para", "sack"] },
  { emoji: "🏷️", keywords: ["tag", "label", "etiket", "fiyat"] },
  { emoji: "🎁", keywords: ["gift", "hediye", "present"] },

  // Travel / Places
  { emoji: "✈️", keywords: ["plane", "uçak", "travel", "seyahat", "flight"] },
  { emoji: "🚗", keywords: ["car", "araba"] },
  { emoji: "🚂", keywords: ["train", "tren"] },
  { emoji: "🏖️", keywords: ["beach", "plaj", "tatil", "summer"] },
  { emoji: "🏔️", keywords: ["mountain", "dağ"] },
  { emoji: "🗺️", keywords: ["map", "harita"] },
  { emoji: "🧳", keywords: ["luggage", "valiz", "bavul"] },
  { emoji: "🏨", keywords: ["hotel", "otel"] },
  { emoji: "🏠", keywords: ["home", "house", "ev"] },
  { emoji: "🌍", keywords: ["earth", "world", "dünya", "globe"] },

  // Sports / Fitness
  { emoji: "⚽", keywords: ["football", "soccer", "futbol", "top"] },
  { emoji: "🏀", keywords: ["basketball", "basketbol"] },
  { emoji: "🎾", keywords: ["tennis", "tenis"] },
  { emoji: "🏃", keywords: ["run", "running", "koşu"] },
  { emoji: "🚴", keywords: ["bike", "cycling", "bisiklet"] },
  { emoji: "🧘", keywords: ["yoga", "meditation", "meditasyon"] },
  { emoji: "💪", keywords: ["muscle", "kas", "gym", "spor", "fitness"] },
  { emoji: "🏋️", keywords: ["weight", "ağırlık", "gym", "fitness"] },
  { emoji: "🏊", keywords: ["swim", "yüzme"] },

  // Health / Self-care
  { emoji: "❤️", keywords: ["heart", "kalp", "love", "aşk"] },
  { emoji: "🩺", keywords: ["health", "sağlık", "doctor", "doktor"] },
  { emoji: "💊", keywords: ["pill", "ilaç", "medicine"] },
  { emoji: "🛁", keywords: ["bath", "banyo", "spa"] },
  { emoji: "🧴", keywords: ["lotion", "skincare", "bakım"] },
  { emoji: "💤", keywords: ["sleep", "uyku", "zzz"] },

  // Tech / Work
  { emoji: "💻", keywords: ["laptop", "computer", "bilgisayar", "work", "iş"] },
  { emoji: "📱", keywords: ["phone", "telefon", "mobile"] },
  { emoji: "⌨️", keywords: ["keyboard", "klavye"] },
  { emoji: "🖥️", keywords: ["desktop", "computer"] },
  { emoji: "💼", keywords: ["briefcase", "iş", "work", "business"] },
  { emoji: "📊", keywords: ["chart", "grafik", "data", "veri"] },
  { emoji: "📈", keywords: ["growth", "büyüme", "stock", "borsa"] },
  { emoji: "🚀", keywords: ["rocket", "roket", "launch", "startup"] },

  // Art / Creativity
  { emoji: "🎨", keywords: ["art", "sanat", "paint", "boyama"] },
  { emoji: "📷", keywords: ["camera", "kamera", "photo", "fotoğraf"] },
  { emoji: "🖌️", keywords: ["brush", "fırça", "art"] },
  { emoji: "🪡", keywords: ["sewing", "dikiş", "craft"] },
  { emoji: "🧵", keywords: ["thread", "iplik", "knit"] },

  // Nature / Plants
  { emoji: "🌱", keywords: ["plant", "bitki", "seed", "growth"] },
  { emoji: "🌳", keywords: ["tree", "ağaç"] },
  { emoji: "🌸", keywords: ["flower", "çiçek", "blossom"] },
  { emoji: "🌻", keywords: ["sunflower", "ayçiçeği"] },
  { emoji: "🌵", keywords: ["cactus", "kaktüs"] },
  { emoji: "🍄", keywords: ["mushroom", "mantar"] },

  // Weather / Sky
  { emoji: "☀️", keywords: ["sun", "güneş", "summer"] },
  { emoji: "🌙", keywords: ["moon", "ay", "night"] },
  { emoji: "⭐", keywords: ["star", "yıldız"] },
  { emoji: "🌈", keywords: ["rainbow", "gökkuşağı"] },
  { emoji: "❄️", keywords: ["snow", "kar", "winter", "kış"] },
  { emoji: "🔥", keywords: ["fire", "ateş", "hot", "lit"] },

  // Animals
  { emoji: "🐶", keywords: ["dog", "köpek"] },
  { emoji: "🐱", keywords: ["cat", "kedi"] },
  { emoji: "🦊", keywords: ["fox", "tilki"] },
  { emoji: "🐻", keywords: ["bear", "ayı"] },
  { emoji: "🐼", keywords: ["panda"] },
  { emoji: "🦁", keywords: ["lion", "aslan"] },
  { emoji: "🐧", keywords: ["penguin", "penguen"] },
  { emoji: "🦋", keywords: ["butterfly", "kelebek"] },

  // Symbols / Misc
  { emoji: "✨", keywords: ["sparkle", "parıltı", "shine", "magic"] },
  { emoji: "🎯", keywords: ["target", "hedef", "goal"] },
  { emoji: "🏆", keywords: ["trophy", "kupa", "win", "ödül"] },
  { emoji: "🎉", keywords: ["party", "parti", "celebrate"] },
  { emoji: "🔔", keywords: ["bell", "zil", "notification", "bildirim"] },
  { emoji: "🔒", keywords: ["lock", "kilit", "secure"] },
  { emoji: "🗓️", keywords: ["calendar", "takvim", "date"] },
  { emoji: "⏰", keywords: ["alarm", "clock", "saat"] },
  { emoji: "📌", keywords: ["pin", "iğne", "save", "kaydet"] },
  { emoji: "🔖", keywords: ["bookmark", "yer imi", "save"] },
  { emoji: "🧩", keywords: ["puzzle", "yapboz"] },
  { emoji: "🎮", keywords: ["game", "oyun", "controller"] },
];

interface EmojiPickerProps {
  selectedEmoji: string;
  onSelectEmoji: (emoji: string) => void;
  searchText?: string;
  onSearchChange?: (value: string) => void;
  hideSearch?: boolean;
}

export function EmojiPicker({ selectedEmoji, onSelectEmoji, searchText: searchTextProp, onSearchChange, hideSearch }: EmojiPickerProps) {
  const { t } = useTranslation();
  const c = useThemeColors();
  const [internalSearch, setInternalSearch] = useState("");
  const { width } = useWindowDimensions();

  const searchText = searchTextProp !== undefined ? searchTextProp : internalSearch;
  const setSearchText = onSearchChange ?? setInternalSearch;

  const filteredEmojis = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return EMOJIS;
    return EMOJIS.filter((e) => e.keywords.some((k) => k.toLowerCase().includes(q)));
  }, [searchText]);

  const itemSize = Math.floor((width - 40 - 40) / 6);

  return (
    <View>
      {/* Search */}
      {!hideSearch && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: c.surfaceAlt,
            borderRadius: 14,
            paddingHorizontal: 14,
            height: 48,
            gap: 10,
            marginBottom: 16,
          }}
        >
          <MingCuteIcon name="search-line" size={20} color={c.textTertiary} />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder={t("emojiPicker.search")}
            placeholderTextColor={c.textTertiary}
            style={{
              flex: 1,
              fontFamily: "Rubik_400Regular",
              fontSize: 16,
              color: c.textPrimary,
            }}
          />
        </View>
      )}

      {/* Emoji Grid */}
      {filteredEmojis.length === 0 ? (
        <View style={{ paddingVertical: 32, alignItems: "center" }}>
          <Text style={{ fontFamily: "Rubik_400Regular", fontSize: 14, color: c.textTertiary }}>
            {t("emojiPicker.noResults")}
          </Text>
        </View>
      ) : (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {filteredEmojis.map((entry, index) => {
            const isSelected = selectedEmoji === entry.emoji;
            return (
              <Pressable
                key={`${entry.emoji}-${index}`}
                onPress={() => onSelectEmoji(entry.emoji)}
                style={{
                  width: itemSize,
                  height: itemSize,
                  borderRadius: 14,
                  backgroundColor: c.surfaceAlt,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: isSelected ? 2 : 0,
                  borderColor: c.textPrimary,
                }}
              >
                <Text style={{ fontSize: itemSize * 0.44 }}>{entry.emoji}</Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}
