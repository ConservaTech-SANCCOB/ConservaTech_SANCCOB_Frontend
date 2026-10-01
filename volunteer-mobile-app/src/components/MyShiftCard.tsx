import { useRef } from "react";
import { Alert, Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { MyShift } from "../services/shifts";
import { COLORS } from "../utils/colors";
import { getRelativeLabel } from "../utils/dateBuckets";
import { formatTimeSlotLabel, hasShiftEnded } from "../utils/timeSlot";
import { DateBadge, SHIFT_CARD_STYLES, SlotChip, slotTheme } from "./ShiftCardParts";

export default function MyShiftCard({
  item,
  cancellationPending = false,
  accent = COLORS.blueMid,
  accentText = COLORS.white,
}: {
  item: MyShift;
  cancellationPending?: boolean;
  /** Tints the Cancel button to match the screen this card is shown on (the rest follows the time slot). */
  accent?: string;
  /** Text/icon colour on top of `accent`; override when the accent is too light for white. */
  accentText?: string;
}) {
  const router = useRouter();
  const ended = hasShiftEnded(item.shiftDate, item.timeSlot);
  const slot = slotTheme(item.timeSlot);
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 6 }).start();
  };
  const pressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 10 }).start();
  };

  const requestChange = () => {
    router.push({
      pathname: "/request-change",
      params: {
        bookingId: String(item.rosterAssignmentId),
        shiftDate: item.shiftDate,
        timeSlot: item.timeSlot,
        location: item.location ?? "",
        status: item.status,
      },
    });
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPressIn={pressIn}
      onPressOut={pressOut}
      onPress={() =>
        Alert.alert(
          item.timeSlot ? `${formatTimeSlotLabel(item.timeSlot)} shift` : "Shift",
          `${item.shiftDate}${item.location ? ` · ${item.location}` : ""}\nStatus: ${item.status}${
            cancellationPending ? "\nCancellation request pending review" : ""
          }`,
          ended || cancellationPending
            ? [{ text: "Close", style: "cancel" }]
            : [
                { text: "Close", style: "cancel" },
                { text: "Cancel Shift", onPress: requestChange },
              ]
        )
      }
    >
      <Animated.View
        style={[SHIFT_CARD_STYLES.card, { borderLeftColor: slot.accent, transform: [{ scale }] }]}
      >
        <View style={[SHIFT_CARD_STYLES.notch, SHIFT_CARD_STYLES.notchBottomLeft]} />
        <View style={SHIFT_CARD_STYLES.topNotch} />
        <View style={styles.titleRow}>
          <SlotChip slot={item.timeSlot} />
        </View>
        <View style={SHIFT_CARD_STYLES.badgeRow}>
          <DateBadge dateStr={item.shiftDate} size={56} color={slot.soft} textColor={slot.ink} />
          <View style={SHIFT_CARD_STYLES.metaColumn}>
            <View style={SHIFT_CARD_STYLES.metaRow}>
              <Ionicons name="time-outline" size={14} color={COLORS.grey} />
              <Text style={SHIFT_CARD_STYLES.metaText}>{item.timeSlot}</Text>
            </View>
            {item.location && (
              <View style={SHIFT_CARD_STYLES.metaRow}>
                <Ionicons name="location-outline" size={14} color={COLORS.grey} />
                <Text style={SHIFT_CARD_STYLES.metaText} numberOfLines={1} ellipsizeMode="tail">
                  {item.location}
                </Text>
              </View>
            )}
            <View style={SHIFT_CARD_STYLES.metaRow}>
              <Ionicons name="calendar-outline" size={14} color={COLORS.grey} />
              <Text style={SHIFT_CARD_STYLES.metaText}>{getRelativeLabel(item.shiftDate)}</Text>
            </View>
          </View>
        </View>
        {!ended && <View style={SHIFT_CARD_STYLES.divider} />}
        {!ended && cancellationPending && (
          <View
            style={[SHIFT_CARD_STYLES.actionWrap, styles.hidden]}
            pointerEvents="none"
            aria-hidden
          >
            <View style={SHIFT_CARD_STYLES.action}>
              <Ionicons name="close-circle-outline" size={14} />
              <Text style={SHIFT_CARD_STYLES.actionText}>Cancel</Text>
            </View>
          </View>
        )}
        {!ended && !cancellationPending && (
          <TouchableOpacity
            style={SHIFT_CARD_STYLES.actionWrap}
            onPress={requestChange}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel="Cancel shift"
          >
            <View style={[SHIFT_CARD_STYLES.action, { backgroundColor: accent }]}>
              <Ionicons name="close-circle-outline" size={14} color={accentText} />
              <Text style={[SHIFT_CARD_STYLES.actionText, { color: accentText }]}>Cancel</Text>
            </View>
          </TouchableOpacity>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  hidden: { opacity: 0 },
});
