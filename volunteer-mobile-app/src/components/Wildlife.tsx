import { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, useWindowDimensions, View, ViewStyle } from "react-native";
import Svg, { Circle, Ellipse, Path } from "react-native-svg";
import { showInfoToast } from "../utils/toast";
import { useReduceMotion } from "../utils/useReduceMotion";

/**
 * Decorative seabirds for the screen banners, drawn after the species SANCCOB
 * rehabilitates: the African penguin (pink patches above the eyes, black chest band,
 * chest spots), its fluffy grey chicks (the Chick Bolstering Project) and the gulls
 * that share the coast. Drawn in a soft, friendly style: big blinking eyes, blush,
 * a gentle bob and the odd flipper wave. Everything here is decoration — hidden from
 * screen readers, and still when "Reduce Motion" is on.
 */

const PENGUIN_FACTS = [
  "African penguins are the only penguins that breed on the African continent.",
  "The pink patches above their eyes help them keep cool on hot days.",
  "Every African penguin has its own pattern of chest spots, like a fingerprint.",
  "They're nicknamed \"jackass penguins\" for their loud, donkey-like bray.",
  "African penguins have been listed as Critically Endangered since 2024.",
  "SANCCOB has been rescuing and rehabilitating seabirds since 1968.",
  "African penguins can swim at around 20 km/h while hunting for fish.",
];

const CHICK_FACTS = [
  "Abandoned chicks are hand-reared at SANCCOB until they're ready for the sea.",
  "Chicks are covered in fluffy grey down, and can't swim until their waterproof feathers grow in.",
  "Young penguins are blue-grey and only get their black-and-white look after their first moult.",
];

const INK = "#2b2d38";
const FEET = "#4a4c58";
const PINK = "#f4a3b6";
const CHICK_DOWN = "#a7b0b9";
const CHICK_FLIPPER = "#8e98a2";

// Shared stand-ins for figures drawn without animation (e.g. empty states).
const EYES_OPEN = new Animated.Value(1);
const FLIPPER_REST = new Animated.Value(0);

/** One eye: a glossy black oval with a highlight, drawn as a View so it can blink natively. */
function Eye({ x, y, u, blink }: { x: number; y: number; u: number; blink: Animated.Value }) {
  const w = 5.6 * u;
  const h = 6.6 * u;
  return (
    <Animated.View
      style={{
        position: "absolute",
        left: x * u - w / 2,
        top: y * u - h / 2,
        width: w,
        height: h,
        borderRadius: w / 2,
        backgroundColor: "#15161c",
        transform: [{ scaleY: blink }],
      }}
    >
      <View
        style={{
          position: "absolute",
          top: h * 0.14,
          left: w * 0.5,
          width: w * 0.38,
          height: w * 0.38,
          borderRadius: w,
          backgroundColor: "#fff",
        }}
      />
    </Animated.View>
  );
}

/** A flipper that pivots from the shoulder; `side` decides which way is "outward". */
function Flipper({
  x,
  y,
  u,
  side,
  wave,
  color,
  length = 24,
}: {
  x: number;
  y: number;
  u: number;
  side: "left" | "right";
  wave: Animated.Value;
  color: string;
  length?: number;
}) {
  const rotate = wave.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", side === "left" ? "55deg" : "-55deg"],
  });
  return (
    <Animated.View
      style={{
        position: "absolute",
        left: (x - 6) * u,
        top: y * u,
        transformOrigin: "top",
        transform: [{ rotate }],
      }}
    >
      <Svg width={12 * u} height={length * u} viewBox={`0 0 12 ${length}`}>
        <Path
          d={
            side === "left"
              ? `M8,0 C3,3 0,${length * 0.45} 3,${length} C8,${length * 0.8} 12,${length * 0.4} 11,3 C11,1 10,0 8,0 Z`
              : `M4,0 C9,3 12,${length * 0.45} 9,${length} C4,${length * 0.8} 0,${length * 0.4} 1,3 C1,1 2,0 4,0 Z`
          }
          fill={color}
        />
      </Svg>
    </Animated.View>
  );
}

