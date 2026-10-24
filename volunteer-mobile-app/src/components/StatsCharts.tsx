import { Ionicons } from "@expo/vector-icons";
import { ReactNode, useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, { Circle, Line, Path, Rect } from "react-native-svg";
import { COLORS } from "../utils/colors";
import { formatStat, StatPeriod } from "../utils/statsPeriods";

export interface StatTheme {
  bg: string;
  chart: string;
  text: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export const STAT_THEMES = {
  hours: { bg: COLORS.coralBg, chart: COLORS.coral, text: COLORS.coralText, icon: "time-outline" },
  shifts: { bg: COLORS.amberBg, chart: COLORS.amberMid, text: COLORS.amberDark, icon: "calendar-outline" },
  total: { bg: COLORS.blueBg, chart: COLORS.blue, text: COLORS.blueText, icon: "trending-up-outline" },
  skills: { bg: COLORS.greenBg, chart: COLORS.greenMid, text: COLORS.greenLight, icon: "ribbon-outline" },
} satisfies Record<string, StatTheme>;

const CHART_HEIGHT = 120;
// Narrow columns only label the tallest bar
const MAX_LABELLED_BARS = 8;

const PERIODS: { key: StatPeriod; label: string }[] = [
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
  { key: "year", label: "Year" },
];

//--------------------MOTION--------------------//

// Null until known so nothing animates early
function useReduceMotion(): boolean | null {
  const [reduce, setReduce] = useState<boolean | null>(null);
  useEffect(() => {
    let active = true;
    Promise.resolve(AccessibilityInfo.isReduceMotionEnabled?.())
      .then((enabled) => active && setReduce(Boolean(enabled)))
      .catch(() => active && setReduce(false));
    const subscription = AccessibilityInfo.addEventListener?.("reduceMotionChanged", setReduce);
    return () => {
      active = false;
      subscription?.remove();
    };
  }, []);
  return reduce;
}

function ChartEntrance({ animationKey, children }: { animationKey: string; children: ReactNode }) {
  const reduceMotion = useReduceMotion();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion === null) return;
    if (reduceMotion) {
      progress.setValue(1);
      return;
    }
    progress.setValue(0);
    Animated.timing(progress, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, [animationKey, reduceMotion, progress]);

  return (
    <Animated.View
      style={{
        opacity: progress,
        transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
      }}
    >
      {children}
    </Animated.View>
  );
}

//--------------------SECTION--------------------//

export function StatSection({
  title,
  theme,
  summary,
  change,
  children,
}: {
  title: string;
  theme: StatTheme;
  summary: string;
  change?: string;
  children: ReactNode;
}) {
  return (
    <View style={[styles.section, { backgroundColor: theme.bg }]}>
      <View style={styles.sectionHeader}>
        <View style={styles.iconCircle}>
          <Ionicons name={theme.icon} size={18} color={theme.text} />
        </View>
        <Text style={[styles.sectionTitle, { color: theme.text }]} accessibilityRole="header">
          {title}
        </Text>
      </View>
      <Text style={[styles.summary, { color: theme.text }]}>{summary}</Text>
      {change ? <Text style={styles.change}>{change}</Text> : null}
      {children}
    </View>
  );
}

export function PeriodTabs({
  value,
  onChange,
  theme,
  chartName,
}: {
  value: StatPeriod;
  onChange: (period: StatPeriod) => void;
  theme: StatTheme;
  chartName: string;
}) {
  return (
    <View style={styles.tabs} accessibilityRole="tablist">
      {PERIODS.map((period) => {
        const selected = period.key === value;
        return (
          <TouchableOpacity
            key={period.key}
            style={[styles.tab, selected && { backgroundColor: theme.text }]}
            onPress={() => onChange(period.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={`${chartName}, ${period.label}`}
          >
            <Text style={[styles.tabText, selected && styles.tabTextSelected]}>{period.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function ChartEmpty({ theme, title, text }: { theme: StatTheme; title: string; text: string }) {
  return (
    <View style={styles.empty}>
      <Ionicons name="bar-chart-outline" size={26} color={COLORS.grey} />
      <Text style={[styles.emptyTitle, { color: theme.text }]}>{title}</Text>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

function AxisLabels({ labels }: { labels: string[] }) {
  return (
    <View style={styles.row}>
      {labels.map((label, i) => (
        <Text key={`${label}-${i}`} style={styles.axisLabel} numberOfLines={1}>
          {label}
        </Text>
      ))}
    </View>
  );
}

//--------------------CHARTS--------------------//

export function BarChart({
  values,
  labels,
  theme,
  unit,
  accessibilityLabel,
  animationKey,
}: {
  values: number[];
  labels: string[];
  theme: StatTheme;
  unit: string;
  accessibilityLabel: string;
  animationKey: string;
}) {
  const [width, setWidth] = useState(0);
  const max = Math.max(...values, 0);
  const columnWidth = values.length > 0 ? width / values.length : 0;
  const barWidth = Math.min(22, columnWidth * 0.58);
  const labelAll = values.length <= MAX_LABELLED_BARS;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      <ChartEntrance animationKey={animationKey}>
        <View style={styles.row}>
          {values.map((value, i) => (
            <Text
              key={i}
              style={[styles.valueLabel, { color: theme.text }, value === max && styles.valueLabelPeak]}
              numberOfLines={1}
            >
              {value > 0 && (labelAll || value === max) ? `${formatStat(value)}${unit}` : " "}
            </Text>
          ))}
        </View>
        {width > 0 ? (
          <Svg width={width} height={CHART_HEIGHT}>
            {values.map((value, i) => {
              if (value <= 0) return null;
              const height = Math.max(4, (value / max) * (CHART_HEIGHT - 4));
              return (
                <Rect
                  key={i}
                  x={i * columnWidth + (columnWidth - barWidth) / 2}
                  y={CHART_HEIGHT - height}
                  width={barWidth}
                  height={height}
                  rx={Math.min(6, barWidth / 2)}
                  fill={theme.chart}
                />
              );
            })}
          </Svg>
        ) : (
          <View style={styles.chartSpace} />
        )}
      </ChartEntrance>
      <AxisLabels labels={labels} />
    </View>
  );
}

export interface PieSlice {
  label: string;
  value: number;
  color: string;
}

const PIE_SIZE = 168;

function pointOnCircle(centre: number, radius: number, angle: number) {
  const radians = (angle * Math.PI) / 180;
  return { x: centre + radius * Math.cos(radians), y: centre + radius * Math.sin(radians) };
}

export function PieChart({
  slices,
  totalLabel,
  theme,
  accessibilityLabel,
}: {
  slices: PieSlice[];
  totalLabel: string;
  theme: StatTheme;
  accessibilityLabel: string;
}) {
  const centre = PIE_SIZE / 2;
  const radius = PIE_SIZE / 2;
  const sum = slices.reduce((total, slice) => total + slice.value, 0);
  let angle = -90;
  const arcs = slices.map((slice) => {
    const start = angle;
    angle += (slice.value / sum) * 360;
    return { ...slice, start, end: angle };
  });

  return (
    <View style={styles.pieWrap} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
      <ChartEntrance animationKey="pie">
        <Svg width={PIE_SIZE} height={PIE_SIZE}>
          {arcs.length === 1 ? (
            <Circle cx={centre} cy={centre} r={radius} fill={arcs[0].color} />
          ) : (
            arcs.map((arc) => {
              const from = pointOnCircle(centre, radius, arc.start);
              const to = pointOnCircle(centre, radius, arc.end);
              const largeArc = arc.end - arc.start > 180 ? 1 : 0;
              return (
                <Path
                  key={arc.label}
                  d={`M${centre},${centre} L${from.x},${from.y} A${radius},${radius} 0 ${largeArc} 1 ${to.x},${to.y} Z`}
                  fill={arc.color}
                />
              );
            })
          )}
          {arcs.length > 1 &&
            arcs.map((arc) => {
              const edge = pointOnCircle(centre, radius, arc.start);
              return (
                <Line
                  key={`gap-${arc.label}`}
                  x1={centre}
                  y1={centre}
                  x2={edge.x}
                  y2={edge.y}
                  stroke={COLORS.white}
                  strokeWidth={3}
                  strokeLinecap="round"
                />
              );
            })}
        </Svg>
      </ChartEntrance>
      <Text style={[styles.pieTotal, { color: theme.text }]}>{totalLabel}</Text>
    </View>
  );
}

//--------------------STYLES--------------------//

const styles = StyleSheet.create({
  section: { borderRadius: 20, padding: 16, marginBottom: 16, gap: 4 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
  },
  sectionTitle: { flex: 1, fontSize: 15.5, fontWeight: "800" },
  summary: { fontSize: 22, fontWeight: "800" },
  change: { fontSize: 12.5, fontWeight: "600", color: COLORS.grey },
  tabs: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderRadius: 22,
    marginTop: 12,
    marginBottom: 14,
  },
  tab: { flex: 1, minHeight: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  tabText: { fontSize: 13, fontWeight: "700", color: COLORS.grey },
  tabTextSelected: { color: COLORS.white, fontWeight: "800" },
  row: { flexDirection: "row" },
  valueLabel: { flex: 1, textAlign: "center", fontSize: 10.5, fontWeight: "600", marginBottom: 4 },
  valueLabelPeak: { fontWeight: "900" },
  axisLabel: { flex: 1, textAlign: "center", fontSize: 10, fontWeight: "600", color: COLORS.grey, marginTop: 6 },
  chartSpace: { height: CHART_HEIGHT },
  empty: { alignItems: "center", gap: 6, paddingVertical: 18, paddingHorizontal: 8 },
  emptyTitle: { fontSize: 15, fontWeight: "700", textAlign: "center" },
  emptyText: { fontSize: 13, color: COLORS.grey, textAlign: "center", lineHeight: 18 },
  pieWrap: { alignItems: "center", gap: 10, marginTop: 8, marginBottom: 4 },
  pieTotal: { fontSize: 15, fontWeight: "800", textAlign: "center" },
});

//----------------------------------- END OF FILE ---------------------------------//
