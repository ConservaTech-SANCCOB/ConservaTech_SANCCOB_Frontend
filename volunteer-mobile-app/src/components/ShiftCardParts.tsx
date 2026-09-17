import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "../utils/colors";
import { parseLocalDate } from "../utils/dateBuckets";

export function DateBadge({ dateStr }: { dateStr: string }) {
  const dateObj = parseLocalDate(dateStr);
  const day = dateObj.getDate();
  const weekday = dateObj.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
  return (
    <LinearGradient colors={["#6FD0FF", "#2BA8E0"]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.dateBadge}>
      <Text style={styles.dateBadgeDay}>{day}</Text>
      <Text style={styles.dateBadgeWeekday}>{weekday}</Text>
    </LinearGradient>
  );
}

export function ShiftMeta({ timeSlot, location }: { timeSlot: string; location: string | null }) {
  return (
    <View style={styles.shiftMetaRow}>
      <Ionicons name="time-outline" size={16} color={COLORS.grey} />
      <Text style={styles.shiftMetaText}>{timeSlot}</Text>
      {location ? (
        <>
          <Text style={styles.metaDot}>·</Text>
          <Ionicons name="location-outline" size={16} color={COLORS.grey} />
          <Text style={styles.shiftMetaText} numberOfLines={1} ellipsizeMode="tail">
            {location}
          </Text>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  dateBadge: {
    width: 72,
    height: 72,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.7)",
    shadowColor: "#002e4c",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  dateBadgeDay: { fontSize: 26, fontWeight: "900", color: COLORS.white, lineHeight: 28 },
  dateBadgeWeekday: { fontSize: 12, fontWeight: "700", color: "rgba(255,255,255,0.85)", letterSpacing: 0.5 },
  shiftMetaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  shiftMetaText: { flexShrink: 1, fontSize: 14, color: COLORS.grey, fontWeight: "600" },
  metaDot: { fontSize: 14, color: COLORS.grey, fontWeight: "700" },
});
