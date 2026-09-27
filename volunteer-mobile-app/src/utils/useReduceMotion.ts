import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/** True while the OS "Reduce Motion" setting is on — decorative loops should stay still. */
export function useReduceMotion() {
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduceMotion)
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => sub?.remove();
  }, []);
  return reduceMotion;
}
