import { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, StyleProp, ViewStyle } from "react-native";

// Stops the keyboard covering form inputs
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

//----------------------------------- END OF FILE ---------------------------------//
