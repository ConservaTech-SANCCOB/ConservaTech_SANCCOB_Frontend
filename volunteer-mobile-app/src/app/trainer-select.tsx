import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { GLASS_CARD, GLASS_SHADOW_MD } from "../constants/glassCard";
import { getTrainers, selectTrainer, Trainer } from "../services/trainers";
import { getErrorMessage } from "../utils/api";
import { COLORS } from "../utils/colors";
import { showErrorToast } from "../utils/toast";
import { logError } from "../utils/logError";

function initialsFor(trainer: Trainer) {
  return `${trainer.firstName?.[0] ?? ""}${trainer.lastName?.[0] ?? ""}`.toUpperCase();
}

export default function TrainerSelectScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    getTrainers()
      .then(setTrainers)
      .catch((error) => {
        logError("Load trainers error", error);
        setLoadError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = async (trainer: Trainer) => {
    try {
      await selectTrainer(trainer.trainerId);
      router.push({
        pathname: "/trainer-dashboard",
        params: {
          trainerId: String(trainer.trainerId),
          trainerName:
            `${trainer.firstName ?? ""} ${trainer.lastName ?? ""}`.trim(),
        },
      });
    } catch (error) {
      logError("Select trainer error", error);
      showErrorToast("Couldn't continue", getErrorMessage(error, "Something went wrong. Try again in a moment."));
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={{
          flex: 1,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <LinearGradient
          colors={["#00567f", "#002e4c"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.header}
        >
          <View style={styles.logoCircle}>
            <Image
              source={require("../../assets/images/sanccob-icon.png")}
              style={styles.logoImage}
            />
          </View>
          <Text style={styles.title}>Who are you?</Text>
          <Text style={styles.subtitle}>Select your name to continue</Text>
        </LinearGradient>

        <View style={styles.background}>
          {loading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator color={COLORS.blue} />
            </View>
          ) : (
            <FlatList
              data={trainers}
              keyExtractor={(item) => String(item.trainerId)}
              contentContainerStyle={{ padding: 20, flexGrow: 1 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.trainerRow}
                  onPress={() => handleSelect(item)}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarInitials}>
                      {initialsFor(item)}
                    </Text>
                  </View>
                  <View style={styles.trainerInfo}>
                    <Text style={styles.trainerName}>
                      {item.firstName} {item.lastName}
                    </Text>
                    <Text style={styles.trainerRole}>SANCCOB Trainer</Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={COLORS.grey}
                  />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons
                    name={loadError ? "warning-outline" : "people-outline"}
                    size={32}
                    color={COLORS.grey}
                  />
                  <Text style={styles.emptyText}>
                    {loadError
                      ? "Couldn't load trainers. Pull back and try again."
                      : "No trainers available right now."}
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: {
    alignItems: "center",
    paddingTop: 100,
    paddingBottom: 120,
    paddingHorizontal: 24,
  },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "rgba(83, 199, 255, 0.6)",
  },
  logoImage: { width: 60, height: 60, resizeMode: "cover" },
  title: { fontSize: 22, fontWeight: "600", color: COLORS.white },
  subtitle: { fontSize: 13, color: COLORS.sky, marginTop: 4 },
  background: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -24,
    shadowColor: "#002e4c",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  trainerRow: {
    ...GLASS_CARD,
    ...GLASS_SHADOW_MD,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
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
  trainerInfo: { flex: 1, gap: 2 },
  trainerName: { fontSize: 15, fontWeight: "700", color: COLORS.navy },
  trainerRole: { fontSize: 12, fontWeight: "600", color: COLORS.grey },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingTop: 40,
  },
  emptyText: { fontSize: 13, color: COLORS.grey, textAlign: "center" },
});
