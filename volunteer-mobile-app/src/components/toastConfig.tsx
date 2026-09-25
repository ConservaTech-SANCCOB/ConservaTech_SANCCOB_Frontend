import { StyleSheet } from "react-native";
import { ErrorToast, ToastConfig } from "react-native-toast-message";
import { COLORS } from "../utils/colors";

/**
 * The library's default toast is a fixed 60px tall with a one-line, 10pt message,
 * which cuts off longer backend messages (e.g. why a sign-off was rejected). This
 * version grows to fit the message instead.
 */
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
};

const styles = StyleSheet.create({
  toast: {
    height: undefined,
    minHeight: 64,
    width: "92%",
    borderLeftColor: COLORS.red,
    borderLeftWidth: 6,
  },
  content: { paddingVertical: 12, paddingHorizontal: 14 },
  title: { fontSize: 15, fontWeight: "700", color: "#1b2a33", marginBottom: 2 },
  message: { fontSize: 13.5, lineHeight: 19, color: "#3d4a52" },
});