/** Friendly African penguin, laid out on a 60×80 grid scaled to `size` wide. */
function PenguinFigure({
  size,
  blink = EYES_OPEN,
  wave = FLIPPER_REST,
}: {
  size: number;
  blink?: Animated.Value;
  wave?: Animated.Value;
}) {
  const u = size / 60;
  return (
    <View style={{ width: size, height: 80 * u }}>
      <Flipper x={10} y={36} u={u} side="left" wave={wave} color={INK} />
      <Flipper x={50} y={36} u={u} side="right" wave={FLIPPER_REST} color={INK} />
      <Svg width={size} height={80 * u} viewBox="0 0 60 80" style={StyleSheet.absoluteFill}>
        <Ellipse cx={30} cy={77.5} rx={16} ry={2.4} fill="#000" opacity={0.15} />
        {/* Round body */}
        <Path d="M30,5 C15,5 8,19 8,37 C8,60 16,75 30,75 C44,75 52,60 52,37 C52,19 45,5 30,5 Z" fill={INK} />
        {/* White face flowing into the belly */}
        <Path
          d="M30,19 C23,11 12,15 13,27 C13.5,35 18,40 21,43 C17.5,49 16.5,57 17.5,63 C19.5,71 25,73 30,73 C35,73 40.5,71 42.5,63 C43.5,57 42.5,49 39,43 C42,40 46.5,35 47,27 C48,15 37,11 30,19 Z"
          fill="#fbfbfd"
        />
        {/* Pink patches above the eyes */}
        <Path d="M18.8,24 C20.5,21.3 25,21.3 26.6,24" stroke={PINK} strokeWidth={2.2} strokeLinecap="round" fill="none" />
        <Path d="M33.4,24 C35,21.3 39.5,21.3 41.2,24" stroke={PINK} strokeWidth={2.2} strokeLinecap="round" fill="none" />
        {/* Blush */}
        <Ellipse cx={18.6} cy={35.5} rx={3} ry={1.8} fill={PINK} opacity={0.5} />
        <Ellipse cx={41.4} cy={35.5} rx={3} ry={1.8} fill={PINK} opacity={0.5} />
        {/* Small rounded beak */}
        <Path d="M26.8,33 Q30,31.2 33.2,33 Q30,38 26.8,33 Z" fill="#454756" />
        {/* Chest band + a few spots */}
        <Path
          d="M19.2,60 C18.6,50 23,46.2 30,46.2 C37,46.2 41.4,50 40.8,60"
          stroke={INK}
          strokeWidth={1.5}
          strokeLinecap="round"
          fill="none"
          opacity={0.85}
        />
        <Circle cx={24.5} cy={62} r={0.8} fill={INK} />
        <Circle cx={36} cy={57} r={0.7} fill={INK} />
        {/* Feet */}
        <Ellipse cx={23.5} cy={75.5} rx={5.5} ry={2.4} fill={FEET} />
        <Ellipse cx={36.5} cy={75.5} rx={5.5} ry={2.4} fill={FEET} />
      </Svg>
      <Eye x={23} y={29} u={u} blink={blink} />
      <Eye x={37} y={29} u={u} blink={blink} />
    </View>
  );
}

/** Fluffy grey penguin chick on the same 60×80 grid, rounder and with a head tuft. */
function ChickFigure({
  size,
  blink = EYES_OPEN,
  wave = FLIPPER_REST,
}: {
  size: number;
  blink?: Animated.Value;
  wave?: Animated.Value;
}) {
  const u = size / 60;
  return (
    <View style={{ width: size, height: 80 * u }}>
      <Flipper x={11} y={46} u={u} side="left" wave={wave} color={CHICK_FLIPPER} length={16} />
      <Flipper x={49} y={46} u={u} side="right" wave={wave} color={CHICK_FLIPPER} length={16} />
      <Svg width={size} height={80 * u} viewBox="0 0 60 80" style={StyleSheet.absoluteFill}>
        <Ellipse cx={30} cy={77.5} rx={17} ry={2.4} fill="#000" opacity={0.15} />
        {/* Fluffy body with a scalloped edge for the down */}
        <Path
          d="M30,20 C17,20 11,32 11,46 C9,50 10,54 11,56 C10,60 12,64 14,66 C14,70 18,74 23,75 C26,77 34,77 37,75 C42,74 46,70 46,66 C48,64 50,60 49,56 C50,54 51,50 49,46 C49,32 43,20 30,20 Z"
          fill={CHICK_DOWN}
        />
        <Path d="M30,41 C22,41 19,51 19,59 C19,68 24,73 30,73 C36,73 41,68 41,59 C41,51 38,41 30,41 Z" fill="#e6e9ec" />
        {/* Tuft */}
        <Path d="M27,21 C27,16 30,14 31,17 C32,13 36,15 34,20" stroke={CHICK_DOWN} strokeWidth={2.2} fill="none" strokeLinecap="round" />
        <Ellipse cx={20.5} cy={38} rx={2.8} ry={1.6} fill={PINK} opacity={0.6} />
        <Ellipse cx={39.5} cy={38} rx={2.8} ry={1.6} fill={PINK} opacity={0.6} />
        <Path d="M27.5,35.5 Q30,34 32.5,35.5 Q30,39.5 27.5,35.5 Z" fill="#555866" />
        <Ellipse cx={24} cy={76} rx={4.6} ry={2} fill={FEET} />
        <Ellipse cx={36} cy={76} rx={4.6} ry={2} fill={FEET} />
      </Svg>
      <Eye x={24} y={31} u={u} blink={blink} />
      <Eye x={36} y={31} u={u} blink={blink} />
    </View>
  );
}

