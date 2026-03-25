import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import ShimmerBlock, { ShimmerProvider } from '../shared/ShimmerBlock';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_PADDING = 16;
const GRID_GAP = 10;
const NUM_COLUMNS = 4;
const COVER_WIDTH = (SCREEN_WIDTH - (GRID_PADDING * 2) - (GRID_GAP * (NUM_COLUMNS - 1))) / NUM_COLUMNS;
const COVER_HEIGHT = COVER_WIDTH * 1.5;

/**
 * Skeleton for Post Detail page - shows placeholder for post header and anime grid
 */
const SkeletonPostDetail = ({ gridCount = 12 }) => {
  const gridItems = Array.from({ length: gridCount });

  return (
    <View style={styles.container}>
      {/* Back button */}
      <ShimmerBlock style={styles.backButton} />

      <View style={styles.content}>
        {/* Header: Avatar + Username + Date */}
        <View style={styles.header}>
          <ShimmerBlock style={styles.avatar} />
          <ShimmerBlock style={{ flex: 1, height: 16 }} />
          <ShimmerBlock style={{ width: 70, height: 12 }} />
        </View>

        {/* Post Title */}
        <ShimmerBlock style={{ width: '95%', height: 22, marginBottom: 8 }} />
        <ShimmerBlock style={{ width: '70%', height: 22, marginBottom: 10 }} />

        {/* Description */}
        <ShimmerBlock style={{ width: '100%', height: 14, marginBottom: 4 }} />
        <ShimmerBlock style={{ width: '85%', height: 14, marginBottom: 18 }} />

        {/* Divider */}
        <View style={styles.divider} />

        {/* Anime Grid - 4 columns */}
        <View style={styles.grid}>
          {gridItems.map((_, index) => (
            <ShimmerBlock key={index} style={styles.gridImage} />
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  backButton: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderCurve: 'continuous',
    marginHorizontal: 16,
    marginVertical: 12,
  },
  content: {
    paddingHorizontal: GRID_PADDING,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderCurve: 'continuous',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: 18,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  gridImage: {
    width: COVER_WIDTH,
    height: COVER_HEIGHT,
    borderRadius: 6,
    borderCurve: 'continuous',
  },
});

const WrappedSkeletonPostDetail = () => (<ShimmerProvider><SkeletonPostDetail /></ShimmerProvider>);
export default WrappedSkeletonPostDetail;
