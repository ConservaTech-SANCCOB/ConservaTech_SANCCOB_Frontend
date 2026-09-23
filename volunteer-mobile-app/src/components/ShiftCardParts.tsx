import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "../utils/colors";
import { parseLocalDate } from "../utils/dateBuckets";

export function DateBadge({
  dateStr,
  size = 72,
  color = COLORS.blueMid,
}: {
  dateStr: string;
  size?: number;
  /** Tints the badge to match the screen the card is shown on. */
  color?: string;
}) {
  const dateObj = parseLocalDate(dateStr);
  const day = dateObj.getDate();
  const weekday = dateObj.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
  return (
    <View
      style={[styles.dateBadge, { width: size, height: size, borderRadius: size * 0.25, backgroundColor: color }]}
    >
      <Text style={[styles.dateBadgeDay, { fontSize: size * 0.36, lineHeight: size * 0.39 }]}>{day}</Text>
      <Text style={[styles.dateBadgeWeekday, { fontSize: size * 0.167 }]}>{weekday}</Text>
    </View>
  );
}

/** Shared chrome for the shift cards, which render in two places and must stay in step. */
export const SHIFT_CARD_STYLES = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#b3c3cc",
    padding: 16,
    marginBottom: 12,
    shadowColor: "#0d2430",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  notch: {
    position: "absolute",
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: "#dde6eb",
    borderWidth: 1,
    borderColor: "#b3c3cc",
  },
  notchBottomLeft: { bottom: 8, left: 8 },
  topNotch: {
    position: "absolute",
    top: 6,
    left: "50%",
    marginLeft: -28,
    width: 56,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#dde6eb",
    borderWidth: 1,
    borderColor: "#b3c3cc",
  },
  timeLabel: { fontSize: 16.5, fontWeight: "700", color: "#1b2a33" },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  metaColumn: { flex: 1, gap: 4 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { flexShrink: 1, fontSize: 13, color: COLORS.grey, fontWeight: "600" },
  divider: { height: 1, backgroundColor: "#b3c3cc", marginTop: 12 },
  actionWrap: { alignSelf: "flex-end", marginTop: 12 },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  actionText: { fontSize: 12.5, fontWeight: "700" },
});

const styles = StyleSheet.create({
  dateBadge: {
    width: 72,
    height: 72,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  dateBadgeDay: { fontSize: 26, fontWeight: "900", color: COLORS.white, lineHeight: 28 },
  dateBadgeWeekday: { fontSize: 12, fontWeight: "700", color: "rgba(255,255,255,0.85)", letterSpacing: 0.5 },
});
