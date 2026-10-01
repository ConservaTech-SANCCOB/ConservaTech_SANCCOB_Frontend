import { StyleSheet } from "react-native";
import { BaseToast, ErrorToast, ToastConfig } from "react-native-toast-message";
import { COLORS } from "../utils/colors";

export const toastConfig: ToastConfig = {
  error: (props) => (
    <ErrorToast
      {...props}
      style={styles.toast}
      contentContainerStyle={styles.content}
      text1Style={styles.title}
      text2Style={styles.message}
      text1NumberOfLines={2}
      text2NumberOfLines={5}
    />
  ),
  info: (props) => (
    <BaseToast
      {...props}
      style={[styles.toast, styles.infoToast]}
      contentContainerStyle={styles.content}
      text1Style={styles.title}
      text2Style={styles.message}
      text1NumberOfLines={2}
      text2NumberOfLines={5}
    />
  ),
};

const styles = StyleSheet.create({
  toast: {
    height: undefined,
    minHeight: 64,
    width: "92%",
    borderLeftColor: COLORS.red,
    borderLeftWidth: 6,
  },
  infoToast: { borderLeftColor: COLORS.blue },
  content: { paddingVertical: 12, paddingHorizontal: 14 },
  title: { fontSize: 15, fontWeight: "700", color: "#1b2a33", marginBottom: 2 },
  message: { fontSize: 13.5, lineHeight: 19, color: "#3d4a52" },
});
