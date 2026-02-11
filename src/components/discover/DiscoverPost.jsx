import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
} from 'react-native';

const DiscoverPost = ({ username, avatarUrl, date, title, description, animeCovers }) => {
  const [imageErrors, setImageErrors] = useState({});

  const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(username || 'user')}`;
  const displayAvatar = avatarUrl || defaultAvatar;

  const handleImageError = (index) => {
    setImageErrors(prev => ({ ...prev, [index]: true }));
  };

  return (
    <View style={styles.container}>
      {/* Header: Avatar + Username + Date */}
      <View style={styles.header}>
        <Image
          source={{ uri: displayAvatar }}
          style={styles.avatar}
        />
        <Text style={styles.username}>{username}</Text>
        <Text style={styles.date}>{date}</Text>
      </View>

      {/* Post Title */}
      <Text style={styles.title}>{title}</Text>

      {/* Anime Cover Strip */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.coverStrip}
        contentContainerStyle={styles.coverStripContent}
      >
        {animeCovers.map((cover, index) => (
          !imageErrors[index] && (
            <Image
              key={index}
              source={{ uri: cover.imageUrl }}
              style={styles.coverImage}
              onError={() => handleImageError(index)}
            />
          )
        ))}
      </ScrollView>

      {/* Description */}
      {description && (
        <Text style={styles.description}>{description}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    marginHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: '#2A2A2A',
  },
  username: {
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'Agdasima',
    letterSpacing: 0.5,
    color: '#fff',
    flex: 1,
  },
  date: {
    fontSize: 13,
    fontFamily: 'Agdasima',
    color: '#666',
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Agdasima-Bold',
    color: '#fff',
    lineHeight: 22,
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  coverStrip: {
    marginBottom: 12,
    marginHorizontal: -4,
  },
  coverStripContent: {
    paddingHorizontal: 4,
    gap: 8,
  },
  coverImage: {
    width: 80,
    height: 120,
    borderRadius: 6,
    backgroundColor: '#2A2A2A',
  },
  description: {
    fontSize: 13,
    fontFamily: 'Agdasima',
    color: '#777',
    lineHeight: 18,
    letterSpacing: 0.3,
  },
});

export default DiscoverPost;
