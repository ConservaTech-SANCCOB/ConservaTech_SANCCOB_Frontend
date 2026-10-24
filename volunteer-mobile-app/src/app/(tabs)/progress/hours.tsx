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
import CompletedShiftCard from "../../../components/CompletedShiftCard";
import {
  BarChart,
  ChartEmpty,
  DonutChart,
  PeriodTabs,
  STAT_THEMES,
  StatSection,
  StatTheme,
} from "../../../components/StatsCharts";
import {
  CompletedShift,
  getMyTrainingProfile,
  getMyTrainingStats,
  MyTrainingStats,
  TrainingVolunteerProfile,
} from "../../../services/training";
import {
  bucketTotals,
  DatedValue,
  describeChange,
  formatStat,
  PERIOD_PHRASE,
  periodBuckets,
  previousRange,
  startOfWeek,
  StatPeriod,
  sumBetween,
} from "../../../utils/statsPeriods";
import { COLORS } from "../../../utils/colors";
import { AboveBannerFill, BelowContentFill, refreshableBannerScrollStyles } from "../../../components/BannerOverscroll";
import { parseLocalDate } from "../../../utils/dateBuckets";
import { logError } from "../../../utils/logError";
import { SHEET_TOP_SHADOW } from "../../../constants/glassCard";
import { BannerBirds } from "../../../components/Wildlife";

const BANNER_SCROLL = refreshableBannerScrollStyles(COLORS.greenLight);

//--------------------HELPERS--------------------//

function monthLabelFor(dateStr: string): string {
  return parseLocalDate(dateStr).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// ------------------------------------------------------------ //

function newestFirst(a: CompletedShift, b: CompletedShift): number {
  return b.shiftDate.localeCompare(a.shiftDate) || (b.timeSlot ?? "").localeCompare(a.timeSlot ?? "");
}

// ------------------------------------------------------------ //

// Skills are a bonus so the screen still loads without them
async function loadSkillsProgress(): Promise<TrainingVolunteerProfile | null> {
  try {
    return (await getMyTrainingProfile()) ?? null;
  } catch (error) {
    logError("Load training profile error", error);
    return null;
  }
}

// ------------------------------------------------------------ //

const UNIT_WORD: Record<StatPeriod, string> = { week: "day", month: "week", year: "month" };

function findBestWeek(points: DatedValue[]): { start: Date; hours: number } | null {
  const totals = new Map<number, number>();
  points.forEach((point) => {
    const key = startOfWeek(point.date).getTime();
    totals.set(key, (totals.get(key) ?? 0) + point.value);
  });
  let best: { start: Date; hours: number } | null = null;
  for (const [key, hours] of totals) {
    if (hours > 0 && (!best || hours > best.hours)) best = { start: new Date(key), hours };
  }
  return best;
}

// Matches the Training tab sections and colours
const SKILL_SECTIONS = [
  { key: "supportingAreas", label: "Supporting areas", color: COLORS.greenMid, text: COLORS.greenLight },
  { key: "penRoutines", label: "Pen routines", color: COLORS.penBlue, text: COLORS.blueMid },
  { key: "seasonalSkills", label: "Seasonal skills", color: COLORS.pinkMid, text: COLORS.pinkLight },
] as const;

function skillCounts(profile: TrainingVolunteerProfile) {
  const sections = SKILL_SECTIONS.map((section) => {
    const list = profile[section.key] ?? [];
    return { ...section, done: list.filter((s) => s.isSignedOff).length, total: list.length };
  });
  return {
    sections,
    done: sections.reduce((sum, section) => sum + section.done, 0),
    total: sections.reduce((sum, section) => sum + section.total, 0),
  };
}

//--------------------STAT SECTIONS--------------------//

function StatCard({
  theme,
  icon,
  value,
  label,
  caption,
}: {
  theme: StatTheme;
  icon?: StatTheme["icon"];
  value: string;
  label: string;
  caption?: string;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: theme.bg }]}>
      <Ionicons name={icon ?? theme.icon} size={18} color={theme.text} />
      <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {caption ? <Text style={styles.statCaption}>{caption}</Text> : null}
    </View>
  );
}

