import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../utils/colors";
import { mockBookings } from "../../data/mockBookings";
import BookingCard from "../../components/BookingCard";

export default function HomeScreen() {
  const upcoming = mockBookings.filter((b) => b.status !== "Cancelled").slice(0, 2);
  const completed = 14;
  const total = 28;
  const percent = Math.round((completed / total) * 100);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingTop: 60 }}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.welcome}>Welcome back, Sarah!</Text>
          <Text style={styles.subtitle}>SANCCOB Cape Town Volunteer</Text>
        </View>
        <View style={styles.avatar}>
          <Ionicons name="person" size={26} color={COLORS.white} />
        </View>
      </View>

      <Text style={styles.sectionTitle}>This Week's Bookings</Text>
      {upcoming.map((booking) => (
        <BookingCard key={booking.id} booking={booking} showActions={false} />
      ))}

      <View style={styles.skillsBanner}>
        <View style={styles.skillsIcon}>
          <Ionicons name="paw-outline" size={22} color={COLORS.navy} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.skillsTitle}>Skills & Training</Text>
          <Text style={styles.skillsSubtitle}>{completed} of {total} skills completed</Text>
        </View>
        <View style={styles.percentCircle}>
          <Text style={styles.percentText}>{percent}%</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Notifications</Text>
      <View style={styles.notification}>
        <View style={styles.dot} />
        <View style={{ flex: 1 }}>
          <Text style={styles.notificationText}>New shift auto-assigned for Saturday, 14 Oct.</Text>
          <Text style={styles.notificationTime}>2 hours ago</Text>
        </View>
      </View>
      <View style={styles.notification}>
        <View style={[styles.dot, { backgroundColor: "transparent" }]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.notificationText}>Your Booking Change Request for Friday, 13 Oct was Approved.</Text>
          <Text style={styles.notificationTime}>1 day ago</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  welcome: { fontSize: 22, fontWeight: "bold", color: COLORS.navy },
  subtitle: { fontSize: 13, color: COLORS.grey, marginTop: 2 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.blue, alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: COLORS.navy, marginTop: 24, marginBottom: 12 },
  skillsBanner: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.sky, borderRadius: 14, padding: 16, marginTop: 8 },
  skillsIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.white, alignItems: "center", justifyContent: "center" },
  skillsTitle: { fontSize: 15, fontWeight: "700", color: COLORS.navy },
  skillsSubtitle: { fontSize: 13, color: COLORS.navy, marginTop: 2 },
  percentCircle: { width: 46, height: 46, borderRadius: 23, borderWidth: 2, borderColor: COLORS.navy, alignItems: "center", justifyContent: "center" },
  percentText: { fontSize: 13, fontWeight: "700", color: COLORS.navy },
  notification: { flexDirection: "row", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F0F2F5", gap: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.sky, marginTop: 5 },
  notificationText: { fontSize: 14, color: COLORS.black },
  notificationTime: { fontSize: 12, color: COLORS.grey, marginTop: 2 },
});