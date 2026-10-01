import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";

export async function getExpoPushToken(): Promise<string | null> {
  try {
    // Android requires a notification channel.
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    // Check current notification permission.
    const existingPermissions =
      await Notifications.getPermissionsAsync();

    let finalStatus = existingPermissions.status;

    // Ask the user if permission has not already been granted.
    if (finalStatus !== "granted") {
      const requestedPermissions =
        await Notifications.requestPermissionsAsync();

      finalStatus = requestedPermissions.status;
    }

    if (finalStatus !== "granted") {
      console.log("Notification permission was not granted.");
      return null;
    }

    // Get the Expo/EAS project ID.
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    if (!projectId) {
      console.error("Expo projectId could not be found.");
      return null;
    }

    // Generate the Expo push token for this device.
    const pushToken =
      await Notifications.getExpoPushTokenAsync({
        projectId,
      });

    console.log("Expo Push Token:", pushToken.data);

    return pushToken.data;
  } catch (error) {
    console.error("Failed to get Expo push token:", error);
    return null;
  }
}