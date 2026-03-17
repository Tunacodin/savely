import { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { useShareIntentContext } from "expo-share-intent";
import * as Clipboard from "expo-clipboard";
import { MingCuteIcon } from "@/components/ui/mingcute-icon";
import { PlatformBadge } from "@/components/ui/platform-badge";
import { useSavedItemsStore } from "@/store/saved-items";
import {
  detectPlatform,
  inferContentType,
  extractUrlFromText,
} from "@/utils/platform-detector";
import { extractMetadata } from "@/services/metadata";
import type { PlatformName } from "@/components/ui/platform-badge";
import type { ContentType, SavedItemMetadata } from "@/types";

export default function SaveScreen() {
  const router = useRouter();
  const { url: routeUrl } = useLocalSearchParams<{ url?: string }>();
  const { shareIntent, resetShareIntent } = useShareIntentContext();

  const addItem = useSavedItemsStore((s) => s.addItem);
  const enrichItem = useSavedItemsStore((s) => s.enrichItem);
  const addCollection = useSavedItemsStore((s) => s.addCollection);
  const collections = useSavedItemsStore((s) => s.collections);

  // Field states
  const [inputText, setInputText] = useState("");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [selectedCollectionId, setSelectedCollectionId] = useState<
    string | undefined
  >();
  const [collectionSearch, setCollectionSearch] = useState("");

  // Metadata states
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [metadataTitle, setMetadataTitle] = useState("");
  const [metadataDescription, setMetadataDescription] = useState("");
  const [metadataImageUrl, setMetadataImageUrl] = useState<
    string | undefined
  >();
  const [metadata, setMetadata] = useState<SavedItemMetadata>({});
  const [platform, setPlatform] = useState<PlatformName>("link");
  const [contentType, setContentType] = useState<ContentType>("link");
  const [contentId, setContentId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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
          if (!title) {
            setTitle(result.title ?? fallbackTitle ?? "");
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

  // Handle route param / share intent on mount
  useEffect(() => {
    if (routeUrl) {
      processUrl(routeUrl);
      return;
    }

    const sharedUrl =
      shareIntent.webUrl ?? extractUrlFromText(shareIntent.text ?? "");
    if (sharedUrl) {
      processUrl(sharedUrl, shareIntent.meta?.title);
    }
  }, [routeUrl, shareIntent, processUrl]);

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
  }, []);

  const handlePaste = useCallback(async () => {
    const text = await Clipboard.getStringAsync();
    if (text) {
      setInputText(text);
      const extracted = extractUrlFromText(text.trim());
      if (extracted) {
        processUrl(extracted);
      }
    }
  }, [processUrl]);

  const handleSave = useCallback(() => {
    if (!url) return;
    setIsSaving(true);

    const id = addItem({
      url,
      title: title || metadataTitle || url,
      description: metadataDescription || metadata.ogDescription,
      imageUrl: metadataImageUrl,
      platform,
      contentType,
      metadata,
      collectionId: selectedCollectionId,
      isEnriched: !!metadata.ogTitle,
      aspectRatio: 1.0,
    });

    // Background enrichment if not yet enriched
    if (!metadata.ogTitle) {
      extractMetadata(url, platform, contentId)
        .then((result) => {
          enrichItem(id, result.metadata, result.title, result.imageUrl);
        })
        .catch(() => {});
    }

    resetShareIntent();
    router.back();
  }, [
    url,
    title,
    metadataTitle,
    metadataDescription,
    metadata,
    metadataImageUrl,
    platform,
    contentType,
    contentId,
    selectedCollectionId,
    addItem,
    enrichItem,
    resetShareIntent,
    router,
  ]);

  const handleClose = useCallback(() => {
    resetShareIntent();
    router.back();
  }, [resetShareIntent, router]);

  // Collection filtering
  const filteredCollections = useMemo(() => {
    if (!collectionSearch.trim()) return collections;
    const query = collectionSearch.toLowerCase();
    return collections.filter((c) => c.name.toLowerCase().includes(query));
  }, [collections, collectionSearch]);

  const showCreateCollection = useMemo(() => {
    if (!collectionSearch.trim()) return false;
    const query = collectionSearch.toLowerCase();
    return !collections.some((c) => c.name.toLowerCase() === query);
  }, [collections, collectionSearch]);

  const handleCreateCollection = useCallback(() => {
    const name = collectionSearch.trim();
    if (!name) return;
    const id = addCollection({
      name,
      emoji: "\uD83D\uDCC1",
      bgColor: "#F4F4F5",
      itemCount: 0,
    });
    setSelectedCollectionId(id);
    setCollectionSearch("");
  }, [collectionSearch, addCollection]);

  const isFormValid = !!url;

  return (
    <Pressable className="flex-1 justify-end" onPress={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="justify-end"
      >
        <Pressable onPress={() => {}}>
          <View className="bg-white rounded-t-3xl max-h-[90%] pb-8">
            {/* Handle indicator */}
            <View className="items-center pt-3 pb-1">
              <View className="w-9 h-1 rounded-full bg-zinc-300" />
            </View>

            {/* Header */}
            <View className="flex-row items-center justify-between px-5 py-3">
              <Text className="font-sans-semibold text-lg text-zinc-900">
                Yeni i{"\u00E7"}erik
              </Text>
              <Pressable
                onPress={handleClose}
                className="w-8 h-8 items-center justify-center rounded-full bg-zinc-100"
              >
                <MingCuteIcon name="close-line" size={18} color="#71717A" />
              </Pressable>
            </View>

            <ScrollView
              className="px-5"
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Link Section */}
              <Text className="font-sans-medium text-sm text-zinc-500 mb-2 mt-2">
                Link
              </Text>
              {!url ? (
                <View className="flex-row items-center bg-zinc-100 rounded-2xl px-4 py-3">
                  <TextInput
                    value={inputText}
                    onChangeText={setInputText}
                    onSubmitEditing={handleInputSubmit}
                    placeholder="https://..."
                    placeholderTextColor="#A1A1AA"
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                    returnKeyType="go"
                    className="flex-1 font-sans text-base text-zinc-800"
                  />
                  <Pressable onPress={handlePaste} className="ml-2 p-1">
                    <MingCuteIcon
                      name="clipboard-line"
                      size={20}
                      color="#A1A1AA"
                    />
                  </Pressable>
                </View>
              ) : (
                <View>
                  {/* URL chip */}
                  <View className="flex-row items-center bg-zinc-100 rounded-xl px-3 py-2.5 mb-3">
                    <MingCuteIcon
                      name="link-2-line"
                      size={16}
                      color="#71717A"
                    />
                    <Text
                      className="flex-1 font-sans text-sm text-zinc-600 ml-2"
                      numberOfLines={1}
                    >
                      {url}
                    </Text>
                    <Pressable onPress={handleClearUrl} className="ml-2 p-0.5">
                      <MingCuteIcon
                        name="close-line"
                        size={16}
                        color="#A1A1AA"
                      />
                    </Pressable>
                  </View>

                  {/* Inline metadata preview */}
                  {isLoadingMetadata ? (
                    <View className="flex-row items-center bg-zinc-50 rounded-2xl p-3">
                      <View className="w-16 h-16 rounded-xl bg-zinc-200 items-center justify-center">
                        <ActivityIndicator size="small" color="#A1A1AA" />
                      </View>
                      <View className="flex-1 ml-3">
                        <View className="w-3/4 h-3 rounded bg-zinc-200 mb-2" />
                        <View className="w-1/2 h-3 rounded bg-zinc-200" />
                      </View>
                    </View>
                  ) : (
                    (metadataTitle || metadataImageUrl) && (
                      <View className="flex-row items-center bg-zinc-50 rounded-2xl p-3">
                        {metadataImageUrl ? (
                          <Image
                            source={{ uri: metadataImageUrl }}
                            className="w-16 h-16 rounded-xl"
                            contentFit="cover"
                          />
                        ) : (
                          <View className="w-16 h-16 rounded-xl bg-zinc-200 items-center justify-center">
                            <MingCuteIcon
                              name="link-2-line"
                              size={20}
                              color="#A3A3A3"
                            />
                          </View>
                        )}
                        <View className="flex-1 ml-3">
                          {metadataTitle ? (
                            <Text
                              className="font-sans-medium text-sm text-zinc-800"
                              numberOfLines={2}
                            >
                              {metadataTitle}
                            </Text>
                          ) : null}
                          {metadataDescription ? (
                            <Text
                              className="font-sans text-xs text-zinc-400 mt-0.5"
                              numberOfLines={1}
                            >
                              {metadataDescription}
                            </Text>
                          ) : null}
                          <View className="mt-1">
                            <PlatformBadge platform={platform} size="sm" />
                          </View>
                        </View>
                      </View>
                    )
                  )}
                </View>
              )}

              {/* Title Section */}
              <Text className="font-sans-medium text-sm text-zinc-500 mb-2 mt-5">
                Ba{"\u015F"}l{"\u0131"}k
              </Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Bir ba\u015Fl\u0131k ekle (iste\u011Fe ba\u011Fl\u0131)"
                placeholderTextColor="#A1A1AA"
                className="font-sans text-base text-zinc-800 bg-zinc-100 rounded-2xl px-4 py-3"
              />

              {/* Collection Section */}
              <Text className="font-sans-medium text-sm text-zinc-500 mb-2 mt-5">
                Koleksiyon
              </Text>
              <View className="flex-row items-center bg-zinc-100 rounded-2xl px-4 py-3 mb-3">
                <MingCuteIcon name="search-line" size={18} color="#A1A1AA" />
                <TextInput
                  value={collectionSearch}
                  onChangeText={setCollectionSearch}
                  placeholder="Koleksiyon ara veya olu\u015Ftur"
                  placeholderTextColor="#A1A1AA"
                  className="flex-1 font-sans text-base text-zinc-800 ml-2"
                />
              </View>

              {/* Collection chips */}
              <View className="flex-row flex-wrap gap-2 mb-6">
                {/* None option */}
                <Pressable
                  onPress={() => setSelectedCollectionId(undefined)}
                  className={`px-3.5 py-2 rounded-xl ${
                    !selectedCollectionId ? "bg-primary-500" : "bg-zinc-100"
                  }`}
                >
                  <Text
                    className={`font-sans-medium text-sm ${
                      !selectedCollectionId ? "text-white" : "text-zinc-600"
                    }`}
                  >
                    Yok
                  </Text>
                </Pressable>

                {filteredCollections.map((c) => (
                  <Pressable
                    key={c.id}
                    onPress={() => setSelectedCollectionId(c.id)}
                    className={`flex-row items-center px-3.5 py-2 rounded-xl gap-1.5 ${
                      selectedCollectionId === c.id
                        ? "bg-primary-500"
                        : "bg-zinc-100"
                    }`}
                  >
                    <Text className="text-sm">{c.emoji}</Text>
                    <Text
                      className={`font-sans-medium text-sm ${
                        selectedCollectionId === c.id
                          ? "text-white"
                          : "text-zinc-600"
                      }`}
                    >
                      {c.name}
                    </Text>
                  </Pressable>
                ))}

                {/* Create new collection chip */}
                {showCreateCollection && (
                  <Pressable
                    onPress={handleCreateCollection}
                    className="flex-row items-center px-3.5 py-2 rounded-xl bg-primary-50 gap-1.5"
                  >
                    <MingCuteIcon name="add-line" size={16} color="#6366F1" />
                    <Text className="font-sans-medium text-sm text-primary-500">
                      {collectionSearch.trim()}
                    </Text>
                  </Pressable>
                )}
              </View>
            </ScrollView>

            {/* Footer: Save button */}
            <View className="px-5 pt-2">
              <Pressable
                onPress={handleSave}
                disabled={!isFormValid || isSaving}
                className={`rounded-2xl py-4 items-center ${
                  isFormValid ? "bg-primary-500" : "bg-zinc-200"
                }`}
              >
                {isSaving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text
                    className={`font-sans-semibold text-base ${
                      isFormValid ? "text-white" : "text-zinc-400"
                    }`}
                  >
                    Olu{"\u015F"}tur
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </Pressable>
      </KeyboardAvoidingView>
    </Pressable>
  );
}
