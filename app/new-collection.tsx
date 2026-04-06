import { useCallback } from "react";
import { Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { CollectionForm } from "@/components/forms/CollectionForm";

export default function NewCollectionScreen() {
  const router = useRouter();
  const handleClose = useCallback(() => router.back(), [router]);
  const handleSuccess = useCallback((_id: string) => router.back(), [router]);

  return (
    <SafeAreaView className="flex-1" edges={[]}>
      <Pressable
        className="flex-1"
        onPress={handleClose}
        style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
      />
      <BottomSheet snapPoints={["80%"]} onChange={(index) => { if (index === -1) handleClose(); }} enablePanDownToClose enableDynamicSizing={false} handleComponent={null} backgroundStyle={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
        <BottomSheetView style={{ flex: 1 }}>
          <CollectionForm onClose={handleClose} onSuccess={handleSuccess} />
        </BottomSheetView>
      </BottomSheet>
    </SafeAreaView>
  );
}
