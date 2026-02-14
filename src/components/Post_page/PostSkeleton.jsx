import React from 'react';
import { View, StyleSheet } from 'react-native';
import ShimmerBlock from '../shared/ShimmerBlock';

/**
 * Single post card skeleton matching ListPost layout
 */
const PostCardSkeleton = () => (
  <View style={styles.card}>
    {/* Header: avatar + username + date */}
    <View style={styles.header}>
      <ShimmerBlock style={styles.avatar} />
      <ShimmerBlock style={{ flex: 1, height: 14 }} />
      <ShimmerBlock style={{ width: 60, height: 12, marginLeft: 10 }} />
    </View>

    {/* Title */}
    <ShimmerBlock style={{ width: '90%', height: 16, marginBottom: 6 }} />
    <ShimmerBlock style={{ width: '60%', height: 14, marginBottom: 12 }} />

    {/* Cover image strip */}
    <View style={styles.coverStrip}>
      {[1, 2, 3, 4].map((i) => (
        <ShimmerBlock key={i} style={styles.coverImage} />
      ))}
    </View>

    {/* Description */}
    <ShimmerBlock style={{ width: '100%', height: 10, marginTop: 12 }} />
    <ShimmerBlock style={{ width: '75%', height: 10, marginTop: 4 }} />
  </View>
);

/**
 * Post page skeleton — renders placeholder post cards
 */
const PostSkeleton = ({ count = 3 }) => (
  <View>
    {Array.from({ length: count }).map((_, index) => (
      <PostCardSkeleton key={index} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    marginHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: 10,
  },
  coverStrip: {
    flexDirection: 'row',
    gap: 8,
  },
  coverImage: {
    width: 80,
    height: 120,
    borderRadius: 6,
  },
});

export default PostSkeleton;
