import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppNotification, getMyNotifications, markNotificationRead } from "../../../services/notifications";
import { COLORS } from "../../../utils/colors";

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    getMyNotifications()
      .then(setNotifications)
      .catch((error) => {
        console.error("Load notifications error:", error);
        setLoadError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const handlePress = async (item: AppNotification) => {
  if (item.isRead) return;
  try {
    await markNotificationRead(item.notificationId);
    setNotifications((prev) =>
      prev.map((n) => (n.notificationId === item.notificationId ? { ...n, isRead: true } : n))
    );
  } catch (error) {
    console.error("Mark read error:", error);
  }
};

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.navy} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.blue} />
        </View>
      ) : loadError ? (
        <View style={styles.emptyState}>
          <Ionicons name="warning-outline" size={40} color={COLORS.grey} />
          <Text style={styles.emptyTitle}>Couldn't load notifications</Text>
          <Text style={styles.emptyText}>Try again in a moment.</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.notificationId.toString()}
          contentContainerStyle={{ padding: 20, flexGrow: 1 }}
          renderItem={({ item }) => (
            <TouchableOpacity
  style={[styles.notificationCard, !item.isRead && styles.notificationCardUnread]}
  onPress={() => handlePress(item)}
>
  {!item.isRead && <View style={styles.unreadDot} />}
  <Text style={styles.message}>{item.message}</Text>
</TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="notifications-outline" size={40} color={COLORS.grey} />
              <Text style={styles.emptyTitle}>Nothing yet</Text>
              <Text style={styles.emptyText}>You'll see updates here once you're scheduled.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.lightGrey },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, backgroundColor: COLORS.white },
  headerTitle: { fontSize: 17, fontWeight: "800", color: COLORS.navy },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: COLORS.navy },
  emptyText: { fontSize: 13, color: COLORS.grey, textAlign: "center", lineHeight: 18 },
  notificationCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: COLORS.white, borderRadius: 12, padding: 14, marginBottom: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  notificationCardUnread: { borderLeftWidth: 3, borderLeftColor: COLORS.blue },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.blue, marginTop: 5 },
  message: { fontSize: 14, color: COLORS.black, fontWeight: "600" },
  
});