import { useEffect } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";

const PUSH_TOKEN_KEY = "expo_push_token";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  } as Notifications.NotificationBehavior),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log("[Push] Not a physical device, skipping");
    return null;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("[Push] Permission not granted");
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) {
    console.log("[Push] No EAS project ID found");
    return null;
  }

  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  console.log("[Push] Token:", token);

  await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from("push_tokens").upsert(
      {
        user_id: user.id,
        expo_push_token: token,
        platform: Platform.OS as "ios" | "android",
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,expo_push_token" }
    );

    await supabase.from("notification_preferences").upsert(
      { user_id: user.id },
      { onConflict: "user_id", ignoreDuplicates: true }
    );
  }

  return token;
}

export async function deactivatePushToken(): Promise<void> {
  const token = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
  if (token) {
    await supabase
      .from("push_tokens")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("expo_push_token", token);
  }
}

export function useNotificationSetup() {
  const router = useRouter();
  const lastResponse = Notifications.useLastNotificationResponse();

  useEffect(() => {
    if (lastResponse) {
      const data = lastResponse.notification.request.content.data;
      if (data?.collectionId) {
        router.push({
          pathname: "/collection-detail",
          params: { id: data.collectionId as string },
        } as any);
      }
    }
  }, [lastResponse, router]);
}
