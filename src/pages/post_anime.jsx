import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';

import ListPost from '../components/Post_page/ListPost';
import PostSkeleton from '../components/skeletons/SkeletonPost';
import { getPosts } from '../services/postService';
import { useMediaType } from '../context/MediaTypeContext';
import { getPostPageStyles, getPostPageTheme } from '../stylehandler/postPageStyles';
import { useProfileStore } from '../stores/useProfileStore';

const PostPage = ({ navigation }) => {
  const { mediaType } = useMediaType();
  const styles = getPostPageStyles(mediaType);
  const theme = getPostPageTheme(mediaType);

  const userProfile = useProfileStore((state) => state.profile);
  const fetchProfile = useProfileStore((state) => state.fetchProfile);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await getPosts(mediaType);
    if (result.success) {
      setPosts(result.data);
    } else {
      setError(result.error || 'Failed to load posts');
    }
    setIsLoading(false);
  }, [mediaType]);

  const renderPost = useCallback(
    ({ item }) => (
      <ListPost
        username={item.username}
        avatarUrl={item.avatarUrl}
        date={item.date}
        title={item.title}
        description={item.description}
        animeCovers={item.mediaCovers}
        accent={theme.accent}
        titleFont={theme.titleFont}
        onPress={() => navigation.navigate(theme.detailRoute, { post: item })}
      />
    ),
    [navigation, theme.accent, theme.detailRoute, theme.titleFont]
  );

  const keyExtractor = useCallback((item) => String(item.id), []);

  useEffect(() => {
    fetchProfile();
    fetchPosts();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchProfile();
      fetchPosts();
    });
    return unsubscribe;
  }, [navigation, fetchPosts, fetchProfile]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.background} />
      
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <View>
            <Text style={styles.headerTitle}>{theme.headerTitle}</Text>
            <Text style={styles.headerSubtitle}>{theme.headerSubtitle}</Text>
          </View>
          <Pressable
            style={styles.profileButton}
            onPress={() => navigation.navigate('ProfilePage')}
          >
            {userProfile ? (
              <Image
                source={{
                  uri: userProfile.avatar_url || `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(userProfile.username || 'user')}`
                }}
                style={styles.profileIcon}
              />
            ) : (
              <Ionicons name="person-circle-outline" size={48} color={theme.profileIconColor} />
            )}
          </Pressable>
        </View>

        {/* Feed */}
        {isLoading ? (
          <View style={styles.feed}>
            <PostSkeleton count={3} />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={fetchPosts}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : (
          <FlashList
            data={posts}
            renderItem={renderPost}
            keyExtractor={keyExtractor}
            style={styles.feed}
            contentContainerStyle={styles.feedContent}
            estimatedItemSize={280}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews
            ListFooterComponent={<View style={{ height: 20 }} />}
          />
        )}
      </View>

    </SafeAreaView>
  );
};

export default PostPage;
