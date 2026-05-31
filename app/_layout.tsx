import {
  Rubik_400Regular,
  Rubik_500Medium,
  Rubik_600SemiBold,
  Rubik_700Bold,
  useFonts,
} from "@expo-google-fonts/rubik";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { AppState, useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useThemeStore } from "@/store/theme";
import { AnimatedSplash } from "@/components/animated-splash";
import { GlobalBottomSheetProvider } from "@/components/global-bottom-sheet";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth";
import { useSavedItemsStore } from "@/store/saved-items";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_COLLECTIONS, SAVE_LATER_COLLECTION } from "@/constants/default-collections";
import { registerForPushNotifications, useNotificationSetup } from "@/hooks/use-notifications";
import i18next from "@/lib/i18n";
import { setNativeCredentials, clearNativeCredentials, drainPendingItems } from "../modules/sharing-shortcuts";
import { setShareSession, clearShareSession } from "../modules/savely-share-extension";
import { PermissionSetupModal } from "@/components/permission-setup-modal";
import { detectPlatform, inferContentType } from "@/utils/platform-detector";
import { extractMetadata } from "@/services/metadata";
import "react-native-reanimated";

const SUPABASE_URL = "https://djdwolekentrczauhlpl.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqZHdvbGVrZW50cmN6YXVobHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NjgwMzUsImV4cCI6MjA5MDQ0NDAzNX0.bzNWqAZA3dg7iUIr9GBMfBFk1oveJk_Q-QmWp7d-HCU";

async function drainAndReplayPending() {
  try {
    const pending = await drainPendingItems();
    if (pending.length === 0) return;
    const { addItem, enrichItem } = useSavedItemsStore.getState();
    for (const it of pending) {
      try {
        const detected = detectPlatform(it.url);
        const id = await addItem({
          url: it.url,
          title: "",
          platform: detected.platform,
          contentType: inferContentType(detected.platform, it.url),
          aspectRatio: 1,
          metadata: {},
          isEnriched: false,
          collectionId: it.collectionId ?? undefined,
        });
        extractMetadata(it.url, detected.platform, detected.contentId)
          .then((result) => {
            enrichItem(id, result.metadata, result.title, result.imageUrl);
          })
          .catch(() => {});
      } catch {}
    }
  } catch {}
}

async function enrichUnenrichedItems() {
  try {
    const { items, enrichItem } = useSavedItemsStore.getState();
    const targets = items.filter((i) => !i.isEnriched && i.url);
    for (const item of targets) {
      try {
        const detected = detectPlatform(item.url);
        const result = await extractMetadata(item.url, detected.platform, detected.contentId);
        if (result.title || result.imageUrl || Object.keys(result.metadata ?? {}).length > 0) {
          await enrichItem(item.id, result.metadata, result.title, result.imageUrl);
        }
      } catch {}
    }
  } catch {}
}

import "../global.css";

SplashScreen.preventAutoHideAsync().catch(() => {});

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

async function ensureSaveLaterCollection(
  userId: string,
  addCollection: (c: any) => Promise<string>,
  reload: (userId: string) => Promise<void>
) {
  try {
    const names = Object.values(SAVE_LATER_COLLECTION.name);
    const { data } = await supabase
      .from("collections")
      .select("id,created_at")
      .eq("user_id", userId)
      .in("name", names)
      .order("created_at", { ascending: true });

    if (!data || data.length === 0) {
      const lang = (i18next.language as "tr" | "en" | "fr" | "es") || "tr";
      await addCollection({
        name: SAVE_LATER_COLLECTION.name[lang] || SAVE_LATER_COLLECTION.name.en,
        emoji: SAVE_LATER_COLLECTION.emoji,
        bgColor: SAVE_LATER_COLLECTION.bgColor,
        itemCount: 0,
      });
      return;
    }

    if (data.length > 1) {
      const duplicateIds = data.slice(1).map((row) => row.id);
      await supabase.from("collections").delete().in("id", duplicateIds);
      await reload(userId);
    }
  } catch {}
}

const PERMISSION_SETUP_KEY = "savely_permission_setup_done_v1";

function AuthGate({ children }: { children: React.ReactNode }) {
  const { setSession, fetchProfile, session, isLoading } = useAuthStore();
  const { loadUserData, clearUserData, addCollection } = useSavedItemsStore();
  const router = useRouter();
  const [showPermissionSetup, setShowPermissionSetup] = useState(false);

  useNotificationSetup();
  const initializedRef = useRef(false);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      if (next !== "active") return;
      const userId = useAuthStore.getState().session?.user?.id;
      if (!userId) return;
      void useSavedItemsStore.getState().loadUserData(userId).then(() => {
        void enrichUnenrichedItems();
      });
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        const userId = session.user.id;
        fetchProfile(userId);
        void setNativeCredentials({
          accessToken: session.access_token ?? null,
          userId,
          supabaseUrl: SUPABASE_URL,
          anonKey: SUPABASE_ANON_KEY,
        }).catch(() => {});
        if (session.access_token) {
          void setShareSession({ accessToken: session.access_token, userId }).catch(() => {});
        }
        // Only run once per app lifecycle
        if (!initializedRef.current) {
          initializedRef.current = true;
          void registerForPushNotifications().catch(() => {});
          (async () => {
            await loadUserData(userId);
            await createPendingCollections(addCollection);
            await ensureSaveLaterCollection(userId, addCollection, loadUserData);
            await drainAndReplayPending();
            void enrichUnenrichedItems();
            const done = await AsyncStorage.getItem(PERMISSION_SETUP_KEY).catch(() => null);
            if (!done) setShowPermissionSetup(true);
          })();
        } else {
          loadUserData(userId);
        }
      } else {
        initializedRef.current = false;
        void clearNativeCredentials().catch(() => {});
        void clearShareSession().catch(() => {});
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
        router.replace("/(auth)/email-login");
      }
    }
  }, [session, isLoading]);

  return (
    <>
      {children}
      <PermissionSetupModal
        visible={showPermissionSetup}
        onDone={() => {
          setShowPermissionSetup(false);
          AsyncStorage.setItem(PERMISSION_SETUP_KEY, "1").catch(() => {});
        }}
      />
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Rubik_400Regular,
    Rubik_500Medium,
    Rubik_600SemiBold,
    Rubik_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
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
        useSavedItemsStore.getState().loadUserData(session.user.id).then(() => {
          void drainAndReplayPending();
          void enrichUnenrichedItems();
        });
        void setNativeCredentials({
          accessToken: session.access_token ?? null,
          userId: session.user.id,
          supabaseUrl: SUPABASE_URL,
          anonKey: SUPABASE_ANON_KEY,
        }).catch(() => {});
        if (session.access_token) {
          void setShareSession({ accessToken: session.access_token, userId: session.user.id }).catch(() => {});
        }
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
      <GlobalBottomSheetProvider>
        <AuthGate>
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
            <Stack.Screen name="preferences" />
            <Stack.Screen
              name="save"
              options={{
                presentation: "transparentModal",
                animation: "none",
              }}
            />
            <Stack.Screen
              name="new-collection"
              options={{
                presentation: "transparentModal",
                animation: "none",
              }}
            />
            <Stack.Screen name="collection-detail" />
            <Stack.Screen name="+not-found" />
          </Stack>
        </AuthGate>
        <StatusBar style={statusBarStyle} />
        {showSplash && <AnimatedSplash onFinish={() => setShowSplash(false)} />}
      </GlobalBottomSheetProvider>
    </GestureHandlerRootView>
  );
}
