import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import ListPost from '../components/Post_page/ListPost';
import PostSkeleton from '../components/skeletons/SkeletonPost';
import { getUserProfile } from '../services/profile';
import { getPosts } from '../services/postService';
import { useMediaType } from '../context/MediaTypeContext';
import { getPostPageStyles, getPostPageTheme } from '../stylehandler/postPageStyles';

const PostPage = ({ navigation }) => {
  const { mediaType } = useMediaType();
  const styles = getPostPageStyles(mediaType);
  const theme = getPostPageTheme(mediaType);

  const [userProfile, setUserProfile] = useState(null);
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

  useEffect(() => {
    const loadProfile = async () => {
      const result = await getUserProfile();
      setUserProfile(result.success && result.profile ? result.profile : null);
    };
    loadProfile();
    fetchPosts();
    const unsubscribe = navigation.addListener('focus', () => {
      loadProfile();
      fetchPosts();
    });
    return unsubscribe;
  }, [navigation, fetchPosts]);

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
        <ScrollView
          style={styles.feed}
          contentContainerStyle={styles.feedContent}
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <PostSkeleton count={3} />
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable style={styles.retryButton} onPress={fetchPosts}>
                <Text style={styles.retryText}>Retry</Text>
              </Pressable>
            </View>
          ) : (
            posts.map((post) => (
              <ListPost
                key={post.id}
                username={post.username}
                avatarUrl={post.avatarUrl}
                date={post.date}
                title={post.title}
                description={post.description}
                animeCovers={post.mediaCovers}
                accent={theme.accent}
                onPress={() => navigation.navigate(theme.detailRoute, { post })}
              />
            ))
          )}
          
          {/* Bottom spacer for NavBar */}
          <View style={{ height: 20 }} />
        </ScrollView>
      </View>

    </SafeAreaView>
  );
};

export default PostPage;
