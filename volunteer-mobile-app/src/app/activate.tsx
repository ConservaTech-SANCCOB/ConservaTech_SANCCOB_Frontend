import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import KeyboardAvoidingScreen from "../components/KeyboardAvoidingScreen";
import { activate } from "../services/auth";
import { getErrorMessage, getErrorStatus } from "../utils/api";
import { COLORS } from "../utils/colors";
import { logError } from "../utils/logError";
import { resetTo } from "../utils/navigation";
import { showErrorToast } from "../utils/toast";

// Same rules enforced by the backend's password validator — keep in sync.
const PASSWORD_HINT =
  "Must be 8+ characters with uppercase, lowercase, and a number";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldErrors = {
  email?: string;
  otp?: string;
  newPassword?: string;
};

//-----------------------------------------------------------------------------------------------//
// Local mirror of the backend password rules so the user gets immediate feedback instead of
// waiting for a round-trip. If these ever drift, the backend is the source of truth and its
// error message will still surface via mapServerErrors below.
//-----------------------------------------------------------------------------------------------//
function validatePassword(password: string): string | undefined {
  if (password.length < 8)
    return "Password must be at least 8 characters long.";
  if (!/[A-Z]/.test(password))
    return "Password must include an uppercase letter.";
  if (!/[a-z]/.test(password))
    return "Password must include a lowercase letter.";
  if (!/\d/.test(password)) return "Password must include a number.";
  return undefined;
}

//-----------------------------------------------------------------------------------------------//
// Extracts field-level validation errors from an ASP.NET Core ProblemDetails response (RFC 7807)
// so a 400 like { errors: { NewPassword: ["..."] } } shows inline instead of a generic toast.
//-----------------------------------------------------------------------------------------------//
function mapServerErrors(error: unknown): FieldErrors | null {
  const anyErr = error as {
    response?: { data?: { errors?: Record<string, string[]> } };
  };
  const errors = anyErr?.response?.data?.errors;
  if (!errors) return null;

  const mapped: FieldErrors = {};
  // Backend field names → form state keys. ASP.NET is case-insensitive on the way out.
  for (const [key, messages] of Object.entries(errors)) {
    const first = messages?.[0];
    if (!first) continue;
    const k = key.toLowerCase();
    if (k === "email") mapped.email = first;
    else if (k === "otp" || k === "pin" || k === "code") mapped.otp = first;
    else if (k === "newpassword" || k === "password")
      mapped.newPassword = first;
  }
  return Object.keys(mapped).length > 0 ? mapped : null;
}

