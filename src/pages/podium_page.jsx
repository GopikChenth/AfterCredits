import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { getByStatus, getWishlist } from '../services/mediaStatusService';
import { getUserProfile } from '../services/profile';

import { useMediaType } from '../context/MediaTypeContext';
import { getPodiumPageStyles, getPodiumPageTheme } from '../stylehandler/podiumPageStyles';

const mediaDetailCache = {};
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const PodiumPage = ({ navigation }) => {
  const { mediaType } = useMediaType();
  const styles = getPodiumPageStyles(mediaType);
  const theme = getPodiumPageTheme(mediaType);

  // ─── Pull components + services straight from the theme ──
  const { Chart, Counters, GenreList, SecondaryList, Skeleton } = theme.components;
  const { fetchDetails, formatData } = theme.services;

  const [counts, setCounts] = useState({ watching: 0, watched: 0, dropped: 0, wishlist: 0 });
  const [genreStats, setGenreStats] = useState({});
  const [secondaryStats, setSecondaryStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  const hasFetched = useRef(false);
  const lastMediaType = useRef(mediaType);

  useEffect(() => {
    const loadProfile = async () => {
      const result = await getUserProfile();
      setUserProfile(result.success && result.profile ? result.profile : null);
    };
    loadProfile();
    const unsubscribe = navigation.addListener('focus', () => loadProfile());
    return unsubscribe;
  }, [navigation]);

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

      setCounts({
        watching: watchingRes.success ? (watchingRes.data?.length || 0) : 0,
        watched: watchedRes.success ? (watchedRes.data?.length || 0) : 0,
        dropped: droppedRes.success ? (droppedRes.data?.length || 0) : 0,
        wishlist: wishlistRes.success ? (wishlistRes.data?.length || 0) : 0,
      });

      const combinedItems = [
        ...(watchingRes.success && watchingRes.data ? watchingRes.data : []),
        ...(watchedRes.success && watchedRes.data ? watchedRes.data : []),
      ];

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
              onStatusPress={(status) => navigation.navigate('PodiumListPage', { status })}
            />
          </View>
        </View>

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