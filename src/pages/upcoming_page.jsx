import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';

import { getUpcomingAnime, formatAnimeData } from '../services/api_anime';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 2 columns with padding
const CARD_HEIGHT = CARD_WIDTH * 1.5;

const UpcomingPage = ({ navigation }) => {
  const [upcomingAnime, setUpcomingAnime] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Season order for sorting (earliest first)
  const SEASON_ORDER = { WINTER: 0, SPRING: 1, SUMMER: 2, FALL: 3 };

  useEffect(() => {
    fetchUpcoming();
  }, []);

  const fetchUpcoming = async (pageNum = 1) => {
    try {
      if (pageNum === 1) setLoading(true);
      const result = await getUpcomingAnime(pageNum, 50);
      if (result?.media) {
        const formatted = result.media.map(formatAnimeData);
        // Sort by nearest release: year first, then season order
        const sorted = formatted.sort((a, b) => {
          const yearA = a.year || 9999;
          const yearB = b.year || 9999;
          if (yearA !== yearB) return yearA - yearB;
          const seasonA = SEASON_ORDER[a.season] ?? 99;
          const seasonB = SEASON_ORDER[b.season] ?? 99;
          return seasonA - seasonB;
        });
        
        if (pageNum === 1) {
          setUpcomingAnime(sorted);
        } else {
          setUpcomingAnime(prev => [...prev, ...sorted]);
        }
        
        setHasMore(result.pageInfo?.hasNextPage || false);
      }
    } catch (error) {
      console.error('Error fetching upcoming anime:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchUpcoming(nextPage);
    }
  };

  const formatDate = (anime) => {
    if (anime.season && anime.year) {
      return `${anime.season} ${anime.year}`;
    }
    if (anime.year) return `${anime.year}`;
    return 'TBA';
  };

  const renderCard = ({ item: anime }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('DetailsAnime', { animeId: anime.id })}
    >
      <Image
        source={{ uri: anime.coverImage }}
        style={styles.cardImage}
      />
      {/* Title overlay on image */}
      <View style={styles.cardOverlay}>
        <Text style={styles.cardTitle} numberOfLines={2}>{anime.title}</Text>
        <View style={styles.releaseBadge}>
          <Ionicons name="calendar-outline" size={10} color="#FFB3C6" />
          <Text style={styles.releaseText}>{formatDate(anime)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!loading || page === 1) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#FFB3C6" />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" />
      
      <View style={styles.container}>
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Upcoming Anime</Text>
            <Text style={styles.headerSubtitle}>Sorted by nearest release</Text>
          </View>
        </View>

        {loading && page === 1 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFB3C6" />
            <Text style={styles.loadingText}>Loading upcoming anime...</Text>
          </View>
        ) : (
          <FlashList
            data={upcomingAnime}
            renderItem={renderCard}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            estimatedItemSize={CARD_HEIGHT}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
          />
        )}
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
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    fontFamily: 'Agdasima',
    color: '#fff',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#888',
    fontFamily: 'Agdasima',
    letterSpacing: 0.3,
    marginTop: 2,
  },
  // List
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  // Card
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 16,
    marginHorizontal: 8,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2A2A2A',
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
    padding: 10,
    paddingTop: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Agdasima',
    color: '#fff',
    letterSpacing: 0.3,
    lineHeight: 18,
  },
  releaseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  releaseText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Agdasima',
    color: '#FFB3C6',
    letterSpacing: 0.3,
  },
  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'Agdasima',
    letterSpacing: 0.3,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

export default UpcomingPage;
