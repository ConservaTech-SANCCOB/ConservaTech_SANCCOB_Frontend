import { ViewStyle } from "react-native";
import { GLASS_CARD, GLASS_SHADOW_LG } from "./glassCard";

export function getTabBarStyle(bottomInset: number): ViewStyle {
  return {
    position: "absolute",
    left: 0,
    right: 0,
    marginHorizontal: 44,
    bottom: 12 + bottomInset,
    borderRadius: 30,
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
    ...GLASS_CARD,
    ...GLASS_SHADOW_LG,
  };
}
