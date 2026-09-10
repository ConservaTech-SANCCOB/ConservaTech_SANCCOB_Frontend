import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../../utils/colors";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.white,
        tabBarInactiveTintColor: "#7A93AC",
        tabBarStyle: {
          backgroundColor: COLORS.navy,
          borderTopWidth: 0,
          height: 60 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{ title: "Home", tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="bookings"
        options={{ title: "Shift", tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="progress"
        options={{ title: "Training", tabBarIcon: ({ color, size }) => <Ionicons name="school-outline" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: "Profile", tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} /> }}
      />
    </Tabs>
  );
}