type Measure = { one: string; many: string; unit: string; emptyText: string };

function PeriodBarSection({
  title,
  theme,
  points,
  measure,
}: {
  title: string;
  theme: StatTheme;
  points: DatedValue[];
  measure: Measure;
}) {
  const [period, setPeriod] = useState<StatPeriod>("month");
  const buckets = periodBuckets(period);
  const totals = bucketTotals(points, buckets);
  const total = totals.reduce((sum, v) => sum + v, 0);
  const previous = previousRange(period, buckets);
  const change = describeChange(total - sumBetween(points, previous.start, previous.end), measure.unit, period);
  const max = Math.max(...totals);
  const peak = buckets[Math.max(0, totals.indexOf(max))];
  const noun = (n: number) => (n === 1 ? measure.one : measure.many);
  const phrase = PERIOD_PHRASE[period];
  const label =
    `${title} ${phrase} by ${UNIT_WORD[period]}. ` +
    `Highest ${formatStat(max)} ${noun(max)} ${peak.spoken}. ` +
    `${formatStat(total)} ${noun(total)} in total.`;

  return (
    <StatSection title={title} theme={theme} summary={`${formatStat(total)} ${noun(total)} ${phrase}`} change={change}>
      <PeriodTabs value={period} onChange={setPeriod} theme={theme} chartName={title} />
      {total > 0 ? (
        <BarChart
          values={totals}
          labels={buckets.map((b) => b.label)}
          theme={theme}
          unit={measure.unit}
          accessibilityLabel={label}
          animationKey={period}
        />
      ) : (
        <ChartEmpty theme={theme} title={`No ${measure.many} ${phrase}`} text={measure.emptyText} />
      )}
    </StatSection>
  );
}

function SkillsSection({ profile }: { profile: TrainingVolunteerProfile }) {
  const theme = STAT_THEMES.skills;
  const { sections, done, total } = skillCounts(profile);
  const spokenBreakdown = sections.map((s) => `${s.label.toLowerCase()} ${s.done} of ${s.total}`).join(", ");

  return (
    <StatSection title="Skills signed off" theme={theme} summary={`${done} of ${total} skills`}>
      {done > 0 ? (
        <DonutChart
          slices={sections.filter((s) => s.done > 0).map((s) => ({ label: s.label, value: s.done, color: s.color }))}
          centreValue={`${done}/${total}`}
          centreCaption="signed off"
          theme={theme}
          accessibilityLabel={`Skills signed off by section: ${spokenBreakdown}. ${done} of ${total} in total.`}
        />
      ) : (
        <ChartEmpty
          theme={theme}
          title="No skills signed off yet"
          text="Ask a trainer on shift to sign off your next skill."
        />
      )}
      <View style={styles.areaList}>
        {sections.map((section) => (
          <View
            key={section.key}
            style={styles.areaRow}
            accessible
            accessibilityLabel={`${section.label}, ${section.done} of ${section.total} signed off`}
          >
            <View style={[styles.areaDot, { backgroundColor: section.color }]} />
            <Text style={[styles.areaName, { color: section.text }]}>{section.label}</Text>
            <Text style={[styles.areaCount, { color: section.text }]}>
              {section.done}/{section.total}
            </Text>
          </View>
        ))}
      </View>
    </StatSection>
  );
}

//--------------------SCREEN--------------------//

