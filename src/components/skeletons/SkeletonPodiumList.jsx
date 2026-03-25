import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import ShimmerBlock, { ShimmerProvider } from '../shared/ShimmerBlock';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 56) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.5;

/**
 * Single skeleton card matching PodiumListPage card layout
 */
const SkeletonCard = () => (
  <View style={styles.animeCard}>
    <ShimmerBlock style={{ width: '100%', height: '100%', borderRadius: 16 }} />
    {/* Status dot */}
    <ShimmerBlock style={styles.statusDot} />
    {/* Title overlay at bottom */}
    <View style={styles.titleOverlay}>
      <ShimmerBlock style={{ width: '80%', height: 12 }} />
      <ShimmerBlock style={{ width: '50%', height: 10, marginTop: 4 }} />
    </View>
  </View>
);

/**
 * Full skeleton for PodiumListPage — header badge + 2-column grid
 */
const SkeletonPodiumList = ({ count = 6 }) => {
  const cards = Array.from({ length: count });

  return (
    <View style={styles.container}>
      {/* Header row: back button + status badge + count */}
      <View style={styles.listHeader}>
        <ShimmerBlock style={{ width: 36, height: 36, borderRadius: 18 }} />
        <ShimmerBlock style={{ width: 100, height: 32, borderRadius: 20 }} />
        <ShimmerBlock style={{ width: 60, height: 14, marginLeft: 'auto' }} />
      </View>

      {/* Card grid */}
      <View style={styles.grid}>
        {cards.map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  animeCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    borderCurve: 'continuous',
    backgroundColor: '#1A1A2E',
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    position: 'relative',
  },
  statusDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderCurve: 'continuous',
  },
  titleOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingBottom: 10,
    paddingTop: 20,
  },
});

const WrappedSkeletonPodiumList = () => (<ShimmerProvider><SkeletonPodiumList /></ShimmerProvider>);
export default WrappedSkeletonPodiumList;
