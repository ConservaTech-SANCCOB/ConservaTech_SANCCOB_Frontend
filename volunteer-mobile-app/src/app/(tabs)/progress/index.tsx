import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { penRoutines, supportingAreas } from "../../../data/mockSkills";
import { Skill } from "../../../types/skill";
import { COLORS } from "../../../utils/colors";

function SkillRow({ skill }: { skill: Skill }) {
  return (
    <View style={styles.skillRow}>
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
    </View>
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
            <View style={styles.summaryRow}>
              <Text style={styles.summaryText}>{completedCount} of {totalCount} skills completed</Text>
              <Text style={styles.summaryPercent}>{percent}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${percent}%` }]} />
            </View>
          </View>

          <TouchableOpacity style={styles.sectionHeader} onPress={() => setSupportingExpanded(!supportingExpanded)}>
            <View>
              <Text style={styles.sectionTitle}>Supporting Areas</Text>
              <Text style={styles.sectionSubtitle}>Must be completed before moving to Pen Routines</Text>
            </View>
            <Ionicons name={supportingExpanded ? "chevron-up" : "chevron-down"} size={20} color={COLORS.navy} />
          </TouchableOpacity>
          {supportingExpanded && supportingAreas.map((skill) => <SkillRow key={skill.id} skill={skill} />)}

          {penRoutines.length > 0 && (
            <>
              <TouchableOpacity style={[styles.sectionHeader, { marginTop: 20 }]} onPress={() => setPenExpanded(!penExpanded)}>
                <View>
                  <Text style={styles.sectionTitle}>Pen Routines</Text>
                  <Text style={styles.sectionSubtitle}>{penCompletedCount} of {penRoutines.length} completed</Text>
                </View>
                <Ionicons name={penExpanded ? "chevron-up" : "chevron-down"} size={20} color={COLORS.navy} />
              </TouchableOpacity>
              {penExpanded && penRoutines.map((skill) => <SkillRow key={skill.id} skill={skill} />)}
            </>
          )}

          {penRoutines.length === 0 && (
            <View style={styles.lockedNotice}>
              <Ionicons name="lock-closed-outline" size={16} color={COLORS.grey} />
              <Text style={styles.lockedText}>Complete Supporting Areas to unlock these skills.</Text>
            </View>
          )}
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
  paddingVertical: 14,
  paddingHorizontal: 18,
  borderRadius: 22,
  backgroundColor: "rgba(255,255,255,0.55)",
  borderWidth: 1.5,
  borderColor: "rgba(255,255,255,0.9)",
  shadowColor: "#002e4c",
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.3,
  shadowRadius: 16,
  elevation: 8,
},
  headerTitle: { fontSize: 20, fontWeight: "800", color: COLORS.navy },
  hoursButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.55)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.9)",
    borderRadius: 20,
    paddingVertical: 9,
    paddingHorizontal: 14,
    gap: 6,
    shadowColor: "#002e4c",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  hoursButtonText: { color: COLORS.navy, fontWeight: "800", fontSize: 13 },
  summaryCard: {
    backgroundColor: "rgba(255,255,255,0.55)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.9)",
    borderRadius: 18,
    padding: 18,
    marginBottom: 24,
    shadowColor: "#002e4c",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 40,
    elevation: 16,
  },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  summaryText: { fontSize: 14, color: COLORS.navy, fontWeight: "700" },
  summaryPercent: { fontSize: 18, color: COLORS.navy, fontWeight: "800" },
  progressTrack: { height: 10, backgroundColor: "rgba(0,46,76,0.15)", borderRadius: 5, overflow: "hidden" },
  progressFill: { height: 10, backgroundColor: COLORS.amber, borderRadius: 5 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.55)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.9)",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#002e4c",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: COLORS.navy },
  sectionSubtitle: { fontSize: 12, color: COLORS.grey, marginTop: 2 },
  skillRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.55)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.9)",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    shadowColor: "#002e4c",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
  skillName: { fontSize: 14, color: COLORS.black, flexShrink: 1 },
  seasonalTag: { backgroundColor: COLORS.amberBg, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  seasonalText: { fontSize: 10, color: COLORS.amber, fontWeight: "700" },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  completedText: { fontSize: 12, color: COLORS.green, fontWeight: "600" },
  incompleteText: { fontSize: 12, color: COLORS.grey },
  lockedNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.55)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.9)",
    borderRadius: 14,
    padding: 16,
    marginTop: 20,
    shadowColor: "#002e4c",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 8,
  },
  lockedText: { fontSize: 12, color: COLORS.grey, flex: 1 },
});