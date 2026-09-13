import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ImageBackground, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import BookingCard from "../../../components/BookingCard";
import { mockBookings } from "../../../data/mockBookings";
import { COLORS } from "../../../utils/colors";

export default function HomeScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const upcoming = mockBookings.slice(0, 2);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setRefreshing(false);
  }, []);

  return (
    <ImageBackground
      source={require("../../../../assets/images/bg_penguin.jpg.jpeg")}
      style={styles.background}
      resizeMode="cover"
    >
      <LinearGradient
        colors={["rgba(255,255,255,0.86)", "rgba(255,255,255,0.76)", "rgba(255,255,255,0.84)"]}
        locations={[0, 0.42, 1]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingTop: 60, paddingBottom: 150 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.navy} />
        }
      >
        <View style={styles.headerCard}>
          <LinearGradient colors={["#00567f", "#002e4c"]} start={{ x: 0, y: 0 }} end={{ x: 0.7, y: 1 }} style={styles.avatar}>
            <Text style={styles.avatarInitials}>SV</Text>
          </LinearGradient>
          <View>
            <Text style={styles.welcomeLabel}>WELCOME BACK</Text>
            <Text style={styles.name}>Your Name</Text>
          </View>

          <TouchableOpacity style={styles.bellButtonQuiet} onPress={() => router.push("/(tabs)/home/notifications")}>
  <Ionicons name="notifications-outline" size={24} color="#3f5f75" />
  <View style={styles.bellDot} />
</TouchableOpacity>
        </View>

        <View style={styles.sectionChip}>
          <Text style={styles.sectionChipText}>THIS WEEK'S SHIFTS</Text>
        </View>

        {upcoming.length > 0 ? (
          upcoming.map((booking) => <BookingCard key={booking.id} booking={booking} />)
        ) : (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="calendar-outline" size={26} color="#007fb0" />
            </View>
            <Text style={styles.emptyTitle}>No shifts yet</Text>
            <Text style={styles.emptyText}>Set your availability and you'll be automatically matched to shifts that fit.</Text>
          </View>
        )}
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  headerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    padding: 14,
    paddingLeft: 16,
    paddingRight: 56,
    borderRadius: 22,
    marginBottom: 12,
    backgroundColor: "rgba(255,255,255,0.55)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.9)",
    shadowColor: "#002e4c",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  avatarInitials: { color: COLORS.white, fontSize: 15, fontWeight: "800" },
  welcomeLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1.1, color: "#3f5f75" },
  name: { fontSize: 18, fontWeight: "800", color: COLORS.navy, marginTop: 2 },
  bellButtonQuiet: {
  position: "absolute",
  top: 10,
  right: 10,
  width: 42,
  height: 42,
  alignItems: "center",
  justifyContent: "center",
},
  bellDot: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.amber,
    borderWidth: 1.6,
    borderColor: "rgba(255,255,255,0.9)",
  },
  sectionChip: {
    alignSelf: "flex-start",
    borderRadius: 11,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 10,
    marginBottom: 12,
    backgroundColor: "rgba(255,255,255,0.55)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.9)",
    shadowColor: "#002e4c",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  sectionChipText: { fontSize: 11, fontWeight: "800", letterSpacing: 1.1, color: "#00567f" },
  emptyCard: {
    alignItems: "center",
    borderRadius: 20,
    padding: 26,
    paddingHorizontal: 20,
    backgroundColor: "rgba(255,255,255,0.55)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.9)",
    shadowColor: "#002e4c",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  emptyIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "rgba(233,247,255,0.55)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "rgba(0,120,180,0.5)",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
  },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: COLORS.navy, marginTop: 14 },
  emptyText: { fontSize: 13, fontWeight: "500", color: "#3d5260", textAlign: "center", maxWidth: 255, marginTop: 6 },
});