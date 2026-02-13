import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  ScrollView,
  StyleSheet,
  StatusBar,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';

import { getUpcomingAnime, formatAnimeData } from "../services/api_anime";
import { getAnimeNews } from "../services/news_service";
import { setWishlist as setWishlistService, getWishlist } from "../services/mediaStatusService";
import NewsCard from "../components/discover_page/NewsCard";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.32;
const CARD_HEIGHT = CARD_WIDTH * 1.3;
const EXPANDED_CARD_WIDTH = width - 40;

const DiscoverPage = ({ navigation }) => {
  const [upcomingAnime, setUpcomingAnime] = useState([]);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newsLoading, setNewsLoading] = useState(true);
  const [expandedAnimeId, setExpandedAnimeId] = useState(null);
  const [wishlistedIds, setWishlistedIds] = useState([]); // Array of wishlisted anime IDs

  // Season order for sorting (earliest first)
  const SEASON_ORDER = { WINTER: 0, SPRING: 1, SUMMER: 2, FALL: 3 };

  useEffect(() => {
    fetchUpcoming();
    fetchNews();
    fetchWishlist();
  }, []);

  const fetchNews = async () => {
    try {
      setNewsLoading(true);
      const articles = await getAnimeNews(7); // Show 7 preview articles
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
      const result = await getUpcomingAnime(1, 20);
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
        setUpcomingAnime(sorted);
      }
    } catch (error) {
      console.error("Error fetching upcoming anime:", error);
    } finally {
      setLoading(false);
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
    // Optimistic update
    if (currentlyWishlisted) {
      setWishlistedIds(prev => prev.filter(id => id !== animeId));
    } else {
      setWishlistedIds(prev => [...prev, animeId]);
    }
    // Persist to Supabase
    const result = await setWishlistService('anime', String(animeId), !currentlyWishlisted);
    if (!result.success) {
      // Revert on failure
      if (currentlyWishlisted) {
        setWishlistedIds(prev => [...prev, animeId]);
      } else {
        setWishlistedIds(prev => prev.filter(id => id !== animeId));
      }
    }
  };

  const isWishlisted = (animeId) => wishlistedIds.includes(animeId);

  const formatDate = (anime) => {
    if (anime.season && anime.year) {
      return `${anime.season} ${anime.year}`;
    }
    if (anime.year) return `${anime.year}`;
    return "TBA";
  };

  const handleCardPress = (animeId) => {
    setExpandedAnimeId(expandedAnimeId === animeId ? null : animeId);
  };

  const renderUpcomingCard = (anime) => {
    const isExpanded = expandedAnimeId === anime.id;
    
    return (
      <TouchableOpacity
        key={anime.id}
        style={[styles.card, isExpanded && styles.cardExpanded]}
        activeOpacity={0.85}
        onPress={() => handleCardPress(anime.id)}
      >
        <Image source={{ uri: anime.coverImage }} style={styles.cardImage} />
        
        {isExpanded && (
          <LinearGradient
            colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)', 'rgba(0,0,0,0.98)']}
            locations={[0, 0.4, 1]}
            style={styles.expandedOverlay}
          >
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setExpandedAnimeId(null)}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>

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
                    {anime.genres.slice(0, 3).join(", ")}
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
                <TouchableOpacity
                  style={[
                    styles.wishlistButton,
                    isWishlisted(anime.id) && styles.wishlistButtonActive
                  ]}
                  onPress={() => toggleWishlist(anime.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name={isWishlisted(anime.id) ? "bookmark" : "bookmark-outline"} 
                    size={20} 
                    color="#D4BBFF" 
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.viewDetailsButton}
                  onPress={() => navigation.navigate("DetailsAnime", { animeId: anime.id })}
                  activeOpacity={0.7}
                >
                  <Text style={styles.viewDetailsText}>View Details</Text>
                  <Ionicons name="arrow-forward" size={14} color="#FFB3C6" />
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header — matches Post & Podium */}
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Discover</Text>
          <Text style={styles.headerSubtitle}>
            Explore anime, find your next obsession
          </Text>
        </View>

        {/* Upcoming Anime Section */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionTitleLeft}>
              <Ionicons name="time-outline" size={20} color="#FFB3C6" />
              <Text style={styles.sectionTitle}>Coming Soon</Text>
            </View>
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => navigation.navigate("UpcomingPage")}
              activeOpacity={0.7}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <Ionicons name="arrow-forward" size={14} color="#FFB3C6" />
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionSubtitle}>
            Anime that are yet to release
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFB3C6" />
            <Text style={styles.loadingText}>Loading upcoming anime...</Text>
          </View>
        ) : (
          <FlatList
            data={upcomingAnime}
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
              <Ionicons name="newspaper-outline" size={20} color="#FFB3C6" />
              <Text style={styles.sectionTitle}>Latest News</Text>
            </View>
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => navigation.navigate('NewsPage')}
              activeOpacity={0.7}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <Ionicons name="arrow-forward" size={14} color="#FFB3C6" />
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionSubtitle}>Fresh from Anime Corner</Text>
        </View>

        {newsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFB3C6" />
            <Text style={styles.loadingText}>Loading news...</Text>
          </View>
        ) : (
          <View style={styles.newsContainer}>
            {news.map((article) => (
              <NewsCard key={article.id} article={article} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0D0D0D",
  },
  container: {
    flex: 1,
    backgroundColor: "#0D0D0D",
  },
  // Header — identical to Post & Podium
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "800",
    fontFamily: "Agdasima",
    color: "#fff",
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#888",
    fontFamily: "Agdasima",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  // Content
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 10,
  },
  // Section header
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "Agdasima",
    color: "#fff",
    letterSpacing: 0.5,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(255, 179, 198, 0.1)",
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Agdasima",
    color: "#FFB3C6",
    letterSpacing: 0.3,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontFamily: "Agdasima",
    color: "#666",
    letterSpacing: 0.3,
    marginTop: 4,
    marginLeft: 28,
  },
  // Horizontal scroll
  horizontalScroll: {
    paddingHorizontal: 20,
    gap: 14,
    alignItems: "flex-start",
  },
  flatList: {
    flexGrow: 0,
  },
  // News section
  newsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 80, // Space for tab bar
  },
  // Card
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  cardExpanded: {
    width: EXPANDED_CARD_WIDTH,
    zIndex: 1000,
  },
  cardImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#2A2A2A",
  },
  // Expanded overlay
  expandedOverlay: {
    position: "absolute",
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
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  expandedHeader: {
    marginBottom: 12,
  },
  expandedTitle: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Agdasima",
    color: "#fff",
    letterSpacing: 0.3,
    lineHeight: 20,
  },
  expandedContent: {
    gap: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  infoText: {
    fontSize: 12,
    fontFamily: "Agdasima",
    color: "#ccc",
    letterSpacing: 0.2,
    flex: 1,
  },
  expandedDescription: {
    fontSize: 11,
    fontFamily: "Agdasima",
    color: "#999",
    letterSpacing: 0.2,
    lineHeight: 15,
    marginTop: 4,
  },
  actionButtonsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  wishlistButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 44,
    height: 44,
    backgroundColor: "rgba(212, 187, 255, 0.1)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(212, 187, 255, 0.3)",
  },
  wishlistButtonActive: {
    backgroundColor: "rgba(212, 187, 255, 0.25)",
    borderColor: "rgba(212, 187, 255, 0.5)",
  },
  viewDetailsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(255, 179, 198, 0.15)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flex: 1,
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Agdasima",
    color: "#FFB3C6",
    letterSpacing: 0.3,
  },
  // Loading
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: {
    color: "#666",
    fontSize: 14,
    fontFamily: "Agdasima",
    letterSpacing: 0.3,
  },
});

export default DiscoverPage;
