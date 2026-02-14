import React from 'react';
import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
import ShimmerBlock from '../shared/ShimmerBlock';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.32;
const CARD_HEIGHT = CARD_WIDTH * 1.3;

/**
 * Discover page skeleton — horizontal upcoming cards + news cards
 */

/** Horizontal skeleton card matching upcoming anime card */
const UpcomingCardSkeleton = () => (
  <View style={styles.upcomingCard}>
    <ShimmerBlock style={{ width: '100%', height: '100%', borderRadius: 14 }} />
  </View>
);

/** News card skeleton */
const NewsCardSkeleton = () => (
  <View style={styles.newsCard}>
    <ShimmerBlock style={styles.newsImage} />
    <View style={styles.newsContent}>
      <ShimmerBlock style={{ width: '90%', height: 14 }} />
      <ShimmerBlock style={{ width: '70%', height: 12, marginTop: 6 }} />
      <ShimmerBlock style={{ width: '40%', height: 10, marginTop: 8 }} />
    </View>
  </View>
);

/**
 * Full discover skeleton with horizontal upcoming cards and news cards
 */
const DiscoverSkeleton = () => (
  <View>
    {/* Upcoming section skeleton */}
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.horizontalScroll}
    >
      {[1, 2, 3, 4].map((i) => (
        <UpcomingCardSkeleton key={i} />
      ))}
    </ScrollView>

    {/* News section skeleton */}
    <View style={styles.newsSection}>
      {[1, 2, 3].map((i) => (
        <NewsCardSkeleton key={i} />
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  horizontalScroll: {
    paddingHorizontal: 20,
    gap: 14,
  },
  upcomingCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  newsSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  newsCard: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  newsImage: {
    width: 100,
    height: 80,
    borderRadius: 0,
  },
  newsContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
});

export default DiscoverSkeleton;
