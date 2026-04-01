import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import MediaCard from './Card';

const AnimeCardItem = React.memo(
  React.forwardRef(({ anime, onPress, onLongPress, cardHeight, columnIndex }, ref) => {
    return (
      <Pressable
        ref={ref}
        style={({ pressed }) => [
          styles.neumorphicCard,
          pressed && styles.cardPressed
        ]}
        onPress={onPress}
        onLongPress={() => onLongPress?.(anime, columnIndex)}
        delayLongPress={400}
      >
        <View style={styles.cardInner}>
          <MediaCard
            theme="anime"
            title={anime.title}
            year={anime.year}
            imageUrl={anime.coverImage}
            width={'100%'}
            height={cardHeight}
          />
        </View>
      </Pressable>
    );
  })
);

AnimeCardItem.displayName = 'AnimeCardItem';

const styles = StyleSheet.create({
  neumorphicCard: {
    flex: 1,
    margin: 8,
    borderRadius: 16,
    borderCurve: 'continuous',
    backgroundColor: '#252525',
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: -8, height: -8 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  cardPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
  cardInner: {
    borderRadius: 12,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
});

export default AnimeCardItem;