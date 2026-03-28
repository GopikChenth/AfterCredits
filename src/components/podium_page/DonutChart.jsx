/**
 * DonutChart
 *
 * Animated SVG donut chart for media status counts.
 *
 * Animations:
 *   • Each segment's stroke draws in from 0 (staggered by 120ms)
 *   • Center count ticks up from 0 → total (ease-out)
 *   • Subtle continuous rotation (very slow, 0.25rpm feel)
 *   • Hover/mount scale-in on the whole SVG
 */

import React, { useMemo, useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

const CHART_STATUSES = [
  { key: 'watching',  label: 'Watching',   color: '#FBBF24' },
  { key: 'watched',   label: 'Completed',  color: '#4ADE80' },
  { key: 'dropped',   label: 'Dropped',    color: '#F87171' },
];

const DONUT_SIZE   = 160;
const STROKE_WIDTH = 22;
const DONUT_RADIUS = (DONUT_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

// ── Animated SVG Circle wrapper ─────────────────────────────────────────────
// We animate strokeDashoffset from CIRCUMFERENCE (hidden) → 0 (fully drawn)
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ── Count-up text ────────────────────────────────────────────────────────────
const CountUp = ({ target, style, labelStyle }) => {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    setDisplay(0);
    if (target === 0) return;
    const duration = 1000;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setDisplay(Math.round(eased * target));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target]);

  return (
    <View style={styles.chartCenter}>
      <Text style={[styles.chartTotal, style]}>{display}</Text>
      <Text style={[styles.chartTotalLabel, labelStyle]}>Total</Text>
    </View>
  );
};

// ── Main chart ────────────────────────────────────────────────────────────────
const DonutChart = ({ counts }) => {
  const chartTotal = useMemo(
    () => CHART_STATUSES.reduce((sum, s) => sum + (counts[s.key] || 0), 0),
    [counts]
  );

  const segments = useMemo(() => {
    if (chartTotal === 0) return [];
    let accumulated = 0;
    return CHART_STATUSES.map((status) => {
      const count = counts[status.key] || 0;
      const percentage = count / chartTotal;
      const arcLen = CIRCUMFERENCE * percentage;
      const rotation = (accumulated / chartTotal) * 360 - 90;
      accumulated += count;
      return { ...status, count, percentage, arcLen, rotation };
    }).filter(s => s.count > 0);
  }, [counts, chartTotal]);

  // One Animated.Value per segment for draw-in
  const drawAnims = useRef(CHART_STATUSES.map(() => new Animated.Value(0))).current;
  // Scale-in for the whole SVG
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  // Slow continuous rotation
  const rotAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    drawAnims.forEach(a => a.setValue(0));
    scaleAnim.setValue(0.7);

    Animated.parallel([
      // Scale in
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 11,
        useNativeDriver: true,
      }),
      // Draw segments in stagger
      Animated.stagger(
        120,
        drawAnims.map(v =>
          Animated.timing(v, {
            toValue: 1,
            duration: 900,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          })
        )
      ),
      // Slow idle rotation (one full turn every 30s)
      Animated.loop(
        Animated.timing(rotAnim, {
          toValue: 1,
          duration: 30000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ),
    ]).start();
  }, [counts]);

  const svgRotate = rotAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.chartContainer,
        { transform: [{ scale: scaleAnim }, { rotate: svgRotate }] },
      ]}
    >
      <Svg width={DONUT_SIZE} height={DONUT_SIZE}>
        {/* Background track */}
        <Circle
          cx={DONUT_SIZE / 2} cy={DONUT_SIZE / 2} r={DONUT_RADIUS}
          stroke="rgba(255,255,255,0.06)" strokeWidth={STROKE_WIDTH} fill="none"
        />
        <G>
          {segments.map((seg, i) => {
            // strokeDashoffset: CIRCUMFERENCE = hidden, 0 = fully drawn
            // full arc length = seg.arcLen; gap = rest
            const dashArray = `${seg.arcLen} ${CIRCUMFERENCE - seg.arcLen}`;

            const dashOffset = drawAnims[i].interpolate({
              inputRange: [0, 1],
              outputRange: [seg.arcLen, 0], // draws in from 0 → full
              extrapolate: 'clamp',
            });

            return (
              <AnimatedCircle
                key={seg.key}
                cx={DONUT_SIZE / 2}
                cy={DONUT_SIZE / 2}
                r={DONUT_RADIUS}
                stroke={seg.color}
                strokeWidth={STROKE_WIDTH}
                fill="none"
                strokeDasharray={dashArray}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                rotation={seg.rotation}
                origin={`${DONUT_SIZE / 2}, ${DONUT_SIZE / 2}`}
              />
            );
          })}
        </G>
      </Svg>

      {/* Counter in the hole — rendered outside the SVG to avoid rotation */}
      <Animated.View
        style={[
          styles.centerWrap,
          // Counter-rotate so the number stays upright while ring spins
          { transform: [{ rotate: svgRotate.interpolate({
              inputRange: ['0deg', '360deg'],
              outputRange: ['0deg', '-360deg'],
            }) }] },
        ]}
      >
        <CountUp target={chartTotal} />
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    width: DONUT_SIZE,
    height: DONUT_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: DONUT_SIZE,
    height: DONUT_SIZE,
  },
  chartCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartTotal: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    fontFamily: 'Agdasima',
    fontVariant: ['tabular-nums'],
  },
  chartTotalLabel: {
    fontSize: 12,
    color: '#888',
    fontFamily: 'Agdasima',
    letterSpacing: 0.5,
    marginTop: -4,
  },
});

export default DonutChart;
