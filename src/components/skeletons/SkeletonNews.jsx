import React from 'react';
import { View, StyleSheet } from 'react-native';
import ShimmerBlock from '../shared/ShimmerBlock';

/**
 * Single skeleton card matching NewsCard layout
 */
const SkeletonNewsCard = () => (
  <View style={styles.card}>
    {/* Image placeholder */}
    <ShimmerBlock style={{ width: '100%', height: 180, borderRadius: 0 }} />

    {/* Content area */}
    <View style={styles.content}>
      {/* Category badge + time ago */}
      <View style={styles.headerRow}>
        <ShimmerBlock style={{ width: 70, height: 22, borderRadius: 6 }} />
        <ShimmerBlock style={{ width: 50, height: 10 }} />
      </View>

      {/* Title lines */}
      <ShimmerBlock style={{ width: '95%', height: 16, marginTop: 8 }} />
      <ShimmerBlock style={{ width: '70%', height: 16, marginTop: 6 }} />

      {/* Footer: author */}
      <View style={styles.footer}>
        <ShimmerBlock style={{ width: 14, height: 14, borderRadius: 7 }} />
        <ShimmerBlock style={{ width: 80, height: 10 }} />
        <ShimmerBlock style={{ width: 12, height: 12, marginLeft: 'auto' }} />
      </View>
    </View>
  </View>
);

/**
 * Full skeleton for News page — renders placeholder news cards
 */
const SkeletonNews = ({ count = 4 }) => {
  const cards = Array.from({ length: count });

  return (
    <View style={styles.container}>
      {cards.map((_, index) => (
        <SkeletonNewsCard key={index} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  content: {
    padding: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
});

export default SkeletonNews;
