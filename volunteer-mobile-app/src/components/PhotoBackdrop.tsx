import { Image, ImageContentPosition, ImageSource } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet } from "react-native";

/**
 * A real photo behind a banner, washed with the banner's own colours so the text on
 * top stays readable and the screen keeps its theme. Render it as the banner's first
 * child; the banner's wave Svg and content then sit on top of it.
 */
export default function PhotoBackdrop({
  source,
  tint,
  position = "center",
}: {
  source: ImageSource | number;
  /** Top-to-bottom overlay colours, usually the banner gradient at partial opacity. */
  tint: [string, string, ...string[]];
  position?: ImageContentPosition;
}) {
  return (
    <>
      <Image
        source={source}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        contentPosition={position}
        transition={250}
        accessible={false}
        pointerEvents="none"
      />
      <LinearGradient colors={tint} style={StyleSheet.absoluteFill} pointerEvents="none" />
    </>
  );
}
