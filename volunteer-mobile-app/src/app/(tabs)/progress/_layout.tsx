import { Stack } from "expo-router";

export default function ProgressLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="skills" />
      <Stack.Screen name="hours" />
    </Stack>
  );
}