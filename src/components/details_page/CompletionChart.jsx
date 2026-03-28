/**
 * CompletionChart
 *
 * Horizontal animated bar chart showing game completion times.
 * Three bars: Main Story (cyan) · Main + Extras (purple) · 100% (gold)
 *
 * Animations:
 *   • Bar width spring-grows in (staggered)
 *   • Numeric counter ticks from 0 → value
 *   • Shimmer sweeps across each bar once it's full
 *   • Faint glow under each fill
 */

import React, { useRef, useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";

const BARS = [
  { key: "mainStory",      label: "Main Story",    color: "#22D3EE" },
  { key: "mainExtra",      label: "Main + Extras", color: "#A78BFA" },
  { key: "completionist",  label: "100%",           color: "#FBBF24" },
];

// ── Shimmer bar ────────────────────────────────────────────────────────────────
const ShimmerBar = ({ color, delay }) => {
  const shimAnim = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    const t = setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimAnim, {
            toValue: 2,
            duration: 1600,
            useNativeDriver: true,
          }),
          Animated.delay(3000),
          Animated.timing(shimAnim, { toValue: -1, duration: 0, useNativeDriver: true }),
        ])
      ).start();
    }, delay);
    return () => clearTimeout(t);
  }, [shimAnim, delay]);

  const shimX = shimAnim.interpolate({
    inputRange: [-1, 2],
    outputRange: ["-100%", "200%"],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.shimmer,
        {
          backgroundColor: color,
          transform: [{ translateX: shimX }],
        },
      ]}
    />
  );
};

// ── Counting number ────────────────────────────────────────────────────────────
const CounterText = ({ targetValue, color, delay }) => {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    setDisplay(0);
    const t = setTimeout(() => {
      const duration = 900;
      const start = Date.now();
      const tick = () => {
        const elapsed = Date.now() - start;
        const progress = Math.min(elapsed / duration, 1);
        // ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplay(Math.round(eased * targetValue));
        if (progress < 1) rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    }, delay);
    return () => {
      clearTimeout(t);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [targetValue, delay]);

  return (
    <Text style={[styles.value, { color }]}>{display}h</Text>
  );
};

// ── Main chart ─────────────────────────────────────────────────────────────────
const CompletionChart = ({ data }) => {
  const anims = useRef(BARS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    anims.forEach((a) => a.setValue(0));
    Animated.stagger(
      140,
      anims.map((v) =>
        Animated.spring(v, {
          toValue: 1,
          tension: 60,
          friction: 10,
          useNativeDriver: false,
        })
      )
    ).start();
  }, [data]);

  const values = BARS.map((b) => data[b.key] ?? 0);
  const maxVal = Math.max(...values, 1);

  return (
    <View style={styles.container}>
      {/* Section header row */}
      <View style={styles.header}>
        <View style={styles.slant} />
        <Text style={styles.title}>HOW LONG TO BEAT</Text>
        <View style={styles.scanLine} />
      </View>

      {BARS.map((bar, i) => {
        const val = data[bar.key];
        if (!val) return null;

        const pct = val / maxVal;
        const barWidth = anims[i].interpolate({
          inputRange: [0, 1],
          outputRange: ["0%", `${Math.round(pct * 100)}%`],
        });
        // Glow opacity pulses slightly
        const glowOp = anims[i].interpolate({
          inputRange: [0, 1],
          outputRange: [0, 0.22],
        });

        const STAGGER_DELAY = 140;
        const SPRING_DURATION = 700;
        const barDelay = i * STAGGER_DELAY + SPRING_DURATION;

        return (
          <View key={bar.key} style={styles.row}>
            <Text style={styles.label}>{bar.label}</Text>

            <View style={styles.trackWrap}>
              {/* Tick marks at 25 / 50 / 75 */}
              {[0.25, 0.5, 0.75].map((frac) => (
                <View
                  key={frac}
                  style={[styles.tick, { left: `${frac * 100}%` }]}
                />
              ))}

              {/* Glow layer behind fill */}
              <Animated.View
                style={[
                  styles.glowFill,
                  { width: barWidth, backgroundColor: bar.color, opacity: glowOp },
                ]}
              />

              {/* Filled bar */}
              <Animated.View
                style={[styles.fill, { width: barWidth, backgroundColor: bar.color }]}
              >
                <ShimmerBar color="#fff" delay={barDelay} />
              </Animated.View>
            </View>

            <CounterText targetValue={val} color={bar.color} delay={i * STAGGER_DELAY + 200} />
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width: "100%" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    gap: 8,
  },
  slant: {
    width: 4,
    height: 16,
    backgroundColor: "#A78BFA",
    transform: [{ skewX: "-14deg" }],
  },
  title: {
    fontSize: 11,
    letterSpacing: 2.2,
    fontWeight: "800",
    color: "#A78BFA",
  },
  scanLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(167,139,250,0.18)",
    marginLeft: 4,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  label: {
    width: 96,
    fontSize: 11,
    color: "#aaa",
    fontWeight: "600",
    letterSpacing: 0.3,
  },

  trackWrap: {
    flex: 1,
    height: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 3,
    overflow: "visible",
    marginHorizontal: 10,
    position: "relative",
  },
  tick: {
    position: "absolute",
    top: -3,
    width: 1,
    height: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    zIndex: 1,
  },
  glowFill: {
    position: "absolute",
    top: -4,
    left: 0,
    height: 20,
    borderRadius: 6,
    opacity: 0.18,
  },
  fill: {
    height: "100%",
    borderRadius: 3,
    overflow: "hidden",
  },
  shimmer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: "40%",
    opacity: 0.28,
    borderRadius: 3,
  },

  value: {
    width: 42,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right",
    letterSpacing: 0.3,
    fontVariant: ["tabular-nums"],
  },
});

export default CompletionChart;
