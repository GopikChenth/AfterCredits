/**
 * CompletionChart
 *
 * Horizontal animated bar chart showing game completion times from
 * HowLongToBeat. Three bars:
 *   • Main Story    (cyan)
 *   • Main + Extras (purple)
 *   • 100%          (gold)
 *
 * Props:
 *   data  — { mainStory: number|null, mainExtra: number|null, completionist: number|null }
 *           Times are in hours (from api_hltb.js).
 */

import React, { useRef, useEffect } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";

const BARS = [
  { key: "mainStory", label: "Main Story", color: "#22D3EE" },
  { key: "mainExtra", label: "Main + Extras", color: "#A78BFA" },
  { key: "completionist", label: "100%", color: "#FBBF24" },
];

const CompletionChart = ({ data }) => {
  const anims = useRef(BARS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Reset then stagger-spring each bar in
    anims.forEach((a) => a.setValue(0));
    Animated.stagger(
      130,
      anims.map((v) =>
        Animated.spring(v, {
          toValue: 1,
          tension: 55,
          friction: 9,
          useNativeDriver: false,
        }),
      ),
    ).start();
  }, [data]);

  const values = BARS.map((b) => data[b.key] ?? 0);
  const maxVal = Math.max(...values, 1);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>HOW LONG TO BEAT</Text>
      </View>

      {/* Bars */}
      {BARS.map((bar, i) => {
        const val = data[bar.key];
        if (!val) return null; // hide if no data for this category

        const targetPct = `${Math.round((val / maxVal) * 100)}%`;
        const barWidth = anims[i].interpolate({
          inputRange: [0, 1],
          outputRange: ["0%", targetPct],
        });

        return (
          <View key={bar.key} style={styles.row}>
            {/* Label */}
            <Text style={styles.label}>{bar.label}</Text>

            {/* Track + animated fill */}
            <View style={styles.track}>
              <Animated.View
                style={[
                  styles.fill,
                  { width: barWidth, backgroundColor: bar.color },
                ]}
              />
            </View>

            {/* Value */}
            <Text style={[styles.value, { color: bar.color }]}>{val}h</Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  title: {
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: "700",
    color: "#A78BFA", // matches games accent
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  label: {
    width: 100,
    fontSize: 12,
    color: "#bbb",
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  track: {
    flex: 1,
    height: 10,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 5,
    borderCurve: "continuous",
    overflow: "hidden",
    marginHorizontal: 10,
  },
  fill: {
    height: "100%",
    borderRadius: 5,
    borderCurve: "continuous",
  },
  value: {
    width: 40,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right",
    letterSpacing: 0.3,
  },
});

export default CompletionChart;
