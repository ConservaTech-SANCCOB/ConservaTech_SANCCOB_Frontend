import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Animated, Easing, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";
import { getMyTrainingProfile, TrainingSkillDto, TrainingVolunteerProfile } from "../../../services/training";
import { Skill } from "../../../types/skill";
import { COLORS } from "../../../utils/colors";
import { logError } from "../../../utils/logError";
import { SHEET_TOP_SHADOW } from "../../../constants/glassCard";
import { BannerBirds, BannerPenguin, MascotFigure } from "../../../components/Wildlife";
import { useReduceMotion } from "../../../utils/useReduceMotion";

function toSkill(dto: TrainingSkillDto): Skill {
  return {
    id: String(dto.skillId),
    name: dto.skillName ?? "Unnamed skill",
    completed: dto.isSignedOff,
    signedOffBy: dto.trainerName,
    signedOffAt: dto.signedOffAt,
  };
}

function signOffDetail(skill: Skill): string {
  if (!skill.completed) return "Not signed off yet. A trainer signs this off once you've shown you can do it.";
  const by = skill.signedOffBy ? ` by ${skill.signedOffBy}` : "";
  const on = skill.signedOffAt ? ` on ${new Date(skill.signedOffAt).toLocaleDateString()}` : "";
  return `Signed off${by}${on}.`;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * Penguin-themed levels for overall progress, from egg to fully fledged: a light
 * nod to the chicks SANCCOB hand-rears, and a friendlier read than a bare number.
 */
function trainingStage(percent: number): { title: string; message: string; icon: keyof typeof Ionicons.glyphMap } {
  if (percent >= 100) return { title: "Fully fledged!", message: "Every required skill is signed off. Amazing work!", icon: "trophy" };
  if (percent >= 75) return { title: "Almost waterproof", message: "Nearly ready for the big swim!", icon: "rocket" };
  if (percent >= 50) return { title: "Finding your flippers", message: "Past halfway, keep it up!", icon: "water" };
  if (percent >= 25) return { title: "Growing feathers", message: "You're building real momentum.", icon: "trending-up" };
  if (percent > 0) return { title: "Fluffy chick", message: "Great start, every skill counts.", icon: "sparkles" };
  return { title: "Just hatched", message: "Your first sign-off is waiting for you!", icon: "egg" };
}

function ProgressRing({ percent, size = 92, strokeWidth = 10 }: { percent: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percent));
  const progress = useRef(new Animated.Value(0)).current;
  const labelScale = useRef(new Animated.Value(1)).current;

  // Fill the ring up to the current value (from wherever it was), then give the
  // percentage a little pop so the change registers.
  useEffect(() => {
    Animated.timing(progress, {
      toValue: clamped,
      duration: 1200,
      delay: 250,
      easing: Easing.out(Easing.cubic),
      // strokeDashoffset is an SVG prop, which the native driver can't animate.
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (!finished || clamped === 0) return;
      Animated.sequence([
        Animated.timing(labelScale, { toValue: 1.18, duration: 130, useNativeDriver: true }),
        Animated.spring(labelScale, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 12 }),
      ]).start();
    });
  }, [clamped, progress, labelScale]);

  const strokeDashoffset = progress.interpolate({ inputRange: [0, 100], outputRange: [circumference, 0] });

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(63,201,32,0.15)" strokeWidth={strokeWidth} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={COLORS.green}
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
          <MascotFigure kind={clamped >= 100 ? "adult" : "chick"} size={size * 0.24} />
          <Animated.Text style={[styles.ringPercent, { fontSize: size * 0.17, transform: [{ scale: labelScale }] }]}>
            {clamped}%
          </Animated.Text>
        </View>
      </View>
    </View>
  );
}

