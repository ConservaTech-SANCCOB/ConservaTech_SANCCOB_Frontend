import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { COLORS } from "../utils/colors";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function NotificationsDropdown({ visible, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.dropdown}>
          <Text style={styles.title}>Notifications</Text>
          <View style={styles.emptyState}>
            <Ionicons name="notifications-outline" size={28} color={COLORS.grey} />
            <Text style={styles.emptyText}>Nothing yet, you'll see updates here once you're scheduled.</Text>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.2)" },
  dropdown: {
    position: "absolute",
    top: 100,
    right: 20,
    width: 280,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  title: { fontSize: 15, fontWeight: "700", color: COLORS.navy, marginBottom: 12 },
  emptyState: { alignItems: "center", padding: 16, gap: 8 },
  emptyText: { fontSize: 12, color: COLORS.grey, textAlign: "center", lineHeight: 16 },
});