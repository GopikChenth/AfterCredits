import React from 'react';
import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
import ShimmerBlock, { ShimmerProvider } from '../shared/ShimmerBlock';

const { width } = Dimensions.get('window');

/**
 * Podium page skeleton — mirrors the actual podium page layout:
 * Header → Donut chart + Status counters → Top Genres → Top Studios
 */
const SkeletonPodium = () => (
  <View style={styles.container}>
    {/* Header */}
    <View style={styles.header}>
      <View>
        <ShimmerBlock style={{ width: 120, height: 28 }} />
        <ShimmerBlock style={{ width: 100, height: 12, marginTop: 6 }} />
      </View>
      <ShimmerBlock style={{ width: 48, height: 48, borderRadius: 24 }} />
    </View>

    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Section Title: Status Distribution */}
      <View style={styles.mainSection}>
        <ShimmerBlock style={{ width: 140, height: 16 }} />

        {/* Donut (left) + Counters (right) */}
        <View style={styles.chartRow}>
          {/* Donut placeholder */}
          <ShimmerBlock style={{ width: 130, height: 130, borderRadius: 65 }} />

          {/* Status counter pills */}
          <View style={styles.countersColumn}>
            {[1, 2, 3, 4].map((i) => (
              <View key={i} style={styles.counterRow}>
                <ShimmerBlock style={{ width: 10, height: 10, borderRadius: 5 }} />
                <ShimmerBlock style={{ width: 70, height: 12 }} />
                <ShimmerBlock style={{ width: 24, height: 14, marginLeft: 'auto' }} />
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Section: Top Genres */}
      <View style={styles.statsSection}>
        <ShimmerBlock style={{ width: 100, height: 16 }} />
        {[1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={styles.barRow}>
            <ShimmerBlock style={{ width: 80, height: 12 }} />
            <ShimmerBlock style={{ flex: 1, height: 20, borderRadius: 10, marginLeft: 12 }} />
            <ShimmerBlock style={{ width: 20, height: 12, marginLeft: 8 }} />
          </View>
        ))}
      </View>

      {/* Section: Top Studios */}
      <View style={styles.statsSection}>
        <ShimmerBlock style={{ width: 100, height: 16 }} />
        {[1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={styles.barRow}>
            <ShimmerBlock style={{ width: 80, height: 12 }} />
            <ShimmerBlock style={{ flex: 1, height: 20, borderRadius: 10, marginLeft: 12 }} />
            <ShimmerBlock style={{ width: 20, height: 12, marginLeft: 8 }} />
          </View>
        ))}
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  mainSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 16,
  },
  countersColumn: {
    flex: 1,
    gap: 12,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statsSection: {
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
});

const WrappedSkeletonPodium = () => (<ShimmerProvider><SkeletonPodium /></ShimmerProvider>);
export default WrappedSkeletonPodium;
