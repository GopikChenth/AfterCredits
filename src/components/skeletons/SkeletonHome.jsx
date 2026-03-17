import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import ShimmerBlock, { ShimmerProvider } from '../shared/ShimmerBlock';

const { width } = Dimensions.get('window');
const GRID_MARGIN = 10;
const MASONRY_HEIGHTS = [1.65, 1.1, 1.5, 1.25, 1.7, 1.15, 1.45, 1.35, 1.6, 1.2, 1.55, 1.3];

/**
 * Single skeleton card matching AnimeCardItem layout
 */
const SkeletonCard = ({ cardHeight }) => (
  <View style={styles.neumorphicCard}>
    <View style={styles.cardInner}>
      <ShimmerBlock style={{ width: '100%', height: cardHeight, borderRadius: 12 }} />
    </View>
    <ShimmerBlock style={{ width: '75%', height: 12, marginTop: 10, marginLeft: 4 }} />
    <ShimmerBlock style={{ width: '35%', height: 10, marginTop: 6, marginLeft: 4 }} />
  </View>
);

const MasonryCard = ({ height }) => (
  <View style={styles.masonryCard}>
    <View style={styles.cardInner}>
      <ShimmerBlock style={{ width: '100%', height, borderRadius: 12 }} />
    </View>
    <ShimmerBlock style={{ width: '75%', height: 12, marginTop: 10, marginLeft: 4 }} />
    <ShimmerBlock style={{ width: '35%', height: 10, marginTop: 6, marginLeft: 4 }} />
  </View>
);

/**
 * Full skeleton grid — renders placeholder cards in 2-column layout
 */
const SkeletonLoader = ({ cardHeight = 220, count = 6, variant = 'grid' }) => {
  const cards = Array.from({ length: count });
  const cardWidth = (width - GRID_MARGIN * 3) / 2;

  return (
    <ShimmerProvider>
    {variant === 'masonry' ? (
      <View style={styles.masonryRow}>
        <View style={styles.masonryCol}>
          {cards.filter((_, i) => i % 2 === 0).map((_, index) => (
            <MasonryCard
              key={`m-left-${index}`}
              height={cardWidth * MASONRY_HEIGHTS[index % MASONRY_HEIGHTS.length]}
            />
          ))}
        </View>
        <View style={styles.masonryCol}>
          {cards.filter((_, i) => i % 2 === 1).map((_, index) => (
            <MasonryCard
              key={`m-right-${index}`}
              height={cardWidth * MASONRY_HEIGHTS[(index + 5) % MASONRY_HEIGHTS.length]}
            />
          ))}
        </View>
      </View>
    ) : (
      <View style={styles.grid}>
        {cards.map((_, index) => (
          <View key={index} style={styles.gridItem}>
            <SkeletonCard cardHeight={cardHeight} />
          </View>
        ))}
      </View>
    )}
    </ShimmerProvider>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  gridItem: {
    flexBasis: '50%',
    padding: 6,
  },
  neumorphicCard: {
    width: '100%',
    borderRadius: 16,
    borderCurve: 'continuous',
    backgroundColor: '#151521',
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: -8, height: -8 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  cardInner: {
    borderRadius: 12,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  masonryRow: {
    flexDirection: 'row',
    paddingHorizontal: GRID_MARGIN / 2,
  },
  masonryCol: {
    flex: 1,
  },
  masonryCard: {
    width: '100%',
    margin: GRID_MARGIN / 2,
    borderRadius: 16,
    borderCurve: 'continuous',
    backgroundColor: '#151521',
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: -8, height: -8 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
});

export default SkeletonLoader;
