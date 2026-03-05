import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
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

    {/* Sync Section */}
    <ShimmerBlock style={{ width: 40, height: 16, marginLeft: 16, marginTop: 8 }} />
    <View style={styles.menuCard}>
      <MenuItemSkeleton />
    </View>

    {/* Backlog Section */}
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
    backgroundColor: '#0D0D0D',
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  menuCard: {
    backgroundColor: '#252525',
    borderRadius: 16,
    borderCurve: 'continuous',
    marginBottom: 20,
    marginTop: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#333',
    marginLeft: 70,
  },
});

const WrappedSkeletonProfile = () => (<ShimmerProvider><SkeletonProfile /></ShimmerProvider>);
export default WrappedSkeletonProfile;
