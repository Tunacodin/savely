import { useMemo, useCallback } from "react";
import { Tabs } from "expo-router";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { SafeAreaView } from "react-native-safe-area-context";
import { CustomTabBar } from "@/components/custom-tab-bar";
import { useThemeColors } from "@/hooks/use-theme";

export default function TabLayout() {
  const c = useThemeColors();

  const sceneStyle = useMemo(() => ({ backgroundColor: c.background }), [c.background]);

  const renderTabBar = useCallback(
    (props: BottomTabBarProps) => <CustomTabBar {...props} />,
    []
  );

  const screenOptions = useMemo(
    () => ({
      headerShown: false as const,
      animation: "none" as const,
      lazy: false,
      freezeOnBlur: true,
      detachInactiveScreens: false,
    }),
    []
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={["top"]}>
      <Tabs
        screenOptions={screenOptions}
        sceneContainerStyle={sceneStyle}
        tabBar={renderTabBar}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="collections" />
        <Tabs.Screen name="search" />
        <Tabs.Screen name="profile" />
      </Tabs>
    </SafeAreaView>
  );
}
