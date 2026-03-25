/**
 * Memoized list item components shared across detail pages.
 * Extracted to:
 *  1. Reduce file sizes of detail pages
 *  2. Memoize FlatList renderItem (prevents re-creation every render)
 *  3. Add accessibility labels consistently
 */
import React, { memo, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

// ─────────────────────────────────────────────────────────────────────────────
// SIMILAR / RELATED CARD  (used in all 3 detail pages)
// ─────────────────────────────────────────────────────────────────────────────

export const RelatedCard = memo(({ item, onPress, cardStyle, imageStyle, overlayStyle, titleStyle }) => (
  <Pressable
    style={cardStyle}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={`View details for ${item.title || item.name}`}
  >
    <Image
      source={{ uri: item.coverImage || item.image }}
      style={imageStyle}
      contentFit="cover"
      recyclingKey={`rel-${item.id}`}
    />
    <View style={overlayStyle}>
      <Text style={titleStyle} numberOfLines={2}>
        {item.title || item.name}
      </Text>
    </View>
  </Pressable>
));
RelatedCard.displayName = 'RelatedCard';

// ─────────────────────────────────────────────────────────────────────────────
// TRAILER CARD  (movies + games)
// ─────────────────────────────────────────────────────────────────────────────

export const TrailerCard = memo(({ thumbnail, url, name, cardStyle, thumbStyle, overlayStyle, playStyle, nameStyle }) => {
  const handlePress = useCallback(() => Linking.openURL(url), [url]);
  return (
    <Pressable
      style={cardStyle}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`Play trailer: ${name}`}
    >
      <Image source={{ uri: thumbnail }} style={thumbStyle} contentFit="cover" recyclingKey={`trail-${url}`} />
      <View style={overlayStyle}>
        <View style={playStyle}>
          <Ionicons name="play" size={20} color="#fff" />
        </View>
      </View>
      <Text style={nameStyle} numberOfLines={1}>{name}</Text>
    </Pressable>
  );
});
TrailerCard.displayName = 'TrailerCard';

// ─────────────────────────────────────────────────────────────────────────────
// CAST CARD  (movies)
// ─────────────────────────────────────────────────────────────────────────────

export const CastCard = memo(({ person, imageUri, cardStyle, imageStyle, placeholderStyle, nameStyle, roleStyle }) => (
  <View style={cardStyle} accessibilityLabel={`${person.name}, ${person.character}`}>
    {imageUri ? (
      <Image
        source={{ uri: imageUri }}
        style={imageStyle}
        contentFit="cover"
        recyclingKey={`cast-${person.credit_id || person.name}`}
      />
    ) : (
      <View style={[imageStyle, placeholderStyle]}>
        <Ionicons name="person" size={28} color="#555" />
      </View>
    )}
    <Text style={nameStyle} numberOfLines={2}>{person.name}</Text>
    <Text style={roleStyle} numberOfLines={1}>{person.character}</Text>
  </View>
));
CastCard.displayName = 'CastCard';

// ─────────────────────────────────────────────────────────────────────────────
// SCREENSHOT CARD  (games)
// ─────────────────────────────────────────────────────────────────────────────

export const ScreenshotCard = memo(({ uri, style }) => (
  <Image
    source={{ uri }}
    style={style}
    contentFit="cover"
    accessibilityLabel="Game screenshot"
  />
));
ScreenshotCard.displayName = 'ScreenshotCard';

// ─────────────────────────────────────────────────────────────────────────────
// BACK BUTTON  (all pages)
// ─────────────────────────────────────────────────────────────────────────────

export const BackButton = memo(({ onPress, style, size = 20, color = '#fff' }) => (
  <Pressable
    style={style}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel="Go back"
    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
  >
    <Ionicons name="arrow-back" size={size} color={color} />
  </Pressable>
));
BackButton.displayName = 'BackButton';

// ─────────────────────────────────────────────────────────────────────────────
// SECTION PAGINATION CONTROLS  (reviews, related)
// ─────────────────────────────────────────────────────────────────────────────

export const PaginationControls = memo(({ currentPage, totalPages, onPrev, onNext, label = 'items' }) => {
  if (totalPages <= 1) return null;
  return (
    <View style={paginationStyles.container}>
      <Pressable
        onPress={onPrev}
        disabled={currentPage === 1}
        accessibilityRole="button"
        accessibilityLabel={`Previous ${label}`}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="chevron-back" size={20} color={currentPage === 1 ? '#666' : '#fff'} />
      </Pressable>
      <Text style={paginationStyles.text}>
        {currentPage} / {totalPages}
      </Text>
      <Pressable
        onPress={onNext}
        disabled={currentPage === totalPages}
        accessibilityRole="button"
        accessibilityLabel={`Next ${label}`}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="chevron-forward" size={20} color={currentPage === totalPages ? '#666' : '#fff'} />
      </Pressable>
    </View>
  );
});
PaginationControls.displayName = 'PaginationControls';

const paginationStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 16,
  },
  text: {
    color: '#888',
    fontSize: 13,
    fontFamily: 'Agdasima',
  },
});
