import { useEffect, useMemo, useRef } from "react";
import { Animated, Dimensions, Easing, Image, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../utils/colors";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const HOLD_DURATION = 5000;
const FADE_OUT_DURATION = 400;
const SNOWFLAKE_COUNT = 18;

type Snowflake = {
  startX: number;
  driftX: number;
  size: number;
  fallDuration: number;
  delay: number;
  opacity: number;
};

function createSnowflakes(count: number): Snowflake[] {
  return Array.from({ length: count }, () => ({
    startX: Math.random() * SCREEN_WIDTH,
    driftX: (Math.random() - 0.5) * 60,
    size: 4 + Math.random() * 6,
    fallDuration: 6000 + Math.random() * 5000,
    delay: Math.random() * 4000,
    opacity: 0.35 + Math.random() * 0.45,
  }));
}

function SnowflakeParticle({ flake }: { flake: Snowflake }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: flake.fallDuration,
        delay: flake.delay,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [flake, progress]);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, SCREEN_HEIGHT + 20],
  });

  const translateX = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, flake.driftX, 0],
  });

  return (
    <Animated.View
      style={[
        styles.snowflake,
        {
          left: flake.startX,
          width: flake.size,
          height: flake.size,
          borderRadius: flake.size / 2,
          opacity: flake.opacity,
          transform: [{ translateY }, { translateX }],
        },
      ]}
    />
  );
}

export default function AnimatedSplash({ onFinish }: { onFinish: () => void }) {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.9)).current;
  const overlayOpacity = useRef(new Animated.Value(1)).current;
  const snowflakes = useMemo(() => createSnowflakes(SNOWFLAKE_COUNT), []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(logoScale, { toValue: 1, duration: 500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start();

    const holdTimer = setTimeout(() => {
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: FADE_OUT_DURATION,
        useNativeDriver: true,
      }).start(() => onFinish());
    }, HOLD_DURATION);

    return () => clearTimeout(holdTimer);
  }, [logoOpacity, logoScale, overlayOpacity, onFinish]);

  return (
    <Animated.View style={[styles.container, { opacity: overlayOpacity, pointerEvents: "none" }]}>
      <LinearGradient colors={["#00567f", "#002e4c"]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill}>
        {snowflakes.map((flake, index) => (
          <SnowflakeParticle key={index} flake={flake} />
        ))}

        <View style={styles.logoWrapper}>
          <Animated.View style={[styles.logoCircle, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
            <Image source={require("../../assets/images/sanccob-icon.png")} style={styles.logoImage} />
          </Animated.View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  snowflake: {
    position: "absolute",
    top: 0,
    backgroundColor: COLORS.white,
  },
  logoWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "rgba(83, 199, 255, 0.6)",
    shadowColor: "#002e4c",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  logoImage: {
    width: 60,
    height: 60,
    resizeMode: "cover",
  },
});
