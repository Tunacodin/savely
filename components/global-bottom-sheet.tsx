import { View, Text, TextInput, Pressable, Linking, Share, Alert, useWindowDimensions } from "react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetFooter,
} from "@gorhom/bottom-sheet";
import type { BottomSheetFooterProps } from "@gorhom/bottom-sheet";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import { PlatformBadge } from "@/components/ui/platform-badge";
import { MingCuteIcon } from "@/components/ui/mingcute-icon";
import { useThemeColors } from "@/hooks/use-theme";
import type { SavedItem } from "@/types";
import { useSavedItemsStore } from "@/store/saved-items";

// Item detail sheet

let _openItemDetail: ((item: SavedItem) => void) | null = null;

export function openItemDetail(item: SavedItem) {
  _openItemDetail?.(item);
}

// Provider

export function GlobalBottomSheetProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { width } = useWindowDimensions();
  const { t, i18n } = useTranslation();
  const c = useThemeColors();
  const updateItem = useSavedItemsStore((s) => s.updateItem);
  const removeItem = useSavedItemsStore((s) => s.removeItem);
  const itemDetailSheetRef = useRef<BottomSheetModal>(null);
  const [selectedItem, setSelectedItem] = useState<SavedItem | null>(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [expandedDescription, setExpandedDescription] = useState(false);

  useEffect(() => {
    _openItemDetail = (item) => {
      setSelectedItem(item);
      setEditedTitle(item.title);
      setIsEditingTitle(false);
      setExpandedDescription(false);
      itemDetailSheetRef.current?.present();
    };
    return () => {
      _openItemDetail = null;
    };
  }, []);

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

  const imageSource = selectedItem?.imageUrl
    ? typeof selectedItem.imageUrl === "number"
      ? selectedItem.imageUrl
      : { uri: selectedItem.imageUrl as string }
    : null;

  const imageAspectRatio = selectedItem?.aspectRatio ?? 1;
  const imageHeight = width * imageAspectRatio;

  const handleOpenUrl = useCallback(() => {
    if (selectedItem?.url) Linking.openURL(selectedItem.url);
  }, [selectedItem?.url]);

  const handleShare = useCallback(() => {
    if (!selectedItem) return;
    Share.share({ message: selectedItem.url, url: selectedItem.url });
  }, [selectedItem]);

  const handleDelete = useCallback(() => {
    if (!selectedItem) return;
    Alert.alert(t("itemDetail.deleteItem"), t("itemDetail.deleteConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: () => {
          removeItem(selectedItem.id);
          itemDetailSheetRef.current?.dismiss();
        },
      },
    ]);
  }, [selectedItem, removeItem]);

  const handleSaveTitle = useCallback(() => {
    if (selectedItem && editedTitle.trim()) {
      setSelectedItem({ ...selectedItem, title: editedTitle.trim() });
      updateItem(selectedItem.id, { title: editedTitle.trim() });
      setIsEditingTitle(false);
    }
  }, [selectedItem, editedTitle, updateItem]);

  const renderFooter = useCallback(
    (props: BottomSheetFooterProps) => {
      if (!selectedItem) return null;
      return (
        <BottomSheetFooter {...props} bottomInset={0}>
          <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 48, backgroundColor: c.sheetBg, borderTopWidth: 1, borderTopColor: c.divider }}>
            <View style={{ flexDirection: "row", gap: 10 }}>
              {selectedItem.url && (
                <Pressable
                  onPress={handleOpenUrl}
                  style={{
                    flex: 5,
                    height: 50,
                    borderRadius: 14,
                    backgroundColor: c.buttonPrimary,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <MingCuteIcon
                    name={selectedItem.contentType === "video" ? "play-fill" : "external-link-line"}
                    size={18}
                    color={c.buttonPrimaryText}
                  />
                  <Text style={{ fontFamily: "Rubik_500Medium", fontSize: 15, color: c.buttonPrimaryText }}>
                    {selectedItem.contentType === "video" ? t("itemDetail.watch") : t("itemDetail.open")}
                  </Text>
                </Pressable>
              )}

              <Pressable
                onPress={handleShare}
                style={{
                  flex: 3,
                  height: 50,
                  borderRadius: 14,
                  backgroundColor: c.buttonSecondary,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <MingCuteIcon name="share-2-line" size={18} color={c.textPrimary} />
                <Text style={{ fontFamily: "Rubik_500Medium", fontSize: 15, color: c.textPrimary }}>
                  {t("itemDetail.share")}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleDelete}
                style={{
                  flex: 2,
                  height: 50,
                  borderRadius: 14,
                  backgroundColor: c.errorBg,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MingCuteIcon name="delete-2-line" size={20} color={c.error} />
              </Pressable>
            </View>
          </View>
        </BottomSheetFooter>
      );
    },
    [selectedItem, handleOpenUrl, handleShare, handleDelete, c]
  );

  const formattedDate = selectedItem?.createdAt
    ? new Date(selectedItem.createdAt).toLocaleDateString(i18n.language === "tr" ? "tr-TR" : "en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <BottomSheetModalProvider>
      {children}

      {/* Item detail sheet */}
      <BottomSheetModal
        ref={itemDetailSheetRef}
        snapPoints={["60%", "92%"]}
        enableDynamicSizing={false}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{ backgroundColor: c.handleIndicator, width: 40 }}
        backgroundStyle={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: c.sheetBg }}
        footerComponent={renderFooter}
      >
        <BottomSheetScrollView style={{ flex: 1 }}>
            {/* Image */}
            {imageSource && (
              <View
                style={{
                  width,
                  height: Math.min(imageHeight, width * 1.4),
                  backgroundColor: c.surfaceAlt,
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  overflow: "hidden",
                  marginTop: 2,
                }}
              >
                <Image
                  source={imageSource}
                  style={{ flex: 1 }}
                  contentFit="contain"
                />
                {/* Platform badge */}
                <View style={{ position: "absolute", bottom: 12, left: 16 }}>
                  <PlatformBadge platform={selectedItem!.platform} size="md" />
                </View>
              </View>
            )}

            {/* Content */}
            <View style={{ paddingHorizontal: 20, paddingTop: 20, gap: 16, paddingBottom: 110 }}>
              {/* Title - Edit Mode */}
              {isEditingTitle ? (
                <View style={{ gap: 10 }}>
                  <TextInput
                    value={editedTitle}
                    onChangeText={setEditedTitle}
                    style={{
                      fontFamily: "Rubik_500Medium",
                      fontSize: 16,
                      color: c.text,
                      backgroundColor: c.surfaceAlt,
                      borderRadius: 12,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      minHeight: 50,
                    }}
                    placeholder={t("itemDetail.addTitle")}
                    placeholderTextColor={c.textTertiary}
                    multiline
                  />
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <Pressable
                      onPress={handleSaveTitle}
                      style={{
                        flex: 1,
                        height: 44,
                        borderRadius: 12,
                        backgroundColor: c.buttonPrimary,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text style={{ fontFamily: "Rubik_500Medium", fontSize: 14, color: c.buttonPrimaryText }}>
                        {t("common.save")}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        setEditedTitle(selectedItem?.title ?? "");
                        setIsEditingTitle(false);
                      }}
                      style={{
                        flex: 1,
                        height: 44,
                        borderRadius: 12,
                        backgroundColor: c.buttonSecondary,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text style={{ fontFamily: "Rubik_500Medium", fontSize: 14, color: c.textMuted }}>
                        {t("common.cancel")}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <Text
                    style={{
                      flex: 1,
                      fontFamily: "Rubik_600SemiBold",
                      fontSize: 18,
                      color: c.text,
                      lineHeight: 26,
                    }}
                  >
                    {selectedItem?.title.split("#")[0].trim()}
                  </Text>
                  <Pressable onPress={() => setIsEditingTitle(true)} hitSlop={8}>
                    <MingCuteIcon name="edit-2-line" size={20} color={c.textSecondary} />
                  </Pressable>
                </View>
              )}

              {/* Meta row */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                {!imageSource && selectedItem && (
                  <PlatformBadge platform={selectedItem.platform} size="md" />
                )}
                {formattedDate && (
                  <Text
                    style={{
                      fontFamily: "Rubik_400Regular",
                      fontSize: 13,
                      color: c.textTertiary,
                    }}
                  >
                    {formattedDate}
                  </Text>
                )}
              </View>
            </View>
          </BottomSheetScrollView>
      </BottomSheetModal>
    </BottomSheetModalProvider>
  );
}
