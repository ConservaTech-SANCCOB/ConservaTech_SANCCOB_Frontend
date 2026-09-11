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
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../utils/colors";
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
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Volunteers</Text>
            {!!trainerName && <Text style={styles.subtitle}>{`Signed in as ${trainerName}`}</Text>}
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={() => router.replace("/")}>
            <Ionicons name="log-out-outline" size={20} color={COLORS.white} />
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
      </View>

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
                <View style={styles.avatar}>
                  <Ionicons name="person" size={20} color={COLORS.white} />
                </View>
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
  header: { backgroundColor: COLORS.navy, paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  title: { fontSize: 22, fontWeight: "800", color: COLORS.white },
  subtitle: { fontSize: 12, color: COLORS.sky, marginTop: 4 },
  logoutButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 16,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.black },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  volunteerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.navy, alignItems: "center", justifyContent: "center" },
  volunteerInfo: { flex: 1 },
  volunteerName: { fontSize: 14, fontWeight: "700", color: COLORS.navy },
  volunteerArea: { fontSize: 12, color: COLORS.grey, marginTop: 2 },
  progressTrack: { height: 5, backgroundColor: "#E2E5E8", borderRadius: 3, overflow: "hidden", marginTop: 8, width: "90%" },
  progressFill: { height: 5, borderRadius: 3 },
  progressBadgeWrap: { alignItems: "center", gap: 4 },
  progressBadge: { fontSize: 11, fontWeight: "700", color: COLORS.navy },
  emptyText: { textAlign: "center", color: COLORS.grey, marginTop: 40 },
});
