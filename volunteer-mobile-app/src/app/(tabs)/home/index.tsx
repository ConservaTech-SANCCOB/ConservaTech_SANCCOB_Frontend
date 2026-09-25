import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import MyShiftCard from "../../../components/MyShiftCard";
import { getPendingCancellationIds } from "../../../services/changeRequests";
import { getMyNotifications } from "../../../services/notifications";
import { getMyProfile } from "../../../services/profile";
import { getMyShifts, MyShift } from "../../../services/shifts";
import { COLORS } from "../../../utils/colors";
import { bucketForDate, getRelativeLabel } from "../../../utils/dateBuckets";
import { logError } from "../../../utils/logError";
import { compareShiftsByStart, formatTimeSlotLabel, hasShiftEnded } from "../../../utils/timeSlot";
import { SHEET_TOP_SHADOW } from "../../../constants/glassCard";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "GOOD MORNING";
  if (hour < 18) return "GOOD AFTERNOON";
  return "GOOD EVENING";
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [shifts, setShifts] = useState<MyShift[]>([]);
  const [pendingCancellationIds, setPendingCancellationIds] = useState<Set<number>>(new Set());
  const [loadingShifts, setLoadingShifts] = useState(true);
  const [shiftsError, setShiftsError] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const initials = (`${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() || "SV");

  // Only shifts still ahead: a shift earlier today that has already finished isn't "upcoming".
  const futureShifts = shifts.filter((s) => !hasShiftEnded(s.shiftDate, s.timeSlot)).sort(compareShiftsByStart);
  const thisWeeksShifts = futureShifts.filter((s) => {
    const bucket = bucketForDate(s.shiftDate);
    return bucket === "Today" || bucket === "This Week";
  });
  const upcoming = thisWeeksShifts.slice(0, 2);
  // Nothing this week doesn't mean nothing at all — point to the next one if there is one.
  const nextLaterShift = futureShifts.find((s) => bucketForDate(s.shiftDate) === "Later");

  const loadUnreadCount = useCallback(async () => {
    try {
      const notifications = await getMyNotifications();
      setUnreadCount(notifications.filter((n) => !n.isRead).length);
    } catch (error) {
      logError("Load notifications count error", error);
    }
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      const profile = await getMyProfile();
      setFirstName(profile.firstName ?? "");
      setLastName(profile.lastName ?? "");
    } catch (error) {
      logError("Load profile error", error);
    }
  }, []);

  const loadShifts = useCallback(async () => {
    setShiftsError(false);
    try {
      const [myShifts, pending] = await Promise.all([
        getMyShifts(),
        // A failure here must not break the shifts list — keep the last known pending set.
        getPendingCancellationIds().catch((error) => {
          logError("Load pending cancellations error", error);
          return null;
        }),
      ]);
      setShifts(myShifts);
      if (pending) setPendingCancellationIds(pending);
    } catch (error) {
      logError("Load shifts error", error);
      setShiftsError(true);
    }
  }, []);

  const refetchAll = useCallback(
    () => Promise.all([loadUnreadCount(), loadShifts(), loadProfile()]),
    [loadUnreadCount, loadShifts, loadProfile]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchAll();
    setRefreshing(false);
  }, [refetchAll]);

  const hasLoadedRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (!hasLoadedRef.current) {
        hasLoadedRef.current = true;
        loadUnreadCount();
        loadProfile();
        loadShifts().finally(() => setLoadingShifts(false));
      } else {
        refetchAll();
      }
    }, [loadUnreadCount, loadShifts, loadProfile, refetchAll])
  );

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 150 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.blueMid} />
        }
      >
        <LinearGradient
          colors={[COLORS.blueLight, COLORS.blueDark]}
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
            <Path d="M-20,46 C40,38 90,52 140,44 C190,36 240,50 290,42 C330,36 380,46 420,40 L420,260 L-20,260 Z" fill={COLORS.blueAccentLight} opacity={0.04} />
            <Path d="M-20,68 C40,58 90,74 140,64 C190,54 240,70 290,60 C330,54 380,66 420,58 L420,260 L-20,260 Z" fill="#ffffff" opacity={0.05} />
            <Path d="M-20,90 C40,82 90,96 140,86 C190,76 240,92 290,82 C330,76 380,88 420,80 L420,260 L-20,260 Z" fill={COLORS.blueAccentLight} opacity={0.07} />
            <Path d="M-20,112 C40,102 90,118 140,108 C190,98 240,114 290,104 C330,98 380,110 420,102 L420,260 L-20,260 Z" fill="#ffffff" opacity={0.08} />
            <Path d="M-20,134 C40,126 90,140 140,130 C190,120 240,136 290,126 C330,120 380,132 420,124 L420,260 L-20,260 Z" fill={COLORS.blueAccentLight} opacity={0.09} />
            <Path d="M-20,156 C40,146 90,162 140,152 C190,142 240,158 290,148 C330,142 380,154 420,146 L420,260 L-20,260 Z" fill="#ffffff" opacity={0.11} />
            <Path d="M-20,178 C40,170 90,184 140,174 C190,164 240,180 290,170 C330,164 380,176 420,168 L420,260 L-20,260 Z" fill={COLORS.blueAccentLight} opacity={0.12} />
            <Path d="M-20,200 C40,190 90,206 140,196 C190,186 240,202 290,192 C330,186 380,198 420,190 L420,260 L-20,260 Z" fill="#ffffff" opacity={0.14} />
            <Path d="M-20,222 C40,214 90,228 140,218 C190,208 240,224 290,214 C330,208 380,220 420,212 L420,260 L-20,260 Z" fill={COLORS.blueAccentLight} opacity={0.16} />
          </Svg>

          <View style={styles.bannerTopRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>

            <TouchableOpacity
              style={styles.bellButton}
              onPress={() => router.push("/(tabs)/home/notifications")}
              accessibilityRole="button"
              accessibilityLabel="Notifications"
            >
              <Ionicons name="notifications-outline" size={22} color={COLORS.white} />
              {unreadCount > 0 && (
                <Text style={styles.bellBadgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.titleGroup}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.title}>{firstName || "Your Name"}</Text>
            <Text style={styles.tagline}>Here&apos;s what your week looks like</Text>
          </View>
        </LinearGradient>

        <View style={styles.sheet}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionChipText}>
              THIS WEEK&apos;S SHIFTS{thisWeeksShifts.length > 0 ? ` (${thisWeeksShifts.length})` : ""}
            </Text>
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => router.push("/(tabs)/bookings")}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <Ionicons name="chevron-forward" size={14} color={COLORS.blueMid} />
            </TouchableOpacity>
          </View>

          {loadingShifts ? (
            <View style={styles.emptyCard}>
              <ActivityIndicator color={COLORS.blueMid} />
            </View>
          ) : shiftsError ? (
            <View style={styles.emptyCard}>
              <Ionicons name="warning-outline" size={26} color={COLORS.grey} />
              <Text style={styles.emptyTitle}>Couldn&apos;t load shifts</Text>
              <Text style={styles.emptyText}>Pull down to try again in a moment.</Text>
            </View>
          ) : upcoming.length > 0 ? (
            upcoming.map((shift) => (
              <MyShiftCard
                key={shift.rosterAssignmentId}
                item={shift}
                cancellationPending={pendingCancellationIds.has(shift.rosterAssignmentId)}
              />
            ))
          ) : nextLaterShift ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No shifts this week</Text>
              <Text style={styles.emptyText}>
                Your next shift is {getRelativeLabel(nextLaterShift.shiftDate).toLowerCase()}
                {` (${formatTimeSlotLabel(nextLaterShift.timeSlot)}${nextLaterShift.location ? `, ${nextLaterShift.location}` : ""}).`}
              </Text>
              <TouchableOpacity style={styles.emptyCtaWrap} onPress={() => router.push("/(tabs)/bookings")}>
                <View style={styles.emptyCta}>
                  <Text style={styles.emptyCtaText}>View My Shifts</Text>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.white} />
                </View>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No shifts yet</Text>
              <Text style={styles.emptyText}>Set your availability and you&apos;ll be automatically matched to shifts that fit.</Text>
              <TouchableOpacity
                style={styles.emptyCtaWrap}
                onPress={() => router.push("/(tabs)/bookings/submit-availability")}
              >
                <View style={styles.emptyCta}>
                  <Text style={styles.emptyCtaText}>Set Availability</Text>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.white} />
                </View>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  banner: {
    paddingBottom: 90,
  },
  bannerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 18,
    zIndex: 1,
  },
  titleGroup: {
    paddingHorizontal: 20,
  },
  greeting: {
    fontSize: 13,
    color: COLORS.blueAccentLight,
    letterSpacing: 1.5,
    fontWeight: "700",
    zIndex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.white,
    letterSpacing: 0.5,
    marginTop: 6,
    zIndex: 1,
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  tagline: {
    fontSize: 11.5,
    color: "#8fb4cc",
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
    shadowColor: COLORS.blueDark,
    ...SHEET_TOP_SHADOW,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  avatarInitials: { color: COLORS.white, fontSize: 15, fontWeight: "800" },
  bellButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  bellBadgeText: {
    position: "absolute",
    top: 5,
    right: 6,
    fontSize: 11,
    fontWeight: "900",
    color: COLORS.blueAccentLight,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  viewAllText: { fontSize: 13, fontWeight: "800", color: COLORS.blueMid },
  sectionChipText: { fontSize: 13, fontWeight: "800", color: COLORS.blueMid },
  emptyCard: {
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e9ee",
    padding: 26,
    paddingHorizontal: 20,
  },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: COLORS.blueLight },
  emptyText: { fontSize: 13, fontWeight: "500", color: "#3d5260", textAlign: "center", maxWidth: 255, marginTop: 8 },
  emptyCtaWrap: {
    marginTop: 20,
    borderRadius: 30,
    shadowColor: COLORS.blueDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  emptyCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: COLORS.blueMid,
  },
  emptyCtaText: { fontSize: 13, fontWeight: "600", color: COLORS.white, letterSpacing: 0.2 },
});