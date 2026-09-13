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
    <View style={styles.shiftMetaRow}>
      <Ionicons name="time-outline" size={13} color={COLORS.grey} />
      <Text style={styles.shiftMetaText}>{timeSlot}</Text>
      {location ? (
        <>
          <Ionicons name="location-outline" size={13} color={COLORS.grey} style={{ marginLeft: 8 }} />
          <Text style={styles.shiftMetaText}>{location}</Text>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  dateBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(0,46,76,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  dateBadgeDay: { fontSize: 18, fontWeight: "900", color: COLORS.navy, lineHeight: 20 },
  dateBadgeWeekday: { fontSize: 10, fontWeight: "700", color: COLORS.grey, letterSpacing: 0.4 },
  shiftMetaRow: { flexDirection: "row", alignItems: "center" },
  shiftMetaText: { fontSize: 12, color: COLORS.grey, marginLeft: 4, fontWeight: "600" },
});