/** Static penguin, for places that shouldn't move (empty states, tests). */
export function PenguinArt({ size = 60 }: { size?: number }) {
  return <PenguinFigure size={size} />;
}

/** Static chick. */
export function ChickArt({ size = 40 }: { size?: number }) {
  return <ChickFigure size={size} />;
}

/**
 * Idle life for a figure: a slow breathing bob, a blink every few seconds and (for
 * adults) an occasional flipper wave. `play()` is the tap reaction: a hop and a wave.
 */
function useCritterMotion({ idleWave, reduceMotion }: { idleWave: boolean; reduceMotion: boolean }) {
  const bob = useRef(new Animated.Value(0)).current;
  const hop = useRef(new Animated.Value(0)).current;
  const blink = useRef(new Animated.Value(1)).current;
  const wave = useRef(new Animated.Value(0)).current;

  const waveOnce = () =>
    Animated.sequence([
      Animated.timing(wave, { toValue: 1, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(wave, { toValue: 0.45, duration: 180, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(wave, { toValue: 1, duration: 180, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(wave, { toValue: 0, duration: 260, easing: Easing.in(Easing.quad), useNativeDriver: true }),
    ]);

  useEffect(() => {
    if (reduceMotion) return;
    const loops = [
      Animated.loop(
        Animated.sequence([
          Animated.timing(bob, { toValue: -2.5, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(bob, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      ),
      Animated.loop(
        Animated.sequence([
          Animated.delay(2600 + Math.random() * 1800),
          Animated.timing(blink, { toValue: 0.1, duration: 70, useNativeDriver: true }),
          Animated.timing(blink, { toValue: 1, duration: 110, useNativeDriver: true }),
        ])
      ),
    ];
    if (idleWave) {
      loops.push(Animated.loop(Animated.sequence([Animated.delay(5500 + Math.random() * 2500), waveOnce()])));
    }
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bob, blink, wave, idleWave, reduceMotion]);

  const play = () => {
    if (reduceMotion) return;
    Animated.parallel([
      Animated.sequence([
        Animated.timing(hop, { toValue: -12, duration: 150, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.spring(hop, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 12 }),
      ]),
      waveOnce(),
    ]).start();
  };

  return { bob, hop, blink, wave, play };
}

/** Gull in flight: a white body with grey wings and dark tips, 40×18 viewBox. */
function GullArt({ width, tint }: { width: number; tint: "light" | "dark" }) {
  const wing = tint === "light" ? "#ffffff" : "#8a6a0c";
  const tip = tint === "light" ? "#c9d6de" : "#5c4508";
  return (
    <Svg width={width} height={(width * 18) / 40} viewBox="0 0 40 18">
      <Path d="M0,7 C6,1 13,1 20,9 C27,1 34,1 40,7 C34,5 27,6 20,13 C13,6 6,5 0,7 Z" fill={wing} />
      <Path d="M0,7 C2,5 4,4 6,3.6 C4,5 3,6 0,7 Z" fill={tip} />
      <Path d="M40,7 C38,5 36,4 34,3.6 C36,5 37,6 40,7 Z" fill={tip} />
      <Ellipse cx={20} cy={10.5} rx={2.2} ry={3} fill={wing} />
    </Svg>
  );
}

function FlyingGull({
  top,
  width,
  duration,
  delay,
  tint,
  reduceMotion,
}: {
  top: number;
  width: number;
  duration: number;
  delay: number;
  tint: "light" | "dark";
  reduceMotion: boolean;
}) {
  const { width: screenWidth } = useWindowDimensions();
  const drift = useRef(new Animated.Value(0)).current;
  const flap = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) return;
    // Start part-way across so the banner isn't empty for the first few seconds.
    drift.setValue(delay);
    const firstLeg = Animated.timing(drift, {
      toValue: 1,
      duration: duration * (1 - delay),
      easing: Easing.linear,
      useNativeDriver: true,
    });
    const loop = Animated.loop(
      Animated.timing(drift, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: true })
    );
    const flapLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(flap, { toValue: 1, duration: 420, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(flap, { toValue: 0, duration: 420, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        // Glide for a moment between wingbeats, as gulls do.
        Animated.delay(900),
      ])
    );
    const flight = Animated.sequence([
      firstLeg,
      Animated.timing(drift, { toValue: 0, duration: 0, useNativeDriver: true }),
      loop,
    ]);
    flight.start();
    flapLoop.start();
    return () => {
      flight.stop();
      flapLoop.stop();
    };
  }, [drift, flap, duration, delay, reduceMotion]);

  const translateX = reduceMotion
    ? screenWidth * delay
    : drift.interpolate({ inputRange: [0, 1], outputRange: [-width - 10, screenWidth + 10] });
  const translateY = drift.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0, -6, 0, 5, 0],
  });
  const scaleY = flap.interpolate({ inputRange: [0, 1], outputRange: [1, 0.55] });

  return (
    <Animated.View
      style={{
        position: "absolute",
        top,
        left: 0,
        opacity: tint === "light" ? 0.85 : 0.6,
        transform: [{ translateX }, { translateY: reduceMotion ? 0 : translateY }, { scaleY }],
      }}
    >
      <GullArt width={width} tint={tint} />
    </Animated.View>
  );
}

/**
 * A small flock of gulls drifting across a banner. Render it straight after the
 * banner's wave Svg so it sits behind the banner's text and buttons.
 * `tint="dark"` is for light banners (the pastel shifts theme).
 */
export function BannerBirds({ tint = "light", top = 0 }: { tint?: "light" | "dark"; top?: number }) {
  const reduceMotion = useReduceMotion();
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <FlyingGull top={top + 18} width={30} duration={26000} delay={0.55} tint={tint} reduceMotion={reduceMotion} />
      <FlyingGull top={top + 40} width={22} duration={32000} delay={0.72} tint={tint} reduceMotion={reduceMotion} />
      <FlyingGull top={top + 8} width={18} duration={38000} delay={0.2} tint={tint} reduceMotion={reduceMotion} />
    </View>
  );
}

/** A penguin or chick that bobs, blinks and waves, and shares a seabird fact when tapped. */
function Critter({ kind, size, reduceMotion }: { kind: "adult" | "chick"; size: number; reduceMotion: boolean }) {
  const facts = kind === "adult" ? PENGUIN_FACTS : CHICK_FACTS;
  const { bob, hop, blink, wave, play } = useCritterMotion({ idleWave: kind === "adult", reduceMotion });
  const factIndex = useRef(Math.floor(Math.random() * facts.length));

  const onPress = () => {
    play();
    showInfoToast("Did you know? 🐧", facts[factIndex.current % facts.length]);
    factIndex.current += 1;
  };

  const Figure = kind === "adult" ? PenguinFigure : ChickFigure;
  return (
    <Pressable onPress={onPress} hitSlop={8} accessible={false}>
      <Animated.View style={{ transform: [{ translateY: Animated.add(bob, hop) }] }}>
        <Figure size={size} blink={blink} wave={wave} />
      </Animated.View>
    </Pressable>
  );
}

/**
 * Penguin (optionally with a chick) standing at the bottom-right of a banner, just
 * above the white sheet's rounded edge. Render it as the banner's last child so it
 * sits above the title and can be tapped for a seabird fact.
 */
export function BannerPenguin({
  variant = "adult",
  style,
}: {
  variant?: "adult" | "chick" | "family";
  style?: ViewStyle;
}) {
  const reduceMotion = useReduceMotion();
  return (
    <View style={[styles.penguinSpot, style]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {(variant === "adult" || variant === "family") && <Critter kind="adult" size={46} reduceMotion={reduceMotion} />}
      {(variant === "chick" || variant === "family") && (
        <Critter kind="chick" size={variant === "family" ? 30 : 40} reduceMotion={reduceMotion} />
      )}
    </View>
  );
}

/** A small penguin to sit alongside an empty-state card's icon or above its title. */
export function EmptyStatePenguin({ size = 30 }: { size?: number }) {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <PenguinArt size={size} />
    </View>
  );
}

/** Blinking figure with no tap behaviour, for use inside other widgets (e.g. the training ring). */
export function MascotFigure({ kind, size }: { kind: "adult" | "chick"; size: number }) {
  const reduceMotion = useReduceMotion();
  const { bob, blink, wave } = useCritterMotion({ idleWave: kind === "adult", reduceMotion });
  const Figure = kind === "adult" ? PenguinFigure : ChickFigure;
  return (
    <Animated.View
      style={{ transform: [{ translateY: bob }] }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Figure size={size} blink={blink} wave={wave} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  penguinSpot: {
    position: "absolute",
    right: 22,
    bottom: 22,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 2,
  },
});
