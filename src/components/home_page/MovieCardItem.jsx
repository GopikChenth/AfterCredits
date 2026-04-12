import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const C = {
  bg:        '#0A0A0A',   // near-black background
  surface:   '#141414',   // card/panel surface
  surface2:  '#1C1C1C',   // slightly lighter surface
  orange:    '#FF6B35',   // primary accent
  orangeDim: '#CC4E1F',   // darker orange
  orangeSoft:'#FF8C5E',   // lighter orange
  cream:     '#F5EEE6',   // warm off-white text
  muted:     '#6B5444',   // muted warm brown
  border:    '#2A2A2A',   // subtle border
  text:      '#ECECEC',
};

const MovieCardItem = React.memo(
  React.forwardRef(({ movie, onPress, onLongPress, cardHeight, columnIndex }, ref) => {
    return (
      <Pressable
        ref={ref}
        style={({ pressed }) => [
          styles.movieCard,
          { height: cardHeight },
          pressed && styles.cardPressed
        ]}
        onPress={() => onPress(movie)}
        onLongPress={() => onLongPress?.(movie, columnIndex)}
        delayLongPress={400}
        accessibilityRole="button"
        accessibilityLabel={`View movie: ${movie.title}`}
      >
        {movie.coverImage ? (
          <Image 
            source={{ uri: movie.coverImage }} 
            style={StyleSheet.absoluteFill} 
            contentFit="cover" 
            recyclingKey={`mov-${movie.id}`} 
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: C.surface2, alignItems: 'center', justifyContent: 'center' }]}>
            <Ionicons name="film-outline" size={28} color={C.orange} />
          </View>
        )}
        <LinearGradient
          colors={['transparent', 'rgba(10,10,10,0.65)', 'rgba(10,10,10,0.98)']}
          style={StyleSheet.absoluteFill}
        />
        {/* Bottom-left orange notch accent */}
        <View style={styles.cardNotch} />
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={2}>{movie.title}</Text>
          {movie.year ? <Text style={styles.cardYear}>{movie.year}</Text> : null}
        </View>
      </Pressable>
    );
  })
);

MovieCardItem.displayName = 'MovieCardItem';

const styles = StyleSheet.create({
  movieCard: {
    margin: 5,
    borderRadius: 12,
    borderCurve: 'continuous',
    overflow: 'hidden',
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.9,
  },
  cardNotch: {
    position: 'absolute',
    left: 0, bottom: 0,
    width: 3,
    height: 36,
    backgroundColor: C.orange,
    borderTopRightRadius: 2,
  },
  cardContent: {
    position: 'absolute',
    left: 10, right: 10, bottom: 10,
  },
  cardTitle: {
    fontSize: 12,
    fontFamily: 'Agdasima-Bold',
    color: C.cream,
    lineHeight: 16,
    marginBottom: 2,
  },
  cardYear: {
    fontSize: 10,
    color: C.muted,
    fontFamily: 'Agdasima',
    letterSpacing: 0.5,
  },
});

export default MovieCardItem;