function StagePill({ percent }: { percent: number }) {
  const stage = trainingStage(percent);
  const pop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    pop.setValue(0);
    Animated.sequence([
      Animated.delay(900),
      Animated.spring(pop, { toValue: 1, useNativeDriver: true, speed: 10, bounciness: 10 }),
    ]).start();
  }, [stage.title, pop]);

  return (
    <Animated.View
      style={[
        styles.stagePill,
        { opacity: pop, transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }] },
      ]}
    >
      <View style={styles.stageIcon}>
        <Ionicons name={stage.icon} size={16} color={COLORS.white} />
      </View>
      <View style={styles.stageTextGroup}>
        <Text style={styles.stageTitle}>{stage.title}</Text>
        <Text style={styles.stageMessage}>{stage.message}</Text>
      </View>
    </Animated.View>
  );
}

function SectionProgressBar({ done, total, locked }: { done: number; total: number; locked?: boolean }) {
  const fill = useRef(new Animated.Value(0)).current;
  const ratio = total > 0 ? done / total : 0;

  useEffect(() => {
    Animated.timing(fill, {
      toValue: ratio,
      duration: 900,
      delay: 400,
      easing: Easing.out(Easing.cubic),
      // Animating width keeps the bar's rounded ends intact (scaleX would squash them).
      useNativeDriver: false,
    }).start();
  }, [ratio, fill]);

  return (
    <View style={styles.barTrack}>
      <Animated.View
        style={[
          styles.barFill,
          locked && styles.barFillLocked,
          ratio === 1 && styles.barFillComplete,
          { width: fill.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) },
        ]}
      />
    </View>
  );
}

function CompleteBadge() {
  const pop = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.delay(1200),
      Animated.spring(pop, { toValue: 1, useNativeDriver: true, speed: 8, bounciness: 14 }),
    ]).start();
  }, [pop]);
  return (
    <Animated.View style={[styles.completeBadge, { transform: [{ scale: pop }] }]}>
      <Ionicons name="star" size={11} color={COLORS.white} />
      <Text style={styles.completeBadgeText}>Complete</Text>
    </Animated.View>
  );
}

function SectionHeader({
  title,
  subtitle,
  locked,
  done,
  total,
}: {
  title: string;
  subtitle: string;
  locked?: boolean;
  done: number;
  total: number;
}) {
  const complete = !locked && total > 0 && done === total;
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleRow}>
        {locked && <Ionicons name="lock-closed" size={14} color="#8a938b" />}
        <Text style={[styles.sectionTitle, locked && styles.sectionTitleLocked]}>{title}</Text>
        {complete && <CompleteBadge />}
      </View>
      <Text style={[styles.sectionSubtitle, locked && styles.sectionSubtitleLocked]}>{subtitle}</Text>
      {total > 0 && <SectionProgressBar done={done} total={total} locked={locked} />}
    </View>
  );
}

