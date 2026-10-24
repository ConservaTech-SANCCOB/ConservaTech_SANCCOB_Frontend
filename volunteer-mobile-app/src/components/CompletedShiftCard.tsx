import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { CompletedShift } from "../services/training";
import { COLORS } from "../utils/colors";
import { parseLocalDate } from "../utils/dateBuckets";
import { formatTimeSlotLabel } from "../utils/timeSlot";
import { DateBadge, SHIFT_CARD_STYLES, SlotChip, slotTheme } from "./ShiftCardParts";

// Read only so there is no booking or cancel action
export default function CompletedShiftCard({ shift, hoursLabel }: { shift: CompletedShift; hoursLabel: string }) {
  const slot = slotTheme(shift.timeSlot ?? "");
  const date = parseLocalDate(shift.shiftDate);
  const shortDate = date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const longDate = date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const label = [
    shift.timeSlot ? `${formatTimeSlotLabel(shift.timeSlot)} shift` : "Shift",
    longDate,
    shift.location,
    `${hoursLabel} worked`,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <View style={[SHIFT_CARD_STYLES.card, { borderLeftColor: slot.accent }]} accessible accessibilityLabel={label}>
      <View style={styles.titleRow}>
        {shift.timeSlot ? <SlotChip slot={shift.timeSlot} /> : <View />}
        <View style={styles.hoursPill}>
          <Ionicons name="checkmark-circle" size={14} color={COLORS.greenMid} />
          <Text style={styles.hoursText}>{hoursLabel}</Text>
        </View>
      </View>
      <View style={SHIFT_CARD_STYLES.badgeRow}>
        <DateBadge dateStr={shift.shiftDate} size={56} color={slot.soft} textColor={slot.ink} />
        <View style={SHIFT_CARD_STYLES.metaColumn}>
          {shift.timeSlot && (
            <View style={SHIFT_CARD_STYLES.metaRow}>
              <Ionicons name="time-outline" size={14} color={COLORS.grey} />
              <Text style={SHIFT_CARD_STYLES.metaText}>{shift.timeSlot}</Text>
            </View>
          )}
          <View style={SHIFT_CARD_STYLES.metaRow}>
            <Ionicons name="location-outline" size={14} color={COLORS.grey} />
            <Text style={SHIFT_CARD_STYLES.metaText} numberOfLines={1} ellipsizeMode="tail">
              {shift.location ?? "Volunteer shift"}
            </Text>
          </View>
          <View style={SHIFT_CARD_STYLES.metaRow}>
            <Ionicons name="calendar-outline" size={14} color={COLORS.grey} />
            <Text style={SHIFT_CARD_STYLES.metaText}>{shortDate}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  hoursPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: COLORS.greenBg,
  },
  hoursText: { fontSize: 12.5, fontWeight: "800", color: COLORS.greenMid },
});

//----------------------------------- END OF FILE ---------------------------------//
