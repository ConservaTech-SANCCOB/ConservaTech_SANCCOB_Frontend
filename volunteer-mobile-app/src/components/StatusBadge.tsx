import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../utils/colors";
import { BookingStatus } from "../types/booking";

export default function StatusBadge({ status }: { status: BookingStatus }) {
  const config = {
    Confirmed: { bg: COLORS.greenBg, text: COLORS.green, label: "CONFIRMED" },
    "Pending Approval": { bg: COLORS.amberBg, text: COLORS.amber, label: "PENDING APPROVAL" },
    Cancelled: { bg: "#FBE9E7", text: COLORS.red, label: "CANCELLED" },
  }[status];

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.text, { color: config.text }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: "flex-start" },
  text: { fontSize: 12, fontWeight: "700" },
});