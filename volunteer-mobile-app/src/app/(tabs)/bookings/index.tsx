import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import MyShiftCard from "../../../components/MyShiftCard";
import { DateBadge, SHIFT_CARD_STYLES } from "../../../components/ShiftCardParts";
import { getPendingCancellationIds } from "../../../services/changeRequests";
import { getMyShifts, MyShift } from "../../../services/shifts";
import { bookVacancy, BookingRejectedError, getVacancies, Vacancy } from "../../../services/vacancies";
import { SessionExpiredError } from "../../../utils/api";
import { COLORS } from "../../../utils/colors";
import { bucketForDate, DateBucket, getRelativeLabel } from "../../../utils/dateBuckets";
import { compareShiftsByStart, formatTimeSlotLabel, hasShiftEnded } from "../../../utils/timeSlot";
import { showErrorToast } from "../../../utils/toast";
import { logError } from "../../../utils/logError";
import { SHEET_TOP_SHADOW } from "../../../constants/glassCard";

type ListRow =
  | { type: "header"; key: string; title: string }
  | { type: "mine"; key: string; item: MyShift }
  | { type: "available"; key: string; item: Vacancy };

function groupMyShifts(shifts: MyShift[]): ListRow[] {
  const order: DateBucket[] = ["Today", "This Week", "Later"];
  const buckets: Record<string, MyShift[]> = {};
  [...shifts].sort(compareShiftsByStart).forEach((item) => {
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
      logError("Book shift error", error);
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
      <Animated.View style={[SHIFT_CARD_STYLES.card, { transform: [{ scale }] }]}>
        <View style={[SHIFT_CARD_STYLES.notch, SHIFT_CARD_STYLES.notchBottomLeft]} />
        <View style={SHIFT_CARD_STYLES.topNotch} />
        <Text style={[SHIFT_CARD_STYLES.timeLabel, styles.availableTimeLabel]}>
          {formatTimeSlotLabel(item.timeSlot)}
        </Text>
        <View style={SHIFT_CARD_STYLES.badgeRow}>
          <DateBadge dateStr={item.shiftDate} size={68} color={COLORS.amberFill} />
          <View style={SHIFT_CARD_STYLES.metaColumn}>
            <View style={SHIFT_CARD_STYLES.metaRow}>
              <Ionicons name="time-outline" size={14} color={COLORS.grey} />
              <Text style={SHIFT_CARD_STYLES.metaText}>{item.timeSlot}</Text>
            </View>
            {item.location && (
              <View style={SHIFT_CARD_STYLES.metaRow}>
                <Ionicons name="location-outline" size={14} color={COLORS.grey} />
                <Text style={SHIFT_CARD_STYLES.metaText} numberOfLines={1} ellipsizeMode="tail">
                  {item.location}
                </Text>
              </View>
            )}
            <View style={SHIFT_CARD_STYLES.metaRow}>
              <Ionicons name="calendar-outline" size={14} color={COLORS.grey} />
              <Text style={SHIFT_CARD_STYLES.metaText}>{getRelativeLabel(item.shiftDate)}</Text>
            </View>
            <View style={SHIFT_CARD_STYLES.metaRow}>
              <Ionicons name="people-outline" size={14} color={COLORS.grey} />
              <Text style={SHIFT_CARD_STYLES.metaText}>
                {item.vacanciesAvailable} of {item.capacity} open
              </Text>
              {limited && (
                <View style={styles.limitedTag}>
                  <Text style={styles.limitedTagText}>Limited</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        <View style={SHIFT_CARD_STYLES.divider} />
        <TouchableOpacity style={SHIFT_CARD_STYLES.actionWrap} onPress={confirmBook} disabled={booking} hitSlop={6}>
          <View style={[SHIFT_CARD_STYLES.action, styles.bookAction]}>
            {booking ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="add-circle-outline" size={14} color={COLORS.white} />
                <Text style={[SHIFT_CARD_STYLES.actionText, styles.bookActionText]}>Book</Text>
              </>
            )}
          </View>
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
    <Animated.View style={[SHIFT_CARD_STYLES.card, { opacity }]}>
      <View style={styles.skeletonLineWide} />
      <View style={SHIFT_CARD_STYLES.badgeRow}>
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

  const bannerFade = useRef(new Animated.Value(0)).current;
  const bannerSlide = useRef(new Animated.Value(14)).current;
  const sheetFade = useRef(new Animated.Value(0)).current;
  const sheetSlide = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    const stagger = (fade: Animated.Value, slide: Animated.Value) =>
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 420, useNativeDriver: true }),
        Animated.timing(slide, { toValue: 0, duration: 420, useNativeDriver: true }),
      ]);

    Animated.stagger(90, [stagger(bannerFade, bannerSlide), stagger(sheetFade, sheetSlide)]).start();
  }, [bannerFade, bannerSlide, sheetFade, sheetSlide]);

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
              logError("Load pending cancellations error", error);
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
              .sort(compareShiftsByStart)
          );
        }
      } catch (error) {
        logError(`Load ${tab} shifts error`, error);
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

  const shiftCount = rows.filter((row) => row.type !== "header").length;

  const header = (
    <>
      <LinearGradient
        colors={[COLORS.amberLight, COLORS.amberDark]}
        style={[styles.banner, { paddingTop: 24 + insets.top }]}
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

        <Animated.View
          style={[styles.titleGroup, { opacity: bannerFade, transform: [{ translateY: bannerSlide }] }]}
        >
          <Text style={styles.title}>Upcoming Shifts</Text>
          <Text style={styles.subtitle}>YOUR SCHEDULE</Text>
          <Text style={styles.tagline}>My Shifts · Available Shifts</Text>
        </Animated.View>
      </LinearGradient>

      <View style={styles.sheet}>
        <Animated.View style={{ opacity: sheetFade, transform: [{ translateY: sheetSlide }] }}>
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summaryHeading}>{shiftCount}</Text>
              <Text style={styles.eyebrowLabel}>
                {tab === "mine" ? "UPCOMING SHIFTS" : "OPEN SHIFTS"}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.availabilityButtonWrap}
              onPress={() => router.push("/(tabs)/bookings/submit-availability")}
              activeOpacity={0.9}
            >
              <View style={styles.availabilityButton}>
                <Text style={styles.availabilityButtonText}>Availability</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.white} />
              </View>
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
                <View style={styles.segmentIndicatorFill} />
              </Animated.View>
            )}
            <TouchableOpacity style={styles.segment} onPress={() => setTab("mine")}>
              <Text style={[styles.segmentText, tab === "mine" && styles.segmentTextActive]}>My Shifts</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.segment} onPress={() => setTab("available")}>
              <Text style={[styles.segmentText, tab === "available" && styles.segmentTextActive]}>Available Shifts</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ListHeaderComponent={header}
        data={rows}
        keyExtractor={(row) => row.key}
        style={styles.list}
        contentContainerStyle={{ paddingBottom: 150, flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load("manual")} tintColor={COLORS.amberMid} />
        }
        renderItem={({ item: row }) => {
          if (row.type === "header") {
            return (
              <View style={styles.rowWrap}>
                <Text style={styles.sectionHeader}>{row.title}</Text>
              </View>
            );
          }
          if (row.type === "mine") {
            return (
              <View style={styles.rowWrap}>
                <MyShiftCard
                  item={row.item}
                  cancellationPending={pendingCancellationIds.has(row.item.rosterAssignmentId)}
                  accent={COLORS.amberFill}
                />
              </View>
            );
          }
          return (
            <View style={styles.rowWrap}>
              <AvailableShiftCard item={row.item} onChanged={() => load("silent")} />
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={[styles.rowWrap, styles.emptyWrap]}>
            {loading ? (
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
            )}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  list: { backgroundColor: COLORS.white },
  rowWrap: { backgroundColor: COLORS.white, paddingHorizontal: 20 },
  emptyWrap: { flexGrow: 1, paddingTop: 4 },
  banner: {
    alignItems: "center",
    paddingBottom: 90,
  },
  titleGroup: {
    alignSelf: "stretch",
    alignItems: "flex-start",
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
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 20,
  },
  summaryHeading: { fontSize: 24, color: COLORS.amberLight, fontWeight: "700" },
  eyebrowLabel: { fontSize: 12, color: COLORS.amberMid, fontWeight: "800", letterSpacing: 1.4, marginTop: 4 },
  availabilityButtonWrap: {
    borderRadius: 40,
    shadowColor: COLORS.amberDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  availabilityButton: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 40,
    paddingVertical: 12,
    paddingHorizontal: 18,
    gap: 6,
    backgroundColor: COLORS.amberFill,
  },
  availabilityButtonText: { color: COLORS.white, fontWeight: "700", fontSize: 13 },
  segmentRow: {
    flexDirection: "row",
    height: 44,
    padding: 4,
    borderRadius: 22,
    marginBottom: 16,
    backgroundColor: COLORS.amberBg,
  },
  segment: { flex: 1, alignItems: "center", justifyContent: "center", borderRadius: 18 },
  segmentIndicator: {
    position: "absolute",
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: 18,
    shadowColor: COLORS.amberDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentIndicatorFill: { flex: 1, borderRadius: 18, backgroundColor: COLORS.amberFill },
  segmentText: { fontSize: 13, color: COLORS.grey, fontWeight: "700" },
  segmentTextActive: { color: COLORS.white, fontWeight: "900" },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.amberMid,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 8,
    marginTop: 4,
  },
  emptyStateCard: {
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#ede7d8",
    padding: 26,
    gap: 12,
  },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: COLORS.amberLight },
  emptyText: { fontSize: 13, color: COLORS.grey, textAlign: "center", lineHeight: 18 },
  availableTimeLabel: { marginBottom: 12 },
  bookAction: { backgroundColor: COLORS.amberFill },
  bookActionText: { color: COLORS.white },
  limitedTag: {
    backgroundColor: COLORS.amberBg,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 13,
    marginLeft: 6,
  },
  limitedTagText: { fontSize: 11, fontWeight: "800", color: "#9A7B00" },
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
