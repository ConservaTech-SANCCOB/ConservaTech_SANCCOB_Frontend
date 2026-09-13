import { View, Text, TouchableOpacity, StyleSheet, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../utils/colors";
import { mockTrainers } from "../data/mockTrainers";
import { Trainer } from "../types/trainer";

export default function TrainerSelectScreen() {
  const router = useRouter();

  const handleSelect = (trainer: Trainer) => {
    // TODO: real endpoint should issue a token for this specific trainer
    router.push({
      pathname: "/trainer-dashboard",
      params: {
        trainerId: trainer.id,
        trainerName: `${trainer.firstName} ${trainer.lastName}`,
      },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Who are you?</Text>
        <Text style={styles.subtitle}>Select your name to continue</Text>
      </View>
      <FlatList
        data={mockTrainers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.trainerRow} onPress={() => handleSelect(item)}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={22} color={COLORS.white} />
            </View>
            <Text style={styles.trainerName}>{item.firstName} {item.lastName}</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.grey} />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: { backgroundColor: COLORS.navy, paddingTop: 70, paddingBottom: 24, paddingHorizontal: 24 },
  title: { fontSize: 22, fontWeight: "800", color: COLORS.white },
  subtitle: { fontSize: 13, color: COLORS.sky, marginTop: 4 },
  trainerRow: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: COLORS.white, borderRadius: 14, padding: 16, marginBottom: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.blue, alignItems: "center", justifyContent: "center" },
  trainerName: { flex: 1, fontSize: 15, fontWeight: "700", color: COLORS.navy },
});
