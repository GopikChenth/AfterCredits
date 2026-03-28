/**
 * DonutChart
 *
 * Animated SVG donut chart for media status counts.
 *
 * Animations:
 *   • Scale spring on mount (JS driver — wraps the SVG View)
 *   • Each segment strokes in via strokeDashoffset (JS driver — required for SVG props)
 *   • Center count ticks up from 0 → total
 */

import React, { useMemo, useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

const CHART_STATUSES = [
  { key: 'watching',  label: 'Watching',   color: '#FBBF24' },
  { key: 'watched',   label: 'Completed',  color: '#4ADE80' },
  { key: 'dropped',   label: 'Dropped',    color: '#F87171' },
];

const DONUT_SIZE    = 160;
const STROKE_WIDTH  = 22;
const DONUT_RADIUS  = (DONUT_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

// AnimatedCircle — JS driver only (SVG props not supported by native driver)
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ── Count-up ─────────────────────────────────────────────────────────────────
const CountUp = ({ target }) => {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    setDisplay(0);
    if (target === 0) return;
    const duration = 500;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(eased * target));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target]);

  return (
    <View style={styles.chartCenter}>
      <Text style={styles.chartTotal}>{display}</Text>
      <Text style={styles.chartTotalLabel}>Total</Text>
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

  // Per-segment draw-in anims (JS driver — SVG props require this)
  const drawAnims = useRef(CHART_STATUSES.map(() => new Animated.Value(0))).current;
  // Scale anim for the wrapper view (native driver OK here)
  const scaleAnim = useRef(new Animated.Value(0.75)).current;

  useEffect(() => {
    drawAnims.forEach(a => a.setValue(0));
    scaleAnim.setValue(0.85);

    // Scale spring (native driver on View transform)
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 120,
      friction: 10,
      useNativeDriver: true,
    }).start();

    // Draw all segments simultaneously (no stagger) — feels instant
    Animated.parallel(
      drawAnims.map(v =>
        Animated.timing(v, {
          toValue: 1,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false, // MUST be false for SVG props
        })
      )
    ).start();
  }, [counts]);

  return (
    <Animated.View
      style={[styles.chartContainer, { transform: [{ scale: scaleAnim }] }]}
    >
      <Svg width={DONUT_SIZE} height={DONUT_SIZE}>
        {/* Background track */}
        <Circle
          cx={DONUT_SIZE / 2} cy={DONUT_SIZE / 2} r={DONUT_RADIUS}
          stroke="rgba(255,255,255,0.06)" strokeWidth={STROKE_WIDTH} fill="none"
        />
        <G>
          {segments.map((seg, i) => {
            const dashArray = `${seg.arcLen} ${CIRCUMFERENCE - seg.arcLen}`;
            const dashOffset = drawAnims[i].interpolate({
              inputRange: [0, 1],
              outputRange: [seg.arcLen, 0],
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

      {/* Center count — absolutely positioned over the hole */}
      <View style={styles.centerWrap}>
        <CountUp target={chartTotal} />
      </View>
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
