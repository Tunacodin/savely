import { forwardRef, useCallback, useRef, useState, type ReactElement } from "react";
import { View, Text, ScrollView, Pressable, TextInput, Alert, useWindowDimensions } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { useSavedItemsStore } from "@/store/saved-items";
import { SaveItemCard } from "@/components/save-item-card";
import { openItemDetail } from "@/components/global-bottom-sheet";
import { MingCuteIcon } from "@/components/ui/mingcute-icon";
import { EmojiPicker } from "@/components/pickers/EmojiPicker";
import { ColorPicker } from "@/components/pickers/ColorPicker";
import { useThemeColors } from "@/hooks/use-theme";
import type { SavedItem, Collection } from "@/types";

const COLLECTION_COLORS = [
  "#FFFFFF", "#FFF7ED", "#EEF2FF", "#FAF5FF", "#F0FDF4", "#FEF2F2",
  "#FDF2F8", "#ECFDF5", "#F0F9FF", "#F5F3FF", "#FFF1F2", "#FFFBEB",
  "#FEF3C7", "#EFF6FF", "#F4F4F5",
];

export default function CollectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const c = useThemeColors();
  const insets = useSafeAreaInsets();

  const collections = useSavedItemsStore((s) => s.collections);
  const allItems = useSavedItemsStore((s) => s.items);
  const updateCollection = useSavedItemsStore((s) => s.updateCollection);
  const removeCollection = useSavedItemsStore((s) => s.removeCollection);

  const collection = collections.find((col) => col.id === id);
  const items = allItems.filter((item) => item.collectionId === id);

  const editSheetRef = useRef<BottomSheetModal>(null);

  const padding = 16;
  const gap = 16;
  const cardWidth = (width - padding * 2 - gap) / 2;

  const leftColumn: SavedItem[] = [];
  const rightColumn: SavedItem[] = [];
  let leftHeight = 0;
  let rightHeight = 0;

  items.forEach((item) => {
    const hasImage = !!item.imageUrl;
    const aspectRatio =
      item.metadata?.width && item.metadata?.height
        ? item.metadata.height / item.metadata.width
        : (item.aspectRatio ?? 1);
    const itemHeight = cardWidth * (hasImage ? aspectRatio : 0.55) + 40;
    if (leftHeight <= rightHeight) {
      leftColumn.push(item);
      leftHeight += itemHeight + gap;
    } else {
      rightColumn.push(item);
      rightHeight += itemHeight + gap;
    }
  });

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={["top"]}>
      {/* Top Bar */}
      <View
        style={{
          height: 64,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          gap: 6,
          borderBottomWidth: 1.5,
          borderBottomColor: c.border,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <MingCuteIcon name="left-line" size={24} color={c.textPrimary} />
        </Pressable>
        <Text
          style={{
            flex: 1,
            fontFamily: "Rubik_500Medium",
            fontSize: 20,
            color: c.textPrimary,
          }}
          numberOfLines={1}
        >
          {collection?.name ?? t("collections.fallbackTitle")}
        </Text>
        {collection && (
          <Pressable
            onPress={() => editSheetRef.current?.present()}
            hitSlop={8}
            style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center" }}
          >
            <MingCuteIcon name="edit-2-line" size={22} color={c.textPrimary} />
          </Pressable>
        )}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {items.length === 0 ? (
          <View style={{ alignItems: "center", paddingTop: 80 }}>
            <Text
              style={{
                fontFamily: "Rubik_400Regular",
                fontSize: 15,
                color: c.textTertiary,
              }}
            >
              {t("collections.empty")}
            </Text>
          </View>
        ) : (
          <View style={{ flexDirection: "row", gap }}>
            <View style={{ flex: 1, gap }}>
              {leftColumn.map((item) => (
                <SaveItemCard
                  key={item.id}
                  item={item}
                  width={cardWidth}
                  onPress={() => openItemDetail(item)}
                />
              ))}
            </View>
            <View style={{ flex: 1, gap }}>
              {rightColumn.map((item) => (
                <SaveItemCard
                  key={item.id}
                  item={item}
                  width={cardWidth}
                  onPress={() => openItemDetail(item)}
                />
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {collection && (
        <EditCollectionSheet
          ref={editSheetRef}
          collection={collection}
          onSave={(updates) => {
            updateCollection(collection.id, updates);
            editSheetRef.current?.dismiss();
          }}
          onDelete={() => {
            Alert.alert(
              t("collections.deleteCollection"),
              t("collections.deleteConfirm"),
              [
                { text: t("common.cancel"), style: "cancel" },
                {
                  text: t("common.delete"),
                  style: "destructive",
                  onPress: () => {
                    removeCollection(collection.id);
                    editSheetRef.current?.dismiss();
                    router.back();
                  },
                },
              ]
            );
          }}
          renderBackdrop={renderBackdrop}
          insetsBottom={insets.bottom}
        />
      )}
    </SafeAreaView>
  );
}

interface EditSheetProps {
  collection: Collection;
  onSave: (updates: Pick<Collection, "name" | "emoji" | "bgColor">) => void;
  onDelete: () => void;
  renderBackdrop: (props: any) => ReactElement;
  insetsBottom: number;
}

const EditCollectionSheet = forwardRef<BottomSheetModal, EditSheetProps>(
  ({ collection, onSave, onDelete, renderBackdrop, insetsBottom }, ref) => {
    const { t } = useTranslation();
    const c = useThemeColors();
    const { height } = useWindowDimensions();

    const [name, setName] = useState(collection.name);
    const [emoji, setEmoji] = useState(collection.emoji);
    const [bgColor, setBgColor] = useState(collection.bgColor);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);

    const handleOnDismiss = useCallback(() => {
      setName(collection.name);
      setEmoji(collection.emoji);
      setBgColor(collection.bgColor);
      setShowEmojiPicker(false);
      setShowColorPicker(false);
    }, [collection]);

    const handleSave = () => {
      if (!name.trim()) return;
      onSave({ name: name.trim(), emoji, bgColor });
    };

    return (
      <BottomSheetModal
        ref={ref}
        enableDynamicSizing
        maxDynamicContentSize={height * 0.9}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        onDismiss={handleOnDismiss}
        handleIndicatorStyle={{ backgroundColor: c.handleIndicator, width: 40 }}
        backgroundStyle={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: c.sheetBg }}
        keyboardBehavior="extend"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
      >
        <BottomSheetScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: insetsBottom + 24, gap: 20 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ width: 60 }} />
            <Text style={{ fontFamily: "Rubik_600SemiBold", fontSize: 17, color: c.textPrimary }}>
              {t("collections.editCollection")}
            </Text>
            <Pressable onPress={handleSave} hitSlop={8} style={{ width: 60, alignItems: "flex-end" }}>
              <Text style={{ fontFamily: "Rubik_600SemiBold", fontSize: 16, color: c.text }}>
                {t("common.save")}
              </Text>
            </Pressable>
          </View>

          {/* Preview */}
          <View style={{ alignItems: "center", paddingVertical: 8 }}>
            <View
              style={{
                width: 96,
                height: 96,
                borderRadius: 20,
                backgroundColor: bgColor,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: c.border,
              }}
            >
              <Text style={{ fontSize: 44 }}>{emoji}</Text>
            </View>
          </View>

          {/* Name */}
          <View style={{ gap: 8 }}>
            <Text style={{ fontFamily: "Rubik_500Medium", fontSize: 14, color: c.textSecondary }}>
              {t("collections.name")}
            </Text>
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
            <Text style={{ fontFamily: "Rubik_500Medium", fontSize: 14, color: c.textSecondary }}>
              {t("collections.icon")}
            </Text>
            <Pressable
              onPress={() => {
                setShowEmojiPicker((v) => !v);
                setShowColorPicker(false);
              }}
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
              <Text style={{ fontFamily: "Rubik_400Regular", fontSize: 16, color: c.textSecondary, flex: 1 }}>
                {t("collections.tapToChange")}
              </Text>
              <MingCuteIcon name="right-small-line" size={20} color={c.textTertiary} />
            </Pressable>
            {showEmojiPicker && (
              <EmojiPicker
                selectedEmoji={emoji}
                onSelectEmoji={(e) => {
                  setEmoji(e);
                  setShowEmojiPicker(false);
                }}
              />
            )}
          </View>

          {/* Color */}
          <View style={{ gap: 8 }}>
            <Text style={{ fontFamily: "Rubik_500Medium", fontSize: 14, color: c.textSecondary }}>
              {t("collections.bgColor")}
            </Text>
            <Pressable
              onPress={() => {
                setShowColorPicker((v) => !v);
                setShowEmojiPicker(false);
              }}
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
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  backgroundColor: bgColor,
                  borderWidth: 1,
                  borderColor: c.border,
                }}
              />
              <Text style={{ fontFamily: "Rubik_400Regular", fontSize: 16, color: c.textSecondary, flex: 1 }}>
                {t("collections.tapToChange")}
              </Text>
              <MingCuteIcon name="right-small-line" size={20} color={c.textTertiary} />
            </Pressable>
            {showColorPicker && (
              <ColorPicker
                colors={COLLECTION_COLORS}
                selectedColor={bgColor}
                onSelectColor={(col) => {
                  setBgColor(col);
                  setShowColorPicker(false);
                }}
              />
            )}
          </View>

          {/* Delete */}
          <Pressable
            onPress={onDelete}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              height: 52,
              borderRadius: 14,
              backgroundColor: c.errorBg,
              gap: 8,
              marginTop: 8,
            }}
          >
            <MingCuteIcon name="delete-2-line" size={20} color={c.error} />
            <Text style={{ fontFamily: "Rubik_500Medium", fontSize: 16, color: c.error }}>
              {t("collections.deleteCollection")}
            </Text>
          </Pressable>
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  }
);
EditCollectionSheet.displayName = "EditCollectionSheet";
