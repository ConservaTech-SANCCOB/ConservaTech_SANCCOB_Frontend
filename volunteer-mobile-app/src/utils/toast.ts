import { AccessibilityInfo } from "react-native";
import Toast from "react-native-toast-message";

type ToastType = "error" | "info" | "success";

function showToast(type: ToastType, title: string, message?: string) {
  const visibilityTime = Math.min(8000, 4000 + (message?.length ?? 0) * 40);
  Toast.show({ type, text1: title, text2: message, visibilityTime });
  // Screen readers don't announce toasts on their own
  AccessibilityInfo.announceForAccessibility(message ? `${title}. ${message}` : title);
}

export function showErrorToast(title: string, message?: string) {
  showToast("error", title, message);
}

/** Friendly, non-error toast (e.g. the seabird facts from tapping a banner penguin). */
export function showInfoToast(title: string, message?: string) {
  showToast("info", title, message);
}

export function showSuccessToast(title: string, message?: string) {
  showToast("success", title, message);
}
