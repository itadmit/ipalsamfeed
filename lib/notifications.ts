import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { api } from "./api";

const EAS_PROJECT_ID_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function resolveExpoProjectId(): string | null {
  const fromExtra = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  const fromEas = Constants.easConfig?.projectId;
  const id = (fromExtra || fromEas || "").trim();
  if (!id || !EAS_PROJECT_ID_UUID.test(id)) return null;
  return id;
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldFlashScreen: false,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") return null;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    const projectId = resolveExpoProjectId();
    if (!projectId) {
      if (__DEV__) {
        console.warn(
          "[push] אין projectId תקין ל-Expo. הרץ `npx eas init` והדבק את ה-UUID ב-app.json → extra.eas.projectId"
        );
      }
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });

    await api("/notifications/push-token", {
      method: "POST",
      body: {
        token: tokenData.data,
        platform: Platform.OS,
      },
    });

    return tokenData.data;
  } catch (error) {
    console.error("Push registration failed:", error);
    return null;
  }
}
