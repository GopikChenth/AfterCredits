import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ShimmerBlock, { ShimmerProvider } from '../shared/ShimmerBlock';

/**
 * Profile/Settings page skeleton — mirrors the actual profile page layout:
 * Header → Avatar section → Settings menu cards
 */

const MenuItemSkeleton = () => (
  <View style={styles.menuItem}>
    <ShimmerBlock style={{ width: 40, height: 40, borderRadius: 12 }} />
    <View style={{ flex: 1, marginLeft: 14 }}>
      <ShimmerBlock style={{ width: '60%', height: 14 }} />
      <ShimmerBlock style={{ width: '40%', height: 10, marginTop: 4 }} />
    </View>
    <ShimmerBlock style={{ width: 18, height: 18, borderRadius: 4 }} />
  </View>
);

const MenuDivider = () => <View style={styles.menuDivider} />;

const SkeletonProfile = () => (
  <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
    <LinearGradient
      colors={['#0B0B10', '#141421', '#0B0B10']}
      style={StyleSheet.absoluteFill}
    />
    <View style={styles.bgGlowOne} />
    <View style={styles.bgGlowTwo} />

    {/* Header */}
    <View style={styles.header}>
      <ShimmerBlock style={{ width: 24, height: 24, borderRadius: 4 }} />
      <ShimmerBlock style={{ width: 80, height: 24 }} />
      <View style={{ width: 24 }} />
    </View>

    {/* Avatar Section */}
    <View style={styles.avatarSection}>
      <ShimmerBlock style={{ width: 100, height: 100, borderRadius: 50 }} />
      <ShimmerBlock style={{ width: 140, height: 20, marginTop: 20 }} />
      <ShimmerBlock style={{ width: 100, height: 12, marginTop: 6 }} />
    </View>

    {/* Privacy Section */}
    <ShimmerBlock style={{ width: 60, height: 16, marginLeft: 16, marginTop: 8 }} />
    <View style={styles.menuCard}>
      <MenuItemSkeleton />
    </View>

    {/* App Section */}
    <ShimmerBlock style={{ width: 30, height: 16, marginLeft: 16, marginTop: 8 }} />
    <View style={styles.menuCard}>
      <MenuItemSkeleton />
      <MenuDivider />
      <MenuItemSkeleton />
    </View>

    <View style={{ height: 100 }} />
  </ScrollView>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B10',
    paddingHorizontal: 16,
  },
  bgGlowOne: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#A78BFA',
    opacity: 0.14,
  },
  bgGlowTwo: {
    position: 'absolute',
    bottom: -140,
    left: -60,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#4ADE80',
    opacity: 0.08,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  menuCard: {
    backgroundColor: '#151521',
    borderRadius: 18,
    borderCurve: 'continuous',
    marginBottom: 20,
    marginTop: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.18)',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginLeft: 70,
  },
});

const WrappedSkeletonProfile = () => (<ShimmerProvider><SkeletonProfile /></ShimmerProvider>);
export default WrappedSkeletonProfile;
