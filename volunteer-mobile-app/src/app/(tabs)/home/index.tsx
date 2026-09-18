import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, ImageBackground, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MyShiftCard from "../../../components/MyShiftCard";
import { GLASS_CARD, GLASS_SHADOW_LG } from "../../../constants/glassCard";
import { getMyNotifications } from "../../../services/notifications";
import { getMyProfile } from "../../../services/profile";
import { getMyShifts, MyShift } from "../../../services/shifts";
import { COLORS } from "../../../utils/colors";
import { bucketForDate } from "../../../utils/dateBuckets";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "GOOD MORNING";
  if (hour < 18) return "GOOD AFTERNOON";
  return "GOOD EVENING";
}

export default function HomeScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [shifts, setShifts] = useState<MyShift[]>([]);
  const [loadingShifts, setLoadingShifts] = useState(true);
  const [shiftsError, setShiftsError] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const initials = (`${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() || "SV");

  const thisWeeksShifts = shifts
    .filter((s) => bucketForDate(s.shiftDate) === "Today" || bucketForDate(s.shiftDate) === "This Week")
    .sort((a, b) => a.shiftDate.localeCompare(b.shiftDate));
  const upcoming = thisWeeksShifts.slice(0, 2);

  const loadUnreadCount = useCallback(async () => {
    try {
      const notifications = await getMyNotifications();
      setUnreadCount(notifications.filter((n) => !n.isRead).length);
    } catch (error) {
      console.error("Load notifications count error:", error);
    }
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      const profile = await getMyProfile();
      setFirstName(profile.firstName ?? "");
      setLastName(profile.lastName ?? "");
    } catch (error) {
      console.error("Load profile error:", error);
    }
  }, []);

  const loadShifts = useCallback(async () => {
    setShiftsError(false);
    try {
      setShifts(await getMyShifts());
    } catch (error) {
      console.error("Load shifts error:", error);
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
    <ImageBackground
      source={require("../../../../assets/images/bg_penguin.jpg.jpeg")}
      style={styles.background}
      resizeMode="cover"
    >
      <LinearGradient
        colors={["rgba(255,255,255,0.86)", "rgba(255,255,255,0.76)", "rgba(255,255,255,0.84)"]}
        locations={[0, 0.42, 1]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingTop: 60, paddingBottom: 150 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.navy} />
        }
      >
        <View style={styles.headerCard}>
          <LinearGradient colors={["#6FD0FF", "#2BA8E0"]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.avatar}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={styles.welcomeLabel}>{getGreeting()}</Text>
            <Text style={styles.name}>{firstName || "Your Name"}</Text>
          </View>

          <TouchableOpacity style={styles.bellButton} onPress={() => router.push("/(tabs)/home/notifications")}>
            <Ionicons name="notifications-outline" size={22} color="#3f5f75" />
            <Text style={styles.bellBadgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionChip}>
            <Text style={styles.sectionChipText}>
              THIS WEEK&apos;S SHIFTS{thisWeeksShifts.length > 0 ? ` (${thisWeeksShifts.length})` : ""}
            </Text>
          </View>
          <TouchableOpacity style={styles.viewAllButton} onPress={() => router.push("/(tabs)/bookings")}>
            <Text style={styles.viewAllText}>View All</Text>
            <Ionicons name="chevron-forward" size={14} color="#00567f" />
          </TouchableOpacity>
        </View>

        {loadingShifts ? (
          <View style={styles.emptyCard}>
            <ActivityIndicator color={COLORS.blue} />
          </View>
        ) : shiftsError ? (
          <View style={styles.emptyCard}>
            <Ionicons name="warning-outline" size={26} color={COLORS.grey} />
            <Text style={styles.emptyTitle}>Couldn&apos;t load shifts</Text>
            <Text style={styles.emptyText}>Pull down to try again in a moment.</Text>
          </View>
        ) : upcoming.length > 0 ? (
          upcoming.map((shift) => <MyShiftCard key={shift.rosterAssignmentId} item={shift} />)
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No shifts yet</Text>
            <Text style={styles.emptyText}>Set your availability and you&apos;ll be automatically matched to shifts that fit.</Text>
            <TouchableOpacity
              style={styles.emptyCtaWrap}
              onPress={() => router.push("/(tabs)/bookings/submit-availability")}
            >
              <LinearGradient
                colors={["#6FD0FF", "#2BA8E0"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.emptyCta}
              >
                <Ionicons name="calendar-outline" size={16} color={COLORS.white} />
                <Text style={styles.emptyCtaText}>Set Availability</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  headerCard: {
    ...GLASS_CARD,
    ...GLASS_SHADOW_LG,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    padding: 14,
    paddingLeft: 16,
    borderRadius: 22,
    marginBottom: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.7)",
    shadowColor: "#002e4c",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 10,
  },
  avatarInitials: { color: COLORS.white, fontSize: 15, fontWeight: "800" },
  welcomeLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1.1, color: "#3f5f75" },
  name: { fontSize: 18, fontWeight: "800", color: COLORS.navy, marginTop: 2 },
  bellButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.6)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.9)",
    shadowColor: "#002e4c",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  bellBadgeText: {
    position: "absolute",
    top: 5,
    right: 6,
    fontSize: 11,
    fontWeight: "900",
    color: COLORS.blue,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 40,
    marginBottom: 12,
  },
  viewAllButton: {
    ...GLASS_CARD,
    ...GLASS_SHADOW_LG,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    borderRadius: 11,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  viewAllText: { fontSize: 12, fontWeight: "800", color: "#00567f" },
  sectionChip: {
    ...GLASS_CARD,
    ...GLASS_SHADOW_LG,
    alignSelf: "flex-start",
    borderRadius: 11,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  sectionChipText: { fontSize: 11, fontWeight: "800", letterSpacing: 1.1, color: "#00567f" },
  emptyCard: {
    ...GLASS_CARD,
    ...GLASS_SHADOW_LG,
    alignItems: "center",
    borderRadius: 20,
    padding: 26,
    paddingHorizontal: 20,
  },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: COLORS.navy },
  emptyText: { fontSize: 13, fontWeight: "500", color: "#3d5260", textAlign: "center", maxWidth: 255, marginTop: 8 },
  emptyCtaWrap: {
    marginTop: 20,
    borderRadius: 16,
    shadowColor: "#002e4c",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 10,
  },
  emptyCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 14.5,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  emptyCtaText: { fontSize: 13, fontWeight: "800", color: COLORS.white },
});