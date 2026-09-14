import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ImageBackground, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MyShiftCard from "../../../components/MyShiftCard";
import { GLASS_CARD, GLASS_SHADOW_LG } from "../../../constants/glassCard";
import { getMyNotifications } from "../../../services/notifications";
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

  const loadShifts = useCallback(async () => {
    setShiftsError(false);
    try {
      setShifts(await getMyShifts());
    } catch (error) {
      console.error("Load shifts error:", error);
      setShiftsError(true);
    }
  }, []);

  useEffect(() => {
    loadUnreadCount();
    loadShifts().finally(() => setLoadingShifts(false));
  }, [loadUnreadCount, loadShifts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadUnreadCount(), loadShifts()]);
    setRefreshing(false);
  }, [loadUnreadCount, loadShifts]);

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
          <LinearGradient colors={["#00567f", "#002e4c"]} start={{ x: 0, y: 0 }} end={{ x: 0.7, y: 1 }} style={styles.avatar}>
            <Text style={styles.avatarInitials}>SV</Text>
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={styles.welcomeLabel}>{getGreeting()}</Text>
            <Text style={styles.name}>Your Name</Text>
          </View>

          <TouchableOpacity style={styles.bellButton} onPress={() => router.push("/(tabs)/home/notifications")}>
            <Ionicons name="notifications-outline" size={22} color="#3f5f75" />
            <Text style={styles.bellBadgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionChip}>
            <Text style={styles.sectionChipText}>
              THIS WEEK'S SHIFTS{thisWeeksShifts.length > 0 ? ` (${thisWeeksShifts.length})` : ""}
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/(tabs)/bookings")}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {loadingShifts ? (
          <View style={styles.emptyCard}>
            <ActivityIndicator color={COLORS.blue} />
          </View>
        ) : shiftsError ? (
          <View style={styles.emptyCard}>
            <Ionicons name="warning-outline" size={26} color={COLORS.grey} />
            <Text style={styles.emptyTitle}>Couldn't load shifts</Text>
            <Text style={styles.emptyText}>Pull down to try again in a moment.</Text>
          </View>
        ) : upcoming.length > 0 ? (
          upcoming.map((shift) => <MyShiftCard key={shift.rosterAssignmentId} item={shift} />)
        ) : (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="calendar-outline" size={26} color="#007fb0" />
            </View>
            <Text style={styles.emptyTitle}>No shifts yet</Text>
            <Text style={styles.emptyText}>Set your availability and you'll be automatically matched to shifts that fit.</Text>
            <TouchableOpacity
              style={styles.emptyCta}
              onPress={() => router.push("/(tabs)/bookings/submit-availability")}
            >
              <Ionicons name="calendar-outline" size={16} color={COLORS.navy} />
              <Text style={styles.emptyCtaText}>Set Availability</Text>
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
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
  viewAllText: { fontSize: 12, fontWeight: "800", color: COLORS.blue },
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
  emptyIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "rgba(233,247,255,0.55)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "rgba(0,120,180,0.5)",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
  },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: COLORS.navy, marginTop: 14 },
  emptyText: { fontSize: 13, fontWeight: "500", color: "#3d5260", textAlign: "center", maxWidth: 255, marginTop: 6 },
  emptyCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 16,
    backgroundColor: "rgba(83, 199, 255, 0.35)",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 18,
    shadowColor: "#00D4FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
  emptyCtaText: { fontSize: 13, fontWeight: "800", color: COLORS.navy },
});