import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { AppNotification, getMyNotifications, markNotificationRead } from "../../../services/notifications";
import { COLORS } from "../../../utils/colors";
import { logError } from "../../../utils/logError";
import { SHEET_TOP_SHADOW } from "../../../constants/glassCard";

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
        logError("Load notifications error", error);
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
      logError("Mark read error", error);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.blueMid} />
      </View>
    );
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.notificationId.toString()}
        style={styles.list}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 150 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <LinearGradient
              colors={[COLORS.blueLight, COLORS.blueDark]}
              style={[styles.banner, { paddingTop: 16 + insets.top }]}
            >
              <LinearGradient
                colors={["rgba(255,255,255,0.08)", "transparent"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />

              <Svg style={StyleSheet.absoluteFill} viewBox="0 0 400 260" preserveAspectRatio="none" pointerEvents="none">
                <Path d="M-20,26 C40,16 90,32 140,24 C190,16 240,30 290,22 C330,16 380,26 420,18 L420,260 L-20,260 Z" fill="#ffffff" opacity={0.03} />
                <Path d="M-20,46 C40,38 90,52 140,44 C190,36 240,50 290,42 C330,36 380,46 420,40 L420,260 L-20,260 Z" fill={COLORS.blueAccentLight} opacity={0.04} />
                <Path d="M-20,68 C40,58 90,74 140,64 C190,54 240,70 290,60 C330,54 380,66 420,58 L420,260 L-20,260 Z" fill="#ffffff" opacity={0.05} />
                <Path d="M-20,90 C40,82 90,96 140,86 C190,76 240,92 290,82 C330,76 380,88 420,80 L420,260 L-20,260 Z" fill={COLORS.blueAccentLight} opacity={0.07} />
                <Path d="M-20,112 C40,102 90,118 140,108 C190,98 240,114 290,104 C330,98 380,110 420,102 L420,260 L-20,260 Z" fill="#ffffff" opacity={0.08} />
                <Path d="M-20,134 C40,126 90,140 140,130 C190,120 240,136 290,126 C330,120 380,132 420,124 L420,260 L-20,260 Z" fill={COLORS.blueAccentLight} opacity={0.09} />
                <Path d="M-20,156 C40,146 90,162 140,152 C190,142 240,158 290,148 C330,142 380,154 420,146 L420,260 L-20,260 Z" fill="#ffffff" opacity={0.11} />
                <Path d="M-20,178 C40,170 90,184 140,174 C190,164 240,180 290,170 C330,164 380,176 420,168 L420,260 L-20,260 Z" fill={COLORS.blueAccentLight} opacity={0.12} />
                <Path d="M-20,200 C40,190 90,206 140,196 C190,186 240,202 290,192 C330,186 380,198 420,190 L420,260 L-20,260 Z" fill="#ffffff" opacity={0.14} />
                <Path d="M-20,222 C40,214 90,228 140,218 C190,208 240,224 290,214 C330,208 380,220 420,212 L420,260 L-20,260 Z" fill={COLORS.blueAccentLight} opacity={0.16} />
              </Svg>

              <View style={styles.bannerTopRow}>
                <TouchableOpacity
                  onPress={() => router.back()}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                >
                  <Ionicons name="arrow-back" size={22} color={COLORS.white} />
                </TouchableOpacity>
              </View>

              <View style={styles.titleGroup}>
                <Text style={styles.title}>Notifications</Text>
                <Text style={styles.subtitle}>
                  {unreadCount > 0 ? `${unreadCount} UNREAD` : "ALL CAUGHT UP"}
                </Text>
              </View>
            </LinearGradient>

            <View style={styles.sheetTop} />
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.rowWrap}>
            <TouchableOpacity
              style={[styles.notificationCard, !item.isRead && styles.notificationCardUnread]}
              onPress={() => handlePress(item)}
            >
              {!item.isRead && <View style={styles.unreadDot} />}
              <Text style={styles.message}>{item.message}</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={[styles.rowWrap, styles.emptyWrap]}>
            {loadError ? (
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
            )}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.white },
  list: { backgroundColor: COLORS.white },
  rowWrap: { backgroundColor: COLORS.white, paddingHorizontal: 20 },
  emptyWrap: { flexGrow: 1 },
  banner: {
    paddingBottom: 90,
  },
  bannerTopRow: {
    paddingHorizontal: 20,
    marginBottom: 14,
    zIndex: 1,
  },
  titleGroup: {
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.white,
    letterSpacing: 0.5,
    zIndex: 1,
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.blueAccentLight,
    letterSpacing: 1.5,
    marginLeft: 1.5,
    marginTop: 6,
    fontWeight: "700",
    zIndex: 1,
  },
  sheetTop: {
    height: 48,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -20,
    shadowColor: COLORS.blueDark,
    ...SHEET_TOP_SHADOW,
  },
  emptyStateCard: {
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#b3c3cc",
    padding: 26,
    gap: 8,
  },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: COLORS.blueLight },
  emptyText: { fontSize: 13, color: COLORS.grey, textAlign: "center", lineHeight: 18 },
  notificationCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#b3c3cc",
    padding: 16,
    marginBottom: 10,
  },
  notificationCardUnread: { borderLeftWidth: 3, borderLeftColor: COLORS.blueMid },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.blueMid, marginTop: 5 },
  message: { flex: 1, fontSize: 14, fontWeight: "600", color: "#1b2a33" },
});
