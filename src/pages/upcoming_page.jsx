import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Image,
  Pressable,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { getUpcomingAnime, formatAnimeData } from '../services/api_anime';
import { setWishlist as setWishlistService, getWishlist } from '../services/mediaStatusService';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 2 columns with padding
const CARD_HEIGHT = CARD_WIDTH * 1.5;
const EXPANDED_WIDTH = width - 40; // Match discover page

const UpcomingPage = ({ navigation }) => {
  const [upcomingAnime, setUpcomingAnime] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [expandedAnimeId, setExpandedAnimeId] = useState(null);
  const [wishlistedIds, setWishlistedIds] = useState([]);

  const SEASON_ORDER = { WINTER: 0, SPRING: 1, SUMMER: 2, FALL: 3 };

  useEffect(() => {
    fetchUpcoming();
    fetchWishlist();
  }, []);

  const fetchUpcoming = async (pageNum = 1) => {
    try {
      if (pageNum === 1) setLoading(true);
      const result = await getUpcomingAnime(pageNum, 50);
      if (result?.media) {
        const formatted = result.media.map(formatAnimeData);
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

  const fetchWishlist = async () => {
    try {
      const result = await getWishlist('anime');
      if (result.success && result.data) {
        setWishlistedIds(result.data.map(item => item.media_id));
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    }
  };

  const toggleWishlist = async (animeId) => {
    const currentlyWishlisted = wishlistedIds.includes(animeId);
    if (currentlyWishlisted) {
      setWishlistedIds(prev => prev.filter(id => id !== animeId));
    } else {
      setWishlistedIds(prev => [...prev, animeId]);
    }
    const result = await setWishlistService('anime', String(animeId), !currentlyWishlisted);
    if (!result.success) {
      if (currentlyWishlisted) {
        setWishlistedIds(prev => [...prev, animeId]);
      } else {
        setWishlistedIds(prev => prev.filter(id => id !== animeId));
      }
    }
  };

  const isWishlisted = (animeId) => wishlistedIds.includes(animeId);

  const formatDate = (anime) => {
    if (anime.season && anime.year) return `${anime.season} ${anime.year}`;
    if (anime.year) return `${anime.year}`;
    return 'TBA';
  };

  const handleCardPress = (animeId) => {
    setExpandedAnimeId(expandedAnimeId === animeId ? null : animeId);
  };

  const renderCard = ({ item: anime, index }) => {
    const isExpanded = expandedAnimeId === anime.id;
    const isRightColumn = index % 2 === 1;

    // When expanded: span full width. Right-column cards shift left.
    const expandedStyle = isExpanded ? {
      width: EXPANDED_WIDTH,
      zIndex: 1000,
      ...(isRightColumn ? { marginLeft: -(EXPANDED_WIDTH - CARD_WIDTH) } : {}),
    } : {};

    return (
      <Pressable
        style={[styles.card, expandedStyle]}
        onPress={() => handleCardPress(anime.id)}
      >
        <Image source={{ uri: anime.coverImage }} style={styles.cardImage} />

        {isExpanded && (
          <LinearGradient
            colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)', 'rgba(0,0,0,0.98)']}
            locations={[0, 0.4, 1]}
            style={styles.expandedOverlay}
          >
            <Pressable
              style={styles.closeButton}
              onPress={() => setExpandedAnimeId(null)}
            >
              <Ionicons name="close" size={20} color="#fff" />
            </Pressable>

            <View style={styles.expandedHeader}>
              <Text style={styles.expandedTitle} numberOfLines={3}>
                {anime.title}
              </Text>
            </View>

            <View style={styles.expandedContent}>
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={14} color="#FFB3C6" />
                <Text style={styles.infoText}>{formatDate(anime)}</Text>
              </View>

              {anime.genres && anime.genres.length > 0 && (
                <View style={styles.infoRow}>
                  <Ionicons name="pricetag-outline" size={14} color="#FFB3C6" />
                  <Text style={styles.infoText} numberOfLines={1}>
                    {anime.genres.slice(0, 3).join(', ')}
                  </Text>
                </View>
              )}

              {anime.studio && (
                <View style={styles.infoRow}>
                  <Ionicons name="business-outline" size={14} color="#FFB3C6" />
                  <Text style={styles.infoText}>{anime.studio}</Text>
                </View>
              )}

              {anime.description && (
                <Text style={styles.expandedDescription} numberOfLines={4}>
                  {anime.description.replace(/<[^>]*>/g, '')}
                </Text>
              )}

              <View style={styles.actionButtonsRow}>
                <Pressable
                  style={[
                    styles.wishlistButton,
                    isWishlisted(anime.id) && styles.wishlistButtonActive
                  ]}
                  onPress={() => toggleWishlist(anime.id)}
                >
                  <Ionicons
                    name={isWishlisted(anime.id) ? 'bookmark' : 'bookmark-outline'}
                    size={20}
                    color="#D4BBFF"
                  />
                </Pressable>

                <Pressable
                  style={styles.viewDetailsButton}
                  onPress={() => navigation.navigate('DetailsAnime', { animeId: anime.id })}
                >
                  <Text style={styles.viewDetailsText}>View Details</Text>
                  <Ionicons name="arrow-forward" size={14} color="#FFB3C6" />
                </Pressable>
              </View>
            </View>
          </LinearGradient>
        )}
      </Pressable>
    );
  };

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
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </Pressable>
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
            keyExtractor={(item) => String(item.id)}
            numColumns={2}
            estimatedItemSize={CARD_HEIGHT + 16}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            extraData={expandedAnimeId}
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
  // Expanded overlay
  expandedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 14,
    justifyContent: 'flex-end',
  },
  closeButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  expandedHeader: {
    marginBottom: 12,
  },
  expandedTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Agdasima',
    color: '#fff',
    letterSpacing: 0.3,
    lineHeight: 20,
  },
  expandedContent: {
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 12,
    fontFamily: 'Agdasima',
    color: '#ccc',
    letterSpacing: 0.2,
    flex: 1,
  },
  expandedDescription: {
    fontSize: 11,
    fontFamily: 'Agdasima',
    color: '#999',
    letterSpacing: 0.2,
    lineHeight: 15,
    marginTop: 2,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  wishlistButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    backgroundColor: 'rgba(212, 187, 255, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 187, 255, 0.3)',
  },
  wishlistButtonActive: {
    backgroundColor: 'rgba(212, 187, 255, 0.25)',
    borderColor: 'rgba(212, 187, 255, 0.5)',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 179, 198, 0.15)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flex: 1,
  },
  viewDetailsText: {
    fontSize: 12,
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