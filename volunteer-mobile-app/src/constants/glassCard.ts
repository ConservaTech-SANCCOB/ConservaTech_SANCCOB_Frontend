import { ViewStyle } from "react-native";

export const GLASS_CARD: ViewStyle = {
  backgroundColor: "rgba(255,255,255,0.85)",
  borderWidth: 0.75,
  borderColor: "rgba(255,255,255,0.9)",
  borderTopColor: "rgba(255,255,255,1)",
  shadowColor: "#002e4c",
};

export const GLASS_SHADOW_LG: ViewStyle = {
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.2,
  shadowRadius: 22,
  elevation: 8,
};

export const GLASS_SHADOW_MD: ViewStyle = {
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.18,
  shadowRadius: 18,
  elevation: 6,
};

// Shadow above the sheet that overlaps each banner
export const SHEET_TOP_SHADOW: ViewStyle = {
  shadowOffset: { width: 0, height: -10 },
  shadowOpacity: 0.15,
  shadowRadius: 8,
};

//----------------------------------- END OF FILE ---------------------------------//
