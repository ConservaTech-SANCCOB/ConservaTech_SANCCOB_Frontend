import Toast from "react-native-toast-message";

export function showErrorToast(title: string, message?: string) {
  const visibilityTime = Math.min(8000, 4000 + (message?.length ?? 0) * 40);
  Toast.show({ type: "error", text1: title, text2: message, visibilityTime });
}

/** Friendly, non-error toast (e.g. the seabird facts from tapping a banner penguin). */
export function showInfoToast(title: string, message?: string) {
  const visibilityTime = Math.min(8000, 4000 + (message?.length ?? 0) * 40);
  Toast.show({ type: "info", text1: title, text2: message, visibilityTime });
}
