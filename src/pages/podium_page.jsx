import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { getMediaTheme } from '../utils/mediaThemes';
import { getByStatus, getWishlist } from '../services/mediaStatusService';
import { getAnimeDetails, formatAnimeData } from '../services/api_anime';
import { useMediaType } from '../context/MediaTypeContext';

const { width } = Dimensions.get('window');

const STATUS_CARDS = [
  { key: 'watching', label: 'Watching', icon: 'eye', color: '#FFF3B0', textColor: '#7A6B00', bgColor: 'rgba(255, 243, 176, 0.08)', borderColor: 'rgba(240, 230, 140, 0.25)' },
  { key: 'watched', label: 'Watched', icon: 'checkmark-circle', color: '#B5EAD7', textColor: '#1B6B3A', bgColor: 'rgba(181, 234, 215, 0.08)', borderColor: 'rgba(143, 212, 180, 0.25)' },
  { key: 'dropped', label: 'Dropped', icon: 'close-circle', color: '#FFB5B5', textColor: '#8B1A1A', bgColor: 'rgba(255, 181, 181, 0.08)', borderColor: 'rgba(240, 144, 144, 0.25)' },
  { key: 'wishlist', label: 'Wishlist', icon: 'bookmark', color: '#D4BBFF', textColor: '#5B2D8E', bgColor: 'rgba(212, 187, 255, 0.08)', borderColor: 'rgba(184, 154, 232, 0.25)' },
];

