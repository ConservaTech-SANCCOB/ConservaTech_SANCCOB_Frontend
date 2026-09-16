import { ViewStyle } from "react-native";

/**
 * Shared "frosted glass" card look used across every redesigned screen:
 * translucent white fill over a photo background, with a soft white border.
 * Combine with GLASS_SHADOW_LG or GLASS_SHADOW_MD (or a one-off override)
 * for the elevation, since that varies between hero cards and list rows.
 */
export const GLASS_CARD: ViewStyle = {
  backgroundColor: "rgba(255,255,255,0.85)",
  borderWidth: 0.75,
  borderColor: "rgba(255,255,255,0.9)",
  borderTopColor: "rgba(255,255,255,1)",
  shadowColor: "#002e4c",
};

/** Shadow for prominent cards: headers, section chips, buttons, empty states. */
export const GLASS_SHADOW_LG: ViewStyle = {
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.2,
  shadowRadius: 22,
  elevation: 8,
};

/** Shadow for list rows: shift/skill/booking cards sitting inside a section. */
export const GLASS_SHADOW_MD: ViewStyle = {
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.18,
  shadowRadius: 18,
  elevation: 6,
};
