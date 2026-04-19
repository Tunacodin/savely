import { useCallback, useEffect } from "react";
import { Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { CollectionForm } from "@/components/forms/CollectionForm";
import { useThemeColors } from "@/hooks/use-theme";
import { useSavedItemsStore } from "@/store/saved-items";

export default function NewCollectionScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const c = useThemeColors();
  const canAdd = useSavedItemsStore((s) => s.canAddCollection)();

  const handleClose = useCallback(() => router.back(), [router]);
  const handleSuccess = useCallback((_id: string) => router.back(), [router]);

  useEffect(() => {
    if (!canAdd) {
      Alert.alert(t("collections.limitReached"), t("collections.limitReachedDesc"), [
        { text: t("common.cancel"), onPress: handleClose },
        {
          text: t("profile.goPremium"),
          onPress: () => {
            handleClose();
            setTimeout(() => router.push("/premium-plan"), 300);
          },
        },
      ]);
    }
  }, [canAdd]);

  if (!canAdd) return null;

  return (
    <SafeAreaView className="flex-1" edges={[]}>
      <Pressable
        className="flex-1"
        onPress={handleClose}
        style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
      />
      <BottomSheet snapPoints={["80%"]} onChange={(index) => { if (index === -1) handleClose(); }} enablePanDownToClose enableDynamicSizing={false} handleComponent={null} backgroundStyle={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: c.sheetBg }}>
        <BottomSheetView style={{ flex: 1 }}>
          <CollectionForm onClose={handleClose} onSuccess={handleSuccess} />
        </BottomSheetView>
      </BottomSheet>
    </SafeAreaView>
  );
}
