import {
  Rubik_400Regular,
  Rubik_500Medium,
  Rubik_600SemiBold,
  Rubik_700Bold,
  useFonts,
} from "@expo-google-fonts/rubik";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ShareIntentProvider, useShareIntentContext } from "expo-share-intent";
import { GlobalBottomSheetProvider } from "@/components/global-bottom-sheet";
import "react-native-reanimated";

import "../global.css";

SplashScreen.preventAutoHideAsync();

function ShareIntentHandler({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { hasShareIntent } = useShareIntentContext();

  useEffect(() => {
    if (hasShareIntent) {
      router.push("/save" as any);
    }
  }, [hasShareIntent]);

  return <>{children}</>;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Rubik_400Regular,
    Rubik_500Medium,
    Rubik_600SemiBold,
    Rubik_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView className="flex-1">
      <ShareIntentProvider>
        <GlobalBottomSheetProvider>
          <ShareIntentHandler>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen
                name="account-settings"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="save"
                options={{
                  headerShown: false,
                  presentation: "modal",
                  animation: "slide_from_bottom",
                }}
              />
              <Stack.Screen name="+not-found" />
            </Stack>
          </ShareIntentHandler>
          <StatusBar style="auto" />
        </GlobalBottomSheetProvider>
      </ShareIntentProvider>
    </GestureHandlerRootView>
  );
}
