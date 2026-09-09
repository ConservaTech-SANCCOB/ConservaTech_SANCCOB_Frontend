import { Ionicons } from "@expo/vector-icons";
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
      <View style={styles.overlay} />
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Training</Text>
          <TouchableOpacity style={styles.hoursButton} onPress={() => router.push("/(tabs)/progress/hours")}>
            <Ionicons name="bar-chart-outline" size={16} color={COLORS.white} />
            <Text style={styles.hoursButtonText}>Stats</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
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
              <TouchableOpacity style={[styles.sectionHeader, { marginTop: 24 }]} onPress={() => setPenExpanded(!penExpanded)}>
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
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(255,255,255,0.75)" },
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  headerTitle: { fontSize: 22, fontWeight: "800", color: COLORS.navy },
  hoursButton: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.blue, borderRadius: 20, paddingVertical: 9, paddingHorizontal: 14, gap: 6 },
  hoursButtonText: { color: COLORS.white, fontWeight: "800", fontSize: 13 },
  summaryCard: { backgroundColor: COLORS.white, borderRadius: 14, padding: 18, marginBottom: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  summaryText: { fontSize: 14, color: COLORS.navy, fontWeight: "700" },
  summaryPercent: { fontSize: 18, color: COLORS.navy, fontWeight: "800" },
  progressTrack: { height: 10, backgroundColor: "#E2E5E8", borderRadius: 5, overflow: "hidden" },
  progressFill: { height: 10, backgroundColor: COLORS.amber, borderRadius: 5 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: COLORS.navy },
  sectionSubtitle: { fontSize: 12, color: COLORS.grey, marginTop: 2 },
  skillRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: COLORS.white, borderRadius: 12, padding: 14, marginBottom: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  skillName: { fontSize: 14, color: COLORS.black, fontWeight: "600", flexShrink: 1 },
  seasonalTag: { backgroundColor: COLORS.amberBg, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  seasonalText: { fontSize: 10, color: "#B8860B", fontWeight: "800" },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  completedText: { fontSize: 12, color: COLORS.green, fontWeight: "700" },
  incompleteText: { fontSize: 12, color: COLORS.grey, fontWeight: "600" },
  lockedNotice: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginTop: 20 },
  lockedText: { fontSize: 12, color: COLORS.grey, flex: 1 },
});