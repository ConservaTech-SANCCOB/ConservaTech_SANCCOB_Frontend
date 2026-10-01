import { LinearGradient } from "expo-linear-gradient";
import { Platform, StyleSheet, View, ViewStyle } from "react-native";
import { COLORS } from "../utils/colors";

const OVERSCROLL_REACH = 2000;
const BANNER_TOP_EDGE_SHEEN = ["rgba(255,255,255,0.08)", "rgba(255,255,255,0.04)"] as const;

export function AboveBannerFill({ color }: { color?: string }) {
  return (
    <View pointerEvents="none" style={[styles.aboveContent, color !== undefined && { backgroundColor: color }]}>
      <LinearGradient
        colors={BANNER_TOP_EDGE_SHEEN}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

export function BelowContentFill() {
  return <View pointerEvents="none" style={styles.belowContent} />;
}

export function refreshableBannerScrollStyles(bannerColor: string): {
  scroll?: ViewStyle;
  content?: ViewStyle;
} {
  if (Platform.OS !== "ios") return {};
  return { scroll: { backgroundColor: bannerColor }, content: { backgroundColor: COLORS.white } };
}

const styles = StyleSheet.create({
  aboveContent: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: "100%",
    height: OVERSCROLL_REACH,
  },
  belowContent: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "100%",
    height: OVERSCROLL_REACH,
    backgroundColor: COLORS.white,
  },
});
