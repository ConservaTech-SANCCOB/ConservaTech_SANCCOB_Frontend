import { Stack } from "expo-router";

// Home links straight into submit-availability / request-change. Without this, if the
// Shifts tab hadn't been opened yet, that screen became the only one in this stack and
// Back fell through to the Home tab instead of returning to the Shifts list.
export const unstable_settings = {
  initialRouteName: "index",
};

export default function BookingsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="submit-availability" />
      <Stack.Screen name="request-change" />
    </Stack>
  );
}