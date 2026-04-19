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
import { useEffect, useRef, useState } from "react";
import { useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useThemeStore } from "@/store/theme";
import { AnimatedSplash } from "@/components/animated-splash";
import { ShareIntentProvider, useShareIntentContext } from "expo-share-intent";
import { GlobalBottomSheetProvider } from "@/components/global-bottom-sheet";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth";
import { useSavedItemsStore } from "@/store/saved-items";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_COLLECTIONS } from "@/constants/default-collections";
import { registerForPushNotifications, useNotificationSetup } from "@/hooks/use-notifications";
import i18next from "@/lib/i18n";
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

async function createPendingCollections(addCollection: (c: any) => Promise<string>) {
  try {
    const raw = await AsyncStorage.getItem("pending_collections");
    if (!raw) return;
    const slugs: string[] = JSON.parse(raw);
    const lang = (i18next.language as "tr" | "en" | "fr" | "es") || "tr";
    for (const slug of slugs) {
      const def = DEFAULT_COLLECTIONS.find((d) => d.slug === slug);
      if (def) {
        await addCollection({
          name: def.name[lang] || def.name.en,
          emoji: def.emoji,
          bgColor: def.bgColor,
          itemCount: 0,
        });
      }
    }
    await AsyncStorage.removeItem("pending_collections");
  } catch {}
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { setSession, fetchProfile, session, isLoading } = useAuthStore();
  const { loadUserData, clearUserData, addCollection } = useSavedItemsStore();
  const router = useRouter();

  useNotificationSetup();
  const initializedRef = useRef(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
        loadUserData(session.user.id);
        // Only run once per app lifecycle
        if (!initializedRef.current) {
          initializedRef.current = true;
          registerForPushNotifications();
          createPendingCollections(addCollection);
        }
      } else {
        initializedRef.current = false;
        clearUserData();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Only redirect on auth state changes
  const prevSessionRef = useRef<boolean | null>(null);

  useEffect(() => {
    if (isLoading) return;

    const hadSession = prevSessionRef.current;
    const hasSession = !!session;
    prevSessionRef.current = hasSession;

    // Skip initial render — index.tsx handles that
    if (hadSession === null) return;

    if (hadSession !== hasSession) {
      if (hasSession) {
        router.replace("/(tabs)");
      } else {
        router.replace("/(auth)/login");
      }
    }
  }, [session, isLoading]);

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
  const [authResolved, setAuthResolved] = useState(false);
  const sessionRef = useRef<boolean>(false);
  const themeMode = useThemeStore((s) => s.mode);
  const statusBarStyle =
    themeMode === "system"
      ? "auto"
      : themeMode === "dark"
        ? "light"
        : "dark";

  // Resolve auth independently before rendering tree
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      sessionRef.current = !!session;
      useAuthStore.getState().setSession(session);
      if (session?.user) {
        useAuthStore.getState().fetchProfile(session.user.id);
        useSavedItemsStore.getState().loadUserData(session.user.id);
      }
      setAuthResolved(true);
    });
  }, []);

  useEffect(() => {
    if (fontsLoaded && authResolved) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, authResolved]);

  if (!fontsLoaded || !authResolved) {
    return null;
  }

  const initialRoute = sessionRef.current ? "(tabs)" : "(auth)";

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ShareIntentProvider>
        <GlobalBottomSheetProvider>
          <AuthGate>
          <ShareIntentHandler>
            <Stack
              initialRouteName={initialRoute}
              screenOptions={{ headerShown: false, animation: "slide_from_right" }}
            >
              <Stack.Screen name="index" options={{ animation: "none" }} />
              <Stack.Screen name="(onboarding)" />
              <Stack.Screen name="(tabs)" options={{ animation: "none" }} />
              <Stack.Screen name="(auth)" options={{ animation: "none" }} />
              <Stack.Screen name="account-settings" />
              <Stack.Screen name="premium-plan" />
              <Stack.Screen name="notification-settings" />
              <Stack.Screen
                name="save"
                options={{
                  presentation: "transparentModal",
                  animation: "fade",
                }}
              />
              <Stack.Screen
                name="new-collection"
                options={{
                  presentation: "transparentModal",
                  animation: "fade",
                }}
              />
              <Stack.Screen name="collection-detail" />
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
