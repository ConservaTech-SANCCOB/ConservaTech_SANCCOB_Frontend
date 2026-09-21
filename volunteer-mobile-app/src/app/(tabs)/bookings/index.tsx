import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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
import { DateBadge } from "../../../components/ShiftCardParts";
import { getPendingCancellationIds } from "../../../services/changeRequests";
import { getMyShifts, MyShift } from "../../../services/shifts";
import { bookVacancy, BookingRejectedError, getVacancies, Vacancy } from "../../../services/vacancies";
import { SessionExpiredError } from "../../../utils/api";
import { COLORS } from "../../../utils/colors";
import { bucketForDate, DateBucket, getRelativeLabel } from "../../../utils/dateBuckets";
import { formatTimeSlotLabel, hasShiftEnded } from "../../../utils/timeSlot";
import { showErrorToast } from "../../../utils/toast";

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

function AvailableShiftCard({ item, onChanged }: { item: Vacancy; onChanged: () => Promise<void> }) {
  const limited = item.vacanciesAvailable === 1;
  const scale = useRef(new Animated.Value(1)).current;
  const [booking, setBooking] = useState(false);

  const pressIn = () => {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 6 }).start();
  };
  const pressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 10 }).start();
  };

  const book = async () => {
    setBooking(true);
    try {
      await bookVacancy(item.shiftId);
      // The response has no updated vacancy count or shift details, so re-fetch: the
      // shift drops out of Available (now assigned to this volunteer, or full) and the
      // refreshed My Shifts data picks it up.
      await onChanged();
      Alert.alert("Shift booked", "It's now in your My Shifts.");
    } catch (error) {
      if (error instanceof SessionExpiredError) return; // api.ts already redirected to /login
      console.error("Book shift error:", error);
      if (error instanceof BookingRejectedError) {
        showErrorToast(
          "Couldn't book this shift",
          error.backendMessage ?? "It may have just filled up or is no longer available."
        );
        // The list is stale (that's the likely cause), so refresh to drop the card.
        await onChanged();
      } else {
        showErrorToast("Couldn't book this shift", "Something went wrong. Try again in a moment.");
      }
    } finally {
      setBooking(false);
    }
  };

  const confirmBook = () => {
    if (booking) return;
    Alert.alert(
      "Book this shift?",
      `${formatTimeSlotLabel(item.timeSlot)} · ${item.shiftDate}${item.location ? ` · ${item.location}` : ""}\n${item.vacanciesAvailable} of ${item.capacity} spots open`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Book", onPress: book },
      ]
    );
  };

  return (
    <TouchableOpacity activeOpacity={0.9} onPressIn={pressIn} onPressOut={pressOut} onPress={confirmBook}>
      <Animated.View style={[styles.shiftCard, { transform: [{ scale }] }]}>
        <View style={[styles.notch, styles.notchTopRight]} />
        <View style={[styles.notch, styles.notchBottomLeft]} />
        <Text style={styles.shiftTimeLabel}>{formatTimeSlotLabel(item.timeSlot)}</Text>
        <View style={styles.badgeRow}>
          <DateBadge dateStr={item.shiftDate} size={56} />
          <View style={styles.metaColumn}>
            <View style={styles.topRow}>
              <View style={styles.metaRow}>
                <Ionicons name="time-outline" size={14} color={COLORS.grey} />
                <Text style={styles.metaText}>{item.timeSlot}</Text>
              </View>
              <View style={styles.capacityGroup}>
                <View style={styles.capacityChip}>
                  <Ionicons name="people-outline" size={16} color={COLORS.navy} />
                  <Text style={styles.capacityChipText}>
                    {item.vacanciesAvailable} of {item.capacity} open
                  </Text>
                </View>
                {limited && (
                  <View style={styles.limitedTag}>
                    <Text style={styles.limitedTagText}>Limited</Text>
                  </View>
                )}
              </View>
            </View>
            {item.location && (
              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={14} color={COLORS.grey} />
                <Text style={styles.metaText} numberOfLines={1} ellipsizeMode="tail">
                  {item.location}
                </Text>
              </View>
            )}
            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={14} color={COLORS.grey} />
              <Text style={styles.metaText}>{getRelativeLabel(item.shiftDate)}</Text>
            </View>
          </View>
        </View>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.changeButtonWrap} onPress={confirmBook} disabled={booking} hitSlop={6}>
          <LinearGradient
            colors={["#00567f", "#002e4c"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.changeButton}
          >
            {booking ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={13} color={COLORS.white} />
                <Text style={styles.changeButtonText}>Book</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
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
      <View style={styles.skeletonLineWide} />
      <View style={styles.badgeRow}>
        <View style={styles.skeletonBadge} />
        <View style={styles.skeletonBody}>
          <View style={styles.skeletonLineNarrow} />
        </View>
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
  const [pendingCancellationIds, setPendingCancellationIds] = useState<Set<number>>(new Set());
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
          const [shifts, pending] = await Promise.all([
            getMyShifts(),
            // A failure here must not break My Shifts — keep the last known pending set.
            getPendingCancellationIds().catch((error) => {
              console.error("Load pending cancellations error:", error);
              return null;
            }),
          ]);
          setMyShifts(shifts);
          if (pending) setPendingCancellationIds(pending);
        } else {
          const [vacancies, myShiftsForExclusion] = await Promise.all([getVacancies(), getMyShifts()]);
          // Already fetched for the exclusion below, so keep My Shifts in sync for free
          // (otherwise it stays stale until the tab is switched back to).
          setMyShifts(myShiftsForExclusion);
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
              return (
                <MyShiftCard
                  item={row.item}
                  cancellationPending={pendingCancellationIds.has(row.item.rosterAssignmentId)}
                />
              );
            }
            return <AvailableShiftCard item={row.item} onChanged={() => load("silent")} />;
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
    paddingVertical: 14,
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
    backgroundColor: COLORS.white,
    borderColor: COLORS.navy,
    borderTopColor: COLORS.navy,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  notch: {
    position: "absolute",
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: COLORS.lightGrey,
    borderWidth: 0.75,
    borderColor: COLORS.navy,
  },
  notchTopRight: { top: 8, right: 8 },
  notchBottomLeft: { bottom: 8, left: 8 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  shiftTimeLabel: { fontSize: 17, fontWeight: "800", color: COLORS.navy, marginBottom: 8 },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  metaColumn: { flex: 1, gap: 3 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { flexShrink: 1, fontSize: 13, color: COLORS.grey, fontWeight: "600" },
  divider: {
    height: 1,
    backgroundColor: "rgba(0,46,76,0.12)",
    marginTop: 6,
    marginLeft: 70,
  },
  capacityGroup: { flexDirection: "row", alignItems: "center", gap: 6 },
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
    paddingHorizontal: 10,
    borderRadius: 13,
  },
  limitedTagText: { fontSize: 11, fontWeight: "800", color: "#9A7B00" },
  changeButtonWrap: {
    alignSelf: "flex-end",
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 0.75,
    borderColor: "rgba(255,255,255,0.5)",
    shadowColor: "#002e4c",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  changeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 13.5,
  },
  changeButtonText: { fontSize: 11, fontWeight: "800", color: COLORS.white },
  skeletonBadge: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: "rgba(0,46,76,0.12)",
  },
  skeletonBody: { flex: 1, gap: 8 },
  skeletonLineWide: {
    height: 18,
    borderRadius: 9,
    width: "70%",
    backgroundColor: "rgba(0,46,76,0.12)",
    marginBottom: 8,
  },
  skeletonLineNarrow: {
    height: 15,
    borderRadius: 7,
    width: "45%",
    backgroundColor: "rgba(0,46,76,0.1)",
    marginTop: 8,
  },
});
