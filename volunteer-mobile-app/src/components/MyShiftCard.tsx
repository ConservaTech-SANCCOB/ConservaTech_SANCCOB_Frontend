import { useRef } from "react";
import { Alert, Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { GLASS_CARD, GLASS_SHADOW_MD } from "../constants/glassCard";
import { MyShift } from "../services/shifts";
import { COLORS } from "../utils/colors";
import { getRelativeLabel } from "../utils/dateBuckets";
import { formatTimeSlotLabel, hasShiftEnded } from "../utils/timeSlot";
import { DateBadge } from "./ShiftCardParts";

export default function MyShiftCard({ item }: { item: MyShift }) {
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
          `${item.shiftDate}${item.location ? ` · ${item.location}` : ""}\nStatus: ${item.status}`,
          ended
            ? [{ text: "Close", style: "cancel" }]
            : [
                { text: "Close", style: "cancel" },
                { text: "Request Change", onPress: requestChange },
              ]
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
          <View style={styles.metaColumn}>
            <View style={styles.metaRow}>
              <Ionicons name="time-outline" size={16} color={COLORS.grey} />
              <Text style={styles.metaText}>{item.timeSlot}</Text>
            </View>
            {item.location && (
              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={16} color={COLORS.grey} />
                <Text style={styles.metaText} numberOfLines={1} ellipsizeMode="tail">
                  {item.location}
                </Text>
              </View>
            )}
          </View>
          {!ended && (
            <TouchableOpacity style={styles.changeButtonWrap} onPress={requestChange} hitSlop={6}>
              <LinearGradient
                colors={["#6FD0FF", "#2BA8E0"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.changeButton}
              >
                <Ionicons name="swap-horizontal-outline" size={13} color={COLORS.white} />
                <Text style={styles.changeButtonText}>Request Change</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
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
    marginBottom: 18,
  },
  shiftCardBody: { flex: 1, gap: 8 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  shiftTimeLabel: { fontSize: 19, fontWeight: "800", color: COLORS.navy },
  relativeLabel: { fontSize: 13, fontWeight: "700", color: COLORS.grey },
  metaColumn: { gap: 4 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { flexShrink: 1, fontSize: 14, color: COLORS.grey, fontWeight: "600" },
  changeButtonWrap: {
    alignSelf: "flex-start",
    marginTop: 4,
    borderRadius: 14,
    borderWidth: 0.75,
    borderColor: "rgba(255,255,255,0.5)",
    shadowColor: "#002e4c",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  changeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 13.5,
  },
  changeButtonText: { fontSize: 12, fontWeight: "800", color: COLORS.white },
});