// In-memory cache for anime details
const animeCache = {};
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const PodiumPage = ({ navigation }) => {
  const theme = getMediaTheme('anime');
  const { mediaType } = useMediaType();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [counts, setCounts] = useState({ watching: 0, watched: 0, dropped: 0, wishlist: 0 });
  const [allAnimeData, setAllAnimeData] = useState([]);
  const [animeDetails, setAnimeDetails] = useState({});

  // Fetch anime details for items with rate limiting
  const fetchAnimeDetailsForItems = useCallback(async (statusItems) => {
    const cached = {};
    statusItems.forEach(item => {
      if (animeCache[item.media_id]) {
        cached[item.media_id] = animeCache[item.media_id];
      }
    });
    if (Object.keys(cached).length > 0) {
      setAnimeDetails(prev => ({ ...prev, ...cached }));
    }

    const uncachedIds = statusItems
      .map(item => item.media_id)
      .filter(id => !animeCache[id]);

    for (const id of uncachedIds) {
      try {
        const result = await getAnimeDetails(parseInt(id));
        if (result) {
          const formatted = formatAnimeData(result);
          animeCache[id] = formatted;
          setAnimeDetails(prev => ({ ...prev, [id]: formatted }));
        }
        if (uncachedIds.indexOf(id) < uncachedIds.length - 1) {
          await delay(400);
        }
      } catch (error) {
        console.warn(`Failed to fetch details for ${id}:`, error.message);
        const fallback = { id, title: `Anime #${id}`, coverImage: null, genres: [], studio: 'Unknown' };
        animeCache[id] = fallback;
        setAnimeDetails(prev => ({ ...prev, [id]: fallback }));
      }
    }
  }, []);

  // Fetch all data: counts + anime details for stats
  const fetchAllData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);

    try {
      const [watchingRes, watchedRes, droppedRes, wishlistRes] = await Promise.all([
        getByStatus('watching', 'anime'),
        getByStatus('watched', 'anime'),
        getByStatus('dropped', 'anime'),
        getWishlist('anime'),
      ]);

      const watchingData = watchingRes.success ? (watchingRes.data || []) : [];
      const watchedData = watchedRes.success ? (watchedRes.data || []) : [];
      const droppedData = droppedRes.success ? (droppedRes.data || []) : [];
      const wishlistData = wishlistRes.success ? (wishlistRes.data || []) : [];

      setCounts({
        watching: watchingData.length,
        watched: watchedData.length,
        dropped: droppedData.length,
        wishlist: wishlistData.length,
      });

      // Combine all data for stats calculations
      const allItems = [...watchingData, ...watchedData, ...droppedData, ...wishlistData];
      // Deduplicate by media_id
      const uniqueItems = allItems.filter((item, index, self) =>
        index === self.findIndex(t => t.media_id === item.media_id)
      );
      setAllAnimeData(uniqueItems);

      // Fetch details for all anime
      if (uniqueItems.length > 0) {
        fetchAnimeDetailsForItems(uniqueItems);
      }
    } catch (error) {
      console.error('Error fetching podium data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchAnimeDetailsForItems]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAllData(true);
  };

  // Calculate statistics from anime details
  const statistics = useMemo(() => {
    const allAnime = Object.values(animeDetails);
    if (allAnime.length === 0) {
      return { totalAnime: 0, totalEpisodes: 0, averageScore: 0, topGenres: [], topStudios: [], mostWatched: [] };
    }

    const totalAnime = allAnime.length;
    const totalEpisodes = allAnime.reduce((sum, anime) => sum + (anime.episodes || 0), 0);

    const scoresWithValues = allAnime.filter(anime => anime.score);
    const averageScore = scoresWithValues.length > 0
      ? (scoresWithValues.reduce((sum, anime) => sum + anime.score, 0) / scoresWithValues.length).toFixed(1)
      : 0;

    // Top genres
    const genreMap = {};
    allAnime.forEach(anime => {
      if (anime.genres) {
        anime.genres.forEach(genre => {
          genreMap[genre] = (genreMap[genre] || 0) + 1;
        });
      }
    });
    const topGenres = Object.entries(genreMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    // Top studios
    const studioMap = {};
    allAnime.forEach(anime => {
      if (anime.studio && anime.studio !== 'Unknown') {
        studioMap[anime.studio] = (studioMap[anime.studio] || 0) + 1;
      }
    });
    const topStudios = Object.entries(studioMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // Most watched (by episode count)
    const mostWatched = allAnime
      .filter(anime => anime.episodes && anime.episodes > 0)
      .sort((a, b) => b.episodes - a.episodes)
      .slice(0, 3)
      .map(anime => ({ title: anime.title, episodes: anime.episodes }));

    return { totalAnime, totalEpisodes, averageScore, topGenres, topStudios, mostWatched };
  }, [animeDetails]);

  // Status breakdown bar widths
  const totalCount = counts.watching + counts.watched + counts.dropped + counts.wishlist;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Podium</Text>
        <Text style={styles.headerSubtitle}>Your anime collection & stats</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
            colors={['#FFB3C6']}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFD4A3" />
            <Text style={styles.loadingText}>Loading stats...</Text>
          </View>
        ) : (
          <>
            {/* ═══ OVERVIEW ═══ */}
            <View style={styles.sectionHeader}>
              <Ionicons name="grid-outline" size={18} color="#FFD4A3" />
              <Text style={styles.sectionTitle}>Overview</Text>
            </View>

            <View style={styles.overviewGrid}>
              <View style={styles.overviewCard}>
                <Ionicons name="film-outline" size={24} color="#FFD4A3" />
                <Text style={styles.overviewValue}>{statistics.totalAnime}</Text>
                <Text style={styles.overviewLabel}>Anime</Text>
              </View>
              <View style={styles.overviewCard}>
                <Ionicons name="play-circle-outline" size={24} color="#FFD4A3" />
                <Text style={styles.overviewValue}>{statistics.totalEpisodes}</Text>
                <Text style={styles.overviewLabel}>Episodes</Text>
              </View>
              <View style={styles.overviewCard}>
                <Ionicons name="star" size={24} color="#FFD4A3" />
                <Text style={styles.overviewValue}>{statistics.averageScore || 'N/A'}</Text>
                <Text style={styles.overviewLabel}>Avg Score</Text>
              </View>
              <View style={styles.overviewCard}>
                <Ionicons name="heart" size={24} color="#FFD4A3" />
                <Text style={styles.overviewValue}>{counts.wishlist}</Text>
                <Text style={styles.overviewLabel}>Favorites</Text>
              </View>
            </View>

            {/* ═══ LIBRARY ═══ */}
            <View style={styles.sectionHeader}>
              <Ionicons name="library-outline" size={18} color="#FFD4A3" />
              <Text style={styles.sectionTitle}>Library</Text>
            </View>

            <View style={styles.libraryContainer}>
              {/* Status Breakdown Bar */}
              {totalCount > 0 && (
                <View style={styles.statusBar}>
                  {STATUS_CARDS.map(card => {
                    const pct = totalCount > 0 ? (counts[card.key] / totalCount) * 100 : 0;
                    if (pct === 0) return null;
                    return (
                      <View
                        key={card.key}
                        style={[styles.statusBarSegment, { width: `${pct}%`, backgroundColor: card.color }]}
                      />
                    );
                  })}
                </View>
              )}

              {/* Status Cards */}
              {STATUS_CARDS.map(card => (
                <TouchableOpacity
                  key={card.key}
                  style={[styles.statusCard, { backgroundColor: card.bgColor, borderColor: card.borderColor }]}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('PodiumListPage', { status: card.key })}
                >
                  <View style={styles.statusCardLeft}>
                    <View style={[styles.statusIconBg, { backgroundColor: card.color }]}>
                      <Ionicons name={card.icon} size={16} color={card.textColor} />
                    </View>
                    <Text style={[styles.statusCardLabel, { color: card.color }]}>{card.label}</Text>
                  </View>
                  <View style={styles.statusCardRight}>
                    <Text style={[styles.statusCardCount, { color: card.color }]}>{counts[card.key]}</Text>
                    <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.3)" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* ═══ TOP GENRES ═══ */}
            {statistics.topGenres.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Ionicons name="pricetag-outline" size={18} color="#FFD4A3" />
                  <Text style={styles.sectionTitle}>Top Genres</Text>
                </View>

                <View style={styles.genreGrid}>
                  {statistics.topGenres.map((genre, index) => (
                    <View key={index} style={styles.genrePill}>
                      <Text style={styles.genreName}>{genre.name}</Text>
                      <View style={styles.genreCountBadge}>
                        <Text style={styles.genreCountText}>{genre.count}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* ═══ MOST WATCHED ═══ */}
            {statistics.mostWatched.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Ionicons name="eye-outline" size={18} color="#FFD4A3" />
                  <Text style={styles.sectionTitle}>Most Watched</Text>
                </View>

                <View style={styles.analyticsContainer}>
                  {statistics.mostWatched.map((anime, index) => (
                    <View key={index} style={styles.analyticsItem}>
                      <View style={styles.analyticsRank}>
                        <Text style={styles.analyticsRankText}>{index + 1}</Text>
                      </View>
                      <Text style={styles.analyticsTitle} numberOfLines={1}>{anime.title}</Text>
                      <View style={styles.analyticsBadge}>
                        <Text style={styles.analyticsBadgeText}>{anime.episodes} ep</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* ═══ TOP STUDIOS ═══ */}
            {statistics.topStudios.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Ionicons name="business-outline" size={18} color="#FFD4A3" />
                  <Text style={styles.sectionTitle}>Top Studios</Text>
                </View>

                <View style={styles.analyticsContainer}>
                  {statistics.topStudios.map((studio, index) => (
                    <View key={index} style={styles.analyticsItem}>
                      <View style={styles.analyticsRank}>
                        <Text style={styles.analyticsRankText}>{index + 1}</Text>
                      </View>
                      <Text style={styles.analyticsTitle} numberOfLines={1}>{studio.name}</Text>
                      <View style={styles.analyticsBadge}>
                        <Text style={styles.analyticsBadgeText}>{studio.count} anime</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* Bottom spacer */}
            <View style={{ height: 30 }} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
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
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 12,
  },
  loadingText: {
    color: '#888',
    fontSize: 14,
    fontFamily: 'Agdasima',
  },

  // Section Headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    fontFamily: 'Agdasima',
    letterSpacing: 0.5,
  },

  // Overview Cards
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  overviewCard: {
    flex: 1,
    minWidth: (width - 60) / 2,
    backgroundColor: 'rgba(255, 212, 163, 0.06)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 179, 102, 0.15)',
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  overviewValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFD4A3',
    fontFamily: 'Agdasima',
  },
  overviewLabel: {
    fontSize: 11,
    color: '#777',
    fontFamily: 'Agdasima',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // Library
  libraryContainer: {
    gap: 8,
  },
  statusBar: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  statusBarSegment: {
    height: '100%',
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  statusCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusIconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusCardLabel: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Agdasima',
    letterSpacing: 0.3,
  },
  statusCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusCardCount: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: 'Agdasima',
  },

  // Genre Pills
  genreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genrePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 212, 163, 0.08)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingLeft: 14,
    paddingRight: 6,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 179, 102, 0.2)',
  },
  genreName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFD4A3',
    fontFamily: 'Agdasima',
  },
  genreCountBadge: {
    backgroundColor: 'rgba(139, 90, 0, 0.5)',
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 8,
    minWidth: 24,
    alignItems: 'center',
  },
  genreCountText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFD4A3',
    fontFamily: 'Agdasima',
  },

  // Analytics (Most Watched & Top Studios)
  analyticsContainer: {
    gap: 6,
  },
  analyticsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    gap: 12,
  },
  analyticsRank: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 212, 163, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyticsRankText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFD4A3',
    fontFamily: 'Agdasima',
  },
  analyticsTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'Agdasima',
  },
  analyticsBadge: {
    backgroundColor: 'rgba(255, 212, 163, 0.12)',
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  analyticsBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFD4A3',
    fontFamily: 'Agdasima',
  },
});

export default PodiumPage;
