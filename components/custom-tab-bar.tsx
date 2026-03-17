import { View, Pressable, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import {
  MingCuteIcon,
  type MingCuteIconName,
} from "@/components/ui/mingcute-icon";
import { extractUrlFromText } from "@/utils/platform-detector";

let ClipboardModule: typeof import("expo-clipboard") | null = null;
try {
  ClipboardModule = require("expo-clipboard");
} catch {}

const TAB_ICONS: Record<string, MingCuteIconName> = {
  index: "home-2-line",
  collections: "folder-line",
  search: "search-line",
  profile: "user-3-line",
};

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleFabPress = async () => {
    if (ClipboardModule) {
      try {
        const clipboardText = await ClipboardModule.getStringAsync();
        const extractedUrl = extractUrlFromText(clipboardText);
        if (extractedUrl) {
          router.push(`/save?url=${encodeURIComponent(extractedUrl)}`);
          return;
        }
      } catch {}
    }
    router.push("/save");
  };
  const tabs = state.routes;

  // Insert FAB placeholder at position 2 (between collections and search)
  const items: ({ type: "tab"; index: number } | { type: "fab" })[] = [];
  tabs.forEach((_, i) => {
    if (i === 2) items.push({ type: "fab" });
    items.push({ type: "tab", index: i });
  });

  return (
    <View style={{ paddingBottom: insets.bottom }}>
      <BlurView
        intensity={80}
        tint="systemChromeMaterialLight"
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View className="flex-row items-center px-6 pt-2">
        {items.map((item, i) => {
          if (item.type === "fab") {
            return (
              <Pressable key="fab" onPress={handleFabPress} className="flex-1 items-center">
                <View
                  className="w-[68px] h-[68px] bg-gray-50 rounded-full items-center justify-center -mt-10"
                >
                  <View className="w-16 h-16 bg-black rounded-full items-center justify-center">
                    <MingCuteIcon name="add-line" size={30} color="#f4f4f5" />
                  </View>
                </View>
              </Pressable>
            );
          }

          const route = tabs[item.index];
          const isFocused = state.index === item.index;
          const iconName = TAB_ICONS[route.name];
          if (!iconName) return null;

          return (
            <Pressable
              key={route.key}
              className="flex-1 items-center py-3"
              onPress={() => {
                if (!isFocused) {
                  navigation.navigate(route.name);
                }
              }}
            >
              <MingCuteIcon
                name={iconName}
                size={24}
                color={isFocused ? "#18181B" : "#a1a1aa"}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
