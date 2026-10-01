import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Booking } from "../types/booking";
import { COLORS } from "../utils/colors";
import StatusBadge from "./StatusBadge";

interface Props {
  booking: Booking;
}

export default function BookingCard({ booking }: Props) {
  const router = useRouter();

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
        <Ionicons name="paw-outline" size={16} color={COLORS.grey} />
        <Text style={styles.taskText}>Assigned: {booking.assignedTask}</Text>
      </View>

      {booking.autoAssigned && (
        <View style={styles.autoTag}>
          <Text style={styles.autoTagText}>AUTO-ASSIGNED</Text>
        </View>
      )}

      <View style={styles.actionsRow}>
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/(tabs)/bookings/request-change",
              params: { bookingId: booking.id },
            })
          }
        >
          <Text style={styles.changeText}>Request Change</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  date: { fontSize: 16, fontWeight: "800", color: COLORS.navy },
  row: { flexDirection: "row", alignItems: "center", marginTop: 6, gap: 8 },
  timeText: { fontSize: 14, color: COLORS.black, fontWeight: "600" },
  taskText: { fontSize: 14, color: COLORS.grey },
  autoTag: { marginTop: 12, alignSelf: "flex-start", backgroundColor: COLORS.sky, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  autoTagText: { fontSize: 10, fontWeight: "800", color: COLORS.navy, letterSpacing: 0.3 },
  actionsRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 14, borderTopWidth: 1, borderTopColor: "#F0F2F5", paddingTop: 12 },
  changeText: { color: COLORS.blue, fontWeight: "700", fontSize: 13 },
});