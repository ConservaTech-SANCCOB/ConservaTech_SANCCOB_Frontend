import Toast from "react-native-toast-message";

/**
 * Shows a short, human-readable error toast. Mirrors Alert.alert(title, message)'s
 * signature on purpose. Never pass a raw caught error (error.message, err.toString())
 * as the message — map it to specific copy when the cause is known (e.g. a 401), or
 * fall back to one honest generic message otherwise.
 */
export function showErrorToast(title: string, message?: string) {
  Toast.show({ type: "error", text1: title, text2: message });
}
