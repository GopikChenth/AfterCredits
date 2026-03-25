import React from 'react';
import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
import ShimmerBlock, { ShimmerProvider } from '../shared/ShimmerBlock';

const { width } = Dimensions.get('window');

/**
 * Details page skeleton — mirrors the actual details page layout:
 * Hero banner → Description box → Stats pills → Genre/Crew section → Reviews
 */
const DetailsSkeleton = () => (
  <ShimmerProvider>
  <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
    {/* Hero banner */}
    <ShimmerBlock style={styles.heroBanner} />

    {/* Description section */}
    <View style={styles.descriptionBox}>
      {/* Title row */}
      <View style={styles.titleRow}>
        <ShimmerBlock style={{ width: '60%', height: 18 }} />
        <ShimmerBlock style={{ width: 40, height: 16 }} />
      </View>
      {/* Subtitle */}
      <ShimmerBlock style={{ width: '45%', height: 14, marginTop: 10 }} />
      {/* Studio */}
      <ShimmerBlock style={{ width: '30%', height: 14, marginTop: 8 }} />
      {/* Description lines */}
      <ShimmerBlock style={{ width: '100%', height: 12, marginTop: 14 }} />
      <ShimmerBlock style={{ width: '100%', height: 12, marginTop: 6 }} />
      <ShimmerBlock style={{ width: '90%', height: 12, marginTop: 6 }} />
      <ShimmerBlock style={{ width: '70%', height: 12, marginTop: 6 }} />
      {/* Episode + Status */}
      <ShimmerBlock style={{ width: '50%', height: 14, marginTop: 16 }} />
      <ShimmerBlock style={{ width: '40%', height: 14, marginTop: 6 }} />
    </View>

    {/* Stats pills */}
    <View style={styles.statsRow}>
      <ShimmerBlock style={styles.statPill} />
      <ShimmerBlock style={styles.statPill} />
      <ShimmerBlock style={styles.statPill} />
    </View>

    {/* Status section */}
    <View style={styles.statusSection}>
      <ShimmerBlock style={{ width: 80, height: 12 }} />
      <View style={styles.statusTags}>
        <ShimmerBlock style={styles.statusTag} />
        <ShimmerBlock style={styles.statusTag} />
        <ShimmerBlock style={styles.statusTag} />
        <ShimmerBlock style={styles.statusTag} />
      </View>
    </View>

    {/* Genre + Crew section */}
    <View style={styles.genreCrewBox}>
      <ShimmerBlock style={{ width: 60, height: 14 }} />
      <View style={styles.genreRow}>
        <ShimmerBlock style={styles.genrePill} />
        <ShimmerBlock style={styles.genrePill} />
        <ShimmerBlock style={styles.genrePill} />
      </View>

      <ShimmerBlock style={{ width: 100, height: 14, marginTop: 20 }} />
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={styles.crewItem}>
          <ShimmerBlock style={styles.crewAvatar} />
          <View style={{ flex: 1 }}>
            <ShimmerBlock style={{ width: '60%', height: 12 }} />
            <ShimmerBlock style={{ width: '40%', height: 10, marginTop: 4 }} />
          </View>
          <ShimmerBlock style={styles.crewAvatar} />
        </View>
      ))}
    </View>

    {/* Reviews section */}
    <View style={styles.reviewsBox}>
      <ShimmerBlock style={{ width: 70, height: 14 }} />
      {[1, 2].map((i) => (
        <View key={i} style={styles.reviewCard}>
          <View style={styles.reviewHeader}>
            <ShimmerBlock style={{ width: 34, height: 34, borderRadius: 17 }} />
            <ShimmerBlock style={{ width: '40%', height: 12, marginLeft: 12 }} />
          </View>
          <ShimmerBlock style={{ width: '100%', height: 10, marginTop: 10 }} />
          <ShimmerBlock style={{ width: '80%', height: 10, marginTop: 4 }} />
        </View>
      ))}
    </View>

    <View style={{ height: 40 }} />
  </ScrollView>
  </ShimmerProvider>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  heroBanner: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 0,
    borderCurve: 'continuous',
    marginBottom: -60,
  },
  descriptionBox: {
    marginHorizontal: 20,
    backgroundColor: 'rgba(30,30,30,0.6)',
    borderRadius: 12,
    borderCurve: 'continuous',
    padding: 20,
    marginBottom: 20,
    zIndex: 5,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 24,
    gap: 10,
  },
  statPill: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    borderCurve: 'continuous',
  },
  statusSection: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  statusTags: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  statusTag: {
    width: 70,
    height: 32,
    borderRadius: 16,
    borderCurve: 'continuous',
  },
  genreCrewBox: {
    marginHorizontal: 20,
    backgroundColor: 'rgba(30,30,30,0.6)',
    borderRadius: 12,
    borderCurve: 'continuous',
    padding: 20,
    marginBottom: 24,
  },
  genreRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  genrePill: {
    width: 70,
    height: 28,
    borderRadius: 14,
    borderCurve: 'continuous',
  },
  crewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  crewAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderCurve: 'continuous',
    marginRight: 10,
  },
  reviewsBox: {
    marginHorizontal: 20,
    backgroundColor: 'rgba(30,30,30,0.6)',
    borderRadius: 12,
    borderCurve: 'continuous',
    padding: 20,
    marginBottom: 24,
  },
  reviewCard: {
    marginTop: 14,
    backgroundColor: 'rgba(40,40,40,0.5)',
    borderRadius: 10,
    borderCurve: 'continuous',
    padding: 14,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default DetailsSkeleton;
