import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import ListPost from '../components/Post_page/ListPost';
import PostSkeleton from '../components/skeletons/SkeletonPost';
import { getMediaTheme } from '../utils/mediaThemes';
import { getUserProfile } from '../services/profile';
import { getPosts } from '../services/postService';

const PostPage = ({ navigation }) => {
  const theme = getMediaTheme('anime');
  const [userProfile, setUserProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await getPosts();
    if (result.success) {
      setPosts(result.data);
    } else {
      setError(result.error || 'Failed to load posts');
    }
    setIsLoading(false);
  }, []);

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
      <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" />
      
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <View>
            <Text style={styles.headerTitle}>Post</Text>
            <Text style={styles.headerSubtitle}>Curated anime lists from the community</Text>
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
              <Ionicons name="person-circle-outline" size={48} color="#FFB3C6" />
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
                animeCovers={post.animeCovers}
                onPress={() => navigation.navigate('PostDetailAnime', { post })}
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  profileIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFB3C6',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    fontFamily: 'Agdasima',
    color: '#fff',
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#888',
    fontFamily: 'Agdasima',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  feed: {
    flex: 1,
  },
  feedContent: {
    paddingBottom: 10,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  errorText: {
    color: '#888',
    fontSize: 15,
    fontFamily: 'Agdasima',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#FFB3C6',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryText: {
    color: '#0D0D0D',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Agdasima',
  },
});

export default PostPage;
