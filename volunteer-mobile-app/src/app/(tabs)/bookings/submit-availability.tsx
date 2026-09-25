import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../../../utils/colors";
import { getTabBarStyle } from "../../../constants/tabBar";
import { TIME_SLOT_LABELS } from "../../../utils/timeSlot";
import { getMyAvailability, updateMyAvailability, AvailabilitySlot, TimeBlock } from "../../../services/availability";
import { getErrorMessage } from "../../../utils/api";
import { showErrorToast } from "../../../utils/toast";
import { logError } from "../../../utils/logError";
import { SHEET_TOP_SHADOW } from "../../../constants/glassCard";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const SLOTS: TimeBlock[] = ["08:00-13:00", "14:00-17:00", "08:00-17:00"];
const FULL_DAY_SLOT: TimeBlock = "08:00-17:00";

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
        logError("Load availability error", error);
        showErrorToast("Couldn't load availability", "Starting from a blank grid instead.");
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

  const toggle = (day: string, slot: TimeBlock) => {
    const key = slotKey(day, slot);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
        return next;
      }
      next.add(key);
      if (slot === FULL_DAY_SLOT) {
        SLOTS.filter((s) => s !== FULL_DAY_SLOT).forEach((s) => next.delete(slotKey(day, s)));
      } else {
        next.delete(slotKey(day, FULL_DAY_SLOT));
      }
      return next;
    });
  };

  const performSave = async () => {
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
      logError("Save availability error", error);
      showErrorToast("Couldn't save", getErrorMessage(error, "Something went wrong. Try again in a moment."));
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => {
    if (selected.size === 0) {
      Alert.alert(
        "No availability selected",
        "You haven't selected any availability. Saving now will clear your current availability. Continue?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Save", style: "destructive", onPress: () => performSave() },
        ]
      );
      return;
    }
    performSave();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.amberMid} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[COLORS.amberLight, COLORS.amberDark]}
          style={[styles.banner, { paddingTop: 16 + insets.top }]}
        >
          <LinearGradient
            colors={["rgba(255,255,255,0.08)", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          <Svg style={StyleSheet.absoluteFill} viewBox="0 0 400 260" preserveAspectRatio="none" pointerEvents="none">
            <Path d="M-20,26 C40,16 90,32 140,24 C190,16 240,30 290,22 C330,16 380,26 420,18 L420,260 L-20,260 Z" fill="#ffffff" opacity={0.03} />
            <Path d="M-20,46 C40,38 90,52 140,44 C190,36 240,50 290,42 C330,36 380,46 420,40 L420,260 L-20,260 Z" fill={COLORS.amberAccentLight} opacity={0.04} />
            <Path d="M-20,68 C40,58 90,74 140,64 C190,54 240,70 290,60 C330,54 380,66 420,58 L420,260 L-20,260 Z" fill="#ffffff" opacity={0.05} />
            <Path d="M-20,90 C40,82 90,96 140,86 C190,76 240,92 290,82 C330,76 380,88 420,80 L420,260 L-20,260 Z" fill={COLORS.amberAccentLight} opacity={0.07} />
            <Path d="M-20,112 C40,102 90,118 140,108 C190,98 240,114 290,104 C330,98 380,110 420,102 L420,260 L-20,260 Z" fill="#ffffff" opacity={0.08} />
            <Path d="M-20,134 C40,126 90,140 140,130 C190,120 240,136 290,126 C330,120 380,132 420,124 L420,260 L-20,260 Z" fill={COLORS.amberAccentLight} opacity={0.09} />
            <Path d="M-20,156 C40,146 90,162 140,152 C190,142 240,158 290,148 C330,142 380,154 420,146 L420,260 L-20,260 Z" fill="#ffffff" opacity={0.11} />
            <Path d="M-20,178 C40,170 90,184 140,174 C190,164 240,180 290,170 C330,164 380,176 420,168 L420,260 L-20,260 Z" fill={COLORS.amberAccentLight} opacity={0.12} />
            <Path d="M-20,200 C40,190 90,206 140,196 C190,186 240,202 290,192 C330,186 380,198 420,190 L420,260 L-20,260 Z" fill="#ffffff" opacity={0.14} />
            <Path d="M-20,222 C40,214 90,228 140,218 C190,208 240,224 290,214 C330,208 380,220 420,212 L420,260 L-20,260 Z" fill={COLORS.amberAccentLight} opacity={0.16} />
          </Svg>

          <View style={styles.bannerTopRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="arrow-back" size={22} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.titleGroup}>
            <Text style={styles.title}>Submit Availability</Text>
            <Text style={styles.subtitle}>WHEN YOU&apos;RE FREE</Text>
            <Text style={styles.tagline}>Pick the days and time blocks you&apos;re free to help</Text>
          </View>
        </LinearGradient>

        <View style={styles.sheet}>
          <View style={styles.infoBannerWrap}>
            <View style={styles.infoBanner}>
              <Ionicons name="information-circle-outline" size={20} color={COLORS.amberMid} />
              <Text style={styles.infoText}>
                Your availability and completed skills drive automatic shift assignment. You can also book an open shift directly from the Available Shifts tab.
              </Text>
            </View>
            <Svg width={18} height={10} viewBox="0 0 18 10" style={styles.infoBannerTail}>
              <Path d="M0,0 L18,0 L18,10 Z" fill={COLORS.amberBg} />
            </Svg>
          </View>

          <View style={styles.gridHeaderRow}>
            <View style={styles.dayLabelSpacer} />
            {SLOTS.map((slot) => (
              <View key={slot} style={styles.colHead}>
                <Text style={styles.colHeadLabel}>{TIME_SLOT_LABELS[slot]}</Text>
                <Text style={styles.colHeadTime}>{slot}</Text>
              </View>
            ))}
          </View>

          {DAYS.map((day, dayIndex) => (
            <View key={day} style={[styles.dayRow, dayIndex < DAYS.length - 1 && styles.dayRowDivider]}>
              <Text style={styles.dayLabel}>{day.slice(0, 3)}</Text>
              {SLOTS.map((slot) => {
                const active = selected.has(slotKey(day, slot));
                return (
                  <TouchableOpacity
                    key={slot}
                    style={[styles.cell, active && styles.cellActive]}
                    onPress={() => toggle(day, slot)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`${day} ${TIME_SLOT_LABELS[slot]}`}
                  >
                    {active && <Ionicons name="checkmark" size={18} color={COLORS.white} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>

      <LinearGradient
        colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.95)"]}
        style={styles.bottomScrim}
        pointerEvents="none"
      />

      <TouchableOpacity
        style={[styles.bottomBarButtonWrap, { bottom: 12 + insets.bottom }]}
        onPress={handleSave}
        disabled={saving}
        activeOpacity={0.85}
      >
        <View style={styles.bottomBarButton}>
          {saving ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text style={styles.bottomBarButtonText}>
              {selected.size > 0
                ? `Submit ${selected.size} block${selected.size === 1 ? "" : "s"}`
                : "Submit Availability"}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.white },
  banner: {
    paddingBottom: 90,
  },
  bannerTopRow: {
    paddingHorizontal: 20,
    marginBottom: 14,
    zIndex: 1,
  },
  titleGroup: {
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.white,
    letterSpacing: 0.5,
    zIndex: 1,
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.amberAccentLight,
    letterSpacing: 1.5,
    marginLeft: 1.5,
    marginTop: 6,
    fontWeight: "700",
    zIndex: 1,
  },
  tagline: {
    fontSize: 11.5,
    color: "#fbeccb",
    letterSpacing: 0.3,
    marginTop: 6,
    fontWeight: "500",
    zIndex: 1,
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -20,
    paddingHorizontal: 20,
    paddingTop: 28,
    shadowColor: "#3a2c02",
    ...SHEET_TOP_SHADOW,
  },
  infoBannerWrap: {
    marginBottom: 24,
  },
  infoBanner: {
    backgroundColor: COLORS.amberBg,
    flexDirection: "row",
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderBottomRightRadius: 0,
    borderBottomLeftRadius: 14,
    padding: 14,
    gap: 10,
  },
  infoBannerTail: {
    position: "absolute",
    bottom: -10,
    right: 0,
  },
  infoText: { flex: 1, fontSize: 12, color: "#6b5a2a", lineHeight: 17 },
  gridHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginBottom: 10,
  },
  dayLabelSpacer: { width: 38 },
  colHead: { flex: 1, alignItems: "center" },
  colHeadLabel: { fontSize: 11, fontWeight: "800", color: COLORS.amberMid, letterSpacing: 0.4 },
  colHeadTime: { fontSize: 9.5, color: COLORS.grey, fontWeight: "600", marginTop: 2 },
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 5,
  },
  dayRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#f2efe6",
  },
  dayLabel: { width: 38, fontSize: 13, fontWeight: "700", color: "#3a2c02" },
  cell: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#e6e2d6",
    alignItems: "center",
    justifyContent: "center",
  },
  cellActive: {
    backgroundColor: COLORS.amberFill,
    borderColor: COLORS.amberFill,
  },
  bottomScrim: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 190,
  },
  bottomBarButtonWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    marginHorizontal: 44,
    height: 60,
    borderRadius: 30,
    shadowColor: COLORS.amberDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  bottomBarButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 30,
    backgroundColor: COLORS.amberFill,
  },
  bottomBarButtonText: { color: COLORS.white, fontWeight: "600", fontSize: 15.5, letterSpacing: 0.2 },
});