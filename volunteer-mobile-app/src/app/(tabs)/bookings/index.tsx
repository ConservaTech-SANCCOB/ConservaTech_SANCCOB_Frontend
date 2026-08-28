import { useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../../utils/colors";
import { mockBookings } from "../../../data/mockBookings";
import { Booking } from "../../../types/booking";
import BookingCard from "../../../components/BookingCard";

export default function UpcomingBookingsScreen() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>(mockBookings);

  const handleCancel = (id: string) => {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: "Cancelled" } : b)));
  };

  const visibleBookings = bookings.filter((b) => b.status !== "Cancelled");

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Upcoming Bookings</Text>
        <TouchableOpacity
          style={styles.availabilityButton}
          onPress={() => router.push("/(tabs)/bookings/submit-availability")}
        >
          <Ionicons name="calendar-outline" size={16} color={COLORS.white} />
          <Text style={styles.availabilityButtonText}>Availability</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={visibleBookings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20 }}
        renderItem={({ item }) => <BookingCard booking={item} onCancel={handleCancel} />}
        ListFooterComponent={<Text style={styles.footerNote}>You can only view your own bookings.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  title: { fontSize: 22, fontWeight: "bold", color: COLORS.navy },
  availabilityButton: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.blue, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, gap: 6 },
  availabilityButtonText: { color: COLORS.white, fontWeight: "600", fontSize: 13 },
  footerNote: { textAlign: "center", color: COLORS.grey, fontSize: 13, marginTop: 10 },
});