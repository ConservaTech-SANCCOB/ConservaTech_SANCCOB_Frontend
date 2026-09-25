import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { CompletedShift, getMyTrainingStats, MyTrainingStats } from "../../../services/training";
import { COLORS } from "../../../utils/colors";
import { parseLocalDate } from "../../../utils/dateBuckets";
import { formatTimeSlotLabel } from "../../../utils/timeSlot";
import { logError } from "../../../utils/logError";
import { SHEET_TOP_SHADOW } from "../../../constants/glassCard";

function monthLabelFor(dateStr: string): string {
  return parseLocalDate(dateStr).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/** Most recent first: by date, then by start time within a day. */
function newestFirst(a: CompletedShift, b: CompletedShift): number {
  return b.shiftDate.localeCompare(a.shiftDate) || (b.timeSlot ?? "").localeCompare(a.timeSlot ?? "");
}

export default function HoursWorkedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<MyTrainingStats | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      setStats(await getMyTrainingStats());
      setLoadError(false);
    } catch (error) {
      logError("Load hours stats error", error);
      setLoadError(true);
    } finally {
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const completedShifts = [...(stats?.completedShifts ?? [])].sort(newestFirst);
  const months = Array.from(new Set(completedShifts.map((s) => monthLabelFor(s.shiftDate))));
  const statValue = (value: number | undefined, decimals: number) =>
    loadError || value === undefined ? "—" : value.toFixed(decimals);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.greenMid} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 150 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={COLORS.greenMid} />
        }
      >
        <LinearGradient
          colors={[COLORS.greenLight, COLORS.greenDark]}
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
            <Path d="M-20,46 C40,38 90,52 140,44 C190,36 240,50 290,42 C330,36 380,46 420,40 L420,260 L-20,260 Z" fill={COLORS.greenAccentLight} opacity={0.04} />
            <Path d="M-20,68 C40,58 90,74 140,64 C190,54 240,70 290,60 C330,54 380,66 420,58 L420,260 L-20,260 Z" fill="#ffffff" opacity={0.05} />
            <Path d="M-20,90 C40,82 90,96 140,86 C190,76 240,92 290,82 C330,76 380,88 420,80 L420,260 L-20,260 Z" fill={COLORS.greenAccentLight} opacity={0.07} />
            <Path d="M-20,112 C40,102 90,118 140,108 C190,98 240,114 290,104 C330,98 380,110 420,102 L420,260 L-20,260 Z" fill="#ffffff" opacity={0.08} />
            <Path d="M-20,134 C40,126 90,140 140,130 C190,120 240,136 290,126 C330,120 380,132 420,124 L420,260 L-20,260 Z" fill={COLORS.greenAccentLight} opacity={0.09} />
            <Path d="M-20,156 C40,146 90,162 140,152 C190,142 240,158 290,148 C330,142 380,154 420,146 L420,260 L-20,260 Z" fill="#ffffff" opacity={0.11} />
            <Path d="M-20,178 C40,170 90,184 140,174 C190,164 240,180 290,170 C330,164 380,176 420,168 L420,260 L-20,260 Z" fill={COLORS.greenAccentLight} opacity={0.12} />
            <Path d="M-20,200 C40,190 90,206 140,196 C190,186 240,202 290,192 C330,186 380,198 420,190 L420,260 L-20,260 Z" fill="#ffffff" opacity={0.14} />
            <Path d="M-20,222 C40,214 90,228 140,218 C190,208 240,224 290,214 C330,208 380,220 420,212 L420,260 L-20,260 Z" fill={COLORS.greenAccentLight} opacity={0.16} />
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
            <Text style={styles.title}>Volunteering Stats</Text>
            <Text style={styles.subtitle}>HOURS &amp; SHIFTS</Text>
            <Text style={styles.tagline}>Track your completed shifts and total hours</Text>
          </View>
        </LinearGradient>

        <View style={styles.sheet}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Ionicons name="time-outline" size={18} color={COLORS.greenMid} />
              <Text style={styles.statValue}>
                {statValue(stats?.totalHours, 1)}
              </Text>
              <Text style={styles.statLabel}>Total Hours</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="calendar-outline" size={18} color={COLORS.greenMid} />
              <Text style={styles.statValue}>{statValue(stats?.shiftsCompleted, 0)}</Text>
              <Text style={styles.statLabel}>Shifts Done</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="trending-up-outline" size={18} color={COLORS.greenMid} />
              <Text style={styles.statValue}>{statValue(stats?.hoursThisMonth, 1)}</Text>
              <Text style={styles.statLabel}>This Month</Text>
            </View>
          </View>

          <Text style={styles.logTitle}>Completed Shifts Log</Text>

          {loadError ? (
            <View style={styles.emptyStateCard}>
              <Ionicons name="warning-outline" size={32} color={COLORS.grey} />
              <Text style={styles.emptyTitle}>Couldn&apos;t load your shift history</Text>
              <Text style={styles.emptyText}>Pull down to try again in a moment.</Text>
            </View>
          ) : months.length > 0 ? (
            months.map((month) => {
              const monthShifts = completedShifts.filter((s) => monthLabelFor(s.shiftDate) === month);
              return (
                <View key={month}>
                  <Text style={styles.monthLabel}>{month.toUpperCase()}</Text>
                  {monthShifts.map((shift, i) => (
                    <View
                      key={`${shift.shiftDate}-${shift.timeSlot}-${i}`}
                      style={[styles.shiftRow, i < monthShifts.length - 1 && styles.shiftRowDivider]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.shiftDate}>{shift.shiftDate}</Text>
                        <Text style={styles.shiftDescription} numberOfLines={1}>
                          {shift.location ?? "Volunteer shift"}
                        </Text>
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={styles.shiftHours}>{shift.hoursWorked.toFixed(1)} hrs</Text>
                        <Text style={styles.shiftTime}>{formatTimeSlotLabel(shift.timeSlot ?? "")}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              );
            })
          ) : (
            <View style={styles.emptyStateCard}>
              <Ionicons name="time-outline" size={32} color={COLORS.grey} />
              <Text style={styles.emptyTitle}>No shifts completed yet</Text>
              <Text style={styles.emptyText}>Your worked shifts will show up here once you&apos;ve completed some.</Text>
            </View>
          )}
        </View>
      </ScrollView>
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
    color: COLORS.greenAccentLight,
    letterSpacing: 1.5,
    marginLeft: 1.5,
    marginTop: 6,
    fontWeight: "700",
    zIndex: 1,
  },
  tagline: {
    fontSize: 11.5,
    color: "#a8cf9e",
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
    shadowColor: "#0d3305",
    ...SHEET_TOP_SHADOW,
  },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 28 },
  statCard: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    borderRadius: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.greenBg,
  },
  statValue: { fontSize: 20, fontWeight: "800", color: COLORS.greenLight },
  statLabel: { fontSize: 10, fontWeight: "700", color: COLORS.grey, textAlign: "center" },
  logTitle: { fontSize: 15.5, fontWeight: "700", color: COLORS.greenLight },
  monthLabel: {
    fontSize: 12,
    color: COLORS.greenMid,
    fontWeight: "700",
    letterSpacing: 0.6,
    marginTop: 18,
    marginBottom: 4,
  },
  shiftRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 13,
  },
  shiftRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#eef2ec",
  },
  shiftDate: { fontSize: 14.5, fontWeight: "600", color: "#1c2b1a" },
  shiftDescription: { fontSize: 12, color: COLORS.grey, marginTop: 2 },
  shiftHours: { fontSize: 14.5, fontWeight: "800", color: COLORS.greenMid },
  shiftTime: { fontSize: 12, color: COLORS.grey, marginTop: 2 },
  emptyStateCard: {
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e7ede4",
    padding: 24,
    gap: 8,
    marginTop: 14,
  },
  emptyTitle: { fontSize: 15, fontWeight: "600", color: COLORS.greenLight },
  emptyText: { fontSize: 13, color: COLORS.grey, textAlign: "center", lineHeight: 18 },
});
