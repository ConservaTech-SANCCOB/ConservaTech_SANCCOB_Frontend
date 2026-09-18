import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GLASS_CARD, GLASS_SHADOW_LG, GLASS_SHADOW_MD } from "../../../constants/glassCard";
import MyShiftCard from "../../../components/MyShiftCard";
import { DateBadge, ShiftMeta } from "../../../components/ShiftCardParts";
import { getMyShifts, MyShift } from "../../../services/shifts";
import { getVacancies, Vacancy } from "../../../services/vacancies";
import { COLORS } from "../../../utils/colors";
import { bucketForDate, DateBucket, getRelativeLabel } from "../../../utils/dateBuckets";
import { formatTimeSlotLabel, hasShiftEnded } from "../../../utils/timeSlot";

type ListRow =
  | { type: "header"; key: string; title: string }
  | { type: "mine"; key: string; item: MyShift }
  | { type: "available"; key: string; item: Vacancy };

function groupMyShifts(shifts: MyShift[]): ListRow[] {
  const order: DateBucket[] = ["Today", "This Week", "Later"];
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

function AvailableShiftCard({ item }: { item: Vacancy }) {
  const limited = item.vacanciesAvailable === 1;
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 6 }).start();
  };
  const pressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 10 }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPressIn={pressIn}
      onPressOut={pressOut}
      onPress={() =>
        Alert.alert(
          `${formatTimeSlotLabel(item.timeSlot)} shift`,
          `${item.shiftDate}${item.location ? ` · ${item.location}` : ""}\n${item.vacanciesAvailable} of ${item.capacity} spots open`
        )
      }
    >
      <Animated.View style={[styles.shiftCard, { transform: [{ scale }] }]}>
        <DateBadge dateStr={item.shiftDate} />
        <View style={styles.shiftCardBody}>
          <View style={styles.topRow}>
            <Text style={styles.shiftTimeLabel}>{formatTimeSlotLabel(item.timeSlot)}</Text>
            <Text style={styles.relativeLabel}>{getRelativeLabel(item.shiftDate)}</Text>
          </View>
          <ShiftMeta timeSlot={item.timeSlot} location={item.location} />
          <View style={styles.capacityRow}>
            <View style={styles.capacityChip}>
              <Ionicons name="people-outline" size={16} color={COLORS.navy} />
              <Text style={styles.capacityChipText}>
                {item.vacanciesAvailable} of {item.capacity} open
              </Text>
            </View>
            {limited && (
              <View style={styles.limitedTag}>
                <Text style={styles.limitedTagText}>Limited spots</Text>
              </View>
            )}
          </View>
        </View>
      </Animated.View>
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
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<"mine" | "available">("mine");
  const [myShifts, setMyShifts] = useState<MyShift[]>([]);
  const [availableShifts, setAvailableShifts] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [segmentRowWidth, setSegmentRowWidth] = useState(0);
  const segmentTranslateX = useRef(new Animated.Value(0)).current;
  const segmentIndicatorWidth = segmentRowWidth > 0 ? (segmentRowWidth - 8) / 2 : 0;
  const hasLoadedTab = useRef<{ mine: boolean; available: boolean }>({ mine: false, available: false });

  useEffect(() => {
    Animated.spring(segmentTranslateX, {
      toValue: tab === "mine" ? 0 : segmentIndicatorWidth,
      useNativeDriver: true,
      speed: 16,
      bounciness: 8,
    }).start();
  }, [tab, segmentIndicatorWidth, segmentTranslateX]);

  const load = useCallback(
    async (mode: "initial" | "manual" | "silent" = "initial") => {
      if (mode === "manual") setRefreshing(true);
      else if (mode === "initial") setLoading(true);
      setLoadError(false);
      try {
        if (tab === "mine") {
          setMyShifts(await getMyShifts());
        } else {
          const [vacancies, myShiftsForExclusion] = await Promise.all([getVacancies(), getMyShifts()]);
          const assignedShiftIds = new Set(myShiftsForExclusion.map((s) => s.shiftId));
          setAvailableShifts(
            vacancies.filter(
              (v) =>
                v.vacanciesAvailable > 0 &&
                !hasShiftEnded(v.shiftDate, v.timeSlot) &&
                !assignedShiftIds.has(v.shiftId)
            )
          );
        }
      } catch (error) {
        console.error(`Load ${tab} shifts error:`, error);
        setLoadError(true);
      } finally {
        if (mode === "manual") setRefreshing(false);
        else if (mode === "initial") setLoading(false);
      }
    },
    [tab]
  );

  useFocusEffect(
    useCallback(() => {
      const alreadyLoadedThisTab = hasLoadedTab.current[tab];
      hasLoadedTab.current[tab] = true;
      load(alreadyLoadedThisTab ? "silent" : "initial");
    }, [tab, load])
  );

  const rows: ListRow[] =
    tab === "mine"
      ? groupMyShifts(myShifts.filter((s) => !hasShiftEnded(s.shiftDate, s.timeSlot)))
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

      <View
        style={styles.segmentRow}
        onLayout={(e) => setSegmentRowWidth(e.nativeEvent.layout.width)}
      >
        {segmentIndicatorWidth > 0 && (
          <Animated.View
            style={[
              styles.segmentIndicator,
              { width: segmentIndicatorWidth, transform: [{ translateX: segmentTranslateX }] },
            ]}
          >
            <LinearGradient
              colors={["#6FD0FF", "#2BA8E0"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.segmentIndicatorFill}
            />
          </Animated.View>
        )}
        <TouchableOpacity style={styles.segment} onPress={() => setTab("mine")}>
          <Text style={[styles.segmentText, tab === "mine" && styles.segmentTextActive]}>My Shifts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.segment} onPress={() => setTab("available")}>
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
      <View style={styles.container}>
        <FlatList
          ListHeaderComponent={header}
          data={rows}
          keyExtractor={(row) => row.key}
          contentContainerStyle={{ padding: 20, paddingTop: 8 + insets.top, paddingBottom: 150, flexGrow: 1 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load("manual")} tintColor={COLORS.blue} />
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
      </View>
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
    height: 44,
    padding: 4,
    borderRadius: 14,
    marginBottom: 16,
  },
  segment: { flex: 1, alignItems: "center", justifyContent: "center", borderRadius: 10 },
  segmentIndicator: {
    position: "absolute",
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: 10,
    borderWidth: 0.75,
    borderColor: "rgba(255,255,255,0.5)",
    shadowColor: "#002e4c",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 10,
  },
  segmentIndicatorFill: { flex: 1, borderRadius: 10 },
  segmentText: { fontSize: 13, color: COLORS.grey, fontWeight: "700" },
  segmentTextActive: { color: COLORS.white, fontWeight: "900" },
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
    gap: 20,
    borderRadius: 20,
    padding: 22,
    marginBottom: 18,
  },
  shiftCardBody: { flex: 1, gap: 8 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  shiftTimeLabel: { fontSize: 19, fontWeight: "800", color: COLORS.navy },
  relativeLabel: { fontSize: 13, fontWeight: "700", color: COLORS.grey },
  capacityRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 3 },
  capacityChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,46,76,0.08)",
    paddingVertical: 5,
    paddingHorizontal: 13,
    borderRadius: 13,
  },
  capacityChipText: { fontSize: 13, fontWeight: "800", color: COLORS.navy },
  limitedTag: {
    backgroundColor: COLORS.amberBg,
    paddingVertical: 5,
    paddingHorizontal: 13,
    borderRadius: 13,
  },
  limitedTagText: { fontSize: 13, fontWeight: "800", color: "#9A7B00" },
  skeletonBadge: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: "rgba(0,46,76,0.12)",
  },
  skeletonLineWide: {
    height: 18,
    borderRadius: 9,
    width: "70%",
    backgroundColor: "rgba(0,46,76,0.12)",
  },
  skeletonLineNarrow: {
    height: 15,
    borderRadius: 7,
    width: "45%",
    backgroundColor: "rgba(0,46,76,0.1)",
    marginTop: 8,
  },
});
