import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../../../utils/colors";
import { TimeSlot } from "../../../types/booking";

const TIME_SLOTS: TimeSlot[] = ["08:00 - 13:00", "14:00 - 17:00", "08:00 - 17:00"];

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  return days;
}

export default function SubmitAvailabilityScreen() {
  const router = useRouter();
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [availability, setAvailability] = useState<Record<number, TimeSlot[]>>({});

  const today = new Date();
  const viewDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthLabel = viewDate.toLocaleString("default", { month: "long", year: "numeric" });
  const days = getMonthDays(year, month);

  const toggleSlot = (slot: TimeSlot) => {
    if (selectedDay === null) return;
    setAvailability((prev) => {
      const current = prev[selectedDay] || [];
      const updated = current.includes(slot) ? current.filter((s) => s !== slot) : [...current, slot];
      return { ...prev, [selectedDay]: updated };
    });
  };

  const handleSubmit = () => {
    if (Object.keys(availability).length === 0) {
      Alert.alert("No availability selected", "Please select at least one day and time slot.");
      return;
    }
    Alert.alert(
      "Availability Submitted",
      "Your availability has been submitted and is pending automatic assignment.",
      [{ text: "OK", onPress: () => router.back() }]
    );
  };

  const selectedSlots = selectedDay !== null ? availability[selectedDay] || [] : [];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.navy} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Submit Availability</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle-outline" size={20} color={COLORS.blue} />
          <Text style={styles.infoText}>
            The system automatically assigns you a day, time slot, and task based on your
            availability and completed skills — you cannot choose a specific booking directly.
          </Text>
        </View>

        <View style={styles.calendarHeader}>
          <Text style={styles.monthLabel}>{monthLabel}</Text>
          <View style={{ flexDirection: "row", gap: 16 }}>
            <TouchableOpacity onPress={() => setMonthOffset((m) => m - 1)}>
              <Ionicons name="chevron-back" size={20} color={COLORS.navy} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMonthOffset((m) => m + 1)}>
              <Ionicons name="chevron-forward" size={20} color={COLORS.navy} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.weekRow}>
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <Text key={i} style={styles.weekDayLabel}>{d}</Text>
          ))}
        </View>

        <View style={styles.daysGrid}>
          {days.map((day, index) => {
            const isSelected = day === selectedDay;
            const hasAvailability = day !== null && availability[day]?.length > 0;
            return (
              <TouchableOpacity
                key={index}
                style={[styles.dayCell, isSelected && styles.dayCellSelected]}
                disabled={day === null}
                onPress={() => day !== null && setSelectedDay(day)}
              >
                {day !== null && (
                  <>
                    <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>{day}</Text>
                    {hasAvailability && !isSelected && <View style={styles.dayDot} />}
                  </>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {selectedDay !== null && (
          <>
            <Text style={styles.slotsLabel}>
              Select Time Slots for {monthLabel.split(" ")[0]} {selectedDay}
            </Text>
            <View style={styles.slotsRow}>
              {TIME_SLOTS.map((slot) => {
                const active = selectedSlots.includes(slot);
                return (
                  <TouchableOpacity
                    key={slot}
                    style={[styles.slotPill, active && styles.slotPillActive]}
                    onPress={() => toggleSlot(slot)}
                  >
                    <Text style={[styles.slotText, active && styles.slotTextActive]}>{slot}</Text>
                    {active && <Ionicons name="checkmark" size={14} color={COLORS.navy} style={{ marginLeft: 4 }} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Ionicons name="close-circle-outline" size={18} color={COLORS.navy} />
          <Text style={styles.submitButtonText}>Submit Availability</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#F0F2F5" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: COLORS.navy },
  infoBanner: { flexDirection: "row", backgroundColor: "#E6F3FB", borderRadius: 10, padding: 12, gap: 10, marginBottom: 20 },
  infoText: { flex: 1, fontSize: 13, color: COLORS.navy, lineHeight: 18 },
  calendarHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  monthLabel: { fontSize: 17, fontWeight: "700", color: COLORS.navy },
  weekRow: { flexDirection: "row", marginBottom: 6 },
  weekDayLabel: { flex: 1, textAlign: "center", fontSize: 12, color: COLORS.grey, fontWeight: "600" },
  daysGrid: { flexDirection: "row", flexWrap: "wrap" },
  dayCell: { width: "14.28%", aspectRatio: 1, alignItems: "center", justifyContent: "center" },
  dayCellSelected: { backgroundColor: COLORS.sky, borderRadius: 100 },
  dayText: { fontSize: 14, color: COLORS.black },
  dayTextSelected: { color: COLORS.navy, fontWeight: "700" },
  dayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.blue, marginTop: 2 },
  slotsLabel: { fontSize: 15, fontWeight: "700", color: COLORS.navy, marginTop: 20, marginBottom: 10 },
  slotsRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  slotPill: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#D8DCDF", borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14 },
  slotPillActive: { backgroundColor: COLORS.sky, borderColor: COLORS.sky },
  slotText: { fontSize: 13, color: COLORS.grey },
  slotTextActive: { color: COLORS.navy, fontWeight: "700" },
  submitButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: COLORS.yellow, borderRadius: 10, paddingVertical: 14, marginTop: 28, gap: 8 },
  submitButtonText: { color: COLORS.navy, fontWeight: "700", fontSize: 15 },
});