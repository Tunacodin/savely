import { View, Text } from "react-native";
import { useCallback, useEffect, useRef } from "react";
import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";

let _openFilter: (() => void) | null = null;
let _closeFilter: (() => void) | null = null;

export function openFilterSheet() {
  _openFilter?.();
}

export function closeFilterSheet() {
  _closeFilter?.();
}

export function GlobalBottomSheetProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const filterSheetRef = useRef<BottomSheetModal>(null);

  useEffect(() => {
    _openFilter = () => {
      filterSheetRef.current?.present();
    };
    _closeFilter = () => {
      filterSheetRef.current?.dismiss();
    };
    return () => {
      _openFilter = null;
      _closeFilter = null;
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

  return (
    <BottomSheetModalProvider>
      {children}
      <BottomSheetModal
        ref={filterSheetRef}
        snapPoints={["50%", "90%"]}
        enableDynamicSizing={false}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{ backgroundColor: "#d4d4d4", width: 40 }}
      >
        <BottomSheetView className="flex-1 px-4 pt-2">
          <Text className="font-sans-medium text-lg text-zinc-800">
            Filtrele
          </Text>
        </BottomSheetView>
      </BottomSheetModal>
    </BottomSheetModalProvider>
  );
}
