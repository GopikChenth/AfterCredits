import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { getByStatus, getWishlist } from '../services/mediaStatusService';
import { getAnimeDetails, formatAnimeData } from '../services/api_anime';
import { getUserProfile } from '../services/profile';

import DonutChart from '../components/podium_page/DonutChart';
import StatusCounters from '../components/podium_page/StatusCounters';
import TopList from '../components/podium_page/TopList';
import SkeletonPodium from '../components/skeletons/SkeletonPodium';

const animeCache = {};
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const PodiumPage = ({ navigation }) => {
  const [counts, setCounts] = useState({ watching: 0, watched: 0, dropped: 0, wishlist: 0 });
  const [genreStats, setGenreStats] = useState({});
  const [studioStats, setStudioStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  const hasFetched = useRef(false);

  useEffect(() => {
    const loadProfile = async () => {
      const result = await getUserProfile();
      setUserProfile(result.success && result.profile ? result.profile : null);
    };
    loadProfile();
    const unsubscribe = navigation.addListener('focus', () => loadProfile());
    return unsubscribe;
  }, [navigation]);

  const fetchCounts = useCallback(async () => {
    try {
      const [watchingRes, watchedRes, droppedRes, wishlistRes] = await Promise.all([
        getByStatus('watching', 'anime'),
        getByStatus('watched', 'anime'),
        getByStatus('dropped', 'anime'),
        getWishlist('anime'),
      ]);

      setCounts({
        watching: watchingRes.success ? (watchingRes.data?.length || 0) : 0,
        watched: watchedRes.success ? (watchedRes.data?.length || 0) : 0,
        dropped: droppedRes.success ? (droppedRes.data?.length || 0) : 0,
        wishlist: wishlistRes.success ? (wishlistRes.data?.length || 0) : 0,
      });

      // Combine watching + watched for genre/studio analysis
      const combinedItems = [
        ...(watchingRes.success && watchingRes.data ? watchingRes.data : []),
        ...(watchedRes.success && watchedRes.data ? watchedRes.data : []),
      ];

      if (combinedItems.length > 0) {
        fetchGenresAndStudios(combinedItems);
      }
    } catch (error) {
      console.error('Error fetching counts:', error);
    } finally {
      setLoading(false);
      hasFetched.current = true;
    }
  }, []);

  const fetchGenresAndStudios = useCallback(async (items) => {
    const genreCount = {};
    const studioCount = {};
    const BATCH_SIZE = 5; // Process 5 items at a time

    // Separate cached and uncached items
    const uncachedItems = items.filter(item => !animeCache[item.media_id]);
    const cachedItems = items.filter(item => animeCache[item.media_id]);

    // Process cached items immediately (no API calls needed)
    cachedItems.forEach(item => {
      const anime = animeCache[item.media_id];
      
      // Count genres
      if (anime?.genres && Array.isArray(anime.genres)) {
        anime.genres.forEach(genre => {
          genreCount[genre] = (genreCount[genre] || 0) + 1;
        });
      }

      // Count studios
      if (anime?.studio) {
        studioCount[anime.studio] = (studioCount[anime.studio] || 0) + 1;
      }
    });

    // Process uncached items in batches
    for (let i = 0; i < uncachedItems.length; i += BATCH_SIZE) {
      const batch = uncachedItems.slice(i, i + BATCH_SIZE);
      
      // Fetch batch in parallel
      const batchResults = await Promise.allSettled(
        batch.map(async (item) => {
          try {
            const result = await getAnimeDetails(parseInt(item.media_id));
            if (result) {
              const anime = formatAnimeData(result);
              animeCache[item.media_id] = anime;
              return { item, anime };
            }
          } catch (error) {
            console.warn(`Failed to fetch anime ${item.media_id}:`, error.message);
            return null;
          }
        })
      );

      // Process batch results
      batchResults.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          const { anime } = result.value;
          
          // Count genres
          if (anime?.genres && Array.isArray(anime.genres)) {
            anime.genres.forEach(genre => {
              genreCount[genre] = (genreCount[genre] || 0) + 1;
            });
          }

          // Count studios
          if (anime?.studio) {
            studioCount[anime.studio] = (studioCount[anime.studio] || 0) + 1;
          }
        }
      });

      // Delay only between batches (not per item) - reduced from 300ms to 150ms
      if (i + BATCH_SIZE < uncachedItems.length) {
        await delay(150);
      }
    }

    setGenreStats(genreCount);
    setStudioStats(studioCount);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!hasFetched.current) {
        setLoading(true);
      }
      fetchCounts();
    }, [fetchCounts])
  );


  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="light-content" />
        <SkeletonPodium />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" />

      {/* Static Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Podium</Text>
          <Text style={styles.headerSubtitle}>Your anime stats</Text>
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

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* Donut (left) + Counters (right) */}
        <View style={styles.mainSection}>
          <Text style={styles.sectionTitle}>Status Distribution</Text>
          <View style={styles.chartRow}>
            <DonutChart counts={counts} />
            <StatusCounters
              counts={counts}
              onStatusPress={(status) => navigation.navigate('PodiumListPage', { status })}
            />
          </View>
        </View>

        {/* Top Genres */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Top Genres</Text>
          <TopList 
            data={genreStats} 
            emptyMessage="No genre data available yet"
            barColor="#FFB3C6"
            countColor="#FFB3C6"
          />
        </View>

        {/* Top Studios */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Top Studios</Text>
          <TopList 
            data={studioStats} 
            emptyMessage="No studio data available yet"
            barColor="#A0C4FF"
            countColor="#A0C4FF"
          />
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
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
    color: '#fff',
    fontFamily: 'Agdasima',
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#888',
    fontFamily: 'Agdasima',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#888',
    fontSize: 14,
    fontFamily: 'Agdasima',
  },

  // Section titles
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'Agdasima',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'Agdasima',
    letterSpacing: 0.3,
    marginBottom: 12,
  },

  // Main section: donut + counters
  mainSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 8,
  },

  // Stats sections (genres/studios)
  statsSection: {
    paddingHorizontal: 20,
    paddingTop: 32,
  },
});

export default PodiumPage;