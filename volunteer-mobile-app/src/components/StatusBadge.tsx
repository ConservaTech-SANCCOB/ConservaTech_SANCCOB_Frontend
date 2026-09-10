import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../utils/colors";
import { BookingStatus } from "../types/booking";

export default function StatusBadge({ status }: { status: BookingStatus }) {
  const config = {
    Assigned: { bg: COLORS.greenBg, text: COLORS.green, label: "CONFIRMED" },
    Conflict: { bg: "#FDEAEA", text: COLORS.red, label: "NEEDS ATTENTION" },
  }[status];

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.text, { color: config.text }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14 },
  text: { fontSize: 11, fontWeight: "800", letterSpacing: 0.3 },
});