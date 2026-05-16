import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useShareIntentContext } from "expo-share-intent";
import BottomSheet from "@gorhom/bottom-sheet";
import { SaveItemForm, type SaveItemFormHandle } from "@/components/forms/SaveItemForm";
import { extractUrlFromText } from "@/utils/platform-detector";
import { useThemeColors } from "@/hooks/use-theme";
import { consumeShortcutId, shortcutIdToCollectionId } from "../modules/sharing-shortcuts";

export default function SaveScreen() {
  const router = useRouter();
  const { url: routeUrl } = useLocalSearchParams<{ url?: string }>();
  const { shareIntent, resetShareIntent } = useShareIntentContext();

  const [sheetVisible, setSheetVisible] = useState(true);
  const [backdropVisible, setBackdropVisible] = useState(true);
  const [initialCollectionId, setInitialCollectionId] = useState<string | undefined>();
  const formRef = useRef<SaveItemFormHandle>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const navigatingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    consumeShortcutId().then((shortcutId) => {
      if (cancelled) return;
      const cid = shortcutIdToCollectionId(shortcutId);
      if (cid) setInitialCollectionId(cid);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const c = useThemeColors();
  const { height: windowHeight } = useWindowDimensions();

  const snapPoints = useMemo(() => [windowHeight * 0.9], [windowHeight]);

  const getInitialUrl = () => {
    if (routeUrl) return routeUrl;
    return shareIntent.webUrl ?? extractUrlFromText(shareIntent.text ?? "") ?? undefined;
  };

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  }, [router]);

  const dismissNow = useCallback(() => {
    if (navigatingRef.current) return;
    navigatingRef.current = true;
    setBackdropVisible(false);
    setSheetVisible(false);
    resetShareIntent();
    goBack();
  }, [resetShareIntent, goBack]);

  const requestClose = useCallback(() => {
    if (navigatingRef.current) return;
    setBackdropVisible(false);
    bottomSheetRef.current?.forceClose();
    setTimeout(() => {
      if (!navigatingRef.current) dismissNow();
    }, 350);
  }, [dismissNow]);

  const handleSaveSuccess = useCallback(() => {
    requestClose();
  }, [requestClose]);

  return (
    <SafeAreaView className="flex-1" edges={[]}>
      <Pressable
        className="flex-1"
        onPress={requestClose}
        style={{ backgroundColor: backdropVisible ? "rgba(0, 0, 0, 0.3)" : "transparent" }}
      />

      {sheetVisible && (
        <BottomSheet
          ref={bottomSheetRef}
          snapPoints={snapPoints}
          index={0}
          enablePanDownToClose
          enableDynamicSizing={false}
          topInset={windowHeight * 0.05}
          handleComponent={null}
          keyboardBehavior="interactive"
          keyboardBlurBehavior="restore"
          android_keyboardInputMode="adjustResize"
          backgroundStyle={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: c.sheetBg }}
          onChange={(index) => {
            if (index === -1) dismissNow();
          }}
        >
          <SaveItemForm
            ref={formRef}
            initialUrl={getInitialUrl()}
            initialCollectionId={initialCollectionId}
            onClose={requestClose}
            onSuccess={handleSaveSuccess}
          />
        </BottomSheet>
      )}
    </SafeAreaView>
  );
}
