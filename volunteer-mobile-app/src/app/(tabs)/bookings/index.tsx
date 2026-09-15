import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  FlatList,
  ImageBackground,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GLASS_CARD, GLASS_SHADOW_LG, GLASS_SHADOW_MD } from "../../../constants/glassCard";
import MyShiftCard from "../../../components/MyShiftCard";
import { DateBadge, ShiftMeta } from "../../../components/ShiftCardParts";
import { getAllShifts, getMyShifts, MyShift, Shift } from "../../../services/shifts";
import { COLORS } from "../../../utils/colors";
import { bucketForDate, DateBucket, getRelativeLabel } from "../../../utils/dateBuckets";
import { formatTimeSlotLabel } from "../../../utils/timeSlot";

type ListRow =
  | { type: "header"; key: string; title: string }
  | { type: "mine"; key: string; item: MyShift }
  | { type: "available"; key: string; item: Shift };

function groupMyShifts(shifts: MyShift[]): ListRow[] {
  const order: DateBucket[] = ["Today", "This Week", "Later", "Past"];
  const buckets: Record<string, MyShift[]> = {};
  shifts.forEach((item) => {
    const key = bucketForDate(item.shiftDate);
    if (!buckets[key]) buckets[key] = [];
    buckets[key].push(item);
  });
  const rows: ListRow[] = [];
  order.forEach((title) => {
    const items = buckets[title];
    if (!items || items.length === 0) return;
    rows.push({ type: "header", key: `header-${title}`, title });
    items.forEach((item) => rows.push({ type: "mine", key: `mine-${item.rosterAssignmentId}`, item }));
  });
  return rows;
}

