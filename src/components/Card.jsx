import React from 'react';
import { View, Text, ImageBackground, StyleSheet } from 'react-native';
import { getMediaTheme } from '../utils/mediaThemes';

/**
 * MediaCard - Reusable card component for different media types
 * Supports theming for anime, movies, games, comics, and manga
 */
const MediaCard = ({ 
  theme = 'anime',  // anime | movie | game | comic | manga
  title = 'TITLE', 
  genres = ['Genre', 'Genre', 'Genre'],
  imageUrl = 'https://via.placeholder.com/300x400',
  progress = 0,
  width = 180,
  height = 260,
}) => {
  // Get theme configuration
  const themeConfig = getMediaTheme(theme);
  
  return (
    <View style={[styles.card, { width, height }]}>
      <ImageBackground 
        source={{ uri: imageUrl }}
        style={styles.imageBackground}
        imageStyle={styles.image}
      >
        <View style={styles.overlay} />
        
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.genres}>{genres.join(', ')}</Text>
        </View>
      </ImageBackground>
      
      {/* Progress bar with theme color */}
      <View style={styles.progressContainer}>
        <View 
          style={[
            styles.progressBar, 
            { 
              width: `${progress}%`,
              backgroundColor: themeConfig.accent,
            }
          ]} 
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  imageBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  image: {
    borderRadius: 16,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  content: {
    padding: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    marginBottom: 4,
  },
  genres: {
    fontSize: 11,
    color: '#fff',
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
    // backgroundColor is now set dynamically via theme
  },
});

export default MediaCard;
