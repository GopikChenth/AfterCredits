import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import ShimmerBlock from '../shared/ShimmerBlock';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 2 columns with padding
const CARD_HEIGHT = CARD_WIDTH * 1.5;

/**
 * Single skeleton card matching UpcomingPage card layout
 */
const SkeletonCard = () => (
  <View style={styles.card}>
    <View style={styles.cardInner}>
      <ShimmerBlock style={{ width: '100%', height: CARD_HEIGHT, borderRadius: 12 }} />
    </View>
    {/* Title placeholder */}
    <ShimmerBlock style={{ width: '80%', height: 14, marginTop: 12, marginLeft: 8 }} />
    {/* Date placeholder */}
    <ShimmerBlock style={{ width: '50%', height: 10, marginTop: 6, marginLeft: 8 }} />
  </View>
);

/**
 * Full skeleton grid for upcoming page — renders placeholder cards in 2-column layout
 */
const SkeletonUpcoming = ({ count = 6 }) => {
  const cards = Array.from({ length: count });

  return (
    <View style={styles.grid}>
      {cards.map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    paddingTop: 16,
  },
  card: {
    width: CARD_WIDTH,
    margin: 8,
    borderRadius: 16,
    backgroundColor: '#1A1A1A',
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  cardInner: {
    borderRadius: 12,
    overflow: 'hidden',
  },
});

export default SkeletonUpcoming;
