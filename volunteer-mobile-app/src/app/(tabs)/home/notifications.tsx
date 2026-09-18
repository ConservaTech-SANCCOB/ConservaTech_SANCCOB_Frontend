import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, ImageBackground, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GLASS_CARD, GLASS_SHADOW_LG, GLASS_SHADOW_MD } from "../../../constants/glassCard";
import { AppNotification, getMyNotifications, markNotificationRead } from "../../../services/notifications";
import { COLORS } from "../../../utils/colors";

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
    <ImageBackground
      source={require("../../../../assets/images/bg_penguin.jpg.jpeg")}
      style={styles.background}
      resizeMode="cover"
    >
      <LinearGradient
        colors={["rgba(255,255,255,0.86)", "rgba(255,255,255,0.76)", "rgba(255,255,255,0.84)"]}
        locations={[0, 0.42, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.container}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={COLORS.blue} />
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.notificationId.toString()}
            contentContainerStyle={{ padding: 20, paddingTop: 8 + insets.top, flexGrow: 1 }}
            ListHeaderComponent={
              <View style={styles.topRow}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => router.back()}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="arrow-back" size={22} color={COLORS.navy} />
                </TouchableOpacity>
                <View style={styles.titleCard}>
                  <Text style={styles.headerTitle}>Notifications</Text>
                </View>
              </View>
            }
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
              loadError ? (
                <View style={styles.emptyStateCard}>
                  <Ionicons name="warning-outline" size={32} color={COLORS.grey} />
                  <Text style={styles.emptyTitle}>Couldn&apos;t load notifications</Text>
                  <Text style={styles.emptyText}>Try again in a moment.</Text>
                </View>
              ) : (
                <View style={styles.emptyStateCard}>
                  <Ionicons name="notifications-outline" size={32} color={COLORS.grey} />
                  <Text style={styles.emptyTitle}>Nothing yet</Text>
                  <Text style={styles.emptyText}>You&apos;ll see updates here once you&apos;re scheduled.</Text>
                </View>
              )
            }
          />
        )}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1 },
  topRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 16 },
  backButton: {
    ...GLASS_CARD,
    ...GLASS_SHADOW_LG,
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  titleCard: {
    ...GLASS_CARD,
    ...GLASS_SHADOW_LG,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 18,
  },
  headerTitle: { fontSize: 17, fontWeight: "800", color: COLORS.navy },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyStateCard: {
    ...GLASS_CARD,
    ...GLASS_SHADOW_LG,
    alignItems: "center",
    borderRadius: 18,
    padding: 26,
    gap: 8,
  },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: COLORS.navy },
  emptyText: { fontSize: 13, color: COLORS.grey, textAlign: "center", lineHeight: 18 },
  notificationCard: {
    ...GLASS_CARD,
    ...GLASS_SHADOW_MD,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
  notificationCardUnread: { borderLeftWidth: 3, borderLeftColor: COLORS.blue },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.blue, marginTop: 5 },
  message: { fontSize: 14, fontWeight: "600", color: COLORS.navy },
});
