import { Ionicons } from "@expo/vector-icons";
import { useCallback, useState } from "react";
import { Image, ImageBackground, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import BookingCard from "../../components/BookingCard";
import NotificationsDropdown from "../../components/NotificationsDropdown";
import { mockBookings } from "../../data/mockBookings";
import { COLORS } from "../../utils/colors";

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const upcoming = mockBookings.slice(0, 2);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // TODO: replace with real API calls once bookings/notifications endpoints exist
    await new Promise((resolve) => setTimeout(resolve, 800));
    setRefreshing(false);
  }, []);

  return (
    <>
      <ImageBackground
        source={require("../../../assets/images/bg_penguin.jpg.jpeg")}
        style={styles.background}
        resizeMode="cover"
      >
         <View style={styles.overlay} />

        <ScrollView
          contentContainerStyle={{ padding: 20, paddingTop: 60 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.white} />
          }
        >
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.welcome}>Welcome back!</Text>
              <Text style={styles.subtitle}>SANCCOB Cape Town Volunteer</Text>
            </View>
            <TouchableOpacity style={styles.bellButton} onPress={() => setNotificationsVisible(true)}>
              <Ionicons name="notifications-outline" size={22} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>This Week's Shifts</Text>
          {upcoming.length > 0 ? (
            upcoming.map((booking) => <BookingCard key={booking.id} booking={booking} />)
          ) : (
            <View style={styles.emptyCard}>
              <Ionicons name="calendar-outline" size={28} color={COLORS.grey} />
              <Text style={styles.emptyCardText}>No shifts yet, set your availability to get started.</Text>
            </View>
          )}
        </ScrollView>
      </ImageBackground>

      <NotificationsDropdown visible={notificationsVisible} onClose={() => setNotificationsVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(255,255,255,0.75)" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  welcome: { fontSize: 24, fontWeight: "800", color: COLORS.navy },
  subtitle: { fontSize: 13, color: COLORS.navy, marginTop: 2, opacity: 0.8 },
  bellButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.blue, alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: COLORS.navy, marginTop: 28, marginBottom: 12, textShadowColor: "rgba(0,0,0,0.4)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  emptyCard: { alignItems: "center", justifyContent: "center", backgroundColor: COLORS.white, borderRadius: 12, padding: 24, gap: 8 },
  emptyCardText: { fontSize: 13, color: COLORS.grey, textAlign: "center" },
});