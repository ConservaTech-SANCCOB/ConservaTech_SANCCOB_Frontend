import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AnimatedSplash from "../components/AnimatedSplash";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [showCustomSplash, setShowCustomSplash] = useState(true);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="activate" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="trainer-pin" />
        <Stack.Screen name="trainer-select" />
        <Stack.Screen name="trainer-dashboard" />
        <Stack.Screen name="trainer-volunteer/[volunteerId]" />
      </Stack>
      {showCustomSplash && <AnimatedSplash onFinish={() => setShowCustomSplash(false)} />}
    </SafeAreaProvider>
  );
}
