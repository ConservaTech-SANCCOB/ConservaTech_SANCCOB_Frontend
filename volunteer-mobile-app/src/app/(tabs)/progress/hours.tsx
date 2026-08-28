import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { mockShifts, shiftStats } from "../../../data/mockShifts";
import { COLORS } from "../../../utils/colors";

export default function HoursWorkedScreen() {
  const router = useRouter();

  const months = Array.from(new Set(mockShifts.map((s) => s.monthLabel)));

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.navy} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hours & Days Worked</Text>
        <View style={{ width: 24 }} />
      </View>

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

        {months.map((month) => (
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
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#F0F2F5" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: COLORS.navy },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: "#F5F7F8", borderRadius: 10, padding: 12, alignItems: "center" },
  statLabel: { fontSize: 10, color: COLORS.grey, fontWeight: "600" },
  statValue: { fontSize: 18, color: COLORS.navy, fontWeight: "700", marginTop: 4 },
  logTitle: { fontSize: 16, fontWeight: "700", color: COLORS.navy, marginBottom: 14 },
  monthLabel: { fontSize: 12, color: COLORS.grey, fontWeight: "600", marginTop: 12, marginBottom: 8 },
  shiftRow: { flexDirection: "row", justifyContent: "space-between", borderWidth: 1, borderColor: "#E2E5E8", borderRadius: 10, padding: 14, marginBottom: 8 },
  shiftDate: { fontSize: 14, fontWeight: "700", color: COLORS.black },
  shiftDescription: { fontSize: 12, color: COLORS.grey, marginTop: 2 },
  shiftHours: { fontSize: 14, fontWeight: "700", color: COLORS.blue },
  shiftTime: { fontSize: 12, color: COLORS.grey, marginTop: 2 },
});