export default function HoursWorkedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<MyTrainingStats | null>(null);
  const [skills, setSkills] = useState<TrainingVolunteerProfile | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    const skillsRequest = loadSkillsProgress();
    try {
      setStats(await getMyTrainingStats());
      setLoadError(false);
    } catch (error) {
      logError("Load hours stats error", error);
      setLoadError(true);
    } finally {
      setSkills(await skillsRequest);
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const completedShifts = [...(stats?.completedShifts ?? [])].sort(newestFirst);
  const months = Array.from(new Set(completedShifts.map((s) => monthLabelFor(s.shiftDate))));
  // Show a dash not 0 when loading failed
  const statValue = (value: number | undefined) =>
    loadError || value === undefined ? "—" : formatStat(value);
  const hourPoints: DatedValue[] = completedShifts.map((s) => ({ date: parseLocalDate(s.shiftDate), value: s.hoursWorked }));
  const shiftPoints: DatedValue[] = completedShifts.map((s) => ({ date: parseLocalDate(s.shiftDate), value: 1 }));
  const bestWeek = findBestWeek(hourPoints);
  const skillTotals = skills ? skillCounts(skills) : null;

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
        style={BANNER_SCROLL.scroll}
        contentContainerStyle={[{ paddingBottom: 150 }, BANNER_SCROLL.content]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={COLORS.white}
            colors={[COLORS.greenMid]}
          />
        }
      >
        <AboveBannerFill />
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

          <BannerBirds top={insets.top} />

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
            <StatCard
              theme={STAT_THEMES.total}
              value={statValue(stats?.totalHours)}
              label="Total Hours"
            />
            <StatCard
              theme={STAT_THEMES.shifts}
              value={statValue(stats?.shiftsCompleted)}
              label="Shifts Done"
            />
          </View>
          <View style={[styles.statsRow, styles.statsRowLast]}>
            <StatCard
              theme={STAT_THEMES.hours}
              icon="trophy-outline"
              value={loadError ? "—" : formatStat(bestWeek?.hours ?? 0)}
              label="Best Week"
              caption={
                !loadError && bestWeek
                  ? `Week of ${bestWeek.start.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`
                  : undefined
              }
            />
            <StatCard
              theme={STAT_THEMES.skills}
              value={skillTotals ? `${skillTotals.done}/${skillTotals.total}` : "—"}
              label="Skills Signed Off"
            />
          </View>

          {!loadError && (
            <>
              <PeriodBarSection
                title="Hours worked"
                theme={STAT_THEMES.hours}
                points={hourPoints}
                measure={{ one: "hour", many: "hours", unit: "h", emptyText: "Completed shifts will show up here." }}
              />
              <PeriodBarSection
                title="Shifts done"
                theme={STAT_THEMES.shifts}
                points={shiftPoints}
                measure={{ one: "shift", many: "shifts", unit: "", emptyText: "Each shift you complete adds a bar here." }}
              />
            </>
          )}
          {skills && <SkillsSection profile={skills} />}

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
                    <CompletedShiftCard
                      key={`${shift.shiftDate}-${shift.timeSlot}-${i}`}
                      shift={shift}
                      hoursLabel={`${formatStat(shift.hoursWorked)} hrs`}
                    />
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
        <BelowContentFill />
      </ScrollView>
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
    color: COLORS.greenAccentMuted,
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
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  statsRowLast: { marginBottom: 20 },
  statCard: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  statValue: { fontSize: 20, fontWeight: "800" },
  statLabel: { fontSize: 10, fontWeight: "700", color: COLORS.grey, textAlign: "center" },
  statCaption: { fontSize: 10.5, fontWeight: "600", color: COLORS.grey, textAlign: "center" },
  logTitle: { fontSize: 15.5, fontWeight: "700", color: COLORS.greenLight, marginTop: 8 },
  monthLabel: {
    fontSize: 12,
    color: COLORS.greenMid,
    fontWeight: "700",
    letterSpacing: 0.6,
    marginTop: 18,
    marginBottom: 10,
  },
  areaList: { gap: 6, marginTop: 10 },
  areaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  areaDot: { width: 10, height: 10, borderRadius: 5 },
  areaName: { flex: 1, fontSize: 13, fontWeight: "700" },
  areaCount: { fontSize: 13, fontWeight: "800" },
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

//----------------------------------- END OF FILE ---------------------------------//
