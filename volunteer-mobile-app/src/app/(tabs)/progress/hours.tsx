import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { mockShifts, shiftStats } from "../../../data/mockShifts";
import { COLORS } from "../../../utils/colors";

export default function HoursWorkedScreen() {
  const router = useRouter();
  const months = Array.from(new Set(mockShifts.map((s) => s.monthLabel)));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.navy} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Volunteering Stats</Text>
        <View style={{ width: 24 }} />
      </View>

      <ImageBackground
        source={require("../../../../assets/images/bg_kelpGull.jpg.jpeg")}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>TOTAL HOURS</Text>
              <Text style={styles.statValue}>{shiftStats.totalHours}h</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>TOTAL DAYS</Text>
              <Text style={styles.statValue}>{shiftStats.totalDays} days</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>THIS MONTH</Text>
              <Text style={styles.statValue}>{shiftStats.hoursThisMonth}h</Text>
            </View>
          </View>

          <Text style={styles.logTitle}>Completed Shifts Log</Text>

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
            <View style={styles.emptyState}>
              <Ionicons name="time-outline" size={32} color={COLORS.grey} />
              <Text style={styles.emptyTitle}>No shifts completed yet</Text>
              <Text style={styles.emptyText}>Your worked shifts will show up here once you've completed some.</Text>
            </View>
          )}
        </ScrollView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, backgroundColor: COLORS.white },
  headerTitle: { fontSize: 17, fontWeight: "800", color: COLORS.navy },
  background: { flex: 1 },
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(255,255,255,0.75)" },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: 12, padding: 14, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  statLabel: { fontSize: 10, color: COLORS.grey, fontWeight: "700" },
  statValue: { fontSize: 20, color: COLORS.navy, fontWeight: "800", marginTop: 6 },
  logTitle: { fontSize: 16, fontWeight: "800", color: COLORS.navy, marginBottom: 14 },
  monthLabel: { fontSize: 12, color: COLORS.grey, fontWeight: "700", marginTop: 14, marginBottom: 8 },
  shiftRow: { flexDirection: "row", justifyContent: "space-between", backgroundColor: COLORS.white, borderRadius: 12, padding: 14, marginBottom: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  shiftDate: { fontSize: 14, fontWeight: "800", color: COLORS.black },
  shiftDescription: { fontSize: 12, color: COLORS.grey, marginTop: 2 },
  shiftHours: { fontSize: 14, fontWeight: "800", color: COLORS.blue },
  shiftTime: { fontSize: 12, color: COLORS.grey, marginTop: 2 },
  emptyState: { alignItems: "center", padding: 24, gap: 8 },
  emptyTitle: { fontSize: 15, fontWeight: "800", color: COLORS.navy },
  emptyText: { fontSize: 13, color: COLORS.grey, textAlign: "center", lineHeight: 18 },
});