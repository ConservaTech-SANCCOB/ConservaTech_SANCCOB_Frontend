import { useCallback, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useNavigation, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../../../utils/colors";
import { AboveBannerFill } from "../../../components/BannerOverscroll";
import { getTabBarStyle } from "../../../constants/tabBar";
import { TIME_SLOT_LABELS } from "../../../utils/timeSlot";
import { getMyAvailability, updateMyAvailability, AvailabilitySlot, TimeBlock } from "../../../services/availability";
import { getErrorMessage, SessionExpiredError } from "../../../utils/api";
import { showErrorToast, showInfoToast } from "../../../utils/toast";
import { logError } from "../../../utils/logError";
import { SHEET_TOP_SHADOW } from "../../../constants/glassCard";
import { BannerBirds, BannerPenguin } from "../../../components/Wildlife";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const SLOTS: TimeBlock[] = ["08:00-13:00", "14:00-17:00", "08:00-17:00"];
const FULL_DAY_SLOT: TimeBlock = "08:00-17:00";
const HALF_DAY_SLOTS = SLOTS.filter((s) => s !== FULL_DAY_SLOT);

function slotKey(day: string, slot: string) {
  return `${day}-${slot}`;
}

/** Morning + Afternoon on the same day is a full day, so store it as one Full Day block. */
function mergeHalfDays(keys: Set<string>, day: string): boolean {
  if (!HALF_DAY_SLOTS.every((s) => keys.has(slotKey(day, s)))) return false;
  HALF_DAY_SLOTS.forEach((s) => keys.delete(slotKey(day, s)));
  keys.add(slotKey(day, FULL_DAY_SLOT));
  return true;
}

// Saving replaces all previously saved availability
export default function SubmitAvailabilityScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadAvailability = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const slots = await getMyAvailability();
      const keys = new Set(slots.map((s) => slotKey(s.dayOfWeek, s.timeSlot)));
      DAYS.forEach((day) => mergeHalfDays(keys, day));
      setSelected(keys);
    } catch (error) {
      logError("Load availability error", error);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAvailability();
  }, [loadAvailability]);

  // Hide the tab bar while on this form
  useFocusEffect(
    useCallback(() => {
      const parent = navigation.getParent();
      parent?.setOptions({ tabBarStyle: { display: "none" } });
      return () => {
        parent?.setOptions({ tabBarStyle: getTabBarStyle(insets.bottom) });
      };
    }, [navigation, insets.bottom])
  );

  const toggle = (day: string, slot: TimeBlock) => {
    const next = new Set(selected);
    const key = slotKey(day, slot);
    let merged = false;
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
      if (slot === FULL_DAY_SLOT) {
        HALF_DAY_SLOTS.forEach((s) => next.delete(slotKey(day, s)));
      } else {
        next.delete(slotKey(day, FULL_DAY_SLOT));
        merged = mergeHalfDays(next, day);
      }
    }
    setSelected(next);
    if (merged) {
      showInfoToast("Full day selected", `Morning and afternoon on ${day} were combined into a full day.`);
    }
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
      if (error instanceof SessionExpiredError) return;
      logError("Save availability error", error);
      showErrorToast("Couldn't save", getErrorMessage(error, "Something went wrong. Try again in a moment."));
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => {
    // Saving before the load would wipe saved slots
    if (loading || loadError) return;
    // An empty save clears everything so confirm first
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
        <AboveBannerFill color={COLORS.pastelYellowLight} />
        <LinearGradient
          colors={[COLORS.pastelYellowLight, COLORS.pastelYellowDeep]}
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

          <BannerBirds tint="dark" top={insets.top} />

          <View style={styles.bannerTopRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="arrow-back" size={22} color={COLORS.pastelInk} />
            </TouchableOpacity>
          </View>

          <View style={styles.titleGroup}>
            <Text style={styles.title}>Submit Availability</Text>
            <Text style={styles.subtitle}>WHEN YOU&apos;RE FREE</Text>
            <Text style={styles.tagline}>Pick the days and time blocks you&apos;re free to help</Text>
          </View>

          <BannerPenguin variant="adult" />
        </LinearGradient>

        <View style={styles.sheet}>
          {loadError ? (
            <View style={styles.loadErrorState}>
              <Ionicons name="warning-outline" size={26} color={COLORS.grey} />
              <Text style={styles.loadErrorText}>
                Couldn&apos;t load your availability. Check your connection and try again.
              </Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={loadAvailability}
                accessibilityRole="button"
                accessibilityLabel="Try again"
              >
                <Text style={styles.retryButtonText}>Try again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.infoBannerWrap}>
                <View style={styles.infoBanner}>
                  <Ionicons name="information-circle-outline" size={20} color={COLORS.amberMid} />
                  <Text style={styles.infoText}>
                    Your availability and completed skills drive automatic shift assignment. You can also book an open shift directly from the Available Shifts tab.
                  </Text>
                </View>
                <Svg width={18} height={10} viewBox="0 0 18 10" style={styles.infoBannerTail}>
                  <Path d="M0,0 L18,0 L18,10 Z" fill={COLORS.pastelYellowBg} />
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
                        {active && <Ionicons name="checkmark" size={18} color={COLORS.pastelInk} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </>
          )}
        </View>
      </ScrollView>

      {!loadError && (
        <>
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
                <ActivityIndicator size="small" color={COLORS.pastelInk} />
              ) : (
                <Text style={styles.bottomBarButtonText}>
                  {selected.size > 0
                    ? `Submit ${selected.size} block${selected.size === 1 ? "" : "s"}`
                    : "Submit Availability"}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

//--------------------STYLES--------------------//

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
    color: COLORS.pastelInk,
    letterSpacing: 0.5,
    zIndex: 1,
    textShadowColor: "rgba(255,255,255,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.amberDark,
    letterSpacing: 1.5,
    marginLeft: 1.5,
    marginTop: 6,
    fontWeight: "700",
    zIndex: 1,
  },
  tagline: {
    fontSize: 11.5,
    color: COLORS.amberDark,
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
    backgroundColor: COLORS.pastelYellowBg,
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
    backgroundColor: COLORS.pastelYellowDeep,
    borderColor: COLORS.pastelYellowBorder,
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
    backgroundColor: COLORS.pastelYellowDeep,
    borderWidth: 1,
    borderColor: COLORS.pastelYellowBorder,
  },
  loadErrorState: { alignItems: "center", paddingVertical: 24, gap: 8 },
  loadErrorText: { fontSize: 13, color: COLORS.grey, textAlign: "center" },
  retryButton: {
    marginTop: 14,
    alignSelf: "center",
    paddingVertical: 12,
    paddingHorizontal: 26,
    borderRadius: 30,
    backgroundColor: COLORS.pastelYellowDeep,
  },
  retryButtonText: { color: COLORS.pastelInk, fontWeight: "600", fontSize: 15 },
  bottomBarButtonText: { color: COLORS.pastelInk, fontWeight: "600", fontSize: 15.5, letterSpacing: 0.2 },
});

//----------------------------------- END OF FILE ---------------------------------//
