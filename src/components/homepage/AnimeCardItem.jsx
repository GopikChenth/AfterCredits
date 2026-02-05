import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import MediaCard from './Card';

const AnimeCardItem = React.memo(({ anime, onPress, cardHeight }) => {
  return (
    <TouchableOpacity 
      style={styles.neumorphicCard}
      onPress={onPress}
      activeOpacity={0.8}
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
    </TouchableOpacity>
  );
});

AnimeCardItem.displayName = 'AnimeCardItem';

const styles = StyleSheet.create({
  neumorphicCard: {
    flex: 1,
    margin: 8,
    borderRadius: 16,
    backgroundColor: '#252525',
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: -8, height: -8 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  cardInner: {
    borderRadius: 12,
    overflow: 'hidden',
  },
});

export default AnimeCardItem;
