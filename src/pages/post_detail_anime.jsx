import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  StatusBar,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
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

  const getMediaNavigationParams = (cover) => {
    if (mediaType === 'games') {
      if (!cover?.mediaId) return null;
      return {
        gameId: cover.mediaId,
        gameName: cover.title || post.title,
        coverImage: cover.imageUrl || null,
      };
    }

    if (mediaType === 'movies') {
      if (!cover?.mediaId) return null;
      return {
        movieId: cover.mediaId,
        movieTitle: cover.title || post.title,
        coverImage: cover.imageUrl || null,
      };
    }

    const animeId = cover?.mediaId || getAnimeIdFromUrl(cover?.imageUrl);
    if (!animeId) return null;
    return { animeId };
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
        {post.description ? (
          <Text style={styles.description}>{post.description}</Text>
        ) : null}

        {/* Divider */}
        <View style={styles.divider} />

        {/* Grid - 4 columns */}
        <FlatList
          data={post.mediaCovers || []}
          numColumns={4}
          scrollEnabled={false}
          contentContainerStyle={{ paddingBottom: 0 }}
          columnWrapperStyle={{ gap: 10, marginBottom: 10 }}
          keyExtractor={(item, index) => item?.imageUrl || `${index}`}
          renderItem={({ item: cover, index }) => {
            if (imageErrors[index]) return null;
            const routeParams = getMediaNavigationParams(cover);
            return (
              <Pressable
                onPress={() => routeParams && navigation.navigate(theme.detailsRoute, routeParams)}
              >
                <Image
                  source={{ uri: cover.imageUrl }}
                  style={styles.gridImage}
                  onError={() => handleImageError(index)}
                />
              </Pressable>
            );
          }}
        />

        {/* Bottom spacer */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default PostDetailPage;
