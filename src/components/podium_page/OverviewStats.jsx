/**
 * OverviewStats
 *
 * A row of stat tiles — icon · value · label — matching the
 * "Overview" card style seen on the Statistics / Podium page.
 *
 * Props:
 *   stats  — Array of { icon: string (Ionicons), value: string|number, label: string, color?: string }
 *   title  — Optional heading string (default "Overview")
 *   accentColor — Border/icon tint (default '#0FA3B1')
 */

import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DEFAULT_ACCENT = '#0FA3B1';

// ── Animated number that counts up on mount ───────────────────────────────────
const CountUp = ({ rawValue, style }) => {
  const isNumber = typeof rawValue === 'number' && !isNaN(rawValue);
  const [display, setDisplay] = useState(isNumber ? 0 : rawValue);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!isNumber) { setDisplay(rawValue); return; }
    setDisplay(0);
    const duration = 600;
    const start = Date.now();
    const tick = () => {
      const t = Math.min((Date.now() - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(eased * rawValue));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [rawValue, isNumber]);

  return <Text style={style}>{display}</Text>;
};

// ── Single stat tile ──────────────────────────────────────────────────────────
const StatTile = ({ icon, value, label, color, delay, accentColor }) => {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1, duration: 280, easing: Easing.out(Easing.quad), useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0, duration: 280, easing: Easing.out(Easing.quad), useNativeDriver: true,
        }),
      ]).start();
    }, delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  const tileColor  = color || accentColor;
  const isNumeric  = typeof value === 'number' && !isNaN(value);

  return (
    <Animated.View
      style={[
        styles.tile,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={[styles.iconWrap, { borderColor: `${tileColor}30` }]}>
        <Ionicons name={icon} size={18} color={tileColor} />
      </View>

      {isNumeric ? (
        <CountUp rawValue={value} style={[styles.tileValue, { color: tileColor }]} />
      ) : (
        <Text style={[styles.tileValue, { color: tileColor }]} numberOfLines={1} adjustsFontSizeToFit>
          {value ?? 'N/A'}
        </Text>
      )}

      <Text style={styles.tileLabel} numberOfLines={1}>{label}</Text>
    </Animated.View>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const OverviewStats = ({
  stats = [],
  title = 'Overview',
  accentColor = DEFAULT_ACCENT,
}) => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.headerIcon, { borderColor: `${accentColor}35` }]}>
          <Ionicons name="grid-outline" size={14} color={accentColor} />
        </View>
        <Text style={[styles.headerText, { color: accentColor }]}>{title}</Text>
      </View>

      {/* Tiles row */}
      <View style={styles.row}>
        {stats.map((stat, i) => (
          <StatTile
            key={`${stat.label}-${i}`}
            icon={stat.icon}
            value={stat.value}
            label={stat.label}
            color={stat.color}
            delay={i * 60}
            accentColor={accentColor}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  headerIcon: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  headerText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },

  // ── Tiles ──
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  tile: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 12,
    paddingHorizontal: 4,
    gap: 6,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  tileValue: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tileLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#777',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
});

export default OverviewStats;
