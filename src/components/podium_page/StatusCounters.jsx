import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DEFAULT_LABELS = {
  watching: 'Watching',
  watched: 'Completed',
  dropped: 'Dropped',
  wishlist: 'Wishlist',
};

const ALL_STATUS_KEYS = [
  { key: 'watching', icon: 'eye', color: '#FBBF24' },
  { key: 'watched', icon: 'checkmark-circle', color: '#4ADE80' },
  { key: 'dropped', icon: 'close-circle', color: '#F87171' },
  { key: 'wishlist', icon: 'bookmark', color: '#C084FC' },
];

const StatusCounters = ({ counts, onStatusPress, labels }) => {
  const resolvedLabels = { ...DEFAULT_LABELS, ...labels };
  return (
    <View style={styles.countersContainer}>
      {ALL_STATUS_KEYS.map((status) => {
        const count = counts[status.key] || 0;
        return (
          <Pressable
            key={status.key}
            style={({ pressed }) => [
              styles.counterRow,
              pressed && styles.counterRowPressed,
            ]}
            onPress={() => onStatusPress(status.key)}
          >
            <View style={[styles.counterDot, { backgroundColor: status.color }]} />
            <Text style={styles.counterLabel}>{resolvedLabels[status.key]}</Text>
            <Text style={[styles.counterValue, { color: status.color }]}>{count}</Text>
            <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.2)" />
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  countersContainer: {
    flex: 1,
    gap: 6,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderCurve: 'continuous',
    backgroundColor: 'rgba(255,255,255,0.04)',
    gap: 10,
  },
  counterRowPressed: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    transform: [{ scale: 0.97 }],
  },
  counterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderCurve: 'continuous',
  },
  counterLabel: {
    flex: 1,
    fontSize: 13,
    color: '#ccc',
    fontFamily: 'Agdasima',
    letterSpacing: 0.3,
  },
  counterValue: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'Agdasima',
    minWidth: 20,
    textAlign: 'right',
  },
});

export default StatusCounters;
