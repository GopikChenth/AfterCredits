import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

const CHART_STATUSES = [
  { key: 'watching', label: 'Watching', color: '#FBBF24' },
  { key: 'watched', label: 'Completed', color: '#4ADE80' },
  { key: 'dropped', label: 'Dropped', color: '#F87171' },
];

const DONUT_SIZE = 160;
const STROKE_WIDTH = 22;
const DONUT_RADIUS = (DONUT_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

const DonutChart = ({ counts }) => {
  const chartTotal = useMemo(() => {
    return CHART_STATUSES.reduce((sum, s) => sum + (counts[s.key] || 0), 0);
  }, [counts]);

  const segments = useMemo(() => {
    if (chartTotal === 0) return [];
    let accumulated = 0;
    return CHART_STATUSES.map((status) => {
      const count = counts[status.key] || 0;
      const percentage = count / chartTotal;
      const strokeDasharray = `${CIRCUMFERENCE * percentage} ${CIRCUMFERENCE * (1 - percentage)}`;
      const rotation = (accumulated / chartTotal) * 360 - 90;
      accumulated += count;
      return { ...status, count, percentage, strokeDasharray, rotation };
    }).filter(s => s.count > 0);
  }, [counts, chartTotal]);

  return (
    <View style={styles.chartContainer}>
      <Svg width={DONUT_SIZE} height={DONUT_SIZE}>
        <Circle
          cx={DONUT_SIZE / 2} cy={DONUT_SIZE / 2} r={DONUT_RADIUS}
          stroke="rgba(255,255,255,0.06)" strokeWidth={STROKE_WIDTH} fill="none"
        />
        <G>
          {segments.map((seg) => (
            <Circle
              key={seg.key}
              cx={DONUT_SIZE / 2} cy={DONUT_SIZE / 2} r={DONUT_RADIUS}
              stroke={seg.color} strokeWidth={STROKE_WIDTH} fill="none"
              strokeDasharray={seg.strokeDasharray} strokeDashoffset={0}
              strokeLinecap="round" rotation={seg.rotation}
              origin={`${DONUT_SIZE / 2}, ${DONUT_SIZE / 2}`}
            />
          ))}
        </G>
      </Svg>
      <View style={styles.chartCenter}>
        <Text style={styles.chartTotal}>{chartTotal}</Text>
        <Text style={styles.chartTotalLabel}>Total</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    width: DONUT_SIZE,
    height: DONUT_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartCenter: {
    position: 'absolute',
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
