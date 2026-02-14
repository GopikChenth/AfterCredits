import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { getByStatus, getWishlist } from '../services/mediaStatusService';
import { getAnimeDetails, formatAnimeData } from '../services/api_anime';
import { getUserProfile } from '../services/profile';

import DonutChart from '../components/podium_page/DonutChart';
import StatusCounters from '../components/podium_page/StatusCounters';
import RadarGraph from '../components/podium_page/RadarGraph';

const animeCache = {};
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const PodiumPage = ({ navigation }) => {
  const [counts, setCounts] = useState({ watching: 0, watched: 0, dropped: 0, wishlist: 0 });
  const [demographics, setDemographics] = useState({ shounen: 0, shoujo: 0, seinen: 0, josei: 0, kodomomuke: 0 });
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

      // Fetch demographic data from watched anime only
      if (watchedRes.success && watchedRes.data?.length > 0) {
        fetchDemographics(watchedRes.data);
      }
    } catch (error) {
      console.error('Error fetching counts:', error);
    } finally {
      setLoading(false);
      hasFetched.current = true;
    }
  }, []);

  const fetchDemographics = useCallback(async (watchedItems) => {
    const demoCount = { shounen: 0, shoujo: 0, seinen: 0, josei: 0, kodomomuke: 0 };

    for (const item of watchedItems) {
      try {
        let anime = animeCache[item.media_id];
        if (!anime) {
          const result = await getAnimeDetails(parseInt(item.media_id));
          if (result) {
            anime = formatAnimeData(result);
            animeCache[item.media_id] = anime;
          }
          await delay(300);
        }

        if (anime?.tags) {
          const tagNames = anime.tags.map(t => t.name.toLowerCase());
          if (tagNames.includes('shounen')) demoCount.shounen++;
          if (tagNames.includes('shoujo')) demoCount.shoujo++;
          if (tagNames.includes('seinen')) demoCount.seinen++;
          if (tagNames.includes('josei')) demoCount.josei++;
          if (tagNames.includes('kids') || tagNames.includes('kodomomuke')) demoCount.kodomomuke++;
        }
      } catch (error) {
        console.warn('Failed to fetch demographics:', error.message);
      }
    }

    setDemographics(demoCount);
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
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FBBF24" />
          <Text style={styles.loadingText}>Loading your stats...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" />

      {/* Static Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Podium</Text>
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

        {/* Demographic Radar Chart */}
        <View style={styles.radarSection}>
          <Text style={styles.sectionTitle}>Demographic Profile</Text>
          <Text style={styles.sectionSubtitle}>Based on your completed anime</Text>
          <RadarGraph demographics={demographics} />
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
    alignItems: 'center',
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
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
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
    marginBottom: 4,
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
    marginTop: 12,
  },

  // Radar chart section
  radarSection: {
    paddingHorizontal: 20,
    paddingTop: 32,
  },
});

export default PodiumPage;