import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../utils/colors";
import { GLASS_CARD, GLASS_SHADOW_LG, GLASS_SHADOW_MD } from "../constants/glassCard";
import { getTrainingVolunteers, TrainingVolunteerSummary } from "../services/training";

type StatusFilter = "all" | "not-started" | "in-progress" | "completed";

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "not-started", label: "Not Started" },
  { key: "in-progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
];

function initialsFor(v: TrainingVolunteerSummary) {
  return `${v.firstName?.[0] ?? ""}${v.lastName?.[0] ?? ""}`.toUpperCase();
}

function statusFor(percent: number): Exclude<StatusFilter, "all"> {
  if (percent === 0) return "not-started";
  if (percent === 100) return "completed";
  return "in-progress";
}

function badgeFor(status: Exclude<StatusFilter, "all">) {
  switch (status) {
    case "completed":
      return { label: "Completed", bg: COLORS.greenBg, color: COLORS.green };
    case "in-progress":
      return { label: "In Progress", bg: "rgba(83,199,255,0.15)", color: COLORS.blue };
    default:
      return { label: "Not Started", bg: COLORS.lightGrey, color: COLORS.grey };
  }
}

export default function TrainerDashboardScreen() {
  const router = useRouter();
  const { trainerId, trainerName } = useLocalSearchParams<{ trainerId?: string; trainerName?: string }>();
  const [volunteers, setVolunteers] = useState<TrainingVolunteerSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    async function load() {
      try {
        setIsLoading(true);
        setVolunteers(await getTrainingVolunteers());
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return volunteers.filter((v) => {
      const matchesSearch = `${v.firstName ?? ""} ${v.lastName ?? ""}`.toLowerCase().includes(q);
      if (!matchesSearch) return false;
      if (statusFilter === "all") return true;
      return statusFor(v.progressPercentage) === statusFilter;
    });
  }, [volunteers, search, statusFilter]);

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
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map((f) => {
            const active = statusFilter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterTab, active && styles.filterTabActiveWrap]}
                onPress={() => setStatusFilter(f.key)}
              >
                {active && <View style={styles.filterTabActiveFill} />}
                <Text style={[styles.filterTabText, active && styles.filterTabTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </LinearGradient>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={COLORS.blue} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.userId)}
          contentContainerStyle={{ padding: 20 }}
          renderItem={({ item }) => {
            const percent = Math.round(item.progressPercentage);
            const status = statusFor(percent);
            const badge = badgeFor(status);
            return (
              <TouchableOpacity
                style={styles.volunteerCard}
                onPress={() =>
                  router.push({
                    pathname: "/trainer-volunteer/[volunteerId]",
                    params: {
                      volunteerId: String(item.userId),
                      trainerId: trainerId ?? "",
                      trainerName: trainerName ?? "",
                    },
                  })
                }
              >
                <View style={styles.cardTopRow}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarInitials}>{initialsFor(item)}</Text>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.volunteerName}>{`${item.firstName ?? ""} ${item.lastName ?? ""}`}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: badge.color }]}>{badge.label}</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons name="school-outline" size={15} color={COLORS.grey} />
                  <Text style={styles.detailText}>
                    {item.completedSkills} of {item.totalRequiredSkills} skills completed
                  </Text>
                </View>

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
  title: { fontSize: 22, fontWeight: "600", color: COLORS.white },
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
    ...GLASS_CARD,
    ...GLASS_SHADOW_LG,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 16,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.black },
  filterRow: { flexDirection: "row", gap: 8, marginTop: 12, paddingRight: 4 },
  filterTab: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.35)",
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  filterTabActiveWrap: {
    borderWidth: 0,
    shadowColor: "#002e4c",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
  },
  filterTabActiveFill: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    backgroundColor: "#0284c7",
  },
  filterTabText: { fontSize: 12, color: COLORS.white, fontWeight: "700" },
  filterTabTextActive: { fontWeight: "900" },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  volunteerCard: {
    ...GLASS_CARD,
    ...GLASS_SHADOW_MD,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  cardTopRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0284c7",
    shadowColor: "#002e4c",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarInitials: { color: COLORS.white, fontSize: 15, fontWeight: "800" },
  cardInfo: { flex: 1 },
  volunteerName: { fontSize: 14, fontWeight: "700", color: COLORS.navy },
  volunteerArea: { fontSize: 12, color: COLORS.grey, marginTop: 2 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  statusBadgeText: { fontSize: 10, fontWeight: "800" },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 },
  detailText: { fontSize: 12, color: COLORS.grey, fontWeight: "600" },
  progressTrack: {
    height: 5,
    backgroundColor: "rgba(0,46,76,0.12)",
    borderRadius: 3,
    overflow: "hidden",
    marginTop: 12,
  },
  progressFill: { height: 5, borderRadius: 3 },
  emptyText: { textAlign: "center", color: COLORS.grey, marginTop: 40 },
});
