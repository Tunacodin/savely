import { View } from "react-native";
import { Tabs } from "expo-router";
import { CustomTabBar } from "@/components/custom-tab-bar";
import { useThemeColors } from "@/hooks/use-theme";

export default function TabLayout() {
  const c = useThemeColors();

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <Tabs
        screenOptions={{ headerShown: false }}
        sceneContainerStyle={{ backgroundColor: c.background }}
        tabBar={(props) => <CustomTabBar {...props} />}
      >
        <Tabs.Screen name="index" options={{ title: "Anasayfa" }} />
        <Tabs.Screen name="collections" options={{ title: "Koleksiyonlar" }} />
        <Tabs.Screen name="search" options={{ title: "Ara" }} />
        <Tabs.Screen name="profile" options={{ title: "Profil" }} />
      </Tabs>
    </View>
  );
}
