import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { VOLUNTEER_NEWS } from "../constants/volunteerNews";
import { COLORS } from "../utils/colors";
import { SPOTLIGHT_STYLES } from "./SeabirdSpotlight";

export default function VolunteerNews() {
  const [index, setIndex] = useState(0);
  const scale = useRef(new Animated.Value(1)).current;
  const story = VOLUNTEER_NEWS[index];

  const next = () => setIndex((i) => (i + 1) % VOLUNTEER_NEWS.length);

  return (
    <Pressable
      onPress={next}
      onPressIn={() => Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 50, bounciness: 6 }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 10 }).start()}
      accessibilityRole="button"
      accessibilityLabel={`Volunteer news: ${story.title}. ${story.body}`}
      accessibilityHint="Shows the next story"
    >
      <Animated.View style={[SPOTLIGHT_STYLES.card, { transform: [{ scale }] }]}>
        <View style={[SPOTLIGHT_STYLES.photoWrap, styles.header]}>
          <LinearGradient colors={[COLORS.blueLight, COLORS.blueDark]} style={StyleSheet.absoluteFill} />
          <Ionicons name={story.icon} size={64} color={COLORS.blueAccentLight} style={styles.headerIcon} />
          <View style={SPOTLIGHT_STYLES.eyebrowChip}>
            <Ionicons name="newspaper-outline" size={11} color={COLORS.navy} />
            <Text style={SPOTLIGHT_STYLES.eyebrowText}>VOLUNTEER NEWS</Text>
          </View>
          <View>
            <Text style={SPOTLIGHT_STYLES.name}>{story.title}</Text>
            <Text style={[SPOTLIGHT_STYLES.scientific, styles.topic]}>{story.topic}</Text>
          </View>
        </View>

        <View style={SPOTLIGHT_STYLES.body}>
          <Text style={SPOTLIGHT_STYLES.fact}>{story.body}</Text>
          <View style={SPOTLIGHT_STYLES.footer}>
            <View style={SPOTLIGHT_STYLES.dots}>
              {VOLUNTEER_NEWS.map((item, i) => (
                <View key={item.key} style={[SPOTLIGHT_STYLES.dot, i === index && SPOTLIGHT_STYLES.dotActive]} />
              ))}
            </View>
            <View style={SPOTLIGHT_STYLES.nextHint}>
              <Text style={SPOTLIGHT_STYLES.nextHintText}>Next story</Text>
              <Ionicons name="chevron-forward" size={14} color={COLORS.blueMid} />
            </View>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Grows with the title so large text never clips
  header: {
    height: undefined,
    minHeight: 140,
    justifyContent: "flex-end",
    paddingTop: 48,
    paddingBottom: 12,
    paddingLeft: 14,
    paddingRight: 96,
  },
  headerIcon: { position: "absolute", right: 22, top: 36, opacity: 0.9 },
  topic: { fontStyle: "normal", fontWeight: "600" },
});

//----------------------------------- END OF FILE ---------------------------------//
