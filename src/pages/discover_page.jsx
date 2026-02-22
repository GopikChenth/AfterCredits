import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  ScrollView,
  StatusBar,
  Image,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';

// Anime services
import { getUpcomingAnime, formatAnimeData } from "../services/api_anilist";
import { getAnimeNews } from "../services/news_service";
// Games services
import { getUpcomingGames, formatGameData } from "../services/api_rawg";
import { getGamingNews } from "../services/news_games";
// Movies services
import { getMovieNews } from "../services/news_movies";
import { getUpcomingMovies, formatMovieData } from "../services/api_movies";
// Shared services
import { setWishlist as setWishlistService, getWishlist } from "../services/mediaStatusService";
import { getUserProfile } from "../services/profile";
// Components
import NewsCard from "../components/discover_page/NewsCard";
import DiscoverSkeleton from "../components/skeletons/SkeletonDiscover";
// Style handler & context
import { useMediaType } from "../context/MediaTypeContext";
import { getDiscoverStyles, getDiscoverTheme, CARD_WIDTH, CARD_HEIGHT, EXPANDED_CARD_WIDTH } from "../stylehandler/discoverStyles";

const DiscoverPage = ({ navigation }) => {
  const { mediaType } = useMediaType();
  const styles = getDiscoverStyles(mediaType);
  const theme = getDiscoverTheme(mediaType);

  const isGames  = mediaType === 'games';
  const isMovies = mediaType === 'movies';

  const [upcomingItems, setUpcomingItems] = useState([]);
  const [news, setNews] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newsLoading, setNewsLoading] = useState(true);
  const [expandedItemId, setExpandedItemId] = useState(null);
  const [wishlistedIds, setWishlistedIds] = useState([]);

  // Season order for sorting anime (earliest first)
  const SEASON_ORDER = { WINTER: 0, SPRING: 1, SUMMER: 2, FALL: 3 };

  // ─── Re-fetch when media type changes ──────────────────────────
  useEffect(() => {
    setUpcomingItems([]);
    setNews([]);
    setExpandedItemId(null);
    fetchUpcoming();
    fetchNews();
    fetchWishlist();

    const loadProfile = async () => {
      const result = await getUserProfile();
      setUserProfile(result.success && result.profile ? result.profile : null);
    };
    loadProfile();
    const unsubscribe = navigation.addListener('focus', () => loadProfile());
    return unsubscribe;
  }, [navigation, mediaType]);

  // ─── Data Fetching ─────────────────────────────────────────────
  const fetchNews = async () => {
    try {
      setNewsLoading(true);
      let articles;
      if (isMovies) {
        articles = await getMovieNews(7);
      } else if (isGames) {
        articles = await getGamingNews(7);
      } else {
        articles = await getAnimeNews(7);
      }
      setNews(articles);
    } catch (error) {
      console.error("Error fetching news:", error);
    } finally {
      setNewsLoading(false);
    }
  };

  const fetchUpcoming = async () => {
    try {
      setLoading(true);

      if (isMovies) {
        // TMDB API — upcoming movies
        const result = await getUpcomingMovies(1, 20);
        if (result?.results) {
          // Sort by release date (nearest first)
          const sorted = result.results.sort((a, b) => {
            const dateA = a.year || 9999;
            const dateB = b.year || 9999;
            return dateA - dateB;
          });
          setUpcomingItems(sorted);
        }
      } else if (isGames) {
        // RAWG API — upcoming games
        const result = await getUpcomingGames(1, 20);
        if (result?.results) {
          const formatted = result.results.map(formatGameData);
          // Sort by release date (nearest first)
          const sorted = formatted.sort((a, b) => {
            if (!a.released) return 1;
            if (!b.released) return -1;
            return new Date(a.released) - new Date(b.released);
          });
          setUpcomingItems(sorted);
        }
      } else {
        // AniList API — upcoming anime
        const result = await getUpcomingAnime(1, 20);
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
          setUpcomingItems(sorted);
        }
      }
    } catch (error) {
      console.error("Error fetching upcoming:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWishlist = async () => {
    try {
      const type = isGames ? 'games' : isMovies ? 'movies' : 'anime';
      const result = await getWishlist(type);
      if (result.success && result.data) {
        setWishlistedIds(result.data.map(item => item.media_id));
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    }
  };

  const toggleWishlist = async (itemId) => {
    const currentlyWishlisted = wishlistedIds.includes(itemId);
    // Optimistic update
    if (currentlyWishlisted) {
      setWishlistedIds(prev => prev.filter(id => id !== itemId));
    } else {
      setWishlistedIds(prev => [...prev, itemId]);
    }
    const type = isGames ? 'games' : isMovies ? 'movies' : 'anime';
    const result = await setWishlistService(type, String(itemId), !currentlyWishlisted);
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

  // ─── Formatters ────────────────────────────────────────────────
  const formatDate = (item) => {
    if (isGames) {
      if (!item.released) return 'TBA';
      const d = new Date(item.released);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    if (isMovies) {
      return item.year ? `${item.year}` : 'TBA';
    }
    // Anime
    if (item.season && item.year) return `${item.season} ${item.year}`;
    if (item.year) return `${item.year}`;
    return 'TBA';
  };

  const getTitle = (item) => isGames ? item.name : item.title;
  const getCoverImage = (item) => item.coverImage;
  const getGenres = (item) => item.genres || [];
  const getSubInfo = (item) => {
    if (isGames) {
      const devs = item.developers?.join(', ');
      return devs || null;
    }
    if (isMovies) {
      return item.description ? item.description.substring(0, 80) + '…' : null;
    }
    return item.studio || null;
  };
  const getSubInfoIcon = () => isGames ? 'code-slash-outline' : isMovies ? 'film-outline' : 'business-outline';

  const handleCardPress = (itemId) => {
    setExpandedItemId(expandedItemId === itemId ? null : itemId);
  };

  // ─── Card Renderer ─────────────────────────────────────────────
  const renderUpcomingCard = (item) => {
    const isExpanded = expandedItemId === item.id;

    return (
      <Pressable
        key={item.id}
        style={[styles.card, isExpanded && styles.cardExpanded]}
        onPress={() => handleCardPress(item.id)}
      >
        <Image source={{ uri: getCoverImage(item) }} style={styles.cardImage} />

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
                {getTitle(item)}
              </Text>
            </View>

            <View style={styles.expandedContent}>
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={14} color={theme.accent} />
                <Text style={styles.infoText}>{formatDate(item)}</Text>
              </View>

              {getGenres(item).length > 0 && (
                <View style={styles.infoRow}>
                  <Ionicons name="pricetag-outline" size={14} color={theme.accent} />
                  <Text style={styles.infoText} numberOfLines={1}>
                    {getGenres(item).slice(0, 3).join(", ")}
                  </Text>
                </View>
              )}

              {getSubInfo(item) && (
                <View style={styles.infoRow}>
                  <Ionicons name={getSubInfoIcon()} size={14} color={theme.accent} />
                  <Text style={styles.infoText}>{getSubInfo(item)}</Text>
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
                    name={isWishlisted(item.id) ? "bookmark" : "bookmark-outline"}
                    size={20}
                    color={theme.wishlistIcon}
                  />
                </Pressable>

                <Pressable
                    style={styles.viewDetailsButton}
                    onPress={() =>
                      isGames
                        ? navigation.navigate('DetailsGames', {
                            gameId: item.id,
                            gameName: item.name,
                            coverImage: item.coverImage,
                          })
                        : isMovies
                          ? navigation.navigate('DetailsMovies', {
                              movieId: item.id,
                              movieTitle: item.title,
                              coverImage: item.coverImage,
                            })
                          : navigation.navigate('DetailsAnime', { animeId: item.id })
                    }
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

  // ─── Render ────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.background} />

      <View style={styles.container}>
        {/* Static Header */}
        <View style={styles.headerContainer}>
          <View>
            <Text style={styles.headerTitle}>Discover</Text>
            <Text style={styles.headerSubtitle}>
              {theme.subtitleText}
            </Text>
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

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          {/* Coming Soon / Upcoming Section */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionTitleLeft}>
                <Ionicons name={theme.comingSoonIcon} size={20} color={theme.accent} />
                <Text style={styles.sectionTitle}>{theme.comingSoonTitle}</Text>
              </View>
              <Pressable
                style={styles.viewAllButton}
                onPress={() => navigation.navigate("UpcomingPage")}
              >
                <Text style={styles.viewAllText}>View All</Text>
                <Ionicons name="arrow-forward" size={14} color={theme.accent} />
              </Pressable>
            </View>
            <Text style={styles.sectionSubtitle}>
              {theme.comingSoonSubtitle}
            </Text>
          </View>

          {loading ? (
            <DiscoverSkeleton />
          ) : (
            <FlatList
              data={upcomingItems}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => renderUpcomingCard(item)}
              style={styles.flatList}
              scrollEnabled={true}
            />
          )}

          {/* News Section */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionTitleLeft}>
                <Ionicons name={theme.newsIcon} size={20} color={theme.accent} />
                <Text style={styles.sectionTitle}>{theme.newsTitle}</Text>
              </View>
              <Pressable
                style={styles.viewAllButton}
                onPress={() => navigation.navigate('NewsPage')}
              >
                <Text style={styles.viewAllText}>View All</Text>
                <Ionicons name="arrow-forward" size={14} color={theme.accent} />
              </Pressable>
            </View>
            <Text style={styles.sectionSubtitle}>{theme.newsSubtitle}</Text>
          </View>

          {newsLoading ? (
            <DiscoverSkeleton />
          ) : (
            <View style={styles.newsContainer}>
              {news.map((article) => (
                <NewsCard key={article.id} article={article} />
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default DiscoverPage;
