import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getByStatus, getWishlist } from '../services/mediaStatusService';

import { useMediaType } from '../context/MediaTypeContext';
import { getPodiumPageStyles, getPodiumPageTheme } from '../stylehandler/podiumPageStyles';
import { useProfileStore } from '../stores/useProfileStore';

const mediaDetailCache = {};
const MEDIA_DETAIL_CACHE_MAX = 150;
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/** Evict oldest entries when the cache exceeds MEDIA_DETAIL_CACHE_MAX. */
const evictCacheIfNeeded = () => {
  const keys = Object.keys(mediaDetailCache);
  if (keys.length > MEDIA_DETAIL_CACHE_MAX) {
    // Remove the first (oldest inserted) entries to stay under the cap
    keys.slice(0, keys.length - MEDIA_DETAIL_CACHE_MAX).forEach(k => {
      delete mediaDetailCache[k];
    });
  }
};

const PodiumPage = ({ navigation }) => {
  const { mediaType } = useMediaType();
  const styles = getPodiumPageStyles(mediaType);
  const theme = getPodiumPageTheme(mediaType);

  // ─── Pull components + services straight from the theme ──
  const { Chart, Counters, GenreList, SecondaryList, Skeleton } = theme.components;
  const { fetchDetails, formatData } = theme.services;

  const [counts, setCounts] = useState({ watching: 0, watched: 0, dropped: 0, wishlist: 0 });
  const [multiplayerCount, setMultiplayerCount] = useState(0);
  const [genreStats, setGenreStats] = useState({});
  const [secondaryStats, setSecondaryStats] = useState({});
  const [loading, setLoading] = useState(true);
  const userProfile = useProfileStore((state) => state.profile);
  const fetchProfile = useProfileStore((state) => state.fetchProfile);

  const hasFetched = useRef(false);
  const lastMediaType = useRef(mediaType);

  useEffect(() => {
    fetchProfile();
    const unsubscribe = navigation.addListener('focus', () => fetchProfile());
    return unsubscribe;
  }, [navigation, fetchProfile]);

  // ─── Aggregate genres + secondary from detail objects ────
  const fetchGenresAndSecondary = useCallback(async (items) => {
    const genreCount = {};
    const secondaryCount = {};
    const BATCH_SIZE = 5;
    const cachePrefix = theme.statusMediaType + '_';

    const processDetail = (detail) => {
      // Use theme extractors — no branching needed!
      theme.extractGenres(detail).forEach(g => {
        genreCount[g] = (genreCount[g] || 0) + 1;
      });
      theme.extractSecondary(detail).forEach(s => {
        secondaryCount[s] = (secondaryCount[s] || 0) + 1;
      });
    };

    const uncachedItems = items.filter(item => !mediaDetailCache[cachePrefix + item.media_id]);
    const cachedItems = items.filter(item => mediaDetailCache[cachePrefix + item.media_id]);

    cachedItems.forEach(item => processDetail(mediaDetailCache[cachePrefix + item.media_id]));

    for (let i = 0; i < uncachedItems.length; i += BATCH_SIZE) {
      const batch = uncachedItems.slice(i, i + BATCH_SIZE);

      const batchResults = await Promise.allSettled(
        batch.map(async (item) => {
          try {
            const result = await fetchDetails(item.media_id);
              if (result) {
                const formatted = formatData(result);
                mediaDetailCache[cachePrefix + item.media_id] = formatted;
                evictCacheIfNeeded();
                return formatted;
            }
          } catch (error) {
            console.warn(`Failed to fetch ${theme.statusMediaType} ${item.media_id}:`, error.message);
            return null;
          }
        })
      );

      batchResults.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          processDetail(result.value);
        }
      });

      if (i + BATCH_SIZE < uncachedItems.length) await delay(150);
    }

    setGenreStats(genreCount);
    setSecondaryStats(secondaryCount);
  }, [theme, fetchDetails, formatData]);

  // ─── Fetch status counts ─────────────────────────────────
  const fetchCounts = useCallback(async () => {
    const mt = theme.statusMediaType;
    try {
      const [watchingRes, watchedRes, droppedRes, wishlistRes] = await Promise.all([
        getByStatus('watching', mt),
        getByStatus('watched', mt),
        getByStatus('dropped', mt),
        getWishlist(mt),
      ]);

      const watchingItems = watchingRes.success && watchingRes.data ? watchingRes.data : [];
      const watchedItems = watchedRes.success && watchedRes.data ? watchedRes.data : [];
      const droppedItems = droppedRes.success && droppedRes.data ? droppedRes.data : [];

      // For games, filter donut by story flag and count multiplayer separately
      let mpCount = 0;
      if (mt === 'games') {
        const allItems = [...watchingItems, ...watchedItems, ...droppedItems];
        if (allItems.length > 0) {
          // Fetch both story and multiplayer keys for all games
          const storyKeys = allItems.map(item => `game_story_${item.media_id}`);
          const mpKeys = allItems.map(item => `game_multiplayer_${item.media_id}`);
          const [storyPairs, mpPairs] = await Promise.all([
            AsyncStorage.multiGet(storyKeys),
            AsyncStorage.multiGet(mpKeys),
          ]);

          // Build sets: story games (default true) and multiplayer games
          const nonStorySet = new Set();
          storyPairs.forEach(([key, val]) => {
            if (val === 'false') {
              nonStorySet.add(key.replace('game_story_', ''));
            }
          });
          const mpSet = new Set();
          mpPairs.forEach(([key, val]) => {
            if (val === 'true') {
              mpSet.add(key.replace('game_multiplayer_', ''));
            }
          });

          mpCount = mpSet.size;
          setMultiplayerCount(mpCount);

          // Donut chart: only games with story=true (default)
          const filterStory = (items) => items.filter(item => !nonStorySet.has(String(item.media_id)));
          setCounts({
            watching: filterStory(watchingItems).length,
            watched: filterStory(watchedItems).length,
            dropped: filterStory(droppedItems).length,
            wishlist: wishlistRes.success ? (wishlistRes.data?.length || 0) : 0,
          });
        } else {
          setMultiplayerCount(0);
          setCounts({ watching: 0, watched: 0, dropped: 0, wishlist: wishlistRes.success ? (wishlistRes.data?.length || 0) : 0 });
        }
      } else {
        setMultiplayerCount(0);
        setCounts({
          watching: watchingItems.length,
          watched: watchedItems.length,
          dropped: droppedItems.length,
          wishlist: wishlistRes.success ? (wishlistRes.data?.length || 0) : 0,
        });
      }

      const combinedItems = [...watchingItems, ...watchedItems];

      if (combinedItems.length > 0) {
        fetchGenresAndSecondary(combinedItems);
      } else {
        setGenreStats({});
        setSecondaryStats({});
      }
    } catch (error) {
      console.error('Error fetching counts:', error);
    } finally {
      setLoading(false);
      hasFetched.current = true;
    }
  }, [theme.statusMediaType, fetchGenresAndSecondary]);

  // ─── Refetch on focus & mediaType change ─────────────────
  useFocusEffect(
    useCallback(() => {
      if (lastMediaType.current !== mediaType) {
        lastMediaType.current = mediaType;
        hasFetched.current = false;
      }
      if (!hasFetched.current) setLoading(true);
      fetchCounts();
    }, [fetchCounts, mediaType])
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="light-content" backgroundColor={theme.background} />
        <Skeleton />
      </SafeAreaView>
    );
  }

  const multiplayerAccent = theme.accentSecondary || theme.accent || '#22D3EE';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.background} />

      {/* Header */}
      <View style={styles.header}>
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

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Donut + Counters */}
        <View style={styles.mainSection}>
          <Text style={styles.sectionTitle}>Status Distribution</Text>
          <View style={styles.chartRow}>
            <Chart counts={counts} />
            <Counters
              counts={counts}
              labels={theme.statusLabels}
              onStatusPress={(status) => navigation.navigate('PodiumListPage', { status })}
            />
          </View>
        </View>

        {/* Multiplayer Games */}
        {theme.statusMediaType === 'games' && multiplayerCount > 0 && (
          <View style={[styles.mainSection, { paddingTop: 14 }]}>
            <Pressable
              style={({ pressed }) => ([
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  borderCurve: 'continuous',
                  backgroundColor: pressed ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.04)',
                  gap: 10,
                },
                pressed && { transform: [{ scale: 0.97 }] },
              ])}
              onPress={() => navigation.navigate('PodiumListPage', { status: 'multiplayer' })}
            >
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  borderCurve: 'continuous',
                  backgroundColor: multiplayerAccent,
                }}
              />
              <Text
                style={{
                  flex: 1,
                  fontSize: 13,
                  color: '#ccc',
                  fontFamily: theme.fontFamily,
                  letterSpacing: 0.3,
                }}
              >
                Multiplayer
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '800',
                  color: multiplayerAccent,
                  fontFamily: theme.fontFamilyBold || theme.fontFamily,
                  minWidth: 20,
                  textAlign: 'right',
                }}
              >
                {multiplayerCount}
              </Text>
              <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.2)" />
            </Pressable>
          </View>
        )}

        {/* Top Genres */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>{theme.topGenresLabel}</Text>
          <GenreList
            data={genreStats}
            emptyMessage={theme.genreEmptyMessage}
            barColor={theme.accent}
            countColor={theme.accent}
          />
        </View>

        {/* Top Studios / Top Developers */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>{theme.topSecondaryLabel}</Text>
          <SecondaryList
            data={secondaryStats}
            emptyMessage={theme.secondaryEmptyMessage}
            barColor={theme.accentSecondary}
            countColor={theme.accentSecondary}
          />
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default PodiumPage;
