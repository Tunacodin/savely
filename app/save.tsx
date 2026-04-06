import { useCallback, useState } from "react";
import { View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useShareIntentContext } from "expo-share-intent";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { SaveItemForm } from "@/components/forms/SaveItemForm";
import { extractUrlFromText } from "@/utils/platform-detector";

export default function SaveScreen() {
  const router = useRouter();
  const { url: routeUrl } = useLocalSearchParams<{ url?: string }>();
  const { shareIntent, resetShareIntent } = useShareIntentContext();

  const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(true);

  const getInitialUrl = () => {
    if (routeUrl) return routeUrl;
    return shareIntent.webUrl ?? extractUrlFromText(shareIntent.text ?? "") ?? undefined;
  };

  const handleSheetClose = useCallback(() => {
    resetShareIntent();
    router.back();
  }, [resetShareIntent, router]);

  const handleSaveSuccess = useCallback(() => {
    resetShareIntent();
    setIsBottomSheetVisible(false);
    router.back();
  }, [resetShareIntent, router]);

  return (
    <SafeAreaView className="flex-1" edges={[]}>
      <Pressable 
        className="flex-1" 
        onPress={handleSheetClose}
        style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
      />
      
      {isBottomSheetVisible && (
        <BottomSheet
          snapPoints={["90%"]}
          onChange={(index) => { if (index === -1) handleSheetClose(); }}
          enablePanDownToClose
          enableDynamicSizing={false}
          handleComponent={null}
          backgroundStyle={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
        >
          <BottomSheetView style={{ flex: 1 }}>
            <SaveItemForm
              initialUrl={getInitialUrl()}
              initialTitle={shareIntent.meta?.title}
              onClose={handleSheetClose}
              onSuccess={handleSaveSuccess}
            />
          </BottomSheetView>
        </BottomSheet>
      )}
    </SafeAreaView>
  );
}
