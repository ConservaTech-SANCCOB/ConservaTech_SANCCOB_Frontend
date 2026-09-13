import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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
      <LinearGradient
        colors={["rgba(255,255,255,0.86)", "rgba(255,255,255,0.76)", "rgba(255,255,255,0.84)"]}
        locations={[0, 0.42, 1]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.container} edges={["top"]}>
        <FlatList
          ListHeaderComponent={
            <>
              <View style={styles.headerRow}>
                <View style={styles.headerCard}>
                  <Text style={styles.title}>Upcoming Shifts</Text>
                </View>
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
            </>
          }
          data={tab === "mine" ? myShifts : availableShifts}
          keyExtractor={(item: any) => (tab === "mine" ? item.rosterAssignmentId : item.shiftId).toString()}
          contentContainerStyle={{ padding: 20, paddingTop: 8, paddingBottom: 150, flexGrow: 1 }}
          renderItem={({ item }: any) => (
            <View style={styles.shiftCard}>
              <Text style={styles.shiftDate}>{item.shiftDate}</Text>
              <Text style={styles.shiftDetail}>{item.timeSlot}{item.location ? ` · ${item.location}` : ""}</Text>
              <Text style={styles.shiftDetail}>
                {tab === "mine" ? `Status: ${item.status}` : `Capacity: ${item.capacity}`}
              </Text>
            </View>
          )}
          ListEmptyComponent={
            loading ? (
              <View style={styles.center}>
                <ActivityIndicator color={COLORS.blue} />
              </View>
            ) : loadError ? (
              <View style={styles.emptyStateCard}>
                <Ionicons name="warning-outline" size={40} color={COLORS.grey} />
                <Text style={styles.emptyTitle}>Couldn't load shifts</Text>
                <Text style={styles.emptyText}>Switch tabs or try again in a moment.</Text>
              </View>
            ) : (
              <View style={styles.emptyStateCard}>
                <Ionicons name="calendar-outline" size={40} color={COLORS.grey} />
                <Text style={styles.emptyTitle}>
                  {tab === "mine" ? "No shifts scheduled yet" : "No open shifts right now"}
                </Text>
                <Text style={styles.emptyText}>
                  {tab === "mine"
                    ? "Set your availability and you'll be automatically matched to shifts that fit."
                    : "Check back later, admins release shifts here when help's needed."}
                </Text>
              </View>
            )
          }
        />
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  headerCard: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.55)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.9)",
    shadowColor: "#002e4c",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  title: { fontSize: 20, fontWeight: "800", color: COLORS.navy },
  availabilityButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.55)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.9)",
    borderRadius: 20,
    paddingVertical: 9,
    paddingHorizontal: 14,
    gap: 6,
    shadowColor: "#002e4c",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  availabilityButtonText: { color: COLORS.navy, fontWeight: "800", fontSize: 13 },
  segmentRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.55)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.9)",
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    shadowColor: "#002e4c",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  segment: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 10 },
  segmentActive: { backgroundColor: COLORS.blue },
  segmentText: { fontSize: 13, color: COLORS.grey, fontWeight: "700" },
  segmentTextActive: { color: COLORS.white },
  center: { paddingVertical: 40, alignItems: "center" },
  emptyStateCard: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.55)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.9)",
    borderRadius: 18,
    padding: 26,
    gap: 12,
    shadowColor: "#002e4c",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: COLORS.navy },
  emptyText: { fontSize: 13, color: COLORS.grey, textAlign: "center", lineHeight: 18 },
  shiftCard: {
    backgroundColor: "rgba(255,255,255,0.55)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.9)",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#002e4c",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
  shiftDate: { fontSize: 15, fontWeight: "800", color: COLORS.navy },
  shiftDetail: { fontSize: 13, color: COLORS.grey, marginTop: 4 },
});