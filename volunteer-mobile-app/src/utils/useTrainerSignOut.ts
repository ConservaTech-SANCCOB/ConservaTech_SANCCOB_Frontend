import { useIsFocused, useNavigation } from "expo-router";
import { NavigationAction, usePreventRemove } from "expo-router/react-navigation";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import { logout } from "../services/auth";
import { resetTo } from "./navigation";

// Only Back should log the trainer out
function isBackAction(action: NavigationAction) {
  return action.type === "GO_BACK" || action.type === "POP";
}

// ------------------------------------------------------------ //

// Back on a trainer screen ends the shared session
export function useTrainerSignOut({ confirmOnBack }: { confirmOnBack: boolean }) {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [signedOut, setSignedOut] = useState(false);

  const signOut = useCallback(async () => {
    await logout();
    setSignedOut(true);
  }, []);

  // Wait until usePreventRemove stops blocking the move
  useEffect(() => {
    if (signedOut) resetTo("/");
  }, [signedOut]);

  usePreventRemove(isFocused && !signedOut, ({ data }) => {
    if (!isBackAction(data.action)) {
      navigation.dispatch(data.action);
      return;
    }
    if (!confirmOnBack) {
      signOut();
      return;
    }
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log Out", style: "destructive", onPress: signOut },
    ]);
  });

  return signOut;
}

//----------------------------------- END OF FILE ---------------------------------//
