import { Stack } from "expo-router";

export default function BookingsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="submit-availability" />
      <Stack.Screen name="request-change" />
    </Stack>
  );
}