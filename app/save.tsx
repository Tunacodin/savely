import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  ScrollView,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { useShareIntentContext } from "expo-share-intent";
import { MingCuteIcon } from "@/components/ui/mingcute-icon";
import { PlatformBadge } from "@/components/ui/platform-badge";
import { useSavedItemsStore } from "@/store/saved-items";
import { detectPlatform, inferContentType, extractUrlFromText } from "@/utils/platform-detector";
import { extractMetadata } from "@/services/metadata";
import type { PlatformName } from "@/components/ui/platform-badge";
import type { ContentType, SavedItemMetadata } from "@/types";

type SaveState = "input" | "loading" | "preview" | "saving" | "saved" | "error";

export default function SaveScreen() {
  const router = useRouter();
  const { url: routeUrl } = useLocalSearchParams<{ url?: string }>();
  const { shareIntent, resetShareIntent } = useShareIntentContext();

  const addItem = useSavedItemsStore((s) => s.addItem);
  const enrichItem = useSavedItemsStore((s) => s.enrichItem);
  const collections = useSavedItemsStore((s) => s.collections);

  const [state, setState] = useState<SaveState>("loading");
  const [url, setUrl] = useState<string>("");
  const [inputUrl, setInputUrl] = useState<string>("");
  const [platform, setPlatform] = useState<PlatformName>("link");
  const [contentType, setContentType] = useState<ContentType>("link");
  const [contentId, setContentId] = useState<string | null>(null);
  const [title, setTitle] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [metadata, setMetadata] = useState<SavedItemMetadata>({});
  const [selectedCollection, setSelectedCollection] = useState<string | undefined>();
  const [errorMessage, setErrorMessage] = useState<string>("");

  const processUrl = useCallback((targetUrl: string, fallbackTitle?: string) => {
    setUrl(targetUrl);
    setState("loading");

    const detected = detectPlatform(targetUrl);
    setPlatform(detected.platform);
    setContentId(detected.contentId);
    setContentType(inferContentType(detected.platform, targetUrl));

    extractMetadata(targetUrl, detected.platform, detected.contentId)
      .then((result) => {
        setMetadata(result.metadata);
        setTitle(result.title ?? fallbackTitle ?? targetUrl);
        setImageUrl(result.imageUrl);
        setState("preview");
      })
      .catch(() => {
        setTitle(fallbackTitle ?? targetUrl);
        setState("preview");
      });
  }, []);

  // Determine initial state: route param > share intent > input
  useEffect(() => {
    if (routeUrl) {
      processUrl(routeUrl);
      return;
    }

    const sharedUrl = shareIntent.webUrl ?? extractUrlFromText(shareIntent.text ?? "");
    if (sharedUrl) {
      processUrl(sharedUrl, shareIntent.meta?.title);
      return;
    }

    setState("input");
  }, [routeUrl, shareIntent, processUrl]);

  const handleSave = useCallback(() => {
    setState("saving");

    const id = addItem({
      url,
      title: title || url,
      description: metadata.ogDescription,
      imageUrl,
      platform,
      contentType,
      metadata,
      collectionId: selectedCollection,
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

    setState("saved");

    // Auto-close after 800ms
    setTimeout(() => {
      resetShareIntent();
      router.back();
    }, 800);
  }, [
    url,
    title,
    metadata,
    imageUrl,
    platform,
    contentType,
    contentId,
    selectedCollection,
    addItem,
    enrichItem,
    resetShareIntent,
    router,
  ]);

  const handleClose = useCallback(() => {
    resetShareIntent();
    router.back();
  }, [resetShareIntent, router]);

  const handleInputSubmit = useCallback(() => {
    const extracted = extractUrlFromText(inputUrl.trim());
    if (!extracted) {
      setState("error");
      setErrorMessage("Gecerli bir URL girin");
      return;
    }
    processUrl(extracted);
  }, [inputUrl, processUrl]);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-5 h-16 border-b-[1.5px] border-zinc-100">
        <Pressable onPress={handleClose} className="mr-1.5">
          <MingCuteIcon name="close-line" size={24} color="#52525B" />
        </Pressable>
        <Text className="font-sans-medium text-xl text-zinc-800">
          Kaydet
        </Text>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="px-4 pt-6 pb-20">
        {/* Input State */}
        {state === "input" && (
          <View className="py-8">
            <Text className="font-sans-semibold text-lg text-zinc-800 mb-2">
              URL Yapistir
            </Text>
            <Text className="font-sans text-sm text-zinc-400 mb-6">
              Kaydetmek istedigin linki yapistir
            </Text>
            <TextInput
              value={inputUrl}
              onChangeText={setInputUrl}
              placeholder="https://..."
              placeholderTextColor="#A1A1AA"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              className="font-sans text-base text-zinc-800 bg-zinc-100 rounded-2xl px-4 py-4"
            />
            <Pressable
              onPress={handleInputSubmit}
              disabled={!inputUrl.trim()}
              className={`mt-4 rounded-2xl py-4 items-center ${
                inputUrl.trim() ? "bg-primary-500" : "bg-zinc-200"
              }`}
            >
              <Text
                className={`font-sans-semibold text-base ${
                  inputUrl.trim() ? "text-white" : "text-zinc-400"
                }`}
              >
                Devam Et
              </Text>
            </Pressable>
          </View>
        )}

        {/* Loading State */}
        {state === "loading" && (
          <View className="items-center justify-center py-16">
            <ActivityIndicator size="large" color="#6366F1" />
            <Text className="font-sans text-sm text-zinc-400 mt-4">
              Bilgiler aliniyor...
            </Text>
          </View>
        )}

        {/* Error State */}
        {state === "error" && (
          <View className="items-center justify-center py-16">
            <MingCuteIcon name="warning-line" size={48} color="#EF4444" />
            <Text className="font-sans-medium text-base text-zinc-800 mt-4">
              Bir hata olustu
            </Text>
            <Text className="font-sans text-sm text-zinc-400 mt-1">
              {errorMessage}
            </Text>
            <Pressable
              onPress={handleClose}
              className="mt-6 bg-zinc-100 rounded-2xl px-6 py-3"
            >
              <Text className="font-sans-medium text-sm text-zinc-600">
                Kapat
              </Text>
            </Pressable>
          </View>
        )}

        {/* Preview State */}
        {(state === "preview" || state === "saving") && (
          <View>
            {/* Thumbnail */}
            {imageUrl ? (
              <View className="relative rounded-2xl overflow-hidden">
                <Image
                  source={{ uri: imageUrl }}
                  style={{ width: "100%", aspectRatio: 16 / 9 }}
                  contentFit="cover"
                />
                <View className="absolute bottom-3 left-3">
                  <PlatformBadge platform={platform} size="md" />
                </View>
              </View>
            ) : (
              <View className="w-full rounded-2xl bg-zinc-100 items-center justify-center" style={{ aspectRatio: 16 / 9 }}>
                <MingCuteIcon name="link-2-line" size={32} color="#A3A3A3" />
                <View className="absolute bottom-3 left-3">
                  <PlatformBadge platform={platform} size="md" />
                </View>
              </View>
            )}

            {/* Title */}
            <Text
              className="font-sans-semibold text-lg text-zinc-800 mt-4"
              numberOfLines={3}
            >
              {title}
            </Text>

            {/* URL */}
            <Text
              className="font-sans text-sm text-zinc-400 mt-1"
              numberOfLines={1}
            >
              {url}
            </Text>

            {/* Collection Selector */}
            <Text className="font-sans-medium text-sm text-zinc-600 mt-6 mb-3">
              Koleksiyon
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-2"
            >
              <Pressable
                onPress={() => setSelectedCollection(undefined)}
                className={`px-4 py-2.5 rounded-xl ${
                  !selectedCollection ? "bg-primary-500" : "bg-zinc-100"
                }`}
              >
                <Text
                  className={`font-sans-medium text-sm ${
                    !selectedCollection ? "text-white" : "text-zinc-600"
                  }`}
                >
                  Yok
                </Text>
              </Pressable>
              {collections.map((c) => (
                <Pressable
                  key={c.id}
                  onPress={() => setSelectedCollection(c.id)}
                  className={`flex-row items-center px-4 py-2.5 rounded-xl gap-2 ${
                    selectedCollection === c.id ? "bg-primary-500" : "bg-zinc-100"
                  }`}
                >
                  <Text className="text-base">{c.emoji}</Text>
                  <Text
                    className={`font-sans-medium text-sm ${
                      selectedCollection === c.id ? "text-white" : "text-zinc-600"
                    }`}
                  >
                    {c.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Saved State */}
        {state === "saved" && (
          <View className="items-center justify-center py-16">
            <View className="w-16 h-16 rounded-full bg-green-100 items-center justify-center">
              <MingCuteIcon name="check-line" size={32} color="#10B981" />
            </View>
            <Text className="font-sans-semibold text-lg text-zinc-800 mt-4">
              Kaydedildi!
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Save Button (visible in preview state) */}
      {(state === "preview" || state === "saving") && (
        <View className="px-4 pb-8">
          <Pressable
            onPress={handleSave}
            disabled={state === "saving"}
            className={`rounded-2xl py-4 items-center ${
              state === "saving" ? "bg-primary-300" : "bg-primary-500"
            }`}
          >
            {state === "saving" ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="font-sans-semibold text-base text-white">
                Kaydet
              </Text>
            )}
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}
