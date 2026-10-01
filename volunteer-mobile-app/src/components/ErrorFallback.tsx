import { Ionicons } from "@expo/vector-icons";
import { ErrorBoundaryProps } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../utils/colors";
import { logError } from "../utils/logError";

export default function ErrorFallback({ error, retry }: ErrorBoundaryProps) {
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    logError("Render error caught by ErrorBoundary", error);
  }, [error]);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await retry();
    } finally {
      setRetrying(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name="warning-outline" size={32} color={COLORS.navy} />
      </View>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>
        The app hit an unexpected problem. Try again, and if it keeps happening, close and reopen the app.
      </Text>
      {__DEV__ && (
        <Text style={styles.devDetails} numberOfLines={6}>
          {error.message}
        </Text>
      )}
      <TouchableOpacity
        style={styles.button}
        onPress={handleRetry}
        disabled={retrying}
        accessibilityRole="button"
        accessibilityLabel="Try again"
      >
        {retrying ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.buttonText}>Try again</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    backgroundColor: COLORS.white,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.lightGrey,
    marginBottom: 18,
  },
  title: { fontSize: 22, fontWeight: "700", color: COLORS.navy, textAlign: "center" },
  message: { fontSize: 14, color: COLORS.grey, textAlign: "center", marginTop: 10, lineHeight: 20 },
  devDetails: { fontSize: 12, color: COLORS.redLight, textAlign: "center", marginTop: 14 },
  button: {
    marginTop: 26,
    minWidth: 160,
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 30,
    backgroundColor: COLORS.blueMid,
  },
  buttonText: { color: COLORS.white, fontWeight: "700", fontSize: 15 },
});

//----------------------------------- END OF FILE ---------------------------------//