function AvailableShiftCard({ item }: { item: Shift }) {
  const limited = item.capacity <= 1;
  return (
    <TouchableOpacity
      style={styles.shiftCard}
      activeOpacity={0.7}
      onPress={() =>
        Alert.alert(
          `${formatTimeSlotLabel(item.timeSlot)} shift`,
          `${item.shiftDate}${item.location ? ` · ${item.location}` : ""}\nCapacity: ${item.capacity} needed`
        )
      }
    >
      <DateBadge dateStr={item.shiftDate} />
      <View style={styles.shiftCardBody}>
        <View style={styles.topRow}>
          <Text style={styles.shiftTimeLabel}>{formatTimeSlotLabel(item.timeSlot)}</Text>
          <Text style={styles.relativeLabel}>{getRelativeLabel(item.shiftDate)}</Text>
        </View>
        <ShiftMeta timeSlot={item.timeSlot} location={item.location} />
        <View style={styles.capacityRow}>
          <View style={styles.capacityChip}>
            <Ionicons name="people-outline" size={13} color={COLORS.navy} />
            <Text style={styles.capacityChipText}>{item.capacity} needed</Text>
          </View>
          {limited && (
            <View style={styles.limitedTag}>
              <Text style={styles.limitedTagText}>Limited spots</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function SkeletonCard() {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.9, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View style={[styles.shiftCard, { opacity }]}>
      <View style={styles.skeletonBadge} />
      <View style={styles.shiftCardBody}>
        <View style={styles.skeletonLineWide} />
        <View style={styles.skeletonLineNarrow} />
      </View>
    </Animated.View>
  );
}

export default function BookingsScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<"mine" | "available">("mine");
  const [myShifts, setMyShifts] = useState<MyShift[]>([]);
  const [availableShifts, setAvailableShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setLoadError(false);
      try {
        if (tab === "mine") {
          setMyShifts(await getMyShifts());
        } else {
          setAvailableShifts(await getAllShifts());
        }
      } catch (error) {
        console.error(`Load ${tab} shifts error:`, error);
        setLoadError(true);
      } finally {
        if (isRefresh) setRefreshing(false);
        else setLoading(false);
      }
    },
    [tab]
  );

  useEffect(() => {
    load();
  }, [load]);

  const rows: ListRow[] =
    tab === "mine"
      ? groupMyShifts(myShifts)
      : availableShifts.map((item) => ({ type: "available", key: `available-${item.shiftId}`, item }));

  const header = (
    <>
      <View style={styles.headerRow}>
        <View style={styles.headerCard}>
          <Text style={styles.title}>Upcoming Shifts</Text>
        </View>
        <TouchableOpacity
          style={styles.availabilityButton}
          onPress={() => router.push("/(tabs)/bookings/submit-availability")}
        >
          <Ionicons name="calendar-outline" size={16} color={COLORS.navy} />
          <Text style={styles.availabilityButtonText}>Availability</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.segmentRow}>
        <TouchableOpacity
          style={[styles.segment, tab === "mine" && styles.segmentActive]}
          onPress={() => setTab("mine")}
        >
          <Text style={[styles.segmentText, tab === "mine" && styles.segmentTextActive]}>My Shifts</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segment, tab === "available" && styles.segmentActive]}
          onPress={() => setTab("available")}
        >
          <Text style={[styles.segmentText, tab === "available" && styles.segmentTextActive]}>Available Shifts</Text>
        </TouchableOpacity>
      </View>
    </>
  );

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
        <FlatList
          ListHeaderComponent={header}
          data={rows}
          keyExtractor={(row) => row.key}
          contentContainerStyle={{ padding: 20, paddingTop: 8, paddingBottom: 150, flexGrow: 1 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={COLORS.blue} />
          }
          renderItem={({ item: row }) => {
            if (row.type === "header") {
              return <Text style={styles.sectionHeader}>{row.title}</Text>;
            }
            if (row.type === "mine") {
              return <MyShiftCard item={row.item} />;
            }
            return <AvailableShiftCard item={row.item} />;
          }}
          ListEmptyComponent={
            loading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : loadError ? (
              <View style={styles.emptyStateCard}>
                <Ionicons name="warning-outline" size={40} color={COLORS.grey} />
                <Text style={styles.emptyTitle}>Couldn't load shifts</Text>
                <Text style={styles.emptyText}>Switch tabs or try again in a moment.</Text>
              </View>
            ) : (
              <View style={styles.emptyStateCard}>
                <Ionicons name="calendar-outline" size={40} color={COLORS.grey} />
                <Text style={styles.emptyTitle}>
                  {tab === "mine" ? "No shifts scheduled yet" : "No open shifts right now"}
                </Text>
                <Text style={styles.emptyText}>
                  {tab === "mine"
                    ? "Set your availability and you'll be automatically matched to shifts that fit."
                    : "Check back later, admins release shifts here when help's needed."}
                </Text>
              </View>
            )
          }
        />
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  headerCard: {
    ...GLASS_CARD,
    ...GLASS_SHADOW_LG,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 22,
  },
  title: { fontSize: 20, fontWeight: "800", color: COLORS.navy },
  availabilityButton: {
    ...GLASS_CARD,
    ...GLASS_SHADOW_LG,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingVertical: 9,
    paddingHorizontal: 14,
    gap: 6,
  },
  availabilityButtonText: { color: COLORS.navy, fontWeight: "800", fontSize: 13 },
  segmentRow: {
    ...GLASS_CARD,
    ...GLASS_SHADOW_LG,
    flexDirection: "row",
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  segment: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 10 },
  segmentActive: {
    backgroundColor: "rgba(83, 199, 255, 0.35)",
    shadowColor: "#00D4FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
  segmentText: { fontSize: 13, color: COLORS.grey, fontWeight: "700" },
  segmentTextActive: { color: COLORS.navy, fontWeight: "900" },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "900",
    color: COLORS.navy,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 8,
    marginTop: 4,
  },
  emptyStateCard: {
    ...GLASS_CARD,
    ...GLASS_SHADOW_LG,
    alignItems: "center",
    borderRadius: 18,
    padding: 26,
    gap: 12,
  },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: COLORS.navy },
  emptyText: { fontSize: 13, color: COLORS.grey, textAlign: "center", lineHeight: 18 },
  shiftCard: {
    ...GLASS_CARD,
    ...GLASS_SHADOW_MD,
    flexDirection: "row",
    gap: 12,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  shiftCardBody: { flex: 1, gap: 6 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  shiftTimeLabel: { fontSize: 15, fontWeight: "800", color: COLORS.navy },
  relativeLabel: { fontSize: 11, fontWeight: "700", color: COLORS.grey },
  capacityRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
  capacityChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,46,76,0.08)",
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  capacityChipText: { fontSize: 11, fontWeight: "800", color: COLORS.navy },
  limitedTag: {
    backgroundColor: COLORS.amberBg,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  limitedTagText: { fontSize: 11, fontWeight: "800", color: "#9A7B00" },
  skeletonBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(0,46,76,0.12)",
  },
  skeletonLineWide: {
    height: 14,
    borderRadius: 7,
    width: "70%",
    backgroundColor: "rgba(0,46,76,0.12)",
  },
  skeletonLineNarrow: {
    height: 12,
    borderRadius: 6,
    width: "45%",
    backgroundColor: "rgba(0,46,76,0.1)",
    marginTop: 6,
  },
});