function SkillRow({
  skill,
  index,
  skills,
  locked,
}: {
  skill: Skill;
  index: number;
  skills: Skill[];
  locked?: boolean;
}) {
  const isFirst = index === 0;
  const isLast = index === skills.length - 1;
  const isCurrent = !locked && !skill.completed && skills.slice(0, index).every((s) => s.completed);
  const reduceMotion = useReduceMotion();
  const enter = useRef(new Animated.Value(0)).current;
  const nodePop = useRef(new Animated.Value(skill.completed ? 0.4 : 1)).current;
  const halo = useRef(new Animated.Value(0)).current;

  // Rows slide in one after another, and each tick pops in as its row arrives.
  useEffect(() => {
    const delay = 350 + index * 70;
    Animated.parallel([
      Animated.timing(enter, { toValue: 1, duration: 380, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(delay + 150),
        Animated.spring(nodePop, { toValue: 1, useNativeDriver: true, speed: 12, bounciness: 14 }),
      ]),
    ]).start();
  }, [enter, nodePop, index]);

  // The "Up next" skill gently pulses so it's obvious where to focus.
  useEffect(() => {
    if (!isCurrent || reduceMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(halo, { toValue: 1, duration: 1300, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(halo, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.delay(300),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isCurrent, reduceMotion, halo]);

  return (
    <Animated.View
      style={{
        opacity: enter,
        transform: [{ translateX: enter.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
      }}
    >
      <TouchableOpacity
        style={styles.pathRow}
        activeOpacity={0.6}
        onPress={() =>
          Alert.alert(skill.name, signOffDetail(skill))
        }
      >
        <View style={styles.pathTrack}>
          {!isFirst && (
            <View style={[styles.trackSeg, styles.trackSegTop, skills[index - 1].completed && styles.trackSegDone]} />
          )}
          {!isLast && (
            <View style={[styles.trackSeg, styles.trackSegBottom, skill.completed && styles.trackSegDone]} />
          )}

          {isCurrent && (
            <Animated.View
              style={[
                styles.nodeHalo,
                {
                  opacity: halo.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }),
                  transform: [{ scale: halo.interpolate({ inputRange: [0, 1], outputRange: [1, 1.8] }) }],
                },
              ]}
            />
          )}
          <Animated.View
            style={[
              styles.node,
              skill.completed && styles.nodeDone,
              isCurrent && styles.nodeCurrent,
              { transform: [{ scale: nodePop }] },
            ]}
          >
            {skill.completed ? (
              <Ionicons name="checkmark" size={15} color={COLORS.white} />
            ) : isCurrent ? (
              <View style={styles.nodeDot} />
            ) : locked ? (
              <Ionicons name="lock-closed" size={11} color="#b5bdb3" />
            ) : null}
          </Animated.View>
        </View>

        <View style={styles.pathBody}>
          <View style={styles.skillNameWrap}>
            <Text
              style={[styles.pathName, skill.completed && styles.pathNameDone, isCurrent && styles.pathNameCurrent]}
              numberOfLines={1}
            >
              {skill.name}
            </Text>
          </View>
          {skill.completed && <Text style={styles.pathStatusDone}>Completed</Text>}
          {isCurrent && <Text style={styles.pathStatusNext}>Up next</Text>}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function TrainingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(14)).current;
  const summaryFade = useRef(new Animated.Value(0)).current;
  const summarySlide = useRef(new Animated.Value(18)).current;
  const sectionsFade = useRef(new Animated.Value(0)).current;
  const sectionsSlide = useRef(new Animated.Value(18)).current;
  const [profile, setProfile] = useState<TrainingVolunteerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // Re-fetched on every focus so a trainer's sign-off shows up without a restart.
  const load = useCallback(async () => {
    try {
      setProfile(await getMyTrainingProfile());
      setLoadError(false);
    } catch (error) {
      logError("Load training profile error", error);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    const stagger = (fade: Animated.Value, slide: Animated.Value) =>
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 420, useNativeDriver: true }),
        Animated.timing(slide, { toValue: 0, duration: 420, useNativeDriver: true }),
      ]);

    Animated.stagger(90, [
      stagger(headerFade, headerSlide),
      stagger(summaryFade, summarySlide),
      stagger(sectionsFade, sectionsSlide),
    ]).start();
  }, [headerFade, headerSlide, summaryFade, summarySlide, sectionsFade, sectionsSlide]);

  const supportingAreas = (profile?.supportingAreas ?? []).map((s) => toSkill(s));
  const penRoutines = (profile?.penRoutines ?? []).map((s) => toSkill(s));
  const seasonalSkills = (profile?.seasonalSkills ?? []).map((s) => toSkill(s));
  const allSupportingAreasComplete = supportingAreas.length > 0 && supportingAreas.every((s) => s.completed);
  // The backend's own required-skill totals, so this matches what trainers see.
  const completedCount = profile?.completedRequiredSkills ?? 0;
  const totalCount = profile?.totalRequiredSkills ?? 0;
  const percent = Math.round(profile?.progressPercentage ?? 0);
  const supportingCompletedCount = supportingAreas.filter((s) => s.completed).length;
  const penCompletedCount = penRoutines.filter((s) => s.completed).length;
  const seasonalCompletedCount = seasonalSkills.filter((s) => s.completed).length;
  const penLocked = !allSupportingAreasComplete;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 150 + insets.bottom }}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <LinearGradient colors={[COLORS.greenLight, COLORS.greenDark]} style={[styles.banner, { paddingTop: 24 + insets.top }]}>
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

          <Animated.View style={[styles.titleGroup, { opacity: headerFade, transform: [{ translateY: headerSlide }] }]}>
            <Text style={styles.title}>Training Progress</Text>
            <Text style={styles.subtitle}>TRACK YOUR SKILLS</Text>
            <Text style={styles.tagline}>Supporting Areas · Pen Routines · Home Pen</Text>
          </Animated.View>

          <BannerPenguin variant="chick" />
        </LinearGradient>

        <View style={styles.options}>
          <Animated.View style={{ opacity: summaryFade, transform: [{ translateY: summarySlide }] }}>
            <View style={styles.summaryRow}>
              <View style={styles.introGroup}>
                <Text style={styles.summaryHeading}>{completedCount} of {totalCount}</Text>
                <Text style={styles.eyebrowLabel}>SKILLS COMPLETED</Text>
              </View>
              <TouchableOpacity style={styles.hoursButtonWrap} onPress={() => router.push("/(tabs)/progress/hours")} activeOpacity={0.9}>
                <View style={styles.hoursButton}>
                  <Text style={styles.hoursButtonText}>Stats</Text>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.white} />
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.ringWrap}>
              <ProgressRing percent={percent} size={168} strokeWidth={16} />
            </View>
            {!loading && profile && <StagePill percent={percent} />}
          </Animated.View>

          <Animated.View style={{ opacity: sectionsFade, transform: [{ translateY: sectionsSlide }] }}>
            {loading ? (
              <View style={styles.statusBlock}>
                <ActivityIndicator color={COLORS.greenMid} />
              </View>
            ) : loadError && !profile ? (
              <View style={styles.statusBlock}>
                <Ionicons name="warning-outline" size={28} color={COLORS.grey} />
                <Text style={styles.emptyNote}>Couldn&apos;t load your training progress. Try again in a moment.</Text>
              </View>
            ) : (
              <>
                <View style={styles.sectionBlock}>
                  <SectionHeader
                    title="Supporting Areas"
                    subtitle="Must be completed before moving to Pen Routines"
                    done={supportingCompletedCount}
                    total={supportingAreas.length}
                  />
                  {supportingAreas.length > 0 ? (
                    <View style={styles.skillList}>
                      {supportingAreas.map((skill, i) => (
                        <SkillRow key={skill.id} skill={skill} index={i} skills={supportingAreas} />
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.emptyNote}>No supporting area skills have been added yet.</Text>
                  )}
                </View>

                <View style={styles.sectionBlock}>
                  <SectionHeader
                    title="Pen Routines"
                    subtitle={
                      penLocked
                        ? "Complete Supporting Areas to unlock these skills"
                        : `${penCompletedCount} of ${penRoutines.length} completed`
                    }
                    locked={penLocked}
                    done={penCompletedCount}
                    total={penRoutines.length}
                  />
                  {penRoutines.length > 0 ? (
                    <View style={styles.skillList}>
                      {penRoutines.map((skill, i) => (
                        <SkillRow key={skill.id} skill={skill} index={i} skills={penRoutines} locked={penLocked} />
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.emptyNote}>No pen routine skills have been added yet.</Text>
                  )}
                </View>

                <View style={styles.sectionBlock}>
                  <SectionHeader
                    title="Seasonal Skills"
                    subtitle={`${seasonalCompletedCount} of ${seasonalSkills.length} completed`}
                    done={seasonalCompletedCount}
                    total={seasonalSkills.length}
                  />
                  {seasonalSkills.length > 0 ? (
                    <View style={styles.skillList}>
                      {seasonalSkills.map((skill, i) => (
                        <SkillRow key={skill.id} skill={skill} index={i} skills={seasonalSkills} />
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.emptyNote}>No seasonal skills have been added yet.</Text>
                  )}
                </View>
              </>
            )}
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
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
    color: COLORS.greenAccentLight,
    letterSpacing: 1.5,
    marginLeft: 1.5,
    marginTop: 6,
    fontWeight: "700",
    zIndex: 1,
  },
  tagline: {
    fontSize: 11.5,
    color: "#a8cf9e",
    letterSpacing: 0.3,
    marginTop: 6,
    fontWeight: "500",
    zIndex: 1,
  },
  options: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -20,
    paddingHorizontal: 20,
    paddingTop: 28,
    shadowColor: "#0d3305",
    ...SHEET_TOP_SHADOW,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 20,
  },
  introGroup: { alignItems: "flex-start" },
  summaryHeading: { fontSize: 24, color: COLORS.greenLight, fontWeight: "700" },
  eyebrowLabel: { fontSize: 12, color: COLORS.green, fontWeight: "800", letterSpacing: 1.4, marginTop: 4 },
  hoursButtonWrap: {
    borderRadius: 40,
    shadowColor: COLORS.greenDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  hoursButton: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 40,
    paddingVertical: 12,
    paddingHorizontal: 18,
    gap: 6,
    backgroundColor: COLORS.greenMid,
  },
  hoursButtonText: { color: COLORS.white, fontWeight: "700", fontSize: 13 },
  ringWrap: { alignItems: "center", marginBottom: 16 },
  stagePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    alignSelf: "center",
    backgroundColor: COLORS.greenBg,
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  stageIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.greenMid,
    alignItems: "center",
    justifyContent: "center",
  },
  stageTextGroup: { flexShrink: 1 },
  stageTitle: { fontSize: 14, fontWeight: "800", color: COLORS.greenLight },
  stageMessage: { fontSize: 12, fontWeight: "500", color: "#4d5b4a", marginTop: 1 },
  statusBlock: { alignItems: "center", gap: 10, paddingVertical: 32 },
  ringLabelWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 2 },
  ringPercent: { fontWeight: "900", color: COLORS.green },
  sectionBlock: {
    marginBottom: 18,
  },
  sectionHeader: {
    paddingVertical: 14,
  },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  sectionTitle: { fontSize: 15.5, fontWeight: "700", color: COLORS.greenLight },
  completeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: COLORS.amberFill,
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 8,
    marginLeft: 4,
  },
  completeBadgeText: { fontSize: 10.5, fontWeight: "800", color: COLORS.white, letterSpacing: 0.3 },
  barTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#e8efe6",
    marginTop: 10,
    overflow: "hidden",
  },
  barFill: { height: "100%", borderRadius: 4, backgroundColor: COLORS.greenMid },
  barFillLocked: { backgroundColor: "#c3cac1" },
  barFillComplete: { backgroundColor: COLORS.green },
  sectionTitleLocked: { color: "#8a938b" },
  sectionSubtitle: { fontSize: 12, color: COLORS.greenMid, fontWeight: "700", marginTop: 2 },
  sectionSubtitleLocked: { color: "#a8aeaa" },
  skillList: {
    paddingBottom: 4,
  },
  emptyNote: {
    fontSize: 13,
    color: "#8a938b",
    paddingLeft: 44,
    paddingBottom: 12,
  },
  pathRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 64,
    paddingRight: 16,
  },
  pathTrack: {
    width: 44,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  trackSeg: {
    position: "absolute",
    width: 2,
    left: 21,
    height: 18,
    backgroundColor: "#e3e9e0",
  },
  trackSegTop: { top: 0 },
  trackSegBottom: { bottom: 0 },
  trackSegDone: { backgroundColor: COLORS.greenMid },
  nodeHalo: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.greenMid,
  },
  node: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#dbe3d9",
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },
  nodeDone: { backgroundColor: COLORS.greenMid, borderColor: COLORS.greenMid },
  nodeCurrent: { borderColor: COLORS.greenMid, borderWidth: 3 },
  nodeDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: COLORS.greenMid },
  pathBody: { flex: 1, justifyContent: "center", gap: 2 },
  skillNameWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  pathName: { fontSize: 15, fontWeight: "600", color: "#6b736a", flexShrink: 1 },
  pathNameCurrent: { color: "#1c2b1a", fontWeight: "700" },
  pathNameDone: { color: COLORS.greenLight },
  pathStatusDone: { fontSize: 12, color: "#7f8a7c", fontWeight: "500" },
  pathStatusNext: { fontSize: 12, color: COLORS.greenMid, fontWeight: "700" },
});
