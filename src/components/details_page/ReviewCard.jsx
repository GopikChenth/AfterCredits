import React, { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

const ReviewCard = ({ name, rating, text, avatar, avatarUrl, mediaType = 'anime' }) => {
  const [imageError, setImageError] = useState(false);
  const isGameTheme = mediaType === 'games' || mediaType === 'game';

  const palette = isGameTheme
    ? {
        starActive: '#22D3EE',
        starInactive: 'rgba(34, 211, 238, 0.28)',
        name: '#D5F6FB',
        text: 'rgba(201, 245, 255, 0.86)',
        borderWidth: 0,
        border: 'transparent',
        avatarBorder: 'rgba(34, 211, 238, 0.45)',
        avatarBg: 'transparent',
        containerBg: 'transparent',
      }
    : {
        starActive: '#FFB3C6',
        starInactive: '#444',
        name: '#fff',
        text: '#999',
        borderWidth: 1,
        border: 'rgba(255,255,255,0.08)',
        avatarBorder: 'rgba(255,255,255,0.1)',
        avatarBg: '#2A2A2A',
        containerBg: '#1A1A1A',
      };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => (
      <Text key={index} style={[styles.star, { color: index < rating ? palette.starActive : palette.starInactive }]}>
        ★
      </Text>
    ));
  };

  // Determine avatar to display:
  // 1. avatarUrl prop (if present)
  // 2. avatar prop (if user is logged in and it's a valid URL string, not a color hex)
  // 3. DiceBear fallback based on name
  const isColorHex = (str) => typeof str === 'string' && str.startsWith('#');
  
  let imageUrl = null;
  if (avatarUrl) imageUrl = avatarUrl;
  else if (avatar && !isColorHex(avatar)) imageUrl = avatar; // Assume it's a URL if not hex
  
  const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(name || 'user')}`;
  const displayAvatar = (imageUrl && !imageError) ? imageUrl : defaultAvatar;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: palette.containerBg,
          borderWidth: palette.borderWidth,
          borderColor: palette.border,
        },
      ]}
    >
      <View style={styles.header}>
        <Image
          source={{ uri: displayAvatar }}
          style={[
            styles.avatar,
            {
              borderColor: palette.avatarBorder,
              backgroundColor: palette.avatarBg,
            },
          ]}
          onError={() => setImageError(true)}
        />
        <View style={styles.userInfo}>
          <Text style={[styles.name, { color: palette.name }]}>{name}</Text>
          <View style={styles.rating}>
            {renderStars()}
          </View>
        </View>
      </View>
      <Text style={[styles.reviewText, { color: palette.text }]}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 12,
    borderCurve: 'continuous',
    padding: 15,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderCurve: 'continuous',
    marginRight: 12,
    borderWidth: 1.5,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Agdasima',
    letterSpacing: 0.5,
    flex: 1,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    fontSize: 12,
    marginRight: 2,
  },
  reviewText: {
    fontSize: 12,
    fontFamily: 'Agdasima',
    letterSpacing: 0.5,
    lineHeight: 16,
  },
});

export default ReviewCard;
