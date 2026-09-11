import { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../utils/colors";
import { getVolunteers, getVolunteerTraining, signOffSkill, revokeSignOff } from "../../services/training";
import { TRAINING_CATALOG } from "../../data/mockTrainingCatalog";
import { TrainingCategory, TrainingSkill, SkillStatus } from "../../types/training";
import { Volunteer } from "../../types/volunteer";

const CATEGORY_ORDER: TrainingCategory[] = ["Supporting Areas", "Pen Routines"];

function groupByCategory(skills: TrainingSkill[]) {
  return CATEGORY_ORDER.map((category) => ({
    category,
    skills: skills.filter((s) => s.category === category),
  })).filter((g) => g.skills.length > 0);
}

export default function TrainerVolunteerScreen() {
  const router = useRouter();
  const { volunteerId, trainerName } = useLocalSearchParams<{ volunteerId: string; trainerName?: string }>();
  const [volunteer, setVolunteer] = useState<Volunteer | null>(null);
  const [statuses, setStatuses] = useState<SkillStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!volunteerId) return;
      try {
        setIsLoading(true);
        const [volunteers, statusList] = await Promise.all([
          getVolunteers(),
          getVolunteerTraining(volunteerId),
        ]);
        setVolunteer(volunteers.find((v) => v.id === volunteerId) ?? null);
        setStatuses(statusList);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [volunteerId]);

  const statusBySkillId = useMemo(() => new Map(statuses.map((s) => [s.skillId, s])), [statuses]);
  const groups = useMemo(() => groupByCategory(TRAINING_CATALOG), []);
  const completedCount = statuses.filter((s) => s.completed).length;
  const totalCount = TRAINING_CATALOG.length;
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const applySignOff = async (skillId: string) => {
    const updated = await signOffSkill(volunteerId, skillId, trainerName || "Trainer");
    setStatuses((prev) => prev.map((s) => (s.skillId === skillId ? updated : s)));
  };

  const applyUndo = async (skillId: string) => {
    const updated = await revokeSignOff(volunteerId, skillId);
    setStatuses((prev) => prev.map((s) => (s.skillId === skillId ? updated : s)));
  };

  const confirmSignOff = (skill: TrainingSkill) => {
    const volunteerLabel = volunteer ? `${volunteer.firstName} ${volunteer.lastName}` : "this volunteer";
    const attribution = trainerName ? `, ${trainerName}` : "";
    Alert.alert(
      "Confirm Sign-Off",
      `Confirm that ${volunteerLabel} has completed "${skill.name}"? This is recorded under your name${attribution}.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Confirm", onPress: () => applySignOff(skill.id) },
      ]
    );
  };

  const confirmUndo = (skill: TrainingSkill) => {
    Alert.alert("Undo Sign-Off", `Remove the sign-off recorded for "${skill.name}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Undo", style: "destructive", onPress: () => applyUndo(skill.id) },
    ]);
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.title}>{volunteer ? `${volunteer.firstName} ${volunteer.lastName}` : "Volunteer"}</Text>
        {!!volunteer && <Text style={styles.subtitle}>{volunteer.area}</Text>}
      </View>

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
          <View key={group.category} style={{ marginBottom: 24 }}>
            <Text style={styles.sectionTitle}>{group.category}</Text>
            {group.skills.map((skill) => {
              const status = statusBySkillId.get(skill.id);
              const isCompleted = status?.completed ?? false;
              return (
                <View key={skill.id} style={styles.skillRow}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text style={styles.skillName}>{skill.name}</Text>
                      {skill.seasonal && (
                        <View style={styles.seasonalTag}>
                          <Text style={styles.seasonalText}>Seasonal</Text>
                        </View>
                      )}
                    </View>
                    {isCompleted && (
                      <Text style={styles.signOffMeta}>{`${status?.signedOffBy} · ${status?.signedOffDate}`}</Text>
                    )}
                  </View>

                  {isCompleted ? (
                    <TouchableOpacity onPress={() => confirmUndo(skill)} style={styles.undoButton}>
                      <Ionicons name="checkmark-circle" size={18} color={COLORS.green} />
                      <Text style={styles.undoText}>Undo</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity onPress={() => confirmSignOff(skill)} style={styles.signOffButton}>
                      <Ionicons name="checkmark" size={16} color={COLORS.white} />
                      <Text style={styles.signOffText}>Sign Off</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.lightGrey },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.lightGrey },
  header: { backgroundColor: COLORS.navy, paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
  backButton: { width: 32, height: 32, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  title: { fontSize: 20, fontWeight: "800", color: COLORS.white },
  subtitle: { fontSize: 12, color: COLORS.sky, marginTop: 2 },
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 18,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  summaryText: { fontSize: 14, color: COLORS.navy, fontWeight: "700" },
  summaryPercent: { fontSize: 18, color: COLORS.navy, fontWeight: "800" },
  progressTrack: { height: 10, backgroundColor: "#E2E5E8", borderRadius: 5, overflow: "hidden" },
  progressFill: { height: 10, borderRadius: 5 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: COLORS.navy, marginBottom: 10 },
  skillRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  skillName: { fontSize: 14, color: COLORS.black, fontWeight: "600" },
  seasonalTag: { backgroundColor: COLORS.amberBg, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  seasonalText: { fontSize: 10, color: "#B8860B", fontWeight: "800" },
  signOffMeta: { fontSize: 11, color: COLORS.grey, marginTop: 4 },
  signOffButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.blue,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  signOffText: { color: COLORS.white, fontWeight: "700", fontSize: 12 },
  undoButton: { flexDirection: "row", alignItems: "center", gap: 4 },
  undoText: { color: COLORS.grey, fontWeight: "700", fontSize: 12 },
});
