import { Tabs } from "expo-router";
import { CustomTabBar } from "@/components/custom-tab-bar";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: "Anasayfa" }} />
      <Tabs.Screen name="collections" options={{ title: "Koleksiyonlar" }} />
      <Tabs.Screen name="search" options={{ title: "Ara" }} />
      <Tabs.Screen name="profile" options={{ title: "Profil" }} />
    </Tabs>
  );
}
