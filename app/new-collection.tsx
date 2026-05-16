import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, Alert, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import BottomSheet, { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { CollectionForm, type CollectionFormHandle } from "@/components/forms/CollectionForm";
import { useThemeColors } from "@/hooks/use-theme";
import { useSavedItemsStore } from "@/store/saved-items";

export default function NewCollectionScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const c = useThemeColors();
  const { height: windowHeight } = useWindowDimensions();
  const canAdd = useSavedItemsStore((s) => s.canAddCollection)();

  const formRef = useRef<CollectionFormHandle>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const navigatingRef = useRef(false);
  const [backdropVisible, setBackdropVisible] = useState(true);
  const [sheetVisible, setSheetVisible] = useState(true);

  const snapPoints = useMemo(() => [windowHeight * 0.9], [windowHeight]);

  const goBack = useCallback(() => router.back(), [router]);

  const dismissNow = useCallback(() => {
    if (navigatingRef.current) return;
    navigatingRef.current = true;
    setBackdropVisible(false);
    setSheetVisible(false);
    goBack();
  }, [goBack]);

  const requestClose = useCallback(() => {
    if (navigatingRef.current) return;
    setBackdropVisible(false);
    bottomSheetRef.current?.forceClose();
    setTimeout(() => {
      if (!navigatingRef.current) dismissNow();
    }, 350);
  }, [dismissNow]);

  const handleSuccess = useCallback((_id: string) => {
    requestClose();
  }, [requestClose]);

  useEffect(() => {
    if (!canAdd) {
      Alert.alert(t("collections.limitReached"), t("collections.limitReachedDesc"), [
        { text: t("common.cancel"), onPress: requestClose },
        {
          text: t("profile.goPremium"),
          onPress: () => {
            requestClose();
            setTimeout(() => router.push("/premium-plan"), 300);
          },
        },
      ]);
    }
  }, [canAdd]);

  if (!canAdd) return null;

  return (
    <BottomSheetModalProvider>
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
            <CollectionForm
              ref={formRef}
              onClose={requestClose}
              onSuccess={handleSuccess}
            />
          </BottomSheet>
        )}
      </SafeAreaView>
    </BottomSheetModalProvider>
  );
}
