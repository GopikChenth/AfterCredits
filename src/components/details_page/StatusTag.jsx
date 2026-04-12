import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Label sets per media type — DB keys never change, only display text does
const STATUS_LABELS = {
  games:  { watching: 'Playing',  watched: 'Completed', dropped: 'Dropped' },
  anime:  { watching: 'Watching', watched: 'Completed', dropped: 'Dropped' },
  movies: { watching: 'Watching', watched: 'Completed', dropped: 'Dropped' },
};

const STATUS_CONFIG = [
  {
    key: 'watching',
    icon: 'game-controller-outline',
    iconActive: 'game-controller',
    color: '#FBBF24',
    activeBg: 'rgba(251,191,36,0.18)',
    activeBorder: 'rgba(251,191,36,0.5)',
  },
  {
    key: 'watched',
    icon: 'checkmark-circle-outline',
    iconActive: 'checkmark-circle',
    color: '#4ADE80',
    activeBg: 'rgba(74,222,128,0.18)',
    activeBorder: 'rgba(74,222,128,0.5)',
  },
  {
    key: 'dropped',
    icon: 'close-circle-outline',
    iconActive: 'close-circle',
    color: '#F87171',
    activeBg: 'rgba(248,113,113,0.18)',
    activeBorder: 'rgba(248,113,113,0.5)',
  },
];

/**
 * StatusTag — 4 inline tappable chips: Playing/Watching, Completed, Dropped, Wishlist
 * @param {string|null} status   - 'watching' | 'watched' | 'dropped' | null
 * @param {boolean} isWishlisted
 * @param {function} onStatusChange
 * @param {function} onWishlistToggle
 * @param {'games'|'anime'|'movies'} mediaType
 */
const StatusTag = ({ status, isWishlisted, onStatusChange, onWishlistToggle, mediaType = 'anime' }) => {
  const labels = STATUS_LABELS[mediaType] || STATUS_LABELS.anime;

  // Use eye icon for anime/movies watching, game-controller for games
  const resolvedConfig = STATUS_CONFIG.map(cfg => {
    if (cfg.key === 'watching') {
      return {
        ...cfg,
        icon: mediaType === 'games' ? 'game-controller-outline' : 'eye-outline',
        iconActive: mediaType === 'games' ? 'game-controller' : 'eye',
      };
    }
    return cfg;
  });

  const handleStatusPress = (key) => {
    // Toggle: tap active status to clear it
    onStatusChange(status === key ? null : key);
  };

  return (
    <View style={styles.wrapper}>
      {/* Status chips */}
      {resolvedConfig.map((cfg) => {
        const isActive = status === cfg.key;
        return (
          <Pressable
            key={cfg.key}
            style={[
              styles.chip,
              isActive
                ? { backgroundColor: cfg.activeBg, borderColor: cfg.activeBorder }
                : styles.chipInactive,
            ]}
            onPress={() => handleStatusPress(cfg.key)}
          >
            <Ionicons
              name={isActive ? cfg.iconActive : cfg.icon}
              size={16}
              color={isActive ? cfg.color : 'rgba(255,255,255,0.45)'}
            />
            <Text style={[styles.chipLabel, { color: isActive ? cfg.color : 'rgba(255,255,255,0.45)' }]}>
              {labels[cfg.key]}
            </Text>
          </Pressable>
        );
      })}

      {/* Wishlist chip */}
      <Pressable
        style={[
          styles.chip,
          isWishlisted
            ? { backgroundColor: 'rgba(192,132,252,0.18)', borderColor: 'rgba(192,132,252,0.5)' }
            : styles.chipInactive,
        ]}
        onPress={() => onWishlistToggle(!isWishlisted)}
      >
        <Ionicons
          name={isWishlisted ? 'bookmark' : 'bookmark-outline'}
          size={16}
          color={isWishlisted ? '#C084FC' : 'rgba(255,255,255,0.45)'}
        />
        <Text style={[styles.chipLabel, { color: isWishlisted ? '#C084FC' : 'rgba(255,255,255,0.45)' }]}>
          Wishlist
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderCurve: 'continuous',
    borderWidth: 1.5,
  },
  chipInactive: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.15)',
  },
  chipLabel: {
    fontSize: 12,
    fontFamily: 'Agdasima-Bold',
    letterSpacing: 0.4,
  },
});

export default StatusTag;
