import { useCallback, useMemo, useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  TextInput,
  Image as RNImage,
} from "react-native";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Image } from "expo-image";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { MingCuteIcon } from "@/components/ui/mingcute-icon";
import { PlatformBadge } from "@/components/ui/platform-badge";
import { useSavedItemsStore } from "@/store/saved-items";
import { useThemeColors } from "@/hooks/use-theme";
import {
  detectPlatform,
  inferContentType,
  extractUrlFromText,
} from "@/utils/platform-detector";
import { extractMetadata } from "@/services/metadata";
import { isExpiringUrl, persistImage } from "@/lib/storage";
import type { PlatformName } from "@/components/ui/platform-badge";
import type { ContentType, SavedItemMetadata } from "@/types";

interface SaveItemFormProps {
  initialUrl?: string;
  initialTitle?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function SaveItemForm({
  initialUrl,
  initialTitle,
  onClose,
  onSuccess,
}: SaveItemFormProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const c = useThemeColors();
  const addItem = useSavedItemsStore((s) => s.addItem);
  const updateItem = useSavedItemsStore((s) => s.updateItem);
  const enrichItem = useSavedItemsStore((s) => s.enrichItem);
  const collections = useSavedItemsStore((s) => s.collections);

  const [inputText, setInputText] = useState(initialUrl ?? "");
  const [url, setUrl] = useState(initialUrl ?? "");
  const [title, setTitle] = useState(initialTitle ?? "");
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | undefined>();
  const [collectionSearch, setCollectionSearch] = useState("");

  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [metadataTitle, setMetadataTitle] = useState("");
  const [metadataDescription, setMetadataDescription] = useState("");
  const [metadataImageUrl, setMetadataImageUrl] = useState<string | undefined>();
  const [metadata, setMetadata] = useState<SavedItemMetadata>({});
  const [platform, setPlatform] = useState<PlatformName>("link");
  const [contentType, setContentType] = useState<ContentType>("link");
  const [contentId, setContentId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [imageAspectRatio, setImageAspectRatio] = useState(1.0);

  const prevCollectionCount = useRef(collections.length);
  useEffect(() => {
    if (collections.length > prevCollectionCount.current) {
      const newest = collections[collections.length - 1];
      setSelectedCollectionId(newest.id);
    }
    prevCollectionCount.current = collections.length;
  }, [collections]);

  const processUrl = useCallback(
    (targetUrl: string, fallbackTitle?: string) => {
      setUrl(targetUrl);
      setInputText(targetUrl);
      setIsLoadingMetadata(true);

      const detected = detectPlatform(targetUrl);
      setPlatform(detected.platform);
      setContentId(detected.contentId);
      setContentType(inferContentType(detected.platform, targetUrl));

      extractMetadata(targetUrl, detected.platform, detected.contentId)
        .then((result) => {
          setMetadata(result.metadata);
          setMetadataTitle(result.title ?? fallbackTitle ?? "");
          setMetadataDescription(result.metadata.ogDescription ?? "");
          setMetadataImageUrl(result.imageUrl);
          if (!title) setTitle(result.title ?? fallbackTitle ?? "");
          if (result.imageUrl) {
            RNImage.getSize(
              result.imageUrl,
              (w, h) => setImageAspectRatio(h > 0 && w > 0 ? h / w : 1.0),
              () => setImageAspectRatio(1.0)
            );
          }
          setIsLoadingMetadata(false);
        })
        .catch(() => {
          setMetadataTitle(fallbackTitle ?? "");
          setIsLoadingMetadata(false);
        });
    },
    [title]
  );

  const handleInputSubmit = useCallback(() => {
    const extracted = extractUrlFromText(inputText.trim());
    if (!extracted) return;
    processUrl(extracted);
  }, [inputText, processUrl]);

  const handleClearUrl = useCallback(() => {
    setUrl("");
    setInputText("");
    setMetadataTitle("");
    setMetadataDescription("");
    setMetadataImageUrl(undefined);
    setMetadata({});
    setPlatform("link");
    setContentType("link");
    setContentId(null);
    setImageAspectRatio(1.0);
  }, []);

  const handlePaste = useCallback(async () => {
    const text = await Clipboard.getStringAsync();
    if (text) {
      setInputText(text);
      const extracted = extractUrlFromText(text.trim());
      if (extracted) processUrl(extracted);
    }
  }, [processUrl]);

  const handleSave = useCallback(async () => {
    if (!url) return;
    setIsSaving(true);

    const id = await addItem({
      url,
      title: title || metadataTitle || url,
      description: metadataDescription || metadata.ogDescription,
      imageUrl: metadataImageUrl,
      platform,
      contentType,
      metadata,
      collectionId: selectedCollectionId,
      isEnriched: !!metadata.ogTitle,
      aspectRatio: imageAspectRatio,
    });

    if (metadataImageUrl && isExpiringUrl(metadataImageUrl)) {
      persistImage(metadataImageUrl, id).then((permanentUrl) => {
        if (permanentUrl !== metadataImageUrl) {
          updateItem(id, { imageUrl: permanentUrl });
        }
      });
    }

    if (!metadata.ogTitle) {
      extractMetadata(url, platform, contentId)
        .then(async (result) => {
          let finalImageUrl = result.imageUrl;
          if (finalImageUrl && isExpiringUrl(finalImageUrl)) {
            finalImageUrl = await persistImage(finalImageUrl, id);
          }
          enrichItem(id, result.metadata, result.title, finalImageUrl);
        })
        .catch(() => {});
    }

    setIsSaving(false);
    onSuccess?.();
  }, [url, title, metadataTitle, metadataDescription, metadata, metadataImageUrl, imageAspectRatio, platform, contentType, contentId, selectedCollectionId, addItem, enrichItem, updateItem, onSuccess]);

  const filteredCollections = useMemo(() => {
    if (!collectionSearch.trim()) return collections;
    const query = collectionSearch.toLowerCase();
    return collections.filter((col) => col.name.toLowerCase().includes(query));
  }, [collections, collectionSearch]);

  const isFormValid = !!url;

  return (
    <View style={{ flex: 1, backgroundColor: c.sheetBg, paddingBottom: 32, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: "hidden" }}>
      {/* Handle */}
      <View style={{ alignItems: "center", paddingTop: 12, paddingBottom: 4 }}>
        <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: c.handleIndicator }} />
      </View>

      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14 }}>
        <Text style={{ fontFamily: "Rubik_600SemiBold", fontSize: 22, color: c.textPrimary }}>
          {t("saveForm.title")}
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
        {/* Link */}
        <Text style={{ fontFamily: "Rubik_500Medium", fontSize: 16, color: c.textPrimary, marginBottom: 12 }}>
          {t("saveForm.link")}
        </Text>

        {!url ? (
          <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: c.surfaceAlt, borderRadius: 14, paddingHorizontal: 16, height: 56, marginBottom: 20 }}>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleInputSubmit}
              placeholder={t("saveForm.linkPlaceholder")}
              placeholderTextColor={c.textTertiary}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              returnKeyType="go"
              style={{ flex: 1, fontFamily: "Rubik_400Regular", fontSize: 16, color: c.textPrimary }}
            />
            <Pressable onPress={handlePaste} style={{ paddingLeft: 8 }}>
              <MingCuteIcon name="clipboard-line" size={20} color={c.textTertiary} />
            </Pressable>
          </View>
        ) : (
          <View style={{ marginBottom: 20 }}>
            {/* URL chip */}
            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: c.surfaceAlt, borderRadius: 14, paddingHorizontal: 16, height: 56, marginBottom: 12 }}>
              <MingCuteIcon name="link-2-line" size={18} color={c.textSecondary} />
              <Text style={{ flex: 1, fontFamily: "Rubik_400Regular", fontSize: 14, color: c.textMuted, marginLeft: 10 }} numberOfLines={1}>
                {url}
              </Text>
              <Pressable onPress={handleClearUrl} style={{ paddingLeft: 8 }}>
                <MingCuteIcon name="close-line" size={18} color={c.textTertiary} />
              </Pressable>
            </View>

            {/* Metadata preview */}
            {isLoadingMetadata ? (
              <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: c.surfaceAlt, borderRadius: 14, padding: 12 }}>
                <View style={{ width: 56, height: 56, borderRadius: 10, backgroundColor: c.skeleton, alignItems: "center", justifyContent: "center" }}>
                  <ActivityIndicator size="small" color={c.textTertiary} />
                </View>
                <View style={{ flex: 1, marginLeft: 12, gap: 8 }}>
                  <View style={{ height: 12, borderRadius: 6, backgroundColor: c.skeleton, width: "75%" }} />
                  <View style={{ height: 12, borderRadius: 6, backgroundColor: c.skeleton, width: "50%" }} />
                </View>
              </View>
            ) : (metadataTitle || metadataImageUrl) ? (
              <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: c.surfaceAlt, borderRadius: 14, padding: 12 }}>
                {metadataImageUrl ? (
                  <Image source={{ uri: metadataImageUrl }} style={{ width: 56, height: 56, borderRadius: 10 }} contentFit="cover" />
                ) : (
                  <View style={{ width: 56, height: 56, borderRadius: 10, backgroundColor: c.skeleton, alignItems: "center", justifyContent: "center" }}>
                    <MingCuteIcon name="link-2-line" size={20} color={c.textTertiary} />
                  </View>
                )}
                <View style={{ flex: 1, marginLeft: 12 }}>
                  {metadataTitle ? (
                    <Text style={{ fontFamily: "Rubik_500Medium", fontSize: 14, color: c.textPrimary }} numberOfLines={2}>
                      {metadataTitle}
                    </Text>
                  ) : null}
                  {metadataDescription ? (
                    <Text style={{ fontFamily: "Rubik_400Regular", fontSize: 12, color: c.textTertiary, marginTop: 4 }} numberOfLines={1}>
                      {metadataDescription}
                    </Text>
                  ) : null}
                  <View style={{ marginTop: 6 }}>
                    <PlatformBadge platform={platform} size="sm" />
                  </View>
                </View>
              </View>
            ) : null}
          </View>
        )}

        {/* Title */}
        <Text style={{ fontFamily: "Rubik_500Medium", fontSize: 16, color: c.textPrimary, marginBottom: 12 }}>
          {t("saveForm.itemTitle")}
        </Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder={t("saveForm.titlePlaceholder")}
          placeholderTextColor={c.textTertiary}
          style={{ fontFamily: "Rubik_400Regular", fontSize: 16, color: c.textPrimary, backgroundColor: c.surfaceAlt, borderRadius: 14, paddingHorizontal: 16, height: 56, marginBottom: 20 }}
        />

        {/* Collection */}
        <Text style={{ fontFamily: "Rubik_500Medium", fontSize: 16, color: c.textPrimary, marginBottom: 12 }}>
          {t("saveForm.collection")}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: c.surfaceAlt, borderRadius: 14, paddingHorizontal: 16, height: 56, marginBottom: 12 }}>
          <MingCuteIcon name="search-line" size={18} color={c.textTertiary} />
          <TextInput
            value={collectionSearch}
            onChangeText={setCollectionSearch}
            placeholder={t("collections.searchPlaceholder")}
            placeholderTextColor={c.textTertiary}
            style={{ flex: 1, fontFamily: "Rubik_400Regular", fontSize: 16, color: c.textPrimary, marginLeft: 10 }}
          />
        </View>

        {/* Collection chips */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
          <Pressable
            onPress={() => setSelectedCollectionId(undefined)}
            style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: !selectedCollectionId ? c.buttonPrimary : c.surfaceAlt }}
          >
            <Text style={{ fontFamily: "Rubik_500Medium", fontSize: 14, color: !selectedCollectionId ? c.buttonPrimaryText : c.textMuted }}>
              {t("common.none")}
            </Text>
          </Pressable>

          {filteredCollections.map((col) => (
            <Pressable
              key={col.id}
              onPress={() => setSelectedCollectionId(col.id)}
              style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: selectedCollectionId === col.id ? c.buttonPrimary : c.surfaceAlt, gap: 6 }}
            >
              <Text style={{ fontSize: 14 }}>{col.emoji}</Text>
              <Text style={{ fontFamily: "Rubik_500Medium", fontSize: 14, color: selectedCollectionId === col.id ? c.buttonPrimaryText : c.textMuted }}>
                {col.name}
              </Text>
            </Pressable>
          ))}

          <Pressable
            onPress={() => router.push("/new-collection" as any)}
            style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: c.surfaceAlt, gap: 6 }}
          >
            <MingCuteIcon name="add-line" size={16} color={c.textSecondary} />
            <Text style={{ fontFamily: "Rubik_500Medium", fontSize: 14, color: c.textMuted }}>
              {t("collections.newCollection")}
            </Text>
          </Pressable>
        </View>
      </BottomSheetScrollView>

      {/* Footer */}
      <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
        <Pressable
          onPress={handleSave}
          disabled={!isFormValid || isSaving}
          style={{ height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: isFormValid ? c.buttonPrimary : c.skeleton }}
        >
          {isSaving ? (
            <ActivityIndicator color={c.buttonPrimaryText} />
          ) : (
            <Text style={{ fontFamily: "Rubik_400Regular", fontSize: 16, color: isFormValid ? c.buttonPrimaryText : c.textTertiary }}>
              {t("common.save")}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
