import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { penRoutines, supportingAreas } from "../../../data/mockSkills";
import { Skill } from "../../../types/skill";
import { COLORS } from "../../../utils/colors";

function SkillRow({ skill }: { skill: Skill }) {
  return (
    <View style={[styles.skillRow, !skill.completed && styles.skillRowIncomplete]}>
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
          <Ionicons name="checkmark-circle" size={18} color={COLORS.green} />
        </View>
      ) : (
        <View style={styles.statusRow}>
          <Text style={styles.incompleteText}>Not Yet Completed</Text>
          <Ionicons name="ellipse-outline" size={18} color={COLORS.grey} />
        </View>
      )}
    </View>
  );
}

export default function SkillsProgressScreen() {
  const router = useRouter();
  const [supportingExpanded, setSupportingExpanded] = useState(true);
  const [penExpanded, setPenExpanded] = useState(false);

  const allSkills = [...supportingAreas, ...penRoutines];
  const completedCount = allSkills.filter((s) => s.completed).length;
  const totalCount = allSkills.length;
  const percent = Math.round((completedCount / totalCount) * 100);

  const penCompletedCount = penRoutines.filter((s) => s.completed).length;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.navy} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Skills Progress</Text>
        <TouchableOpacity onPress={() => router.push("/(tabs)/progress/hours")}>
          <Ionicons name="time-outline" size={22} color={COLORS.blue} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={styles.summaryBox}>
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

        <TouchableOpacity style={[styles.sectionHeader, { marginTop: 20 }]} onPress={() => setPenExpanded(!penExpanded)}>
          <View>
            <Text style={styles.sectionTitle}>Pen Routines</Text>
            <Text style={styles.sectionSubtitle}>{penCompletedCount} of {penRoutines.length} completed</Text>
          </View>
          <Ionicons name={penExpanded ? "chevron-up" : "chevron-down"} size={20} color={COLORS.navy} />
        </TouchableOpacity>
        {penExpanded && penRoutines.map((skill) => <SkillRow key={skill.id} skill={skill} />)}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#F0F2F5" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: COLORS.navy },
  summaryBox: { backgroundColor: "#F5F7F8", borderRadius: 12, padding: 16, marginBottom: 24 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  summaryText: { fontSize: 14, color: COLORS.navy, fontWeight: "600" },
  summaryPercent: { fontSize: 16, color: COLORS.navy, fontWeight: "700" },
  progressTrack: { height: 8, backgroundColor: "#E2E5E8", borderRadius: 4, overflow: "hidden" },
  progressFill: { height: 8, backgroundColor: COLORS.sky, borderRadius: 4 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: COLORS.navy },
  sectionSubtitle: { fontSize: 12, color: COLORS.grey, marginTop: 2 },
  skillRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: "#E2E5E8", borderRadius: 10, padding: 14, marginBottom: 8 },
  skillRowIncomplete: { backgroundColor: "#FAFAFA" },
  skillName: { fontSize: 14, color: COLORS.black, flexShrink: 1 },
  seasonalTag: { backgroundColor: "#FFF4D9", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  seasonalText: { fontSize: 10, color: COLORS.amber, fontWeight: "700" },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  completedText: { fontSize: 12, color: COLORS.green, fontWeight: "600" },
  incompleteText: { fontSize: 12, color: COLORS.grey },
});