import { useRef } from "react";
import { Alert, Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { MyShift } from "../services/shifts";
import { COLORS } from "../utils/colors";
import { getRelativeLabel } from "../utils/dateBuckets";
import { formatTimeSlotLabel, hasShiftEnded } from "../utils/timeSlot";
import { DateBadge, SHIFT_CARD_STYLES } from "./ShiftCardParts";

export default function MyShiftCard({
  item,
  cancellationPending = false,
  accent = COLORS.blueMid,
}: {
  item: MyShift;
  /** A pending cancellation request already exists for this shift — hides the cancel action. */
  cancellationPending?: boolean;
  /** Tints the date badge and Cancel button to match the screen this card is shown on. */
  accent?: string;
}) {
  const router = useRouter();
  const ended = hasShiftEnded(item.shiftDate, item.timeSlot);
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 6 }).start();
  };
  const pressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 10 }).start();
  };

  const requestChange = () => {
    router.push({
      pathname: "/(tabs)/bookings/request-change",
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
          `${formatTimeSlotLabel(item.timeSlot)} shift`,
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
      <Animated.View style={[SHIFT_CARD_STYLES.card, { transform: [{ scale }] }]}>
        <View style={[SHIFT_CARD_STYLES.notch, SHIFT_CARD_STYLES.notchBottomLeft]} />
        <View style={SHIFT_CARD_STYLES.topNotch} />
        <View style={styles.titleRow}>
          <Text style={SHIFT_CARD_STYLES.timeLabel}>{formatTimeSlotLabel(item.timeSlot)}</Text>
          {!ended && cancellationPending && (
            <View style={styles.pendingDot} accessible accessibilityLabel="Cancellation pending" />
          )}
        </View>
        <View style={SHIFT_CARD_STYLES.badgeRow}>
          <DateBadge dateStr={item.shiftDate} size={56} color={accent} />
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
        {!ended && !cancellationPending && <View style={SHIFT_CARD_STYLES.divider} />}
        {!ended && !cancellationPending && (
          <TouchableOpacity
            style={SHIFT_CARD_STYLES.actionWrap}
            onPress={requestChange}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel="Cancel shift"
          >
            <View style={[SHIFT_CARD_STYLES.action, { backgroundColor: accent }]}>
              <Ionicons name="close-circle-outline" size={14} color={COLORS.white} />
              <Text style={[SHIFT_CARD_STYLES.actionText, styles.cancelActionText]}>Cancel</Text>
            </View>
          </TouchableOpacity>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  cancelActionText: { color: COLORS.white },
  // Same 8px round dot as the unread indicator in notifications.tsx, in amber for "pending".
  pendingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.amber },
});
