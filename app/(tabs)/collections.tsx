import { useState, useCallback } from "react";
import { View, Text, TextInput, ScrollView, Pressable, Alert, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { MingCuteIcon } from "@/components/ui/mingcute-icon";
import { useSavedItemsStore } from "@/store/saved-items";
import { EmojiPicker } from "@/components/pickers/EmojiPicker";
import { ColorPicker } from "@/components/pickers/ColorPicker";
import { useThemeColors } from "@/hooks/use-theme";
import type { Collection } from "@/types";

function EditCollectionModal({
  collection,
  visible,
  onClose,
}: {
  collection: Collection | null;
  visible: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const updateCollection = useSavedItemsStore((s) => s.updateCollection);
  const removeCollection = useSavedItemsStore((s) => s.removeCollection);
  const c = useThemeColors();

  const [name, setName] = useState(collection?.name ?? "");
  const [emoji, setEmoji] = useState(collection?.emoji ?? "");
  const [bgColor, setBgColor] = useState(collection?.bgColor ?? "#f4f4f5");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const resetState = useCallback((col: Collection | null) => {
    setName(col?.name ?? "");
    setEmoji(col?.emoji ?? "");
    setBgColor(col?.bgColor ?? "#f4f4f5");
    setShowEmojiPicker(false);
    setShowColorPicker(false);
  }, []);

  const handleSave = useCallback(() => {
    if (!collection || !name.trim()) return;
    updateCollection(collection.id, {
      name: name.trim(),
      emoji,
      bgColor,
    });
    onClose();
  }, [collection, name, emoji, bgColor, updateCollection, onClose]);

  const handleDelete = useCallback(() => {
    if (!collection) return;
    Alert.alert(t("collections.deleteCollection"), t("collections.deleteConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: () => {
          removeCollection(collection.id);
          onClose();
        },
      },
    ]);
  }, [collection, removeCollection, onClose]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onShow={() => resetState(collection)}>
      <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, height: 60 }}>
          <Pressable onPress={onClose} hitSlop={8}>
            <Text style={{ fontFamily: "Rubik_400Regular", fontSize: 16, color: c.textSecondary }}>{t("common.cancel")}</Text>
          </Pressable>
          <Text style={{ fontFamily: "Rubik_600SemiBold", fontSize: 17, color: c.textPrimary }}>{t("collections.editCollection")}</Text>
          <Pressable onPress={handleSave} hitSlop={8}>
            <Text style={{ fontFamily: "Rubik_600SemiBold", fontSize: 16, color: c.text }}>{t("common.save")}</Text>
          </Pressable>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 24 }}>
          {/* Preview */}
          <View style={{ alignItems: "center", paddingVertical: 20 }}>
            <View style={{ width: 120, height: 120, borderRadius: 24, backgroundColor: bgColor, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 56 }}>{emoji}</Text>
            </View>
          </View>

          {/* Name */}
          <View style={{ gap: 8 }}>
            <Text style={{ fontFamily: "Rubik_500Medium", fontSize: 14, color: c.textSecondary }}>{t("collections.name")}</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              style={{
                fontFamily: "Rubik_400Regular",
                fontSize: 16,
                color: c.text,
                backgroundColor: c.surfaceAlt,
                borderRadius: 14,
                paddingHorizontal: 16,
                height: 52,
              }}
              placeholder={t("collections.namePlaceholder")}
              placeholderTextColor={c.textTertiary}
            />
          </View>

          {/* Emoji */}
          <View style={{ gap: 8 }}>
            <Text style={{ fontFamily: "Rubik_500Medium", fontSize: 14, color: c.textSecondary }}>{t("collections.icon")}</Text>
            <Pressable
              onPress={() => setShowEmojiPicker(!showEmojiPicker)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: c.surfaceAlt,
                borderRadius: 14,
                paddingHorizontal: 16,
                height: 52,
                gap: 12,
              }}
            >
              <Text style={{ fontSize: 24 }}>{emoji}</Text>
              <Text style={{ fontFamily: "Rubik_400Regular", fontSize: 16, color: c.textSecondary, flex: 1 }}>{t("collections.tapToChange")}</Text>
              <MingCuteIcon name="right-small-line" size={20} color={c.textTertiary} />
            </Pressable>
            {showEmojiPicker && (
              <EmojiPicker selectedEmoji={emoji} onSelectEmoji={(e: string) => { setEmoji(e); setShowEmojiPicker(false); }} />
            )}
          </View>

          {/* Color */}
          <View style={{ gap: 8 }}>
            <Text style={{ fontFamily: "Rubik_500Medium", fontSize: 14, color: c.textSecondary }}>{t("collections.bgColor")}</Text>
            <Pressable
              onPress={() => setShowColorPicker(!showColorPicker)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: c.surfaceAlt,
                borderRadius: 14,
                paddingHorizontal: 16,
                height: 52,
                gap: 12,
              }}
            >
              <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: bgColor, borderWidth: 1, borderColor: c.border }} />
              <Text style={{ fontFamily: "Rubik_400Regular", fontSize: 16, color: c.textSecondary, flex: 1 }}>{t("collections.tapToChange")}</Text>
              <MingCuteIcon name="right-small-line" size={20} color={c.textTertiary} />
            </Pressable>
            {showColorPicker && (
              <ColorPicker colors={COLLECTION_COLORS} selectedColor={bgColor} onSelectColor={(col: string) => { setBgColor(col); setShowColorPicker(false); }} />
            )}
          </View>

          {/* Delete */}
          <Pressable
            onPress={handleDelete}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              height: 52,
              borderRadius: 14,
              backgroundColor: c.errorBg,
              gap: 8,
              marginTop: 12,
            }}
          >
            <MingCuteIcon name="delete-2-line" size={20} color={c.error} />
            <Text style={{ fontFamily: "Rubik_500Medium", fontSize: 16, color: c.error }}>{t("collections.deleteCollection")}</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

export default function CollectionsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const collections = useSavedItemsStore((s) => s.collections);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const c = useThemeColors();

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      {/* Top Bar */}
      <View
        style={{
          height: 64,
          justifyContent: "center",
          paddingHorizontal: 16,
        }}
      >
        <Text
          style={{ fontFamily: "Rubik_500Medium", fontSize: 20, color: c.textPrimary }}
        >
          {t("collections.title")}
        </Text>
      </View>

      {collections.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 }}>
          <MingCuteIcon name="folder-line" size={56} color={c.border} />
          <Text style={{ fontFamily: "Rubik_500Medium", fontSize: 18, color: c.textPrimary, marginTop: 20, textAlign: "center" }}>
            {t("collections.emptyTitle")}
          </Text>
          <Text style={{ fontFamily: "Rubik_400Regular", fontSize: 14, color: c.textTertiary, marginTop: 8, textAlign: "center", lineHeight: 20 }}>
            {t("collections.emptyDesc")}
          </Text>
        </View>
      ) : (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: 8, paddingHorizontal: 16 }}>
        {collections.map((collection) => (
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
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: collection.bgColor,
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

            <Pressable
              onPress={() => setEditingCollection(collection)}
              hitSlop={8}
              style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center" }}
            >
              <MingCuteIcon name="more-2-line" size={24} color={c.icon} />
            </Pressable>
          </Pressable>
        ))}
        </View>
      </ScrollView>
      )}

      <EditCollectionModal
        collection={editingCollection}
        visible={!!editingCollection}
        onClose={() => setEditingCollection(null)}
      />
    </View>
  );
}
