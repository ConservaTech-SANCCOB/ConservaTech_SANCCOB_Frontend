import { useEffect, useRef } from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Animated, ColorValue, LayoutChangeEvent, Pressable, StyleSheet, View } from "react-native";
import { COLORS } from "../../utils/colors";
import { getTabBarStyle } from "../../constants/tabBar";

const INDICATOR_WIDTH = 52;
const INDICATOR_HEIGHT = 36;

function TabIcon({
  name,
  color,
  size,
  focused,
}: {
  name: keyof typeof Ionicons.glyphMap;
  color: ColorValue;
  size: number;
  focused: boolean;
}) {
  const iconName = (focused ? name : `${name}-outline`) as keyof typeof Ionicons.glyphMap;
  return <Ionicons name={iconName} size={focused ? size + 2 : size} color={color} />;
}

function TabButton({
  onPress,
  onLayout,
  children,
}: {
  onPress: () => void;
  onLayout: (event: LayoutChangeEvent) => void;
  children: React.ReactNode;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    Animated.spring(scale, { toValue: 0.86, useNativeDriver: true, speed: 50, bounciness: 6 }).start();
  };
  const pressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 10 }).start();
  };

  return (
    <Pressable style={styles.tabButton} onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} onLayout={onLayout}>
      <Animated.View style={[styles.tabButtonInner, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const translateX = useRef(new Animated.Value(0)).current;
  const buttonLayouts = useRef<Array<{ x: number; width: number }>>([]);

  const moveIndicatorTo = (index: number, animate: boolean) => {
    const layout = buttonLayouts.current[index];
    if (!layout) return;
    const target = layout.x + (layout.width - INDICATOR_WIDTH) / 2;
    if (animate) {
      Animated.spring(translateX, {
        toValue: target,
        useNativeDriver: true,
        speed: 16,
        bounciness: 8,
      }).start();
    } else {
      translateX.setValue(target);
    }
  };

  useEffect(() => {
    moveIndicatorTo(state.index, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.index]);

  const focusedOptions = descriptors[state.routes[state.index].key].options;
  if (focusedOptions.tabBarStyle?.display === "none") {
    return null;
  }

  const handleButtonLayout = (index: number, event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    buttonLayouts.current[index] = { x, width };
    if (index === state.index) {
      moveIndicatorTo(index, false);
    }
  };

  return (
    <View style={[getTabBarStyle(insets.bottom), styles.barContainer]}>
      <View style={styles.indicatorLayer} pointerEvents="none">
        <Animated.View style={[styles.indicator, { transform: [{ translateX }] }]} />
      </View>
      {state.routes.map((route: { key: string; name: string }, index: number) => {
        const { options } = descriptors[route.key];
        const focused = state.index === index;
        const color = focused ? COLORS.navy : COLORS.grey;

        const onPress = () => {
          const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TabButton key={route.key} onPress={onPress} onLayout={(e) => handleButtonLayout(index, e)}>
            {options.tabBarIcon?.({ focused, color, size: 22 })}
          </TabButton>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen
        name="home"
        options={{ title: "Home", tabBarIcon: ({ color, size, focused }) => <TabIcon name="home" color={color} size={size} focused={focused} /> }}
      />
      <Tabs.Screen
        name="bookings"
        options={{ title: "Shift", tabBarIcon: ({ color, size, focused }) => <TabIcon name="calendar" color={color} size={size} focused={focused} /> }}
      />
      <Tabs.Screen
        name="progress"
        options={{ title: "Training", tabBarIcon: ({ color, size, focused }) => <TabIcon name="school" color={color} size={size} focused={focused} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: "Profile", tabBarIcon: ({ color, size, focused }) => <TabIcon name="person" color={color} size={size} focused={focused} /> }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  barContainer: {
    flexDirection: "row",
  },
  tabButton: {
    flex: 1,
  },
  tabButtonInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  indicatorLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
  },
  indicator: {
    width: INDICATOR_WIDTH,
    height: INDICATOR_HEIGHT,
    borderRadius: 14,
    backgroundColor: "rgba(83, 199, 255, 0.22)",
    shadowColor: COLORS.sky,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
});
