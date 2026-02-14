import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import ShimmerBlock from '../shared/ShimmerBlock';

const { width } = Dimensions.get('window');

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

/**
 * Full skeleton grid — renders placeholder cards in 2-column layout
 */
const SkeletonLoader = ({ cardHeight = 220, count = 6 }) => {
  const cards = Array.from({ length: count });

  return (
    <View style={styles.grid}>
      {cards.map((_, index) => (
        <SkeletonCard key={index} cardHeight={cardHeight} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  neumorphicCard: {
    width: (width - 48) / 2,
    margin: 8,
    borderRadius: 16,
    backgroundColor: '#252525',
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: -8, height: -8 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  cardInner: {
    borderRadius: 12,
    overflow: 'hidden',
  },
});

export default SkeletonLoader;
