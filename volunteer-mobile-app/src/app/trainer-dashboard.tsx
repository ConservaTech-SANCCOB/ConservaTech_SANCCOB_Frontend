import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../utils/colors";
import { GLASS_CARD, GLASS_SHADOW_MD } from "../constants/glassCard";
import { getVolunteers, getVolunteerTraining } from "../services/training";
import { TRAINING_CATALOG } from "../data/mockTrainingCatalog";
import { Volunteer } from "../types/volunteer";
import { SkillStatus } from "../types/training";

function progressFor(statuses: SkillStatus[] | undefined) {
  const total = TRAINING_CATALOG.length;
  const completed = statuses ? statuses.filter((s) => s.completed).length : 0;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { completed, total, percent };
}

export default function TrainerDashboardScreen() {
  const router = useRouter();
  const { trainerName } = useLocalSearchParams<{ trainerId?: string; trainerName?: string }>();
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [statusesByVolunteer, setStatusesByVolunteer] = useState<Record<string, SkillStatus[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setIsLoading(true);
        const vs = await getVolunteers();
        setVolunteers(vs);
        const entries = await Promise.all(
          vs.map(async (v) => [v.id, await getVolunteerTraining(v.id)] as const)
        );
        setStatusesByVolunteer(Object.fromEntries(entries));
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return volunteers.filter(
      (v) =>
        `${v.firstName} ${v.lastName}`.toLowerCase().includes(q) ||
        v.area.toLowerCase().includes(q)
    );
  }, [volunteers, search]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#00567f", "#002e4c"]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Volunteers</Text>
            {!!trainerName && <Text style={styles.subtitle}>{`Signed in as ${trainerName}`}</Text>}
          </View>
          <TouchableOpacity style={styles.logoutButtonWrap} onPress={() => router.replace("/")}>
            <View style={styles.logoutButton}>
              <Ionicons name="log-out-outline" size={20} color={COLORS.white} />
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={COLORS.grey} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search volunteers..."
            placeholderTextColor={COLORS.grey}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </LinearGradient>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={COLORS.blue} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20 }}
          renderItem={({ item }) => {
            const { completed, total, percent } = progressFor(statusesByVolunteer[item.id]);
            return (
              <TouchableOpacity
                style={styles.volunteerRow}
                onPress={() =>
                  router.push({
                    pathname: "/trainer-volunteer/[volunteerId]",
                    params: {
                      volunteerId: item.id,
                      trainerName: trainerName ?? "",
                    },
                  })
                }
              >
                <LinearGradient
                  colors={["#6FD0FF", "#2BA8E0"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.avatar}
                >
                  <Ionicons name="person" size={20} color={COLORS.white} />
                </LinearGradient>
                <View style={styles.volunteerInfo}>
                  <Text style={styles.volunteerName}>{`${item.firstName} ${item.lastName}`}</Text>
                  <Text style={styles.volunteerArea}>{item.area}</Text>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${percent}%`,
                          backgroundColor: percent === 100 ? COLORS.green : COLORS.blue,
                        },
                      ]}
                    />
                  </View>
                </View>
                <View style={styles.progressBadgeWrap}>
                  <Text style={styles.progressBadge}>{`${completed}/${total}`}</Text>
                  <Ionicons name="chevron-forward" size={18} color={COLORS.grey} />
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={<Text style={styles.emptyText}>No volunteers match your search.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.lightGrey },
  header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  title: { fontSize: 22, fontWeight: "800", color: COLORS.white },
  subtitle: { fontSize: 12, color: COLORS.sky, marginTop: 4 },
  logoutButtonWrap: {
    borderRadius: 18,
    shadowColor: "#002e4c",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  logoutButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 16,
    shadowColor: "#002e4c",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.black },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  volunteerRow: {
    ...GLASS_CARD,
    ...GLASS_SHADOW_MD,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#002e4c",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  volunteerInfo: { flex: 1 },
  volunteerName: { fontSize: 14, fontWeight: "700", color: COLORS.navy },
  volunteerArea: { fontSize: 12, color: COLORS.grey, marginTop: 2 },
  progressTrack: { height: 5, backgroundColor: "#E2E5E8", borderRadius: 3, overflow: "hidden", marginTop: 8, width: "90%" },
  progressFill: { height: 5, borderRadius: 3 },
  progressBadgeWrap: { alignItems: "center", gap: 4 },
  progressBadge: { fontSize: 11, fontWeight: "700", color: COLORS.navy },
  emptyText: { textAlign: "center", color: COLORS.grey, marginTop: 40 },
});
