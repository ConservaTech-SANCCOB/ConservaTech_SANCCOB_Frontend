import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, ImageBackground } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../../../utils/colors";
import { getTabBarStyle } from "../../../constants/tabBar";
import { GLASS_CARD, GLASS_SHADOW_LG, GLASS_SHADOW_MD } from "../../../constants/glassCard";
import { TIME_SLOT_LABELS } from "../../../utils/timeSlot";
import { getMyAvailability, updateMyAvailability, AvailabilitySlot, TimeBlock } from "../../../services/availability";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const SLOTS: TimeBlock[] = ["08:00-13:00", "14:00-17:00", "08:00-17:00"];

function slotKey(day: string, slot: string) {
  return `${day}-${slot}`;
}

export default function SubmitAvailabilityScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
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

  useEffect(() => {
    const parent = navigation.getParent();
    parent?.setOptions({ tabBarStyle: { display: "none" } });
    return () => {
      parent?.setOptions({ tabBarStyle: getTabBarStyle(insets.bottom) });
    };
  }, [navigation, insets.bottom]);

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
        <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 8, paddingBottom: 110 }}>
          <View style={styles.topRow}>
            <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="arrow-back" size={22} color={COLORS.navy} />
            </TouchableOpacity>
            <View style={styles.titleCard}>
              <Text style={styles.headerTitle}>Submit Availability</Text>
              <Text style={styles.headerSubtitle}>Pick the days and time blocks you're free to help</Text>
            </View>
          </View>

          <View style={styles.infoBanner}>
            <Ionicons name="information-circle-outline" size={20} color={COLORS.navy} />
            <Text style={styles.infoText}>
              The system automatically assigns you a day, time slot, and task based on your availability and completed skills, you cannot choose a specific booking directly.
            </Text>
          </View>

          {DAYS.map((day) => (
            <View key={day} style={styles.daySection}>
              <View style={styles.dayLabelRow}>
                <Ionicons name="calendar-outline" size={16} color={COLORS.navy} />
                <Text style={styles.dayLabel}>{day}</Text>
              </View>
              <View style={styles.slotRow}>
                {SLOTS.map((slot) => {
                  const active = selected.has(slotKey(day, slot));
                  return (
                    <TouchableOpacity
                      key={slot}
                      style={[styles.slotButton, active && styles.slotButtonActive]}
                      onPress={() => toggle(day, slot)}
                    >
                      <Text style={[styles.slotLabel, active && styles.slotTextActive]}>{TIME_SLOT_LABELS[slot]}</Text>
                      <Text style={[styles.slotText, active && styles.slotTextActive]}>{slot}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>

      <View style={[styles.bottomBar, { bottom: 12 + insets.bottom }]}>
        <TouchableOpacity style={styles.bottomBarButton} onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color={COLORS.navy} />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.navy} />
              <Text style={styles.bottomBarButtonText}>Submit Availability</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  topRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 16 },
  titleCard: {
    ...GLASS_CARD,
    ...GLASS_SHADOW_LG,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 18,
  },
  headerTitle: { fontSize: 17, fontWeight: "800", color: COLORS.navy },
  headerSubtitle: { fontSize: 12, color: COLORS.grey, marginTop: 3, fontWeight: "600" },
  infoBanner: {
    ...GLASS_CARD,
    ...GLASS_SHADOW_LG,
    flexDirection: "row",
    borderRadius: 14,
    padding: 14,
    gap: 10,
    marginBottom: 20,
  },
  infoText: { flex: 1, fontSize: 12, color: COLORS.navy, lineHeight: 17 },
  daySection: {
    ...GLASS_CARD,
    ...GLASS_SHADOW_MD,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  dayLabelRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  dayLabel: { fontSize: 13, fontWeight: "900", color: COLORS.navy, letterSpacing: 0.2 },
  slotRow: { flexDirection: "row", gap: 10 },
  slotButton: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.9)",
    borderRadius: 16,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    shadowColor: "#002e4c",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  slotButtonActive: {
    backgroundColor: "rgba(83, 199, 255, 0.35)",
    borderWidth: 0,
    shadowColor: "#00D4FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 10,
  },
  slotLabel: { fontSize: 13, color: COLORS.navy, fontWeight: "800" },
  slotText: { fontSize: 11, color: COLORS.grey, fontWeight: "700" },
  slotTextActive: { color: COLORS.navy, fontWeight: "900" },
  bottomBar: {
    ...GLASS_CARD,
    ...GLASS_SHADOW_LG,
    position: "absolute",
    left: 0,
    right: 0,
    marginHorizontal: 44,
    height: 60,
    borderRadius: 30,
    padding: 6,
  },
  bottomBarButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 24,
    backgroundColor: "rgba(83, 199, 255, 0.55)",
    shadowColor: "#00D4FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 22,
    elevation: 12,
  },
  bottomBarButtonText: { color: COLORS.navy, fontWeight: "800", fontSize: 15 },
});