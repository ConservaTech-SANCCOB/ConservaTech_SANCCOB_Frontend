import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "../utils/colors";
import { parseLocalDate } from "../utils/dateBuckets";

export function DateBadge({ dateStr }: { dateStr: string }) {
  const dateObj = parseLocalDate(dateStr);
  const day = dateObj.getDate();
  const weekday = dateObj.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
  return (
    <View style={styles.dateBadge}>
      <Text style={styles.dateBadgeDay}>{day}</Text>
      <Text style={styles.dateBadgeWeekday}>{weekday}</Text>
    </View>
  );
}

export function ShiftMeta({ timeSlot, location }: { timeSlot: string; location: string | null }) {
  return (
    <View style={styles.shiftMetaCol}>
      <View style={styles.shiftMetaRow}>
        <Ionicons name="time-outline" size={13} color={COLORS.grey} />
        <Text style={styles.shiftMetaText}>{timeSlot}</Text>
      </View>
      {location ? (
        <View style={styles.shiftMetaRow}>
          <Ionicons name="location-outline" size={13} color={COLORS.grey} />
          <Text style={styles.shiftMetaText}>{location}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  dateBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.blue,
    alignItems: "center",
    justifyContent: "center",
  },
  dateBadgeDay: { fontSize: 18, fontWeight: "900", color: COLORS.white, lineHeight: 20 },
  dateBadgeWeekday: { fontSize: 10, fontWeight: "700", color: "rgba(255,255,255,0.85)", letterSpacing: 0.4 },
  shiftMetaCol: { gap: 2 },
  shiftMetaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  shiftMetaText: { fontSize: 12, color: COLORS.grey, fontWeight: "600" },
});
