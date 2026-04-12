import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { getMediaTheme } from '../../utils/mediaThemes';

/**
 * MediaCard - Reusable card component for different media types
 * Supports theming for anime, movies, games, comics, and manga
 */
const MediaCard = ({ 
  theme = 'anime',  // anime | movie | game | comic | manga
  title = 'TITLE', 
  year = null,
  imageUrl = 'https://via.placeholder.com/300x400',
  progress = 0,
  width = 180,
  height = 260,
}) => {
  // Get theme configuration
  const themeConfig = getMediaTheme(theme);
  
  return (
    <View style={[styles.card, { width, height }]}>
      <Image 
        source={{ uri: imageUrl }}
        style={styles.imageBackground}
        contentFit="cover"
        transition={200}
        cachePolicy="memory-disk"
      />
      <View style={styles.overlay} />
      
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {year ? <Text style={styles.year}>{year}</Text> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderCurve: 'continuous',
    overflow: 'hidden',
    backgroundColor: '#000',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    position: 'relative',
  },
  imageBackground: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    borderCurve: 'continuous',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 16,
    borderCurve: 'continuous',
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 12,
    fontFamily: 'Agdasima-Bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    marginBottom: 4,
  },
  year: {
    fontSize: 11,
    fontFamily: 'Agdasima',
    color: '#fff',
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});

export default MediaCard;
