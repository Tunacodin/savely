import { useCallback, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  TextInput,
  useWindowDimensions,
} from "react-native";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useTranslation } from "react-i18next";
import { MingCuteIcon } from "@/components/ui/mingcute-icon";
import { useSavedItemsStore } from "@/store/saved-items";
import { useThemeColors } from "@/hooks/use-theme";
import { DEFAULT_COLLECTIONS, type DefaultCollection } from "@/constants/default-collections";

const PRESET_EMOJIS = [
  "\ud83d\udc23", "\ud83e\udd58", "\u26f1\ufe0f", "\ud83d\uded2\ufe0f", "\ud83d\udcaa", "\ud83d\udcda",
  "\ud83c\udf56", "\ud83c\udfac", "\ud83d\udc55", "\ud83d\ude97", "\ud83c\udfb5",
];

const PRESET_COLORS = [
  "#FFFFFF", "#F5D7D7", "#FBE4D6", "#FFF7E6", "#F0FDE4", "#E6D9F6",
  "#E0F0FF", "#EDE9FE", "#FFE8F0", "#D1FAE5", "#FEF3C7", "#FFF9C4",
];

interface CollectionFormProps {
  onClose: () => void;
  onSuccess?: (collectionId: string) => void;
}

export function CollectionForm({ onClose, onSuccess }: CollectionFormProps) {
  const { t, i18n } = useTranslation();
  const addCollection = useSavedItemsStore((s) => s.addCollection);
  const { width } = useWindowDimensions();
  const c = useThemeColors();
  const emojiInputRef = useRef<TextInput>(null);

  const [name, setName] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState(PRESET_EMOJIS[0]);
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [isSaving, setIsSaving] = useState(false);

  const lang = (i18n.language as keyof DefaultCollection["name"]) || "tr";
  const existingNames = useSavedItemsStore((s) => s.collections).map((c) => c.name.toLowerCase());

  const suggestions = useMemo(() => {
    const q = name.trim().toLowerCase();
    return DEFAULT_COLLECTIONS.filter((d) => {
      // Don't suggest already existing collections
      const dName = (d.name[lang] || d.name.en).toLowerCase();
      if (existingNames.includes(dName)) return false;
      if (!q) return true; // Show all when empty
      return dName.includes(q) || d.keywords.some((k) => k.includes(q));
    }).slice(0, 8);
  }, [name, lang, existingNames]);

  const selectSuggestion = (d: DefaultCollection) => {
    setName(d.name[lang] || d.name.en);
    setSelectedEmoji(d.emoji);
    setSelectedColor(d.bgColor);
  };

  const handleCreate = useCallback(async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    const id = await addCollection({
      name: name.trim(),
      emoji: selectedEmoji,
      bgColor: selectedColor,
      itemCount: 0,
    });
    setIsSaving(false);
    onSuccess?.(id);
  }, [name, selectedEmoji, selectedColor, addCollection, onSuccess]);

  const isFormValid = name.trim().length > 0;

  const itemSize = Math.floor((width - 40 - 40) / 6);

  return (
    <View style={{ flex: 1, backgroundColor: c.sheetBg, paddingBottom: 32, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: "hidden" }}>
      {/* Hidden TextInput for emoji keyboard */}
      <TextInput
        ref={emojiInputRef}
        style={{ position: "absolute", opacity: 0, width: 1, height: 1 }}
        onChangeText={(text) => {
          if (text.length > 0) {
            const chars = [...text];
            if (chars[0]) setSelectedEmoji(chars[0]);
            emojiInputRef.current?.clear();
          }
        }}
      />

      {/* Handle */}
      <View style={{ alignItems: "center", paddingTop: 12, paddingBottom: 4 }}>
        <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: c.handleIndicator }} />
      </View>

      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14 }}>
        <Text style={{ fontFamily: "Rubik_600SemiBold", fontSize: 22, color: c.textPrimary }}>
          {t("collections.newCollection")}
        </Text>
        <Pressable
          onPress={onClose}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c.surfaceAlt, alignItems: "center", justifyContent: "center" }}
        >
          <MingCuteIcon name="close-line" size={18} color={c.textSecondary} />
        </Pressable>
      </View>

      {/* Divider */}
      <View style={{ height: 1, backgroundColor: c.divider, marginBottom: 16 }} />

      <BottomSheetScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Emoji + Name row */}
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
          <View style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: c.surfaceAlt, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 28 }}>{selectedEmoji}</Text>
          </View>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t("collections.giveName")}
            placeholderTextColor={c.textTertiary}
            style={{ flex: 1, fontFamily: "Rubik_400Regular", fontSize: 16, color: c.textPrimary, backgroundColor: c.surfaceAlt, borderRadius: 14, paddingHorizontal: 16 }}
          />
        </View>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {suggestions.map((d) => (
                <Pressable
                  key={d.slug}
                  onPress={() => selectSuggestion(d)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 12,
                    backgroundColor: c.surfaceAlt,
                    gap: 6,
                  }}
                >
                  <Text style={{ fontSize: 16 }}>{d.emoji}</Text>
                  <Text style={{ fontFamily: "Rubik_400Regular", fontSize: 13, color: c.textPrimary }}>
                    {d.name[lang] || d.name.en}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Emoji Select */}
        <Text style={{ fontFamily: "Rubik_500Medium", fontSize: 16, color: c.textPrimary, marginBottom: 12 }}>
          {t("collections.selectEmoji")}
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
          {PRESET_EMOJIS.map((emoji) => {
            const isSelected = selectedEmoji === emoji;
            return (
              <Pressable
                key={emoji}
                onPress={() => setSelectedEmoji(emoji)}
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
                <Text style={{ fontSize: itemSize * 0.44 }}>{emoji}</Text>
              </Pressable>
            );
          })}

          {/* "+" button */}
          <Pressable
            onPress={() => emojiInputRef.current?.focus()}
            style={{
              width: itemSize,
              height: itemSize,
              borderRadius: 14,
              backgroundColor: c.buttonPrimary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MingCuteIcon name="add-line" size={24} color={c.buttonPrimaryText} />
          </Pressable>
        </View>

        {/* Color Select */}
        <Text style={{ fontFamily: "Rubik_500Medium", fontSize: 16, color: c.textPrimary, marginBottom: 12 }}>
          {t("collections.selectColor")}
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
          {PRESET_COLORS.map((color) => {
            const isSelected = selectedColor === color;
            return (
              <Pressable
                key={color}
                onPress={() => setSelectedColor(color)}
                style={{
                  width: itemSize,
                  height: itemSize,
                  borderRadius: 14,
                  backgroundColor: color,
                  borderWidth: isSelected ? 2 : 1,
                  borderColor: isSelected ? c.textPrimary : c.border,
                }}
              />
            );
          })}
        </View>
      </BottomSheetScrollView>

      {/* Footer */}
      <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
        <Pressable
          onPress={handleCreate}
          disabled={!isFormValid || isSaving}
          style={{
            height: 56,
            borderRadius: 16,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: isFormValid ? c.buttonPrimary : c.skeleton,
          }}
        >
          {isSaving ? (
            <ActivityIndicator color={c.buttonPrimaryText} />
          ) : (
            <Text style={{ fontFamily: "Rubik_400Regular", fontSize: 16, color: isFormValid ? c.buttonPrimaryText : c.textTertiary }}>
              {t("collections.create")}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
