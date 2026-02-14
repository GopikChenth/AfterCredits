import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { getMediaTheme } from '../utils/mediaThemes';
import { getByStatus, getWishlist } from '../services/mediaStatusService';
import { getAnimeDetails, formatAnimeData } from '../services/api_anime';
import { useMediaType } from '../context/MediaTypeContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 56) / 2;

const TABS = [
  { key: 'watching', label: 'Watching', icon: 'eye', color: '#FFF3B0', textColor: '#7A6B00', borderColor: '#F0E68C' },
  { key: 'watched', label: 'Watched', icon: 'checkmark-circle', color: '#B5EAD7', textColor: '#1B6B3A', borderColor: '#8FD4B4' },
  { key: 'dropped', label: 'Dropped', icon: 'close-circle', color: '#FFB5B5', textColor: '#8B1A1A', borderColor: '#F09090' },
  { key: 'wishlist', label: 'Wishlist', icon: 'bookmark', color: '#D4BBFF', textColor: '#5B2D8E', borderColor: '#B89AE8' },
  { key: 'statistics', label: 'Stats', icon: 'stats-chart', color: '#FFD4A3', textColor: '#8B5A00', borderColor: '#FFB366' },
];

// Simple in-memory cache for anime details
const animeCache = {};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const PodiumPage = ({ navigation }) => {
  const theme = getMediaTheme('anime');
  const { mediaType } = useMediaType();
  const [activeTab, setActiveTab] = useState('watching');
  const [items, setItems] = useState([]);
  const [animeDetails, setAnimeDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [counts, setCounts] = useState({ watching: 0, watched: 0, dropped: 0, wishlist: 0 });
  const [statistics, setStatistics] = useState({
    totalAnime: 0,
    totalEpisodes: 0,
    averageScore: 0,
    topGenres: [],
    topStudios: [],
    mostWatched: [],
  });

  // Fetch anime details for a list of media IDs with rate limit handling
  const fetchAnimeDetailsForItems = useCallback(async (statusItems) => {
    // Show cached items instantly
    const cached = {};
    statusItems.forEach(item => {
      if (animeCache[item.media_id]) {
        cached[item.media_id] = animeCache[item.media_id];
      }
    });
    if (Object.keys(cached).length > 0) {
      setAnimeDetails(prev => ({ ...prev, ...cached }));
    }

    // Fetch uncached items one by one, updating state after each
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
        // Small delay between requests to avoid rate limiting
        if (uncachedIds.indexOf(id) < uncachedIds.length - 1) {
          await delay(400);
        }
      } catch (error) {
        console.warn(`Failed to fetch details for ${id}:`, error.message);
        const fallback = { id, title: `Anime #${id}`, coverImage: null };
        animeCache[id] = fallback;
        setAnimeDetails(prev => ({ ...prev, [id]: fallback }));
      }
    }
  }, []);

  const fetchItems = useCallback(async (tab, isRefresh = false) => {
    if (!isRefresh) setLoading(true);

    try {
      let result;
      if (tab === 'wishlist') {
        result = await getWishlist('anime');
      } else {
        result = await getByStatus(tab, 'anime');
      }

      if (result.success) {
        const data = result.data || [];
        setItems(data);
        // Fetch anime details for each item
        if (data.length > 0) {
          fetchAnimeDetailsForItems(data);
        }
      }
    } catch (error) {
      console.error('Error fetching podium items:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchAnimeDetailsForItems]);

  // Fetch all counts on mount
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
    } catch (error) {
      console.error('Error fetching counts:', error);
    }
  }, []);

  // Calculate statistics from all anime details
  const calculateStatistics = useCallback(() => {
    const allAnime = Object.values(animeDetails);
    if (allAnime.length === 0) return;

    // Total anime and episodes
    const totalAnime = allAnime.length;
    const totalEpisodes = allAnime.reduce((sum, anime) => sum + (anime.episodes || 0), 0);

    // Average score
    const scoresWithValues = allAnime.filter(anime => anime.averageScore);
    const averageScore = scoresWithValues.length > 0
      ? (scoresWithValues.reduce((sum, anime) => sum + anime.averageScore, 0) / scoresWithValues.length).toFixed(1)
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
      .slice(0, 9)
      .map(([name, count]) => ({ name, count }));

    // Top studios
    const studioMap = {};
    allAnime.forEach(anime => {
      if (anime.studio) {
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

    setStatistics({
      totalAnime,
      totalEpisodes,
      averageScore,
      topGenres,
      topStudios,
      mostWatched,
    });
  }, [animeDetails]);

  // Fetch initial data on mount
  useEffect(() => {
    fetchItems('watching'); // Load watching tab by default
    fetchCounts();
  }, [fetchItems, fetchCounts]);

  // Fetch data when tab changes
  useEffect(() => {
    fetchItems(activeTab);
  }, [activeTab, fetchItems]);

  // Recalculate statistics when anime details change
  useEffect(() => {
    calculateStatistics();
  }, [animeDetails, calculateStatistics]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchItems(activeTab, true);
    fetchCounts();
  };

  const currentTab = TABS.find(t => t.key === activeTab);

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name={currentTab.icon} size={64} color="rgba(255,255,255,0.15)" />
      <Text style={styles.emptyTitle}>Nothing here yet</Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === 'watching' && 'Start watching anime and mark them here'}
        {activeTab === 'watched' && 'Mark anime as watched to track your history'}
        {activeTab === 'dropped' && "Anime you've dropped will appear here"}
        {activeTab === 'wishlist' && 'Add anime to your wishlist from the details page'}
      </Text>
    </View>
  );

  const renderItem = (item) => {
    const anime = animeDetails[item.media_id];
    const title = anime?.title || `Loading...`;
    const coverImage = anime?.coverImage;

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.animeCard}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('DetailsAnime', { animeId: item.media_id })}
      >
        <View style={styles.cardImageContainer}>
          {coverImage ? (
            <Image
              source={{ uri: coverImage }}
              style={styles.cardImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.cardPlaceholder}>
              <ActivityIndicator size="small" color="rgba(255,255,255,0.3)" />
            </View>
          )}
          {/* Status indicator dot */}
          <View style={[styles.statusDot, { backgroundColor: currentTab.color }]} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {title}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: currentTab.color }]}>
            <Ionicons name={currentTab.icon} size={10} color={currentTab.textColor} />
            <Text style={[styles.statusBadgeText, { color: currentTab.textColor }]}>
              {currentTab.label}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderStatistics = () => (
    <View style={styles.statisticsContainer}>
      {/* Overview Cards */}
      <View style={styles.statsSection}>
        <View style={styles.statsSectionHeader}>
          <Ionicons name="grid-outline" size={18} color="#FFD4A3" />
          <Text style={styles.statsSectionTitle}>Overview</Text>
        </View>
        <View style={styles.overviewGrid}>
          <View style={[styles.overviewCard, { borderColor: '#FFB366' }]}>
            <Ionicons name="film-outline" size={24} color="#FFD4A3" />
            <Text style={styles.overviewValue}>{statistics.totalAnime}</Text>
            <Text style={styles.overviewLabel}>Anime</Text>
          </View>
          <View style={[styles.overviewCard, { borderColor: '#FFB366' }]}>
            <Ionicons name="time-outline" size={24} color="#FFD4A3" />
            <Text style={styles.overviewValue}>{statistics.totalEpisodes}</Text>
            <Text style={styles.overviewLabel}>Episodes</Text>
          </View>
          <View style={[styles.overviewCard, { borderColor: '#FFB366' }]}>
            <Ionicons name="star" size={24} color="#FFD4A3" />
            <Text style={styles.overviewValue}>{statistics.averageScore || 'N/A'}</Text>
            <Text style={styles.overviewLabel}>Avg Score</Text>
          </View>
          <View style={[styles.overviewCard, { borderColor: '#FFB366' }]}>
            <Ionicons name="heart" size={24} color="#FFD4A3" />
            <Text style={styles.overviewValue}>{counts.wishlist}</Text>
            <Text style={styles.overviewLabel}>Wishlist</Text>
          </View>
        </View>
      </View>

      {/* Top Genres */}
      {statistics.topGenres.length > 0 && (
        <View style={styles.statsSection}>
          <View style={styles.statsSectionHeader}>
            <Ionicons name="pricetag-outline" size={18} color="#FFD4A3" />
            <Text style={styles.statsSectionTitle}>Top Genres</Text>
          </View>
          <View style={styles.genreGrid}>
            {statistics.topGenres.map((genre, index) => (
              <View key={index} style={styles.genrePill}>
                <Text style={styles.genreName}>{genre.name}</Text>
                <View style={styles.genreCount}>
                  <Text style={styles.genreCountText}>{genre.count}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Most Watched */}
      {statistics.mostWatched.length > 0 && (
        <View style={styles.statsSection}>
          <View style={styles.statsSectionHeader}>
            <Ionicons name="eye-outline" size={18} color="#FFD4A3" />
            <Text style={styles.statsSectionTitle}>Most Watched</Text>
          </View>
          {statistics.mostWatched.map((anime, index) => (
            <View key={index} style={styles.mostWatchedItem}>
              <Text style={styles.mostWatchedTitle} numberOfLines={1}>{anime.title}</Text>
              <View style={styles.mostWatchedEpisodes}>
                <Text style={styles.mostWatchedEpisodesText}>{anime.episodes} ep</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Top Studios */}
      {statistics.topStudios.length > 0 && (
        <View style={styles.statsSection}>
          <View style={styles.statsSectionHeader}>
            <Ionicons name="business-outline" size={18} color="#FFD4A3" />
            <Text style={styles.statsSectionTitle}>Top Studios</Text>
          </View>
          {statistics.topStudios.map((studio, index) => (
            <View key={index} style={styles.studioItem}>
              <Text style={styles.studioName} numberOfLines={1}>{studio.name}</Text>
              <Text style={styles.studioCount}>{studio.count} anime</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Podium</Text>
        <Text style={styles.headerSubtitle}>Your anime collection</Text>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                isActive && { backgroundColor: tab.color, borderColor: tab.borderColor },
              ]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={tab.icon}
                size={16}
                color={isActive ? tab.textColor : '#888'}
              />
              <Text style={[
                styles.tabLabel,
                isActive && { color: tab.textColor, fontWeight: '800' },
              ]}>
                {tab.label}
              </Text>
              {counts[tab.key] > 0 && (
                <View style={[
                  styles.countBadge,
                  isActive
                    ? { backgroundColor: tab.textColor }
                    : { backgroundColor: 'rgba(255,255,255,0.15)' },
                ]}>
                  <Text style={[
                    styles.countText,
                    isActive && { color: tab.color },
                  ]}>
                    {counts[tab.key]}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
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
        {activeTab === 'statistics' ? (
          renderStatistics()
        ) : loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={currentTab.color} />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : items.length === 0 ? (
          renderEmptyState()
        ) : (
          <View style={styles.grid}>
            {items.map(renderItem)}
          </View>
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
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#888',
    fontFamily: 'Agdasima',
    letterSpacing: 0.3,
  },
  countBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  countText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'Agdasima',
    letterSpacing: 0.5,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Agdasima',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 8,
  },
  animeCard: {
    width: CARD_WIDTH,
    borderRadius: 16,
    backgroundColor: '#1A1A2E',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  cardImageContainer: {
    width: '100%',
    height: CARD_WIDTH * 1.4,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#252540',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.3)',
  },
  cardInfo: {
    padding: 10,
    gap: 6,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'Agdasima',
    letterSpacing: 0.3,
    lineHeight: 17,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'Agdasima',
  },
  // Statistics styles
  statisticsContainer: {
    padding: 16,
    gap: 20,
  },
  statsSection: {
    gap: 12,
  },
  statsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  statsSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    fontFamily: 'Agdasima',
    letterSpacing: 0.5,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  overviewCard: {
    flex: 1,
    minWidth: (width - 56) / 2,
    backgroundColor: 'rgba(255, 212, 163, 0.08)',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  overviewValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFD4A3',
    fontFamily: 'Agdasima',
  },
  overviewLabel: {
    fontSize: 12,
    color: '#888',
    fontFamily: 'Agdasima',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  genreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genrePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 212, 163, 0.1)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 179, 102, 0.3)',
  },
  genreName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFD4A3',
    fontFamily: 'Agdasima',
  },
  genreCount: {
    backgroundColor: '#8B5A00',
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
  mostWatchedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 179, 102, 0.15)',
  },
  mostWatchedTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'Agdasima',
    marginRight: 12,
  },
  mostWatchedEpisodes: {
    backgroundColor: 'rgba(255, 212, 163, 0.15)',
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  mostWatchedEpisodesText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFD4A3',
    fontFamily: 'Agdasima',
  },
  studioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 179, 102, 0.15)',
  },
  studioName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'Agdasima',
    marginRight: 12,
  },
  studioCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    fontFamily: 'Agdasima',
  },
});

export default PodiumPage;
