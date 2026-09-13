import { StyleSheet, Text, View } from "react-native";
import { GLASS_CARD, GLASS_SHADOW_MD } from "../constants/glassCard";
import { MyShift } from "../services/shifts";
import { COLORS } from "../utils/colors";
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
    <View style={styles.shiftCard}>
      <DateBadge dateStr={item.shiftDate} />
      <View style={styles.shiftCardBody}>
        <Text style={styles.shiftTimeLabel}>{formatTimeSlotLabel(item.timeSlot)}</Text>
        <ShiftMeta timeSlot={item.timeSlot} location={item.location} />
        <View style={[styles.statusPill, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.statusPillText, { color: statusStyle.fg }]}>{item.status}</Text>
        </View>
      </View>
    </View>
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
    marginBottom: 12,
  },
  shiftCardBody: { flex: 1, gap: 6 },
  shiftTimeLabel: { fontSize: 15, fontWeight: "800", color: COLORS.navy },
  statusPill: {
    alignSelf: "flex-start",
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginTop: 2,
  },
  statusPillText: { fontSize: 11, fontWeight: "800" },
});
