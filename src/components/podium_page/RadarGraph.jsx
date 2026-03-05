import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, Polygon, Line, Text as SvgText } from 'react-native-svg';

const { width } = Dimensions.get('window');

const DEMOGRAPHICS = [
  { key: 'shounen', label: 'Shonen', color: '#FF6B35' },
  { key: 'shoujo', label: 'Shojo', color: '#FF69B4' },
  { key: 'seinen', label: 'Seinen', color: '#7C3AED' },
  { key: 'josei', label: 'Josei', color: '#EC4899' },
  { key: 'kodomomuke', label: 'Kids', color: '#34D399' },
];

const RADAR_SIZE = width - 40;
const RADAR_CENTER = RADAR_SIZE / 2;
const RADAR_RADIUS = RADAR_SIZE * 0.34;
const RADAR_LEVELS = 4;
const NUM_AXES = DEMOGRAPHICS.length;

const getRadarPoint = (axisIndex, value) => {
  const angle = (Math.PI * 2 * axisIndex) / NUM_AXES - Math.PI / 2;
  return {
    x: RADAR_CENTER + Math.cos(angle) * RADAR_RADIUS * value,
    y: RADAR_CENTER + Math.sin(angle) * RADAR_RADIUS * value,
  };
};

const RadarGraph = ({ demographics }) => {
  const maxVal = useMemo(() => Math.max(...Object.values(demographics), 1), [demographics]);

  const gridPolygons = useMemo(() => {
    return Array.from({ length: RADAR_LEVELS }, (_, level) => {
      const ratio = (level + 1) / RADAR_LEVELS;
      return DEMOGRAPHICS.map((_, i) => {
        const p = getRadarPoint(i, ratio);
        return `${p.x},${p.y}`;
      }).join(' ');
    });
  }, []);

  const dataPoints = useMemo(() => {
    return DEMOGRAPHICS.map((demo, i) => {
      const val = demographics[demo.key] || 0;
      const ratio = maxVal > 0 ? val / maxVal : 0;
      const p = getRadarPoint(i, Math.max(ratio, 0.05));
      return `${p.x},${p.y}`;
    }).join(' ');
  }, [demographics, maxVal]);

  const labelPositions = useMemo(() => {
    return DEMOGRAPHICS.map((demo, i) => {
      const p = getRadarPoint(i, 1.22);
      return { ...p, label: demo.label, count: demographics[demo.key] || 0, color: demo.color };
    });
  }, [demographics]);

  const hasData = Object.values(demographics).some(v => v > 0);

  return (
    <View style={styles.radarContainer}>
      <Svg width={RADAR_SIZE} height={RADAR_SIZE}>
        {/* Grid pentagons */}
        {gridPolygons.map((points, i) => (
          <Polygon key={`grid-${i}`} points={points}
            fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
        ))}

        {/* Axis lines */}
        {DEMOGRAPHICS.map((_, i) => {
          const p = getRadarPoint(i, 1);
          return (
            <Line key={`axis-${i}`}
              x1={RADAR_CENTER} y1={RADAR_CENTER} x2={p.x} y2={p.y}
              stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
          );
        })}

        {/* Data polygon */}
        {hasData && (
          <Polygon points={dataPoints}
            fill="rgba(99,102,241,0.25)" stroke="#6366F1" strokeWidth={2} />
        )}

        {/* Data dots */}
        {hasData && DEMOGRAPHICS.map((demo, i) => {
          const val = demographics[demo.key] || 0;
          if (val === 0) return null;
          const ratio = Math.max((maxVal > 0 ? val / maxVal : 0), 0.05);
          const p = getRadarPoint(i, ratio);
          return (
            <Circle key={`dot-${i}`}
              cx={p.x} cy={p.y} r={4}
              fill={demo.color} stroke="#0D0D0D" strokeWidth={2} />
          );
        })}

        {/* Labels */}
        {labelPositions.map((pos, i) => (
          <SvgText key={`label-${i}`}
            x={pos.x} y={pos.y}
            fill={pos.count > 0 ? pos.color : '#555'}
            fontSize={12} fontWeight="700" fontFamily="Agdasima"
            textAnchor="middle" alignmentBaseline="middle">
            {pos.label}
          </SvgText>
        ))}

      </Svg>

      {!hasData && (
        <View style={styles.radarEmptyOverlay}>
          <Text style={styles.radarEmptyText}>No watched anime yet</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  radarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 8,
  },
  radarEmptyOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarEmptyText: {
    fontSize: 14,
    color: '#555',
    fontFamily: 'Agdasima',
  },
});

export default RadarGraph;
