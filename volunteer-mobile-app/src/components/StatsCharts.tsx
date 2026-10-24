import { Ionicons } from "@expo/vector-icons";
import { ReactNode, useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";
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

export function LineChart({
  values,
  labels,
  theme,
  step = false,
  accessibilityLabel,
  animationKey,
}: {
  values: (number | null)[];
  labels: string[];
  theme: StatTheme;
  step?: boolean;
  accessibilityLabel: string;
  animationKey: string;
}) {
  const [width, setWidth] = useState(0);
  const pad = 8;
  const known = values.filter((v): v is number => v !== null);
  const max = Math.max(...known, 1);
  const columnWidth = values.length > 0 ? width / values.length : 0;
  const points = values.flatMap((value, i) =>
    value === null ? [] : [{ x: (i + 0.5) * columnWidth, y: pad + (1 - value / max) * (CHART_HEIGHT - 2 * pad) }]
  );
  const line = points
    .map((p, i) => (i === 0 ? `M${p.x},${p.y}` : step ? `H${p.x}V${p.y}` : `L${p.x},${p.y}`))
    .join(" ");
  const area =
    points.length > 1
      ? `${line} L${points[points.length - 1].x},${CHART_HEIGHT} L${points[0].x},${CHART_HEIGHT} Z`
      : "";

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      <ChartEntrance animationKey={animationKey}>
        {width > 0 ? (
          <Svg width={width} height={CHART_HEIGHT}>
            {area ? <Path d={area} fill={theme.chart} opacity={0.14} /> : null}
            {points.length > 1 ? (
              <Path
                d={line}
                stroke={theme.chart}
                strokeWidth={2.5}
                fill="none"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ) : null}
            {points.map((p, i) => (
              <Circle key={i} cx={p.x} cy={p.y} r={3.5} fill={theme.chart} />
            ))}
          </Svg>
        ) : (
          <View style={styles.chartSpace} />
        )}
      </ChartEntrance>
      <AxisLabels labels={labels} />
    </View>
  );
}

export function ProgressRing({ percent, theme, label }: { percent: number; theme: StatTheme; label: string }) {
  const size = 120;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  return (
    <View style={styles.ringWrap} accessible accessibilityRole="image" accessibilityLabel={label}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={COLORS.white} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.chart}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - percent / 100)}
          strokeLinecap="round"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.ringLabel}>
        <Text style={[styles.ringPercent, { color: theme.text }]}>{percent}%</Text>
      </View>
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
  ringWrap: { alignSelf: "center", width: 120, height: 120, marginVertical: 8 },
  ringLabel: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, alignItems: "center", justifyContent: "center" },
  ringPercent: { fontSize: 24, fontWeight: "900" },
});

//----------------------------------- END OF FILE ---------------------------------//
