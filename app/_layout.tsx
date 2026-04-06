import {
  Rubik_400Regular,
  Rubik_500Medium,
  Rubik_600SemiBold,
  Rubik_700Bold,
  useFonts,
} from "@expo-google-fonts/rubik";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useThemeStore } from "@/store/theme";
import { AnimatedSplash } from "@/components/animated-splash";
import { ShareIntentProvider, useShareIntentContext } from "expo-share-intent";
import { GlobalBottomSheetProvider } from "@/components/global-bottom-sheet";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth";
import { useSavedItemsStore } from "@/store/saved-items";
import "react-native-reanimated";
import "@/lib/i18n";

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

function AuthGate({ children }: { children: React.ReactNode }) {
  const { setSession, fetchProfile, session, isLoading } = useAuthStore();
  const { loadUserData, clearUserData } = useSavedItemsStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("[AuthGate] getSession:", session?.user?.email ?? "no session");
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
        loadUserData(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("[AuthGate] onAuthStateChange:", _event, session?.user?.email ?? "no session");
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
        loadUserData(session.user.id);
      } else {
        clearUserData();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    console.log("[AuthGate] nav effect — session:", !!session, "isLoading:", isLoading, "segments:", segments[0]);
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inOnboarding = segments[0] === "(onboarding)";

    if (!session && !inAuthGroup && !inOnboarding) {
      console.log("[AuthGate] → redirecting to login");
      router.replace("/(auth)/login");
    } else if (session && (inAuthGroup || inOnboarding)) {
      console.log("[AuthGate] → redirecting to tabs");
      router.replace("/(tabs)");
    } else {
      console.log("[AuthGate] → no redirect needed");
    }
  }, [session, isLoading, segments]);

  return <>{children}</>;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Rubik_400Regular,
    Rubik_500Medium,
    Rubik_600SemiBold,
    Rubik_700Bold,
  });
  const [showSplash, setShowSplash] = useState(true);
  const systemScheme = useColorScheme();
  const themeMode = useThemeStore((s) => s.mode);
  const statusBarStyle =
    themeMode === "system"
      ? "auto"
      : themeMode === "dark"
        ? "light"
        : "dark";

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
          <AuthGate>
          <ShareIntentHandler>
            <Stack>
              <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen
                name="account-settings"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="premium-plan"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="save"
                options={{
                  headerShown: false,
                  presentation: "transparentModal",
                  animation: "fade",
                }}
              />
              <Stack.Screen
                name="new-collection"
                options={{
                  headerShown: false,
                  presentation: "transparentModal",
                  animation: "fade",
                }}
              />
              <Stack.Screen
                name="collection-detail"
                options={{ headerShown: false }}
              />
              <Stack.Screen name="+not-found" />
            </Stack>
          </ShareIntentHandler>
          </AuthGate>
          <StatusBar style={statusBarStyle} />
          {showSplash && <AnimatedSplash onFinish={() => setShowSplash(false)} />}
        </GlobalBottomSheetProvider>
      </ShareIntentProvider>
    </GestureHandlerRootView>
  );
}
