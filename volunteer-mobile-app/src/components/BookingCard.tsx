import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Booking } from "../types/booking";
import { COLORS } from "../utils/colors";
import StatusBadge from "./StatusBadge";

interface Props {
  booking: Booking;
  showActions?: boolean;
  onCancel?: (id: string) => void;
}

export default function BookingCard({ booking, showActions = true, onCancel }: Props) {
  const router = useRouter();

  const handleCancel = () => {
    Alert.alert(
      "Cancel Booking",
      `Are you sure you want to cancel your booking on ${booking.date}? This cannot be undone.`,
      [
        { text: "Keep Booking", style: "cancel" },
        { text: "Cancel Booking", style: "destructive", onPress: () => onCancel?.(booking.id) },
      ]
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.date}>{booking.date}</Text>
        <StatusBadge status={booking.status} />
      </View>

      <View style={styles.row}>
        <Ionicons name="time-outline" size={16} color={COLORS.blue} />
        <Text style={styles.timeText}>{booking.timeSlot}</Text>
      </View>

      <View style={styles.row}>
        <Ionicons name="leaf-outline" size={16} color={COLORS.grey} />
        <Text style={styles.taskText}>Assigned: {booking.assignedTask}</Text>
      </View>

      {booking.autoAssigned && (
        <View style={styles.autoTag}>
          <Text style={styles.autoTagText}>AUTO-ASSIGNED</Text>
        </View>
      )}

      {showActions && booking.status !== "Cancelled" && (
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelText}>Cancel Booking</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              router.push({
              pathname: "/(tabs)/bookings/request-change" as any,
              params: { bookingId: booking.id },
            })
            }
          >
            <Text style={styles.changeText}>Request Change</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderColor: "#E2E5E8", borderRadius: 12, padding: 16, marginBottom: 14, backgroundColor: COLORS.white },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  date: { fontSize: 16, fontWeight: "700", color: COLORS.navy },
  row: { flexDirection: "row", alignItems: "center", marginTop: 4, gap: 6 },
  timeText: { fontSize: 14, color: COLORS.black },
  taskText: { fontSize: 14, color: COLORS.grey },
  autoTag: { marginTop: 10, alignSelf: "flex-start", backgroundColor: "#E6F3FB", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  autoTagText: { fontSize: 11, fontWeight: "700", color: COLORS.blue },
  actionsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 14, borderTopWidth: 1, borderTopColor: "#F0F2F5", paddingTop: 12 },
  cancelButton: { borderWidth: 1, borderColor: COLORS.red, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14 },
  cancelText: { color: COLORS.red, fontWeight: "600", fontSize: 13 },
  changeText: { color: COLORS.blue, fontWeight: "600", fontSize: 13, textDecorationLine: "underline" },
});