import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Alert, Animated, ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import { penRoutines, supportingAreas } from "../../../data/mockSkills";
import { Skill } from "../../../types/skill";
import { GLASS_CARD, GLASS_SHADOW_LG, GLASS_SHADOW_MD } from "../../../constants/glassCard";
import { COLORS } from "../../../utils/colors";

function ProgressRing({ percent, size = 92, strokeWidth = 10 }: { percent: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percent));
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(0,46,76,0.12)" strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={COLORS.amber}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={StyleSheet.absoluteFill}>
        <View style={styles.ringLabelWrap}>
          <Text style={styles.ringPercent}>{clamped}%</Text>
        </View>
      </View>
    </View>
  );
}

function getMilestone(percent: number, totalCount: number): { icon: keyof typeof Ionicons.glyphMap; text: string } | null {
  if (totalCount === 0) return null;
  if (percent >= 100) return { icon: "trophy", text: "All skills completed!" };
  if (percent >= 50) return { icon: "flag", text: "Halfway there, keep going" };
  return null;
}

function SectionHeader({
  title,
  subtitle,
  expanded,
  locked,
  onPress,
}: {
  title: string;
  subtitle: string;
  expanded: boolean;
  locked?: boolean;
  onPress: () => void;
}) {
  const rotation = useRef(new Animated.Value(expanded ? 1 : 0)).current;

  const toggle = () => {
    Animated.timing(rotation, {
      toValue: expanded ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    onPress();
  };

  const spin = rotation.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] });

  return (
    <TouchableOpacity
      style={[styles.sectionHeader, locked && styles.sectionHeaderLocked]}
      onPress={toggle}
      disabled={locked}
      activeOpacity={locked ? 1 : 0.7}
    >
      <View style={{ flex: 1 }}>
        <Text style={[styles.sectionTitle, locked && styles.sectionTitleLocked]}>{title}</Text>
        <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      </View>
      {locked ? (
        <Ionicons name="lock-closed" size={18} color={COLORS.grey} />
      ) : (
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <Ionicons name="chevron-down" size={20} color={COLORS.navy} />
        </Animated.View>
      )}
    </TouchableOpacity>
  );
}

function SkillRow({ skill }: { skill: Skill }) {
  return (
    <TouchableOpacity
      style={styles.skillRow}
      activeOpacity={0.7}
      onPress={() =>
        Alert.alert(skill.name, skill.completed ? "You've completed this skill." : "Not started yet.")
      }
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
        <Text style={styles.skillName}>{skill.name}</Text>
        {skill.seasonal && (
          <View style={styles.seasonalTag}>
            <Text style={styles.seasonalText}>Seasonal</Text>
          </View>
        )}
      </View>
      {skill.completed ? (
        <View style={styles.statusRow}>
          <Text style={styles.completedText}>Completed</Text>
          <Ionicons name="checkmark-circle" size={20} color={COLORS.green} />
        </View>
      ) : (
        <View style={styles.statusRow}>
          <Text style={styles.incompleteText}>Not Started</Text>
          <Ionicons name="ellipse-outline" size={20} color={COLORS.grey} />
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function TrainingScreen() {
  const router = useRouter();
  const [supportingExpanded, setSupportingExpanded] = useState(true);
  const [penExpanded, setPenExpanded] = useState(false);

  const allSkills = [...supportingAreas, ...penRoutines];
  const completedCount = allSkills.filter((s) => s.completed).length;
  const totalCount = allSkills.length;
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const penCompletedCount = penRoutines.filter((s) => s.completed).length;
  const penLocked = penRoutines.length === 0;
  const milestone = getMilestone(percent, totalCount);

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
        <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 8, paddingBottom: 150 }}>
          <View style={styles.headerRow}>
            <View style={styles.headerCard}>
              <Text style={styles.headerTitle}>Training</Text>
            </View>
            <TouchableOpacity style={styles.hoursButton} onPress={() => router.push("/(tabs)/progress/hours")}>
              <Ionicons name="bar-chart-outline" size={16} color={COLORS.navy} />
              <Text style={styles.hoursButtonText}>Stats</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryTopRow}>
              <ProgressRing percent={percent} />
              <View style={styles.summaryTextCol}>
                <Text style={styles.summaryText}>{completedCount} of {totalCount}</Text>
                <Text style={styles.summarySubtext}>skills completed</Text>
                {milestone && (
                  <View style={styles.milestoneBadge}>
                    <Ionicons name={milestone.icon} size={13} color="#9A7B00" />
                    <Text style={styles.milestoneText}>{milestone.text}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <SectionHeader
            title="Supporting Areas"
            subtitle="Must be completed before moving to Pen Routines"
            expanded={supportingExpanded}
            onPress={() => setSupportingExpanded(!supportingExpanded)}
          />
          {supportingExpanded && supportingAreas.map((skill) => <SkillRow key={skill.id} skill={skill} />)}

          <View style={{ marginTop: 20 }}>
            <SectionHeader
              title="Pen Routines"
              subtitle={
                penLocked
                  ? "Complete Supporting Areas to unlock these skills"
                  : `${penCompletedCount} of ${penRoutines.length} completed`
              }
              expanded={penExpanded}
              locked={penLocked}
              onPress={() => setPenExpanded(!penExpanded)}
            />
          </View>
          {!penLocked && penExpanded && penRoutines.map((skill) => <SkillRow key={skill.id} skill={skill} />)}
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  headerCard: {
    ...GLASS_CARD,
    ...GLASS_SHADOW_LG,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 22,
  },
  headerTitle: { fontSize: 20, fontWeight: "800", color: COLORS.navy },
  hoursButton: {
    ...GLASS_CARD,
    ...GLASS_SHADOW_LG,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingVertical: 9,
    paddingHorizontal: 14,
    gap: 6,
  },
  hoursButtonText: { color: COLORS.navy, fontWeight: "800", fontSize: 13 },
  summaryCard: {
    ...GLASS_CARD,
    borderRadius: 18,
    padding: 18,
    marginBottom: 24,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 40,
    elevation: 16,
  },
  summaryTopRow: { flexDirection: "row", alignItems: "center", gap: 18 },
  summaryTextCol: { flex: 1, gap: 2 },
  ringLabelWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  ringPercent: { fontSize: 18, fontWeight: "900", color: COLORS.navy },
  summaryText: { fontSize: 18, color: COLORS.navy, fontWeight: "800" },
  summarySubtext: { fontSize: 13, color: COLORS.grey, fontWeight: "600" },
  milestoneBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: COLORS.amberBg,
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginTop: 8,
  },
  milestoneText: { fontSize: 11, fontWeight: "800", color: "#9A7B00" },
  sectionHeader: {
    ...GLASS_CARD,
    ...GLASS_SHADOW_LG,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowRadius: 18,
  },
  sectionHeaderLocked: {
    backgroundColor: "rgba(255,255,255,0.35)",
    shadowOpacity: 0.15,
  },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: COLORS.navy },
  sectionTitleLocked: { color: COLORS.grey },
  sectionSubtitle: { fontSize: 12, color: COLORS.grey, marginTop: 2 },
  skillRow: {
    ...GLASS_CARD,
    ...GLASS_SHADOW_MD,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  skillName: { fontSize: 14, color: COLORS.black, flexShrink: 1 },
  seasonalTag: { backgroundColor: COLORS.amberBg, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  seasonalText: { fontSize: 10, color: COLORS.amber, fontWeight: "700" },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  completedText: { fontSize: 12, color: COLORS.green, fontWeight: "600" },
  incompleteText: { fontSize: 12, color: COLORS.grey },
});
