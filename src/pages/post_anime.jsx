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

// Dummy data — curated anime lists from users
const DUMMY_POSTS = [
  {
    id: '1',
    username: 'Jake',
    avatarUrl: null,
    date: '06/06/2025',
    title: 'Anime that should be watched by anyone atleast once in a life before u die.',
    description: 'This is my list based on my years of anime watching experience.',
    animeCovers: [
      { imageUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-C6FPmWm59CyP.jpg' },
      { imageUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1535-lawCkEPjOFMq.png' },
      { imageUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx11061-NpIIobuQNbJW.png' },
      { imageUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx5114-KJTQz9AIm6Wk.jpg' },
      { imageUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21459-RoPwgrZ32gM3.jpg' },
      { imageUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101922-PEn1CTc93blC.jpg' },
    ],
  },
  {
    id: '2',
    username: 'Sakura',
    avatarUrl: null,
    date: '05/28/2025',
    title: 'Top 5 hidden gem anime most people have never heard of',
    description: 'These are criminally underrated shows that deserve way more attention. Trust me on this.',
    animeCovers: [
      { imageUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx99426-BZ0VhJOUMPam.jpg' },
      { imageUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21827-10F6m50H4GJK.png' },
      { imageUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx20954-UMb6Kl7ZL0Db.jpg' },
      { imageUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21202-TfzXuWQf2oLQ.png' },
      { imageUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx104464-cIUMHS6VDGRV.jpg' },
    ],
  },
  {
    id: '3',
    username: 'NarutoFan99',
    avatarUrl: null,
    date: '05/15/2025',
    title: 'Best anime to binge watch on a rainy weekend 🌧️',
    description: 'Grab some snacks, get cozy, and start any of these. You won\'t regret it.',
    animeCovers: [
      { imageUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx20605-515yShPMNGkC.jpg' },
      { imageUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx20755-q0bGuVwuzQMy.jpg' },
      { imageUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-bbBWj4pEFseh.jpg' },
      { imageUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21856-gutV0czqOSal.jpg' },
    ],
  },
  {
    id: '4',
    username: 'AnimeMaster',
    avatarUrl: null,
    date: '04/30/2025',
    title: 'Anime with the best villains of all time',
    description: 'A great villain can make or break a show. These anime have the most iconic antagonists ever written.',
    animeCovers: [
      { imageUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1535-lawCkEPjOFMq.png' },
      { imageUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx11061-NpIIobuQNbJW.png' },
      { imageUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-C6FPmWm59CyP.jpg' },
      { imageUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx20605-515yShPMNGkC.jpg' },
      { imageUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21459-RoPwgrZ32gM3.jpg' },
    ],
  },
  {
    id: '5',
    username: 'CasualViewer',
    avatarUrl: null,
    date: '04/12/2025',
    title: 'Anime for people who don\'t watch anime',
    description: 'Trying to get your friends into anime? Start them with these. No filler, no cringe, just storytelling.',
    animeCovers: [
      { imageUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx5114-KJTQz9AIm6Wk.jpg' },
      { imageUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101922-PEn1CTc93blC.jpg' },
      { imageUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-bbBWj4pEFseh.jpg' },
    ],
  },
];

const PostPage = ({ navigation }) => {
  const theme = getMediaTheme('anime');
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      const result = await getUserProfile();
      setUserProfile(result.success && result.profile ? result.profile : null);
    };
    loadProfile();
    const unsubscribe = navigation.addListener('focus', () => loadProfile());
    
    // Simulate loading for dummy data
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [navigation]);

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
          ) : (
            DUMMY_POSTS.map((post) => (
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
});

export default PostPage;
