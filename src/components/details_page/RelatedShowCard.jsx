import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import MediaCard from '../homepage/Card';

/**
 * RelatedShowCard - Wrapper for MediaCard used in related shows section
 * Reuses the same card design from home page for consistency
 * Uses Pressable for better touch handling in horizontal scroll
 */
const RelatedShowCard = ({ title, image, onPress }) => {
  return (
    <Pressable 
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed
      ]}
    >
      <MediaCard
        theme="anime"
        title={title}
        imageUrl={image}
        width={150}
        height={200}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    marginRight: 12,
  },
  pressed: {
    opacity: 0.7,
  },
});

export default RelatedShowCard;