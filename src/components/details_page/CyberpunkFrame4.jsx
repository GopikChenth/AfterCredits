import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";

const withOpacity = (hex, alpha) => {
  const match = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/.exec(hex);
  if (!match) return hex;
  const raw = match[1];
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  const int = Number.parseInt(full, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r},${g},${b},${alpha})`;
};

/**
 * Single-SVG composition based on assets/CyberpunkUI/CyberFrame4.svg
 */
const CyberpunkFrame4 = ({ color = "#0FA3B1", children, style }) => {
  return (
    <View style={[styles.container, style]}>
      <Svg
        style={StyleSheet.absoluteFill}
        viewBox="0 0 282 131"
        preserveAspectRatio="none"
      >
        <Path
          d="M280.682 120.33H2.85156V3.95996H280.682V120.33Z"
          fill={withOpacity(color, 0.1)}
        />
        <Path
          d="M8.70078 128.28L1.80078 121.38V16.3798L13.9508 4.22976H100.801L105.691 9.11978H188.401L195.721 1.7998H263.101L279.271 17.9398V116.28L268.501 127.05H177.301L172.381 122.13H21.0008L14.9408 128.22L8.70078 128.28Z"
          stroke={color}
          strokeWidth={3.6}
          strokeMiterlimit={10}
          fill="none"
        />
        <Path
          d="M21.3008 129.779L25.3508 125.729H169.201L173.491 130.02L21.3008 129.779Z"
          fill={color}
        />
        <Path
          d="M107.102 4.07969L109.502 6.47969H186.902L189.452 3.92969L107.102 4.07969Z"
          fill={color}
        />
        <Path
          d="M271.502 1.67969L279.752 9.92969V1.67969H271.502Z"
          fill={color}
        />
        <Path
          d="M245.731 1.79993L273.571 29.6399V110.28L256.651 127.2H268.501L279.361 116.34V17.8799L262.831 1.37988H245.701"
          fill={withOpacity(color, 0.3)}
        />
        <Path
          d="M27.2711 4.58955L6.54114 25.3195V70.6795L2.37109 74.8495V16.3795L14.5511 4.22949L27.2711 4.58955Z"
          fill={withOpacity(color, 0.3)}
        />
      </Svg>
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    minHeight: 131,
    overflow: "hidden",
  },
  content: {
    paddingTop: 16,
    paddingBottom: 14,
    paddingHorizontal: 14,
  },
});

export default CyberpunkFrame4;
