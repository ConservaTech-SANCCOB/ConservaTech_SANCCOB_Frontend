import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { mockShifts, shiftStats } from "../../../data/mockShifts";
import { COLORS } from "../../../utils/colors";

export default function HoursWorkedScreen() {
  const router = useRouter();
  const months = Array.from(new Set(mockShifts.map((s) => s.monthLabel)));

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
        <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 8, paddingBottom: 150 }}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="arrow-back" size={22} color={COLORS.navy} />
            </TouchableOpacity>
            <View style={styles.headerCard}>
              <Text style={styles.headerTitle}>Your Volunteering Stats</Text>
            </View>
          </View>

          

          <View style={styles.sectionTitleCard}>
            <Text style={styles.logTitle}>Completed Shifts Log</Text>
          </View>

          {months.length > 0 ? (
            months.map((month) => (
              <View key={month}>
                <Text style={styles.monthLabel}>{month.toUpperCase()}</Text>
                {mockShifts
                  .filter((s) => s.monthLabel === month)
                  .map((shift) => (
                    <View key={shift.id} style={styles.shiftRow}>
                      <View>
                        <Text style={styles.shiftDate}>{shift.date}</Text>
                        <Text style={styles.shiftDescription}>{shift.description}</Text>
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={styles.shiftHours}>{shift.hours.toFixed(1)} hrs</Text>
                        <Text style={styles.shiftTime}>{shift.timeRange}</Text>
                      </View>
                    </View>
                  ))}
              </View>
            ))
          ) : (
            <View style={styles.emptyStateCard}>
              <Ionicons name="time-outline" size={32} color={COLORS.grey} />
              <Text style={styles.emptyTitle}>No shifts completed yet</Text>
              <Text style={styles.emptyText}>Your worked shifts will show up here once you've completed some.</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 24 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.55)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.9)",
    shadowColor: "#002e4c",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
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
  headerTitle: { fontSize: 17, fontWeight: "800", color: COLORS.navy },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.55)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.9)",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    shadowColor: "#002e4c",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  statLabel: { fontSize: 10, color: COLORS.grey, fontWeight: "700" },
  statValue: { fontSize: 20, color: COLORS.navy, fontWeight: "800", marginTop: 6 },
  sectionTitleCard: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.55)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.9)",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 14,
    shadowColor: "#002e4c",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logTitle: { fontSize: 16, fontWeight: "800", color: COLORS.navy },
  monthLabel: { fontSize: 12, color: COLORS.grey, fontWeight: "700", marginTop: 14, marginBottom: 8 },
  shiftRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.55)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.9)",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    shadowColor: "#002e4c",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
  shiftDate: { fontSize: 14, fontWeight: "800", color: COLORS.black },
  shiftDescription: { fontSize: 12, color: COLORS.grey, marginTop: 2 },
  shiftHours: { fontSize: 14, fontWeight: "800", color: COLORS.blue },
  shiftTime: { fontSize: 12, color: COLORS.grey, marginTop: 2 },
  emptyStateCard: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.55)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.9)",
    borderRadius: 14,
    padding: 24,
    gap: 8,
    shadowColor: "#002e4c",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  emptyTitle: { fontSize: 15, fontWeight: "800", color: COLORS.navy },
emptyText: { fontSize: 13, color: COLORS.grey, textAlign: "center", lineHeight: 18 },
});