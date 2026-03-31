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

const CyberpunkFrame2 = ({ color = "#0FA3B1", children, style }) => {
  return (
    <View style={[styles.container, style]}>
      <Svg style={StyleSheet.absoluteFill} viewBox="0 0 320 186" preserveAspectRatio="none">
        <Path d="M315.33 181.23H1.5V3.62988H315.33V181.23Z" fill={withOpacity(color, 0.1)} />
        <Path
          d="M15.4508 3.7798L1.80078 17.4298V158.58L24.9908 181.77H165.151L171.811 175.14H282.751L291.001 183.36H310.051L317.341 176.07V7.3798L311.761 1.7998H273.451L265.261 9.98978H207.451L200.311 2.8498H100.651L93.0008 10.5298H34.6508L27.8408 3.71978L15.4508 3.7798Z"
          stroke={color}
          strokeWidth={3.6}
          strokeMiterlimit={10}
          fill="none"
        />
        <Path d="M1.64961 167.579L16.1996 182.129H1.34961L1.64961 167.579Z" fill={color} />
        <Path d="M1.80078 106.05L6.72075 110.94V150.78L27.3008 171.36H44.8508L50.0408 176.52H64.6508L69.7207 181.59H25.0508L1.86077 158.4L1.80078 106.05Z" fill={color} />
        <Path d="M1.34961 10.6791L8.69961 3.3291H1.34961V10.6791Z" fill={color} />
        <Path d="M34.6504 3.47949L38.5504 7.37949H91.0504L94.8004 3.62949L34.6504 3.47949Z" fill={color} />
        <Path d="M207.15 1.67969L212.4 6.92969H262.05L267.09 1.91967L207.15 1.67969Z" fill={color} />
        <Path d="M169.35 181.379L173.4 177.329H178.05L173.94 181.469L169.35 181.379Z" fill={color} />
        <Path d="M176.85 181.379L180.9 177.329H185.55L181.44 181.469L176.85 181.379Z" fill={color} />
        <Path d="M184.35 181.379L188.4 177.329H193.05L188.94 181.469L184.35 181.379Z" fill={color} />
        <Path d="M191.85 181.379L195.9 177.329H200.55L196.44 181.469L191.85 181.379Z" fill={color} />
        <Path d="M199.35 181.379L203.4 177.329H208.05L203.94 181.469L199.35 181.379Z" fill={color} />
        <Path d="M206.85 181.379L210.9 177.329H215.55L211.44 181.469L206.85 181.379Z" fill={color} />
        <Path d="M214.35 181.379L218.4 177.329H223.05L218.94 181.469L214.35 181.379Z" fill={color} />
        <Path d="M221.85 181.379L225.9 177.329H230.55L226.44 181.469L221.85 181.379Z" fill={color} />
        <Path d="M229.35 181.379L233.4 177.329H238.05L233.94 181.469L229.35 181.379Z" fill={color} />
        <Path d="M236.85 181.379L240.9 177.329H245.55L241.44 181.469L236.85 181.379Z" fill={color} />
        <Path d="M244.35 181.379L248.4 177.329H253.05L248.94 181.469L244.35 181.379Z" fill={color} />
        <Path d="M251.85 181.379L255.9 177.329H260.55L256.44 181.469L251.85 181.379Z" fill={color} />
        <Path d="M259.35 181.379L263.4 177.329H268.05L263.94 181.469L259.35 181.379Z" fill={color} />
        <Path
          d="M290.76 1.79928L293.91 4.94928H306.45L313.53 12.0293V71.5793L315.39 73.4693V99.4793L317.16 101.249V7.07927L311.82 1.73926L290.76 1.79928Z"
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
    minHeight: 186,
    overflow: "hidden",
  },
  content: {
    paddingTop: 16,
    paddingBottom: 14,
    paddingHorizontal: 14,
  },
});

export default CyberpunkFrame2;
