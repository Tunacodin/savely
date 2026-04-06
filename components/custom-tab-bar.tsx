import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import {
  MingCuteIcon,
  type MingCuteIconName,
} from "@/components/ui/mingcute-icon";
import { useThemeColors } from "@/hooks/use-theme";

const TAB_ICONS: Record<string, MingCuteIconName> = {
  index: "home-2-line",
  collections: "folder-line",
  search: "search-line",
  profile: "user-3-line",
};

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const c = useThemeColors();

  const tabs = state.routes;

  const items: ({ type: "tab"; index: number } | { type: "fab" })[] = [];
  tabs.forEach((_, i) => {
    if (i === 2) items.push({ type: "fab" });
    items.push({ type: "tab", index: i });
  });

  return (
    <>
      {/* Backdrop to close menu */}
      {menuOpen && (
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={() => setMenuOpen(false)}
        />
      )}

      {/* Floating menu */}
      {menuOpen && (
        <View
          style={{
            position: "absolute",
            bottom: insets.bottom + 80,
            alignSelf: "center",
            gap: 8,
            alignItems: "center",
          }}
        >
          <Pressable
            onPress={() => {
              setMenuOpen(false);
              router.push("/new-collection");
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              backgroundColor: c.buttonPrimary,
              borderRadius: 16,
              paddingHorizontal: 20,
              paddingVertical: 14,
            }}
          >
            <MingCuteIcon name="folder-add-line" size={20} color={c.buttonPrimaryText} />
            <Text style={{ fontFamily: "Rubik_400Regular", fontSize: 15, color: c.buttonPrimaryText }}>
              {t("collections.newCollection")}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              setMenuOpen(false);
              router.push("/save");
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              backgroundColor: c.buttonPrimary,
              borderRadius: 16,
              paddingHorizontal: 20,
              paddingVertical: 14,
            }}
          >
            <MingCuteIcon name="add-circle-line" size={20} color={c.buttonPrimaryText} />
            <Text style={{ fontFamily: "Rubik_400Regular", fontSize: 15, color: c.buttonPrimaryText }}>
              {t("saveForm.title")}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Tab Bar */}
      <View style={{ paddingBottom: insets.bottom, backgroundColor: c.tabBarBg, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
        <View className="flex-row items-center px-6 pt-2">
          {items.map((item) => {
            if (item.type === "fab") {
              return (
                <Pressable
                  key="fab"
                  onPress={() => setMenuOpen((prev) => !prev)}
                  className="flex-1 items-center"
                >
                  <View
                    style={{ backgroundColor: c.fabRing }}
                    className="w-[62px] h-[62px] rounded-full items-center justify-center -mt-8"
                  >
                    <View
                      style={{ backgroundColor: c.fabBg }}
                      className="w-16 h-16 rounded-full items-center justify-center"
                    >
                      <MingCuteIcon
                        name={menuOpen ? "close-line" : "add-line"}
                        size={30}
                        color={c.fabIcon}
                      />
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
                  setMenuOpen(false);
                  if (!isFocused) navigation.navigate(route.name);
                }}
              >
                <MingCuteIcon
                  name={iconName}
                  size={24}
                  color={isFocused ? c.tabIconActive : c.tabIconInactive}
                />
              </Pressable>
            );
          })}
        </View>
      </View>
    </>
  );
}
