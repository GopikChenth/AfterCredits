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

/**
 * CyberpunkFrame
 * Single-SVG composition based on assets/CyberpunkUI 1/cyberframe1.svg.
 * Keeps all vector placements in one coordinate system to match Figma layout.
 */
const CyberpunkFrame = ({ color = "#0FA3B1", children, style }) => {
  return (
    <View style={[styles.container, style]}>
      <Svg
        style={StyleSheet.absoluteFill}
        viewBox="0 0 317 184"
        preserveAspectRatio="none"
      >
        <Path
          d="M313.8 180.451H0V2.85059H313.8V180.451Z"
          fill={withOpacity(color, 0.1)}
        />
        <Path
          d="M3.15039 33.0002L34.2004 1.9502H171.75L193.59 23.7902H307.05L314.97 31.7102V171.3L304.41 181.86H59.5504L54.0004 176.28H8.85039L3.24037 170.64L3.15039 33.0002Z"
          stroke={color}
          strokeWidth={3.6}
          strokeMiterlimit={10}
          fill="none"
        />
        <Path
          d="M186.75 2.10059L199.8 15.1506H309.45L314.49 20.1906V2.10059H186.75Z"
          fill={withOpacity(color, 0.3)}
        />
        <Path
          d="M3.15039 176.101V183.301H55.0504L51.3004 179.551H6.15039L3.15039 176.101Z"
          fill={color}
        />
        <Path
          d="M184.441 14.6403H180.451L172.261 6.42037H161.851L159.721 4.26035H139.651L137.281 1.86035H172.051L184.441 14.6403Z"
          fill={color}
        />
        <Path d="M193.471 8.82031H198.751L205.021 15.0603H199.951L193.471 8.82031Z" fill={color} />
        <Path d="M203.07 8.82031H208.35L214.62 15.0603H209.55L203.07 8.82031Z" fill={color} />
        <Path d="M212.67 8.82031H217.95L224.22 15.0603H219.15L212.67 8.82031Z" fill={color} />
        <Path d="M222.271 8.82031H227.552L233.821 15.0603H228.752L222.271 8.82031Z" fill={color} />
        <Path d="M231.871 8.82031H237.151L243.421 15.0603H238.351L231.871 8.82031Z" fill={color} />
        <Path
          d="M27.7504 1.7998L3.15039 26.3998V1.7998H27.7504Z"
          stroke={color}
          strokeWidth={3.6}
          strokeMiterlimit={10}
          fill="none"
        />
        <Path
          d="M314.971 145.92L313.321 147.57V169.5L302.402 180.45H275.252L274.021 181.68H304.352L314.792 171.24L314.971 145.92Z"
          fill={color}
        />
        <Path d="M315.45 174.601L307.5 182.551H315.45V174.601Z" fill={color} />
      </Svg>

      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    minHeight: 100,
  },
  content: {
    paddingTop: 26,
    paddingBottom: 18,
    paddingHorizontal: 18,
  },
});

export default CyberpunkFrame;
