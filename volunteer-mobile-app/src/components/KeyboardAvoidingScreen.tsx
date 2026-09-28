import { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, StyleProp, ViewStyle } from "react-native";

/** Wraps a form screen so the on-screen keyboard shrinks the screen instead of
 * covering the focused input. Put a ScrollView inside so the form can scroll
 * clear of the keyboard. iOS needs "padding"; Android (edge-to-edge, so the
 * window no longer resizes itself) uses "height". */
export default function KeyboardAvoidingScreen({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <KeyboardAvoidingView style={[{ flex: 1 }, style]} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      {children}
    </KeyboardAvoidingView>
  );
}
