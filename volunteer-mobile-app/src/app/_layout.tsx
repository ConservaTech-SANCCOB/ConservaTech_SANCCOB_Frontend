import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import AnimatedSplash from "../components/AnimatedSplash";
import { toastConfig } from "../components/toastConfig";
import { clearToken, getSessionRole, getToken } from "../utils/api";
import { COLORS } from "../utils/colors";
import { logError } from "../utils/logError";

SplashScreen.preventAutoHideAsync().catch(() => {});

type SessionCheck = "checking" | "authenticated" | "unauthenticated";

export default function RootLayout() {
  const router = useRouter();
  const [showCustomSplash, setShowCustomSplash] = useState(true);
  const [sessionCheck, setSessionCheck] = useState<SessionCheck>("checking");

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let token = await getToken();
        // A trainer session left over from the PIN flow (app closed mid-session) must
        // not be restored as a volunteer session — sign it out and start fresh.
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
        {showCustomSplash && <AnimatedSplash onFinish={() => setShowCustomSplash(false)} />}
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
        <Stack.Screen name="trainer-pin" />
        <Stack.Screen name="trainer-select" />
        <Stack.Screen name="trainer-dashboard" />
        <Stack.Screen name="trainer-volunteer/[volunteerId]" />
      </Stack>
      {showCustomSplash && <AnimatedSplash onFinish={() => setShowCustomSplash(false)} />}
      <Toast config={toastConfig} />
    </SafeAreaProvider>
  );
}