export default function ActivateScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  //-----------------------------------------------------------------------------------------------//
  // Runs all client-side rules and returns a fresh errors object; empty means ready to submit.
  //-----------------------------------------------------------------------------------------------//
  const validateAll = (): FieldErrors => {
    const next: FieldErrors = {};
    if (!email.trim()) next.email = "Email is required.";
    else if (!EMAIL_REGEX.test(email.trim()))
      next.email = "Enter a valid email address.";

    if (!otp) next.otp = "PIN is required.";
    else if (otp.length !== 6) next.otp = "The PIN must be 6 digits.";
    else if (!/^\d{6}$/.test(otp))
      next.otp = "The PIN must only contain digits.";

    if (!newPassword) next.newPassword = "Password is required.";
    else {
      const pwdError = validatePassword(newPassword);
      if (pwdError) next.newPassword = pwdError;
    }

    return next;
  };

  const handleActivate = async () => {
    const clientErrors = validateAll();
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      showErrorToast(
        "Check your details",
        "Fix the highlighted fields and try again.",
      );
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await activate(email.trim(), otp, newPassword);
      resetTo("/(tabs)/home");
    } catch (error) {
      logError("Activation error", error);
      const status = getErrorStatus(error);

      // Backend field errors (e.g. password rules) surface inline on the exact field.
      const serverFieldErrors = mapServerErrors(error);
      if (serverFieldErrors) {
        setErrors(serverFieldErrors);
        showErrorToast(
          "Check your details",
          "The server flagged one or more fields.",
        );
      } else {
        showErrorToast(
          "Activation failed",
          status === 401
            ? "Incorrect or expired code"
            : getErrorMessage(
                error,
                "Couldn't activate your account. Try again in a moment.",
              ),
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Clear a specific field's error as the user starts typing in it again — removes the red state
  // the moment they begin to fix it.
  const clearError = (field: keyof FieldErrors) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  return (
    <KeyboardAvoidingScreen style={styles.container}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <LinearGradient
          colors={["#003b5c", "#001a2c"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.banner}
        >
          <LinearGradient
            colors={["rgba(255,255,255,0.08)", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          <Svg
            style={StyleSheet.absoluteFill}
            viewBox="0 0 400 380"
            preserveAspectRatio="none"
            pointerEvents="none"
          >
            <Path
              d="M-20,40 C60,15 120,55 200,35 C280,15 340,45 420,25 L420,380 L-20,380 Z"
              fill="#ffffff"
              opacity={0.03}
            />
            <Path
              d="M-20,85 C70,110 140,70 220,90 C300,110 350,80 420,95 L420,380 L-20,380 Z"
              fill="#7dd3fc"
              opacity={0.04}
            />
            <Path
              d="M-20,130 C60,105 130,140 210,120 C290,100 350,135 420,115 L420,380 L-20,380 Z"
              fill="#ffffff"
              opacity={0.05}
            />
            <Path
              d="M-20,180 C80,205 150,165 230,185 C310,205 360,175 420,190 L420,380 L-20,380 Z"
              fill="#7dd3fc"
              opacity={0.07}
            />
            <Path
              d="M-20,225 C70,195 140,235 220,215 C300,195 355,230 420,210 L420,380 L-20,380 Z"
              fill="#ffffff"
              opacity={0.09}
            />
            <Path
              d="M-20,270 C80,300 155,260 235,285 C315,310 365,275 420,290 L420,380 L-20,380 Z"
              fill="#7dd3fc"
              opacity={0.11}
            />
            <Path
              d="M-20,320 C80,345 160,310 240,330 C320,350 360,320 420,335 L420,380 L-20,380 Z"
              fill="#ffffff"
              opacity={0.14}
            />
          </Svg>

          <View style={styles.logoCircleOuter}>
            <LinearGradient
              colors={["#ffffff", "#e2e8f0", "#cbd5e1", "#ffffff"]}
              locations={[0, 0.4, 0.6, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoCircle}
            >
              <Image
                source={require("../../assets/images/sanccob-icon.png")}
                style={styles.logoImage}
              />
            </LinearGradient>
          </View>
          <Text style={styles.title}>Activate Account</Text>
          <Text style={styles.subtitle}>ENTER YOUR DETAILS BELOW</Text>
        </LinearGradient>

        <View style={styles.background}>
          <View style={styles.form}>
            {/*------------------------------------ Email ------------------------------------*/}
            <Text style={styles.label}>Email Address</Text>
            <View
              style={[styles.inputRow, errors.email && styles.inputRowError]}
            >
              <Ionicons name="mail-outline" size={18} color={COLORS.grey} />
              <TextInput
                style={styles.input}
                placeholderTextColor={COLORS.grey}
                value={email}
                onChangeText={(v) => {
                  setEmail(v);
                  clearError("email");
                }}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
              />
            </View>
            {errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}

            {/*------------------------------------ PIN ------------------------------------*/}
            <Text style={styles.label}>6-Digit PIN</Text>
            <View style={[styles.inputRow, errors.otp && styles.inputRowError]}>
              <Ionicons name="keypad-outline" size={18} color={COLORS.grey} />
              <TextInput
                style={styles.input}
                placeholderTextColor={COLORS.grey}
                value={otp}
                onChangeText={(v) => {
                  setOtp(v);
                  clearError("otp");
                }}
                keyboardType="number-pad"
                maxLength={6}
                autoCorrect={false}
              />
            </View>
            {errors.otp && <Text style={styles.errorText}>{errors.otp}</Text>}

            {/*------------------------------------ Password ------------------------------------*/}
            <Text style={styles.label}>Create Password</Text>
            <View
              style={[
                styles.inputRow,
                errors.newPassword && styles.inputRowError,
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={COLORS.grey}
              />
              <TextInput
                style={styles.input}
                placeholderTextColor={COLORS.grey}
                value={newPassword}
                onChangeText={(v) => {
                  setNewPassword(v);
                  clearError("newPassword");
                }}
                secureTextEntry={!showPassword}
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={8}
              >
                <Ionicons
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color={COLORS.grey}
                />
              </TouchableOpacity>
            </View>
            {errors.newPassword ? (
              <Text style={styles.errorText}>{errors.newPassword}</Text>
            ) : (
              <Text style={styles.hintText}>{PASSWORD_HINT}</Text>
            )}

            <TouchableOpacity
              style={styles.loginButtonWrap}
              onPress={handleActivate}
              disabled={loading}
            >
              <View style={styles.loginButton}>
                {loading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.loginButtonText}>Activate</Text>
                )}
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.helperText}>Back to login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingScreen>
  );
}

//--------------------STYLES--------------------//

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  banner: { alignItems: "center", paddingTop: 90, paddingBottom: 170 },
  logoCircleOuter: {
    borderRadius: 48,
    padding: 2,
    backgroundColor: "rgba(77, 184, 255, 0.3)",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logoImage: { width: 48, height: 48, resizeMode: "cover" },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.white,
    letterSpacing: 0.5,
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  subtitle: {
    fontSize: 12,
    color: "#7dd3fc",
    letterSpacing: 1.5,
    marginTop: 6,
    fontWeight: "700",
  },
  background: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    marginTop: -32,
    shadowColor: "#001a2c",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  form: { paddingHorizontal: 24 },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.navy,
    marginBottom: 6,
    marginTop: 16,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.borderBlueGrey,
    backgroundColor: COLORS.lightGrey,
    borderRadius: 26,
    paddingHorizontal: 18,
    shadowColor: "#002e4c",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  inputRowError: {
    borderColor: "#B42318",
    borderWidth: 1.5,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.navy,
  },
  errorText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#B42318",
    marginTop: 6,
    marginLeft: 6,
  },
  hintText: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.grey,
    marginTop: 6,
    marginLeft: 6,
  },
  loginButtonWrap: {
    marginTop: 28,
    borderRadius: 40,
    shadowColor: "#075985",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  loginButton: {
    flexDirection: "row",
    borderRadius: 40,
    paddingVertical: 24,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.blueButton,
  },
  loginButtonText: {
    color: COLORS.white,
    fontWeight: "600",
    fontSize: 15.5,
    letterSpacing: 0.2,
  },
  helperText: {
    textAlign: "center",
    color: COLORS.navy,
    fontSize: 13,
    marginTop: 20,
  },
});

//----------------------------------- END OF FILE ---------------------------------//
