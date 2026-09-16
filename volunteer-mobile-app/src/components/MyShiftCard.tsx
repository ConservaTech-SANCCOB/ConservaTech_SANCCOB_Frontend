import { useRef } from "react";
import { Alert, Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { GLASS_CARD, GLASS_SHADOW_MD } from "../constants/glassCard";
import { MyShift } from "../services/shifts";
import { COLORS } from "../utils/colors";
import { getRelativeLabel } from "../utils/dateBuckets";
import { formatTimeSlotLabel } from "../utils/timeSlot";
import { DateBadge, ShiftMeta } from "./ShiftCardParts";

function getStatusColor(status: string) {
  const s = status.toLowerCase();
  if (s.includes("confirm") || s.includes("schedul") || s.includes("complete")) return COLORS.green;
  if (s.includes("pend")) return "#9A7B00";
  if (s.includes("cancel") || s.includes("declin") || s.includes("reject")) return COLORS.red;
  return COLORS.grey;
}

export default function MyShiftCard({ item }: { item: MyShift }) {
  const statusColor = getStatusColor(item.status);
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 6 }).start();
  };
  const pressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 10 }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPressIn={pressIn}
      onPressOut={pressOut}
      onPress={() =>
        Alert.alert(
          `${formatTimeSlotLabel(item.timeSlot)} shift`,
          `${item.shiftDate}${item.location ? ` · ${item.location}` : ""}\nStatus: ${item.status}`
        )
      }
    >
      <Animated.View style={[styles.shiftCard, { transform: [{ scale }] }]}>
        <DateBadge dateStr={item.shiftDate} />
        <View style={styles.shiftCardBody}>
          <View style={styles.topRow}>
            <Text style={styles.shiftTimeLabel}>{formatTimeSlotLabel(item.timeSlot)}</Text>
            <Text style={styles.relativeLabel}>{getRelativeLabel(item.shiftDate)}</Text>
          </View>
          <ShiftMeta timeSlot={item.timeSlot} location={item.location} />
        </View>
        <View style={styles.statusCorner}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusCornerText, { color: statusColor }]}>{item.status}</Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  shiftCard: {
    ...GLASS_CARD,
    ...GLASS_SHADOW_MD,
    flexDirection: "row",
    gap: 20,
    borderRadius: 20,
    padding: 22,
    paddingTop: 46,
    marginBottom: 18,
  },
  shiftCardBody: { flex: 1, gap: 8 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  shiftTimeLabel: { fontSize: 19, fontWeight: "800", color: COLORS.navy },
  relativeLabel: { fontSize: 13, fontWeight: "700", color: COLORS.grey },
  statusCorner: {
    position: "absolute",
    top: 14,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  statusCornerText: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4 },
});
