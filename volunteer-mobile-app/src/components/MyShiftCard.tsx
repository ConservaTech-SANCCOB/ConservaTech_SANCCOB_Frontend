import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { GLASS_CARD, GLASS_SHADOW_MD } from "../constants/glassCard";
import { MyShift } from "../services/shifts";
import { COLORS } from "../utils/colors";
import { getRelativeLabel } from "../utils/dateBuckets";
import { formatTimeSlotLabel } from "../utils/timeSlot";
import { DateBadge, ShiftMeta } from "./ShiftCardParts";

function getStatusStyle(status: string) {
  const s = status.toLowerCase();
  if (s.includes("confirm") || s.includes("schedul") || s.includes("complete")) {
    return { bg: COLORS.greenBg, fg: COLORS.green };
  }
  if (s.includes("pend")) {
    return { bg: COLORS.amberBg, fg: "#9A7B00" };
  }
  if (s.includes("cancel") || s.includes("declin") || s.includes("reject")) {
    return { bg: "rgba(235,87,87,0.15)", fg: COLORS.red };
  }
  return { bg: COLORS.lightGrey, fg: COLORS.grey };
}

export default function MyShiftCard({ item }: { item: MyShift }) {
  const statusStyle = getStatusStyle(item.status);
  return (
    <TouchableOpacity
      style={styles.shiftCard}
      activeOpacity={0.7}
      onPress={() =>
        Alert.alert(
          `${formatTimeSlotLabel(item.timeSlot)} shift`,
          `${item.shiftDate}${item.location ? ` · ${item.location}` : ""}\nStatus: ${item.status}`
        )
      }
    >
      <DateBadge dateStr={item.shiftDate} />
      <View style={styles.shiftCardBody}>
        <View style={styles.topRow}>
          <Text style={styles.shiftTimeLabel}>{formatTimeSlotLabel(item.timeSlot)}</Text>
          <Text style={styles.relativeLabel}>{getRelativeLabel(item.shiftDate)}</Text>
        </View>
        <ShiftMeta timeSlot={item.timeSlot} location={item.location} />
      </View>
      <View style={[styles.statusCorner, { backgroundColor: statusStyle.bg }]}>
        <Text style={[styles.statusCornerText, { color: statusStyle.fg }]}>{item.status}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  shiftCard: {
    ...GLASS_CARD,
    ...GLASS_SHADOW_MD,
    flexDirection: "row",
    gap: 12,
    borderRadius: 16,
    padding: 14,
    paddingTop: 30,
    marginBottom: 12,
  },
  shiftCardBody: { flex: 1, gap: 6 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  shiftTimeLabel: { fontSize: 15, fontWeight: "800", color: COLORS.navy },
  relativeLabel: { fontSize: 11, fontWeight: "700", color: COLORS.grey },
  statusCorner: {
    position: "absolute",
    top: 10,
    right: 10,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  statusCornerText: { fontSize: 11, fontWeight: "800" },
});
