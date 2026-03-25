import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

const ListPost = ({ username, avatarUrl, date, title, description, animeCovers, onPress, accent = '#FFB3C6' }) => {
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
      <FlatList
        data={animeCovers || []}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.coverStrip}
        contentContainerStyle={styles.coverStripContent}
        keyExtractor={(item, index) => item?.imageUrl || `${index}`}
        renderItem={({ item, index }) =>
          imageErrors[index] ? null : (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.coverImage}
              onError={() => handleImageError(index)}
            />
          )
        }
      />

      {/* Description */}
      {description && (
        <Text style={styles.description}>{description}</Text>
      )}

      {/* View List Button */}
      <Pressable
        style={[styles.viewListButton, {
          backgroundColor: `${accent}14`,
          borderColor: `${accent}26`,
        }]}
        onPress={onPress}
      >
        <Text style={[styles.viewListText, { color: accent }]}>View List</Text>
        <Ionicons name="arrow-forward" size={14} color={accent} />
      </Pressable>
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
    borderCurve: 'continuous',
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
    borderCurve: 'continuous',
    backgroundColor: '#2A2A2A',
  },
  description: {
    fontSize: 13,
    fontFamily: 'Agdasima',
    color: '#777',
    lineHeight: 18,
    letterSpacing: 0.3,
  },
  viewListButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderCurve: 'continuous',
    backgroundColor: 'rgba(255,179,198,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,179,198,0.15)',
  },
  viewListText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Agdasima',
    color: '#FFB3C6',
    letterSpacing: 0.5,
  },
});

export default ListPost;
