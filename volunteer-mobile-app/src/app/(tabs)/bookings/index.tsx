import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, ImageBackground, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getAllShifts, getMyShifts, MyShift, Shift } from "../../../services/shifts";
import { COLORS } from "../../../utils/colors";

export default function BookingsScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<"mine" | "available">("mine");
  const [myShifts, setMyShifts] = useState<MyShift[]>([]);
  const [availableShifts, setAvailableShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setLoadError(false);
    const request = tab === "mine" ? getMyShifts() : getAllShifts();
    request
      .then((data) => (tab === "mine" ? setMyShifts(data as MyShift[]) : setAvailableShifts(data as Shift[])))
      .catch((error) => {
        console.error(`Load ${tab} shifts error:`, error);
        setLoadError(true);
      })
      .finally(() => setLoading(false));
  }, [tab]);

  return (
    <ImageBackground
      source={require("../../../../assets/images/bg_kelpGull.jpg.jpeg")}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <Text style={styles.title}>Upcoming Shifts</Text>
          <TouchableOpacity
            style={styles.availabilityButton}
            onPress={() => router.push("/(tabs)/bookings/submit-availability")}
          >
            <Ionicons name="calendar-outline" size={16} color={COLORS.navy} />
            <Text style={styles.availabilityButtonText}>Availability</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.segmentRow}>
          <TouchableOpacity
            style={[styles.segment, tab === "mine" && styles.segmentActive]}
            onPress={() => setTab("mine")}
          >
            <Text style={[styles.segmentText, tab === "mine" && styles.segmentTextActive]}>My Shifts</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segment, tab === "available" && styles.segmentActive]}
            onPress={() => setTab("available")}
          >
            <Text style={[styles.segmentText, tab === "available" && styles.segmentTextActive]}>Available Shifts</Text>
          </TouchableOpacity>
        </View>

        {tab === "mine" ? (
          <FlatList
            data={myShifts}
            keyExtractor={(item) => item.rosterAssignmentId.toString()}
            contentContainerStyle={{ padding: 20, flexGrow: 1 }}
            renderItem={({ item }) => (
              <View style={styles.shiftCard}>
                <Text style={styles.shiftDate}>{item.shiftDate}</Text>
                <Text style={styles.shiftDetail}>{item.timeSlot}{item.location ? ` · ${item.location}` : ""}</Text>
                <Text style={styles.shiftDetail}>Status: {item.status}</Text>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyStateCard}>
  <Ionicons name="calendar-outline" size={40} color={COLORS.grey} />
  <Text style={styles.emptyTitle}>No shifts scheduled yet</Text>
  <Text style={styles.emptyText}>
    Set your availability and you'll be automatically matched to shifts that fit.
  </Text>
</View> 

            }
          />
        ) : loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={COLORS.blue} />
          </View>
        ) : loadError ? (
          <View style={styles.emptyState}>
            <Ionicons name="warning-outline" size={40} color={COLORS.grey} />
            <Text style={styles.emptyTitle}>Couldn't load shifts</Text>
            <Text style={styles.emptyText}>Switch tabs or try again in a moment.</Text>
          </View>
        ) : (
          <FlatList
            data={availableShifts}
            keyExtractor={(item) => item.shiftId.toString()}
            contentContainerStyle={{ padding: 20, flexGrow: 1 }}
            renderItem={({ item }) => (
              <View style={styles.shiftCard}>
                <Text style={styles.shiftDate}>{item.shiftDate}</Text>
                <Text style={styles.shiftDetail}>{item.timeSlot}{item.location ? ` · ${item.location}` : ""}</Text>
                <Text style={styles.shiftDetail}>Capacity: {item.capacity}</Text>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={40} color={COLORS.grey} />
                <Text style={styles.emptyTitle}>No open shifts right now</Text>
                <Text style={styles.emptyText}>Check back later, admins release shifts here when help's needed.</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(255,255,255,0.75)" },
  container: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  title: { fontSize: 22, fontWeight: "800", color: COLORS.navy },
  availabilityButton: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.amber, borderRadius: 20, paddingVertical: 9, paddingHorizontal: 14, gap: 6 },
  availabilityButtonText: { color: COLORS.navy, fontWeight: "800", fontSize: 13 },
  segmentRow: { flexDirection: "row", marginHorizontal: 20, backgroundColor: COLORS.white, borderRadius: 10, padding: 4, marginBottom: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  segment: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 8 },
  segmentActive: { backgroundColor: COLORS.blue },
  segmentText: { fontSize: 13, color: COLORS.grey, fontWeight: "700" },
  segmentTextActive: { color: COLORS.white },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 12 },
  emptyStateCard: { alignItems: "center", justifyContent: "center", backgroundColor: COLORS.white, borderRadius: 14, padding: 32, gap: 12, margin: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: COLORS.navy },
  emptyText: { fontSize: 13, color: COLORS.grey, textAlign: "center", lineHeight: 18 },
  shiftCard: { backgroundColor: COLORS.white, borderRadius: 14, padding: 16, marginBottom: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  shiftDate: { fontSize: 15, fontWeight: "800", color: COLORS.navy },
  shiftDetail: { fontSize: 13, color: COLORS.grey, marginTop: 4 },
});