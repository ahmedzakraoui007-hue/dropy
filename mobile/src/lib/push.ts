import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { api } from "@/lib/supabase";

const TOKEN_KEY = "dropy.push_token";

export type PushResult = "granted" | "denied" | "unsupported" | "error";

if (Platform.OS !== "web") Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function pushPermission(): Promise<"granted" | "denied" | "undetermined"> {
  if (Platform.OS === "web") return "granted";
  const { status } = await Notifications.getPermissionsAsync();
  return status === "granted" ? "granted" : status === "denied" ? "denied" : "undetermined";
}

export async function registerForPush(ask: boolean): Promise<PushResult> {
  if (!Device.isDevice || Platform.OS === "web") return "unsupported";
  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("orders", {
        name: "Commandes",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#7C3AED",
        sound: "default",
      });
    }
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted" && ask) status = (await Notifications.requestPermissionsAsync()).status;
    if (status !== "granted") return "denied";
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) return "unsupported";
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    await api("/api/mobile/push-token", { method: "POST", body: { token, platform: Platform.OS } });
    await AsyncStorage.setItem(TOKEN_KEY, token);
    return "granted";
  } catch {
    return "error";
  }
}

export async function unregisterPush() {
  const token = await AsyncStorage.getItem(TOKEN_KEY).catch(() => null);
  if (!token) return;
  await api("/api/mobile/push-token", { method: "DELETE", body: { token } }).catch(() => {});
  await AsyncStorage.removeItem(TOKEN_KEY).catch(() => {});
}
