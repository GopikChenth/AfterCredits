import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StatusBar,
  Image,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useMediaType } from '../context/MediaTypeContext';
import { getUpcomingAnime, formatAnimeData } from '../services/api_anime';
import { getUpcomingGames } from '../services/api_games';
import { setWishlist as setWishlistService, getWishlist } from '../services/mediaStatusService';
import SkeletonUpcoming from '../components/skeletons/SkeletonUpcoming';
import {
  getUpcomingPageStyles,
  getUpcomingPageTheme,
  CARD_WIDTH,
  CARD_HEIGHT,
  EXPANDED_WIDTH,
} from '../stylehandler/upcomingPageStyles';

const UpcomingPage = ({ navigation }) => {
  const { mediaType } = useMediaType();
  const styles = getUpcomingPageStyles(mediaType);
  const theme = getUpcomingPageTheme(mediaType);
  const isGames = mediaType === 'games';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [expandedItemId, setExpandedItemId] = useState(null);
  const [wishlistedIds, setWishlistedIds] = useState([]);

  const SEASON_ORDER = { WINTER: 0, SPRING: 1, SUMMER: 2, FALL: 3 };

  useEffect(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
    setExpandedItemId(null);
    fetchUpcoming(1);
    fetchWishlist();
  }, [mediaType]);

  // ─── Data Fetching ───────────────────────────────────────────

  const fetchUpcoming = async (pageNum = 1) => {
    try {
      if (pageNum === 1) setLoading(true);

      if (isGames) {
        const result = await getUpcomingGames(pageNum, 20);
        if (result?.results) {
          const formatted = result.results.map(game => ({
            id: game.id,
            title: game.name,
            coverImage: game.background_image,
            genres: game.genres?.map(g => g.name) || [],
            studio: game.developers?.[0]?.name || null,
            season: null,
            year: game.released ? new Date(game.released).getFullYear() : null,
            releaseDate: game.released || 'TBA',
          }));

          if (pageNum === 1) {
            setItems(formatted);
          } else {
            setItems(prev => [...prev, ...formatted]);
          }
          setHasMore(!!result.next);
        }
      } else {
        // Anime
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
            setItems(sorted);
          } else {
            setItems(prev => [...prev, ...sorted]);
          }
          setHasMore(result.pageInfo?.hasNextPage || false);
        }
      }
    } catch (error) {
      console.error('Error fetching upcoming:', error);
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

  // ─── Wishlist ────────────────────────────────────────────────

  const fetchWishlist = async () => {
    try {
      const result = await getWishlist(theme.mediaKey);
      if (result.success && result.data) {
        setWishlistedIds(result.data.map(item => item.media_id));
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    }
  };

  const toggleWishlist = async (itemId) => {
    const currentlyWishlisted = wishlistedIds.includes(itemId);
    if (currentlyWishlisted) {
      setWishlistedIds(prev => prev.filter(id => id !== itemId));
    } else {
      setWishlistedIds(prev => [...prev, itemId]);
    }
    const result = await setWishlistService(theme.mediaKey, String(itemId), !currentlyWishlisted);
    if (!result.success) {
      // Revert on failure
      if (currentlyWishlisted) {
        setWishlistedIds(prev => [...prev, itemId]);
      } else {
        setWishlistedIds(prev => prev.filter(id => id !== itemId));
      }
    }
  };

  const isWishlisted = (itemId) => wishlistedIds.includes(itemId);

  // ─── Helpers ─────────────────────────────────────────────────

  const formatDate = (item) => {
    if (isGames) {
      return item.releaseDate || 'TBA';
    }
    if (item.season && item.year) return `${item.season} ${item.year}`;
    if (item.year) return `${item.year}`;
    return 'TBA';
  };

  const handleCardPress = (itemId) => {
    setExpandedItemId(expandedItemId === itemId ? null : itemId);
  };

  // ─── Render ──────────────────────────────────────────────────

  const renderCard = ({ item, index }) => {
    const isExpanded = expandedItemId === item.id;
    const isRightColumn = index % 2 === 1;

    const expandedStyle = isExpanded ? {
      width: EXPANDED_WIDTH,
      zIndex: 1000,
      ...(isRightColumn ? { marginLeft: -(EXPANDED_WIDTH - CARD_WIDTH) } : {}),
    } : {};

    return (
      <Pressable
        style={[styles.card, expandedStyle]}
        onPress={() => handleCardPress(item.id)}
      >
        <Image source={{ uri: item.coverImage }} style={styles.cardImage} />

        {isExpanded && (
          <LinearGradient
            colors={theme.gradientOverlay}
            locations={[0, 0.4, 1]}
            style={styles.expandedOverlay}
          >
            <Pressable
              style={styles.closeButton}
              onPress={() => setExpandedItemId(null)}
            >
              <Ionicons name="close" size={20} color="#fff" />
            </Pressable>

            <View style={styles.expandedHeader}>
              <Text style={styles.expandedTitle} numberOfLines={3}>
                {item.title}
              </Text>
            </View>

            <View style={styles.expandedContent}>
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={14} color={theme.accent} />
                <Text style={styles.infoText}>{formatDate(item)}</Text>
              </View>

              {item.genres && item.genres.length > 0 && (
                <View style={styles.infoRow}>
                  <Ionicons name="pricetag-outline" size={14} color={theme.accent} />
                  <Text style={styles.infoText} numberOfLines={1}>
                    {item.genres.slice(0, 3).join(', ')}
                  </Text>
                </View>
              )}

              {item.studio && (
                <View style={styles.infoRow}>
                  <Ionicons name="business-outline" size={14} color={theme.accent} />
                  <Text style={styles.infoText}>{item.studio}</Text>
                </View>
              )}

              <View style={styles.actionButtonsRow}>
                <Pressable
                  style={[
                    styles.wishlistButton,
                    isWishlisted(item.id) && styles.wishlistButtonActive
                  ]}
                  onPress={() => toggleWishlist(item.id)}
                >
                  <Ionicons
                    name={isWishlisted(item.id) ? 'bookmark' : 'bookmark-outline'}
                    size={20}
                    color={theme.wishlistIcon}
                  />
                </Pressable>

                <Pressable
                  style={styles.viewDetailsButton}
                  onPress={() => navigation.navigate(theme.detailsRoute, { animeId: item.id })}
                >
                  <Text style={styles.viewDetailsText}>View Details</Text>
                  <Ionicons name="arrow-forward" size={14} color={theme.accent} />
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
        <ActivityIndicator size="small" color={theme.accent} />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={theme.background} />
      
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
            <Text style={styles.headerTitle}>{theme.headerTitle}</Text>
            <Text style={styles.headerSubtitle}>{theme.headerSubtitle}</Text>
          </View>
        </View>

        {loading && page === 1 ? (
          <SkeletonUpcoming count={6} />
        ) : (
          <FlashList
            data={items}
            renderItem={renderCard}
            keyExtractor={(item) => String(item.id)}
            numColumns={2}
            estimatedItemSize={CARD_HEIGHT + 16}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            extraData={expandedItemId}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export default UpcomingPage;