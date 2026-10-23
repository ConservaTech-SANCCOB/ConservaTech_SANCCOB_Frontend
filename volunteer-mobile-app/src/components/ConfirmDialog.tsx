import { ComponentRef, useRef } from "react";
import { AccessibilityInfo, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { GLASS_SHADOW_MD } from "../constants/glassCard";
import { COLORS } from "../utils/colors";

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// Leaving out confirmLabel shows a single close button
export default function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleRef = useRef<ComponentRef<typeof Text>>(null);

  const focusTitle = () => {
    if (titleRef.current) AccessibilityInfo.sendAccessibilityEvent(titleRef.current, "focus");
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} onShow={focusTitle}>
      <View style={styles.overlay}>
        <Pressable
          style={[StyleSheet.absoluteFill, styles.backdrop]}
          onPress={onCancel}
          accessible={false}
          importantForAccessibility="no-hide-descendants"
        />
        <View style={styles.card} accessibilityViewIsModal>
          <Text ref={titleRef} style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              accessibilityRole="button"
              accessibilityLabel={cancelLabel}
            >
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </TouchableOpacity>
            {confirmLabel ? (
              <TouchableOpacity
                style={[styles.button, destructive ? styles.destructiveButton : styles.confirmButton]}
                onPress={onConfirm}
                accessibilityRole="button"
                accessibilityLabel={confirmLabel}
              >
                <Text style={styles.confirmText}>{confirmLabel}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "center", paddingHorizontal: 32 },
  backdrop: { backgroundColor: COLORS.black, opacity: 0.35 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    paddingTop: 22,
    paddingBottom: 18,
    paddingHorizontal: 20,
    shadowColor: COLORS.navy,
    ...GLASS_SHADOW_MD,
  },
  title: { fontSize: 17, fontWeight: "700", color: COLORS.navy },
  message: { fontSize: 14, lineHeight: 20, color: COLORS.navy, marginTop: 8 },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 20 },
  button: {
    minHeight: 48,
    minWidth: 96,
    paddingHorizontal: 18,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  // Padding minus border width keeps the same size
  cancelButton: {
    backgroundColor: COLORS.lightGrey,
    borderWidth: 1,
    borderColor: COLORS.borderBlueGrey,
    paddingHorizontal: 17,
  },
  confirmButton: { backgroundColor: COLORS.blueMid },
  destructiveButton: { backgroundColor: COLORS.redMid },
  cancelText: { fontSize: 15, fontWeight: "700", color: COLORS.navy },
  confirmText: { fontSize: 15, fontWeight: "700", color: COLORS.white },
});

//----------------------------------- END OF FILE ---------------------------------//
