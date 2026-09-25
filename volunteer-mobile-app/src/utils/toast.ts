import Toast from "react-native-toast-message";

/**
 * Shows a short, human-readable error toast. Mirrors Alert.alert(title, message)'s
 * signature on purpose. Never pass a raw caught error (error.message, err.toString())
 * as the message — map it to specific copy when the cause is known (e.g. a 401), or
 * use getErrorMessage() from utils/api, which shows the backend's own message for
 * 4xx responses and falls back to one honest generic message otherwise.
 */
export function showErrorToast(title: string, message?: string) {
  // Longer messages stay up longer so they can actually be read (4s base, up to 8s).
  const visibilityTime = Math.min(8000, 4000 + (message?.length ?? 0) * 40);
  Toast.show({ type: "error", text1: title, text2: message, visibilityTime });
}
