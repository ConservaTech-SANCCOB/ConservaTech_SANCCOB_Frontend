import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LanguageCode, SUPPORTED_LANGUAGES, useLanguage } from "../i18n";
import { COLORS } from "../utils/colors";

//-----------------------------------------------------------------------------------------------//
// Language list for the Profile screen. Tapping a row saves the choice and re-renders every
// screen that uses useLanguage().
//-----------------------------------------------------------------------------------------------//
export default function LanguagePicker() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{t("profile.languageSection")}</Text>
      <Text style={styles.description}>{t("profile.languageDescription")}</Text>

      <View style={styles.list}>
        {SUPPORTED_LANGUAGES.map((lang) => {
          const selected = lang.code === language;
          return (
            <TouchableOpacity
              key={lang.code}
              style={[styles.row, selected && styles.rowSelected]}
              onPress={() => setLanguage(lang.code as LanguageCode)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <Text
                style={[styles.rowLabel, selected && styles.rowLabelSelected]}
              >
                {lang.nativeLabel}
              </Text>
              {selected && (
                <Ionicons
                  name="checkmark-circle"
                  size={22}
                  color={COLORS.blueButton}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 0, marginTop: 0 },
  sectionTitle: {
    fontSize: 15.5,
    fontWeight: "700",
    color: COLORS.navy,
    marginBottom: 4,
  },
  description: { fontSize: 13, color: COLORS.grey, marginBottom: 16 },
  list: { gap: 10 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: COLORS.borderBlueGrey,
    backgroundColor: COLORS.lightGrey,
    borderRadius: 16,
  },
  rowSelected: { borderColor: COLORS.blueButton, borderWidth: 1.5 },
  rowLabel: { fontSize: 15, fontWeight: "600", color: COLORS.navy },
  rowLabelSelected: { color: COLORS.blueButton },
});
