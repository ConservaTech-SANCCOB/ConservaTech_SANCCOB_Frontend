import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";

export async function getExpoPushToken(): Promise<string | null> {
  try {
    // Remote push notifications require a physical device.
    if (!Device.isDevice) {
      console.log("Push notifications require a physical device.");
      return null;
    }

    // Android requires a notification channel.
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    // Check existing permission.
    const existingPermissions =
      await Notifications.getPermissionsAsync();

    let finalStatus = existingPermissions.status;

    // Request permission if needed.
    if (finalStatus !== "granted") {
      const requestedPermissions =
        await Notifications.requestPermissionsAsync();

      finalStatus = requestedPermissions.status;
    }

    if (finalStatus !== "granted") {
      console.log("Notification permission was not granted.");
      return null;
    }

    // Get the EAS project ID from app.json.
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    if (!projectId) {
      console.error("Expo projectId could not be found.");
      return null;
    }

    // Generate this device's Expo push token.
    const pushToken = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    console.log("Expo Push Token:", pushToken.data);

    return pushToken.data;
  } catch (error) {
    console.error("Failed to get Expo push token:", error);
    return null;
  }
}