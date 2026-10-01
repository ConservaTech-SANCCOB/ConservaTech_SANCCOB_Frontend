import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import AnimatedSplash from "../components/AnimatedSplash";
import { toastConfig } from "../components/toastConfig";
import { clearToken, getSessionRole, getToken } from "../utils/api";
import { COLORS } from "../utils/colors";
import { logError } from "../utils/logError";

// Keep the native splash until ours takes over
SplashScreen.preventAutoHideAsync().catch(() => {});

export { default as ErrorBoundary } from "../components/ErrorFallback";

type SessionCheck = "checking" | "authenticated" | "unauthenticated";

// Checks for a saved session before showing any screen
export default function RootLayout() {
  const router = useRouter();
  const [showCustomSplash, setShowCustomSplash] = useState(true);
  const [sessionCheck, setSessionCheck] = useState<SessionCheck>("checking");
  const hideCustomSplash = useCallback(() => setShowCustomSplash(false), []);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  // Trainer sessions are never restored on a shared device
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let token = await getToken();
        if (token && (await getSessionRole()) === "trainer") {
          await clearToken();
          token = null;
        }
        if (!cancelled) setSessionCheck(token ? "authenticated" : "unauthenticated");
      } catch (error) {
        logError("Session restore check failed", error);
        if (!cancelled) setSessionCheck("unauthenticated");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Already signed in so skip Welcome
  useEffect(() => {
    if (sessionCheck === "authenticated") {
      router.replace("/(tabs)/home");
    }
  }, [sessionCheck, router]);

  if (sessionCheck === "checking") {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.white }}>
          <ActivityIndicator color={COLORS.blue} />
        </View>
        {showCustomSplash && <AnimatedSplash onFinish={hideCustomSplash} />}
        <Toast config={toastConfig} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="activate" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="request-change" />
        <Stack.Screen name="trainer-pin" />
        <Stack.Screen name="trainer-select" />
        <Stack.Screen name="trainer-dashboard" />
        <Stack.Screen name="trainer-volunteer/[volunteerId]" />
      </Stack>
      {showCustomSplash && <AnimatedSplash onFinish={hideCustomSplash} />}
      <Toast config={toastConfig} />
    </SafeAreaProvider>
  );
}
