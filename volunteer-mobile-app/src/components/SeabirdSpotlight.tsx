import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { SEABIRDS } from "../constants/seabirds";
import { COLORS } from "../utils/colors";

function dayOfYear(date: Date) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date.getTime() - start.getTime()) / 86_400_000);
}

/**
 * "Meet the seabirds" card for Home: one of the species SANCCOB cares for, with a real
 * photo, its conservation status and a short fact. Starts on a different bird each day;
 * tapping moves on to the next one.
 */
export default function SeabirdSpotlight() {
  const [index, setIndex] = useState(() => dayOfYear(new Date()) % SEABIRDS.length);
  const scale = useRef(new Animated.Value(1)).current;
  const bird = SEABIRDS[index];

  const next = () => setIndex((i) => (i + 1) % SEABIRDS.length);

  return (
    <Pressable
      onPress={next}
      onPressIn={() => Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 50, bounciness: 6 }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 10 }).start()}
      accessibilityRole="button"
      accessibilityLabel={`Seabird spotlight: ${bird.name}, ${bird.status}. ${bird.fact}`}
      accessibilityHint="Shows the next seabird"
    >
      <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
        <View style={styles.photoWrap}>
          <Image
            source={bird.photo}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            contentPosition={bird.photoPosition}
            transition={300}
            accessible={false}
          />
          <LinearGradient
            colors={["rgba(0,26,44,0)", "rgba(0,26,44,0.75)"]}
            style={styles.photoShade}
            pointerEvents="none"
          />
          <View style={styles.eyebrowChip}>
            <Ionicons name="sparkles" size={11} color={COLORS.navy} />
            <Text style={styles.eyebrowText}>SEABIRD SPOTLIGHT</Text>
          </View>
          <View style={styles.photoCaption}>
            <Text style={styles.name}>{bird.name}</Text>
            <Text style={styles.scientific}>{bird.scientificName}</Text>
          </View>
          {bird.credit && <Text style={styles.credit}>Photo: {bird.credit}</Text>}
        </View>

        <View style={styles.body}>
          <View style={[styles.statusChip, bird.threatened ? styles.statusThreatened : styles.statusSafe]}>
            <View style={[styles.statusDot, { backgroundColor: bird.threatened ? COLORS.red : COLORS.greenMid }]} />
            <Text style={[styles.statusText, { color: bird.threatened ? COLORS.redLight : COLORS.greenLight }]}>
              {bird.status}
            </Text>
          </View>
          <Text style={styles.fact}>{bird.fact}</Text>
          <View style={styles.footer}>
            <View style={styles.dots}>
              {SEABIRDS.map((b, i) => (
                <View key={b.key} style={[styles.dot, i === index && styles.dotActive]} />
              ))}
            </View>
            <View style={styles.nextHint}>
              <Text style={styles.nextHintText}>Next bird</Text>
              <Ionicons name="chevron-forward" size={14} color={COLORS.blueMid} />
            </View>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e9ee",
    overflow: "hidden",
    shadowColor: COLORS.blueDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  photoWrap: { height: 170, backgroundColor: COLORS.blueLight },
  photoShade: { position: "absolute", left: 0, right: 0, bottom: 0, height: 90 },
  eyebrowChip: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 9,
  },
  eyebrowText: { fontSize: 10, fontWeight: "800", color: COLORS.navy, letterSpacing: 1 },
  photoCaption: { position: "absolute", left: 14, bottom: 12, right: 90 },
  name: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.white,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  scientific: { fontSize: 12, fontStyle: "italic", color: "rgba(255,255,255,0.85)", marginTop: 1 },
  credit: { position: "absolute", right: 10, bottom: 8, fontSize: 9.5, color: "rgba(255,255,255,0.75)" },
  body: { padding: 16, gap: 10 },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  statusThreatened: { backgroundColor: COLORS.redBg },
  statusSafe: { backgroundColor: COLORS.greenBg },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 11.5, fontWeight: "800" },
  fact: { fontSize: 13.5, lineHeight: 19.5, color: "#3d5260", fontWeight: "500" },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 2 },
  dots: { flexDirection: "row", gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#d3dde3" },
  dotActive: { width: 16, backgroundColor: COLORS.blueMid },
  nextHint: { flexDirection: "row", alignItems: "center", gap: 2 },
  nextHintText: { fontSize: 12.5, fontWeight: "800", color: COLORS.blueMid },
});
