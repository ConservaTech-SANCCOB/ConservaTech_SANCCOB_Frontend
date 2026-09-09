import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../../../utils/colors";
import { getMyAvailability, updateMyAvailability, AvailabilitySlot, TimeBlock } from "../../../services/availability";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const SLOTS: TimeBlock[] = ["08:00-13:00", "14:00-17:00", "08:00-17:00"];

function slotKey(day: string, slot: string) {
  return `${day}-${slot}`;
}

export default function SubmitAvailabilityScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getMyAvailability()
      .then((slots) => {
        const keys = slots.map((s) => slotKey(s.dayOfWeek, s.timeSlot));
        setSelected(new Set(keys));
      })
      .catch((error) => {
        console.error("Load availability error:", error);
        Alert.alert("Couldn't load availability", "Starting from a blank grid instead.");
      })
      .finally(() => setLoading(false));
  }, []);

  const toggle = (day: string, slot: string) => {
    const key = slotKey(day, slot);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSave = async () => {
    const slots: AvailabilitySlot[] = DAYS.flatMap((day) =>
      SLOTS.filter((slot) => selected.has(slotKey(day, slot))).map((timeSlot) => ({
        dayOfWeek: day,
        timeSlot,
      }))
    );
    setSaving(true);
    try {
      await updateMyAvailability(slots);
      Alert.alert("Saved", "Your availability has been updated.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error("Save availability error:", error);
      Alert.alert("Couldn't save", "Something went wrong, try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.blue} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.topRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.navy} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Submit Availability</Text>
      </View>

      <View style={styles.submitRow}>
        <TouchableOpacity style={styles.submitButton} onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color={COLORS.navy} />
          ) : (
            <Text style={styles.submitButtonText}>Submit</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}>
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle-outline" size={20} color={COLORS.navy} />
          <Text style={styles.infoText}>
            The system automatically assigns you a day, time slot, and task based on your availability and completed skills, you cannot choose a specific booking directly.
          </Text>
        </View>

        {DAYS.map((day) => (
          <View key={day} style={styles.daySection}>
            <Text style={styles.dayLabel}>Select Time Slots for {day}</Text>
            <View style={styles.slotRow}>
              {SLOTS.map((slot) => {
                const active = selected.has(slotKey(day, slot));
                return (
                  <TouchableOpacity
                    key={slot}
                    style={[styles.slotButton, active && styles.slotButtonActive]}
                    onPress={() => toggle(day, slot)}
                  >
                    <Text style={[styles.slotText, active && styles.slotTextActive]}>{slot}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E1E8ED" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  topRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 14, gap: 12 },
  headerTitle: { fontSize: 19, fontWeight: "800", color: COLORS.navy },
  submitRow: { alignItems: "flex-end", paddingHorizontal: 20, marginTop: -8, marginBottom: 12, zIndex: 1 },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 215, 63, 0.9)",
    borderWidth: 2,
    borderColor: "#FFD73F",
    borderRadius: 22,
    paddingVertical: 13,
    paddingHorizontal: 22,
    gap: 6,
    shadowColor: "#FFD73F",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 10,
  },
  submitButtonText: { color: COLORS.navy, fontWeight: "900", fontSize: 16 },
  infoBanner: { flexDirection: "row", backgroundColor: COLORS.amberBg, borderRadius: 10, padding: 12, gap: 10, marginBottom: 20 },
  infoText: { flex: 1, fontSize: 12, color: COLORS.navy, lineHeight: 17 },
  daySection: { marginBottom: 20, paddingBottom: 20, borderBottomWidth: 2, borderBottomColor: COLORS.navy },
  dayLabel: { fontSize: 15, fontWeight: "900", color: COLORS.navy, marginBottom: 10, letterSpacing: 0.2 },
  slotRow: { flexDirection: "row", gap: 10 },
  slotButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#C5D0D8",
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  slotButtonActive: {
    backgroundColor: "rgba(83, 199, 255, 0.35)",
    borderWidth: 2,
    borderColor: "#00D4FF",
    shadowColor: "#00D4FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 10,
  },
  slotText: { fontSize: 13, color: COLORS.grey, fontWeight: "800" },
  slotTextActive: { color: COLORS.navy, fontWeight: "900" },
});