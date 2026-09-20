import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text } from "react-native";
import { COLORS } from "../utils/colors";
import { parseLocalDate } from "../utils/dateBuckets";

export function DateBadge({ dateStr, size = 72 }: { dateStr: string; size?: number }) {
  const dateObj = parseLocalDate(dateStr);
  const day = dateObj.getDate();
  const weekday = dateObj.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
  return (
    <LinearGradient
      colors={["#00567f", "#002e4c"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[styles.dateBadge, { width: size, height: size, borderRadius: size * 0.25 }]}
    >
      <Text style={[styles.dateBadgeDay, { fontSize: size * 0.36, lineHeight: size * 0.39 }]}>{day}</Text>
      <Text style={[styles.dateBadgeWeekday, { fontSize: size * 0.167 }]}>{weekday}</Text>
    </LinearGradient>
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
});
