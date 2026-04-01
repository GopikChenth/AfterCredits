import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";

const withOpacity = (hex, alpha) => {
  const match = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/.exec(hex);
  if (!match) return hex;
  const raw = match[1];
  const full = raw.length === 3
    ? raw.split("").map((c) => c + c).join("")
    : raw;
  const int = Number.parseInt(full, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r},${g},${b},${alpha})`;
};

const CyberpunkFrame3 = ({ color = "#0FA3B1", children, style }) => {
  return (
    <View style={[styles.container, style]}>
      <Svg style={StyleSheet.absoluteFill} viewBox="0 0 289 144" preserveAspectRatio="none">
        <Path d="M288.48 139.891H10.6504V14.8506H288.48V139.891Z" fill={withOpacity(color, 0.1)} />
        <Path
          d="M11.1008 1.80078L1.80078 11.1008V126.601L9.15078 133.951H167.701L175.141 141.391H274.501L285.961 129.961V22.5008L277.831 14.4008H113.701L101.281 1.95078L11.1008 1.80078Z"
          stroke={color}
          strokeWidth={3.6}
          strokeMiterlimit={10}
          fill="none"
        />
        <Path d="M112.801 1.80078L120.151 9.15078H276.901L283.741 2.34076L112.801 1.80078Z" fill={withOpacity(color, 0.3)} />
        <Path d="M285.901 18.9012V5.70117L279.301 12.3012L285.901 18.9012Z" fill={color} />
        <Path d="M1.80078 134.101V141.301H8.70078L1.80078 134.101Z" fill={color} />
        <Path d="M165 137.101L168.9 141.001H165L161.4 137.101H165Z" fill={color} />
        <Path d="M159.301 137.101L163.201 141.001H159.301L155.701 137.101H159.301Z" fill={color} />
        <Path d="M153.6 137.101L157.5 141.001H153.6L150 137.101H153.6Z" fill={color} />
        <Path d="M147.901 137.101L151.801 141.001H147.901L144.301 137.101H147.901Z" fill={color} />
        <Path d="M142.2 137.101L146.1 141.001H142.2L138.6 137.101H142.2Z" fill={color} />
        <Path d="M136.5 137.101L140.4 141.001H136.5L132.9 137.101H136.5Z" fill={color} />
        <Path d="M130.801 137.101L134.701 141.001H130.801L127.201 137.101H130.801Z" fill={color} />
        <Path d="M125.1 137.101L129 141.001H125.1L121.5 137.101H125.1Z" fill={color} />
        <Path d="M119.4 137.101L123.3 141.001H14.1L10.5 137.101H119.4Z" fill={color} />
        <Path d="M21.6605 1.83105L17.4605 6.06105H12.9006L5.58052 13.3811V63.6011L1.56055 67.6211V11.1011L10.6805 1.98105L21.6605 1.83105Z" fill={color} />
      </Svg>
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    minHeight: 144,
    overflow: "hidden",
  },
  content: {
    paddingTop: 16,
    paddingBottom: 14,
    paddingHorizontal: 14,
  },
});

export default CyberpunkFrame3;
