import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StatusBar,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useMediaType } from '../context/MediaTypeContext';
import {
  getPostDetailStyles,
  getPostDetailTheme,
} from '../stylehandler/postDetailStyles';

const PostDetailPage = ({ route, navigation }) => {
  const { mediaType } = useMediaType();
  const styles = getPostDetailStyles(mediaType);
  const theme = getPostDetailTheme(mediaType);

  const { post } = route.params;
  const [imageErrors, setImageErrors] = useState({});

  const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(post.username || 'user')}`;
  const displayAvatar = post.avatarUrl || defaultAvatar;

  const handleImageError = (index) => {
    setImageErrors(prev => ({ ...prev, [index]: true }));
  };

  // Extract anime ID from AniList CDN URL (e.g. bx16498-xxx.jpg => 16498)
  const getAnimeIdFromUrl = (url) => {
    const match = url?.match(/\/bx(\d+)/);
    return match ? parseInt(match[1]) : null;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={theme.background} />

      {/* Back Button */}
      <Pressable
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </Pressable>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header: Avatar + Username + Date */}
        <View style={styles.header}>
          <Image
            source={{ uri: displayAvatar }}
            style={styles.avatar}
          />
          <Text style={styles.username}>{post.username}</Text>
          <Text style={styles.date}>{post.date}</Text>
        </View>

        {/* Post Title */}
        <Text style={styles.title}>{post.title}</Text>

        {/* Description */}
        {post.description && (
          <Text style={styles.description}>{post.description}</Text>
        )}

        {/* Divider */}
        <View style={styles.divider} />

        {/* Grid - 4 columns */}
        <View style={styles.grid}>
          {(post.mediaCovers || []).map((cover, index) => {
            if (imageErrors[index]) return null;
            // For anime: extract AniList ID from CDN URL. For others: use cover.mediaId if present.
            const animeId = getAnimeIdFromUrl(cover.imageUrl) || cover.mediaId || null;
            return (
              <Pressable
                key={index}
                onPress={() => animeId && navigation.navigate(theme.detailsRoute, { animeId })}
              >
                <Image
                  source={{ uri: cover.imageUrl }}
                  style={styles.gridImage}
                  onError={() => handleImageError(index)}
                />
              </Pressable>
            );
          })}
        </View>

        {/* Bottom spacer */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default PostDetailPage;