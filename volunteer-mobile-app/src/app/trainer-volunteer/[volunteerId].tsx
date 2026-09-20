import { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../utils/colors";
import { GLASS_CARD, GLASS_SHADOW_LG, GLASS_SHADOW_MD } from "../../constants/glassCard";
import {
  getTrainingVolunteerProfile,
  signOffTrainingSkill,
  TrainingSkillDto,
  TrainingVolunteerProfile,
} from "../../services/training";
import { showErrorToast } from "../../utils/toast";

type SkillGroup = { title: string; skills: TrainingSkillDto[] };

function groupsFor(profile: TrainingVolunteerProfile | null): SkillGroup[] {
  if (!profile) return [];
  return [
    { title: "Supporting Areas", skills: profile.supportingAreas ?? [] },
    { title: "Pen Routines", skills: profile.penRoutines ?? [] },
    { title: "Seasonal Skills", skills: profile.seasonalSkills ?? [] },
  ].filter((group) => group.skills.length > 0);
}

export default function TrainerVolunteerScreen() {
  const router = useRouter();
  const { volunteerId, trainerId, trainerName } = useLocalSearchParams<{
    volunteerId: string;
    trainerId?: string;
    trainerName?: string;
  }>();
  const userId = Number(volunteerId);
  const numericTrainerId = trainerId ? Number(trainerId) : NaN;

  const [profile, setProfile] = useState<TrainingVolunteerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [signingOffId, setSigningOffId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!Number.isFinite(userId)) return;
    setProfile(await getTrainingVolunteerProfile(userId));
  }, [userId]);

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        await load();
      } finally {
        setIsLoading(false);
      }
    })();
  }, [load]);

  const groups = useMemo(() => groupsFor(profile), [profile]);
  const completedCount = profile?.completedRequiredSkills ?? 0;
  const totalCount = profile?.totalRequiredSkills ?? 0;
  const percent = profile ? Math.round(profile.progressPercentage) : 0;
  const volunteerLabel = profile ? `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim() : "Volunteer";

  const applySignOff = async (skill: TrainingSkillDto) => {
    if (!Number.isFinite(numericTrainerId)) {
      showErrorToast("Missing trainer ID", "Sign in again from the trainer PIN screen, then retry.");
      return;
    }
    setSigningOffId(skill.skillId);
    try {
      await signOffTrainingSkill(userId, skill.skillId, numericTrainerId);
      // Re-fetch rather than trust the optimistic response — confirms the sign-off
      // actually persisted server-side and not just in local state.
      await load();
    } catch (error) {
      console.error("Sign off skill error:", error);
      showErrorToast("Couldn't sign off", "Something went wrong. Try again in a moment.");
    } finally {
      setSigningOffId(null);
    }
  };

  const confirmSignOff = (skill: TrainingSkillDto) => {
    const attribution = trainerName ? `, ${trainerName}` : "";
    Alert.alert(
      "Confirm Sign-Off",
      `Confirm that ${volunteerLabel} has completed "${skill.skillName}"? This is recorded under your name${attribution} and can't be undone from this app.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Confirm", onPress: () => applySignOff(skill) },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={COLORS.blue} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#00567f", "#002e4c"]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.title}>{volunteerLabel}</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>{`${completedCount} of ${totalCount} skills completed`}</Text>
            <Text style={styles.summaryPercent}>{`${percent}%`}</Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${percent}%`, backgroundColor: percent === 100 ? COLORS.green : COLORS.blue },
              ]}
            />
          </View>
        </View>

        {groups.map((group) => (
          <View key={group.title} style={{ marginBottom: 24 }}>
            <Text style={styles.sectionTitle}>{group.title}</Text>
            {group.skills.map((skill) => (
              <View key={skill.skillId} style={styles.skillRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.skillName}>{skill.skillName}</Text>
                  {skill.isSignedOff && (
                    <Text style={styles.signOffMeta}>
                      {skill.trainerName ? `${skill.trainerName} · ` : ""}
                      {skill.signedOffAt ? new Date(skill.signedOffAt).toLocaleDateString() : ""}
                    </Text>
                  )}
                </View>

                {skill.isSignedOff ? (
                  <View style={styles.signedOffTag}>
                    <Ionicons name="checkmark-circle" size={18} color={COLORS.green} />
                    <Text style={styles.signedOffText}>Signed Off</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => confirmSignOff(skill)}
                    style={styles.signOffButtonWrap}
                    disabled={signingOffId === skill.skillId}
                  >
                    <LinearGradient
                      colors={["#6FD0FF", "#2BA8E0"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={styles.signOffButton}
                    >
                      {signingOffId === skill.skillId ? (
                        <ActivityIndicator size="small" color={COLORS.white} />
                      ) : (
                        <>
                          <Ionicons name="checkmark" size={16} color={COLORS.white} />
                          <Text style={styles.signOffText}>Sign Off</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.lightGrey },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.lightGrey },
  header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
  backButton: { width: 32, height: 32, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  title: { fontSize: 20, fontWeight: "800", color: COLORS.white },
  summaryCard: {
    ...GLASS_CARD,
    ...GLASS_SHADOW_LG,
    borderRadius: 14,
    padding: 18,
    marginBottom: 24,
  },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  summaryText: { fontSize: 14, color: COLORS.navy, fontWeight: "700" },
  summaryPercent: { fontSize: 18, color: COLORS.navy, fontWeight: "800" },
  progressTrack: { height: 10, backgroundColor: "#E2E5E8", borderRadius: 5, overflow: "hidden" },
  progressFill: { height: 10, borderRadius: 5 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: COLORS.navy, marginBottom: 10 },
  skillRow: {
    ...GLASS_CARD,
    ...GLASS_SHADOW_MD,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  skillName: { fontSize: 14, color: COLORS.black, fontWeight: "600" },
  signOffMeta: { fontSize: 11, color: COLORS.grey, marginTop: 4 },
  signOffButtonWrap: {
    borderRadius: 8,
    shadowColor: "#002e4c",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  signOffButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  signOffText: { color: COLORS.white, fontWeight: "700", fontSize: 12 },
  signedOffTag: { flexDirection: "row", alignItems: "center", gap: 4 },
  signedOffText: { color: COLORS.green, fontWeight: "700", fontSize: 12 },
});
