import React, { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ReviewCard = ({ name, rating, text, avatar, avatarUrl }) => {
  const [imageError, setImageError] = useState(false);

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => (
      <Text key={index} style={[styles.star, { color: index < rating ? '#FFB3C6' : '#444' }]}>
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={{ uri: displayAvatar }}
          style={styles.avatar}
          onError={() => setImageError(true)}
        />
        <View style={styles.userInfo}>
          <Text style={styles.name}>{name}</Text>
          <View style={styles.rating}>
            {renderStars()}
          </View>
        </View>
      </View>
      <Text style={styles.reviewText}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
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
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: '#2A2A2A',
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
    color: '#fff',
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
    color: '#999',
    lineHeight: 16,
  },
});

export default ReviewCard;