import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "../utils/colors";
import { parseLocalDate } from "../utils/dateBuckets";
import { formatTimeSlotLabel } from "../utils/timeSlot";

type SlotTheme = {
  /** Card edge stripe and chip icon. */
  accent: string;
  /** Pale fill for the chip and date badge. */
  soft: string;
  /** Text/icon colour on top of `soft`. */
  ink: string;
  icon: keyof typeof Ionicons.glyphMap;
};

/**
 * Each time slot gets its own colour so a list of shifts scans at a glance:
 * warm sunrise for mornings, sky blue for afternoons, lavender for full days.
 */
const SLOT_THEMES: Record<string, SlotTheme> = {
  "08:00-13:00": { accent: "#f08a3c", soft: "#ffe6d2", ink: "#8a3d06", icon: "cafe-outline" },
  "14:00-17:00": { accent: "#2c9fd9", soft: "#d9f0fc", ink: "#0b4f73", icon: "partly-sunny-outline" },
  "08:00-17:00": { accent: "#8a62d6", soft: "#ece4fb", ink: "#4a2a8f", icon: "sunny-outline" },
};

const FALLBACK_SLOT_THEME: SlotTheme = { accent: "#8aa0ad", soft: "#e8eef1", ink: "#1b2a33", icon: "time-outline" };

export function slotTheme(slot: string): SlotTheme {
  return SLOT_THEMES[slot] ?? FALLBACK_SLOT_THEME;
}

/** The slot name ("Morning", ...) as a tinted pill, used as each shift card's title. */
export function SlotChip({ slot }: { slot: string }) {
  const theme = slotTheme(slot);
  return (
    <View style={[styles.slotChip, { backgroundColor: theme.soft }]}>
      <Ionicons name={theme.icon} size={15} color={theme.accent} />
      <Text style={[styles.slotChipText, { color: theme.ink }]}>{formatTimeSlotLabel(slot)}</Text>
    </View>
  );
}

export function DateBadge({
  dateStr,
  size = 72,
  color = COLORS.blueMid,
  textColor = COLORS.white,
}: {
  dateStr: string;
  size?: number;
  /** Tints the badge to match the screen the card is shown on. */
  color?: string;
  /** For light badge colours (the pastel shifts theme), where white text would vanish. */
  textColor?: string;
}) {
  const dateObj = parseLocalDate(dateStr);
  const day = dateObj.getDate();
  const weekday = dateObj.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
  return (
    <View
      style={[styles.dateBadge, { width: size, height: size, borderRadius: size * 0.25, backgroundColor: color }]}
    >
      <Text style={[styles.dateBadgeDay, { fontSize: size * 0.36, lineHeight: size * 0.39, color: textColor }]}>
        {day}
      </Text>
      <Text style={[styles.dateBadgeWeekday, { fontSize: size * 0.167, color: textColor, opacity: 0.85 }]}>
        {weekday}
      </Text>
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
    // Coloured per time slot by each card (see slotTheme).
    borderLeftWidth: 5,
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
  dateBadgeWeekday: { fontSize: 12, fontWeight: "700", color: COLORS.white, letterSpacing: 0.5 },
  slotChip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  slotChipText: { fontSize: 14.5, fontWeight: "800", letterSpacing: 0.2 },
});
