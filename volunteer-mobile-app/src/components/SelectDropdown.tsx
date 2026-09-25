import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../utils/colors";

interface SelectDropdownProps {
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  placeholder: string;
  icon: keyof typeof Ionicons.glyphMap;
  accessibilityLabel: string;
}

/** A closed set of choices styled like the app's pill text inputs. Tapping opens a
 * modal list, so only the given options can ever be picked. */
export default function SelectDropdown({
  value,
  options,
  onChange,
  placeholder,
  icon,
  accessibilityLabel,
}: SelectDropdownProps) {
  const [open, setOpen] = useState(false);

  const choose = (option: string) => {
    onChange(option);
    setOpen(false);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.inputRow}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        <Ionicons name={icon} size={18} color={COLORS.grey} />
        <Text style={[styles.valueText, !value && styles.placeholderText]}>{value || placeholder}</Text>
        <Ionicons name="chevron-down" size={18} color={COLORS.grey} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{accessibilityLabel}</Text>
            {options.map((option) => {
              const selected = option === value;
              return (
                <TouchableOpacity
                  key={option}
                  style={[styles.option, selected && styles.optionSelected]}
                  onPress={() => choose(option)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{option}</Text>
                  {selected && <Ionicons name="checkmark" size={18} color={COLORS.pinkMid} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#dbe3e7",
    backgroundColor: COLORS.lightGrey,
    borderRadius: 26,
    paddingHorizontal: 18,
    gap: 10,
  },
  valueText: { flex: 1, paddingVertical: 14, fontSize: 14, fontWeight: "700", color: COLORS.grey },
  placeholderText: { fontWeight: "500", opacity: 0.7 },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  sheet: { backgroundColor: COLORS.white, borderRadius: 18, paddingVertical: 12 },
  sheetTitle: {
    fontSize: 15.5,
    fontWeight: "700",
    color: COLORS.pinkLight,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  optionSelected: { backgroundColor: COLORS.lightGrey },
  optionText: { fontSize: 15, fontWeight: "600", color: "#1b2a33" },
  optionTextSelected: { color: COLORS.pinkMid, fontWeight: "700" },
});
