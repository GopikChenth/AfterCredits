import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Image as RNImage,
  Keyboard,
} from 'react-native';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useMediaType } from '../context/MediaTypeContext';
import { getTrendingGames, getPopularGames, getNewReleases } from '../services/api_rawg';
import { searchMedia, debounce } from '../services/search';
import SideBar from '../components/home_page/SideBar';
import SkeletonLoader from '../components/skeletons/SkeletonHome';
import { KeyboardAwareSearchBar } from '../components/home_page/SearchBar';
import SearchSuggestionsOverlay from '../components/home_page/SearchSuggestionsOverlay';
import InlineSearchResults from '../components/home_page/InlineSearchResults';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.35;

const GameHome = ({ navigation }) => {
  const { setMediaType } = useMediaType();
  const tabBarHeight = useBottomTabBarHeight();
  const [selectedCategory, setSelectedCategory] = useState('trending');
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [activeSection, setActiveSection] = useState('game');

  // ── Search state ──
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchSubmitted, setIsSearchSubmitted] = useState(false);

  const loadGames = useCallback(async (category = selectedCategory, page = 1) => {
    if (page === 1) setLoading(true);
    else setIsLoadingMore(true);
    try {
      let data;
      switch (category) {
        case 'popular':
          data = await getPopularGames(page, 20);
          break;
        case 'new':
          data = await getNewReleases(page, 20);
          break;
        case 'trending':
        default:
          data = await getTrendingGames(page, 20);
      }
      setGames(data.results || []);
      setCurrentPage(page);
      setHasMore(!!data.next); // RAWG returns next=null on last page
    } catch (error) {
      console.error('Error loading games:', error);
      setGames([]);
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    loadGames(selectedCategory, 1);
  }, [selectedCategory]);

  const handleCategoryChange = useCallback((category) => {
    setSelectedCategory(category);
    setCurrentPage(1);
    setHasMore(true);
    loadGames(category, 1);
  }, [loadGames]);

  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      loadGames(selectedCategory, currentPage + 1);
    }
  }, [isLoadingMore, hasMore, currentPage, selectedCategory, loadGames]);

  const handlePrevPage = useCallback(() => {
    if (!isLoadingMore && currentPage > 1) {
      loadGames(selectedCategory, currentPage - 1);
    }
  }, [isLoadingMore, currentPage, selectedCategory, loadGames]);

  // ── Search handlers ─────────────────────────────────────────────────────

  const performSuggestionSearch = useCallback(
    debounce(async (query) => {
      if (!query || query.trim().length < 2) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }
      setIsSearching(true);
      try {
        const results = await searchMedia(query, 'games', 3);
        setSearchResults(results);
      } catch (error) {
        console.error('Game suggestion search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500),
    []
  );

  const handleSearchChange = useCallback((text) => {
    setSearchQuery(text);
    setIsSearchSubmitted(false);
    if (text.trim().length >= 2) {
      performSuggestionSearch(text);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [performSuggestionSearch]);

  const handleSearchSubmit = useCallback(async () => {
    if (!searchQuery || searchQuery.trim().length < 2) return;
    setIsSearchSubmitted(true);
    Keyboard.dismiss();
    setIsSearching(true);
    try {
      const results = await searchMedia(searchQuery, 'games', 50);
      setSearchResults(results);
    } catch (error) {
      console.error('Game search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  const handleSearchCancel = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
    setIsSearchSubmitted(false);
  }, []);

  const handleSearchResultPress = useCallback((item) => {
    navigation.navigate('DetailsGames', {
      gameId: item.id,
      gameName: item.title,
      coverImage: item.coverImage,
    });
    handleSearchCancel();
  }, [navigation, handleSearchCancel]);

  // Memoized FlashList callbacks
  const renderGameCard = useCallback(({ item: game }) => (
    <Pressable
      style={({ pressed }) => [styles.gameCard, pressed && styles.gameCardPressed]}
      onPress={() => navigation.navigate('DetailsGames', {
        gameId: game.id,
        gameName: game.name,
        coverImage: game.background_image,
        rating: game.rating,
        metacritic: game.metacritic,
        genres: game.genres?.map(g => g.name) || [],
        playtime: game.playtime,
        esrbRating: game.esrb_rating?.name || 'Not Rated',
      })}
      accessibilityRole="button"
      accessibilityLabel={`View game: ${game.name}`}
    >
      {game.background_image ? (
        <Image source={{ uri: game.background_image }} style={styles.cardImage} contentFit="cover" recyclingKey={`game-${game.id}`} />
      ) : (
        <View style={[styles.cardImage, styles.cardPlaceholder]}>
          <Ionicons name="game-controller-outline" size={32} color="rgba(167,139,250,0.3)" />
        </View>
      )}
      <LinearGradient
        colors={['transparent', 'rgba(15,15,35,0.82)', 'rgba(15,15,35,0.97)']}
        style={styles.cardOverlay}
      />
      {game.metacritic ? (
        <View style={[
          styles.metacriticBadge,
          { backgroundColor: game.metacritic >= 75 ? '#10B981' : game.metacritic >= 50 ? '#FFBE0B' : '#EF4444' },
        ]}>
          <Text style={styles.metacriticText}>{game.metacritic}</Text>
        </View>
      ) : null}
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>{game.name}</Text>
        <View style={styles.ratingRow}>
          {[...Array(5)].map((_, i) => (
            <Ionicons key={i} name={i < Math.round(game.rating) ? 'star' : 'star-outline'} size={11} color="#FFBE0B" />
          ))}
        </View>
      </View>
      <View style={styles.cardAccent} />
    </Pressable>
  ), [navigation]);

  const gameKeyExtractor = useCallback((item) => item.id.toString(), []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F23" />
      
      {/* CRT Scanline Overlay */}
      <View style={styles.scanlineOverlay} pointerEvents="none" />
      
      {/* Animated Background Grid */}
      <View style={styles.gridBackground} pointerEvents="none">
        {[...Array(20)].map((_, i) => (
          <View key={i} style={styles.gridLine} />
        ))}
      </View>

      <SafeAreaView style={styles.safeArea} edges={['top']}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <Pressable style={styles.menuButton} onPress={() => setIsSidebarVisible(!isSidebarVisible)} accessibilityRole="button" accessibilityLabel="Open sidebar menu" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <LinearGradient colors={['#7C3AED', '#A78BFA']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.neonButton}>
              <Ionicons name="menu" size={24} color="#E2E8F0" />
            </LinearGradient>
          </Pressable>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>GAMES</Text>
            <View style={styles.titleGlow} />
          </View>
          <Pressable style={styles.profileButton} onPress={() => navigation.navigate('ProfilePage')} accessibilityRole="button" accessibilityLabel="Go to profile">
            <LinearGradient colors={['#F43F5E', '#EC4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.neonButton}>
              <Ionicons name="person" size={24} color="#E2E8F0" />
            </LinearGradient>
          </Pressable>
        </View>

        {/* ── Category arcade buttons ── */}
        <View style={styles.categoryContainer}>
          {['trending', 'popular', 'new'].map((category) => (
            <Pressable
              key={category}
              onPress={() => handleCategoryChange(category)}
              style={({ pressed }) => [
                styles.categoryButton,
                selectedCategory === category && styles.categoryButtonActive,
                pressed && styles.categoryButtonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Filter by ${category}`}
            >
              <LinearGradient
                colors={selectedCategory === category ? ['#7C3AED', '#A78BFA'] : ['#1E1E3F', '#2A2A5A']}
                start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                style={styles.categoryGradient}
              >
                <View style={styles.categoryHighlight} />
                <View style={styles.categoryFace}>
                  <Text style={[styles.categoryText, selectedCategory === category && styles.categoryTextActive]}>
                    {category.toUpperCase()}
                  </Text>
                </View>
                {selectedCategory === category && <View style={styles.categoryGlow} />}
              </LinearGradient>
            </Pressable>
          ))}
        </View>

        {/* ── Search submitted → inline results ── */}
        {isSearchSubmitted ? (
          <InlineSearchResults
            results={searchResults}
            isLoading={isSearching}
            searchQuery={searchQuery}
            onResultPress={handleSearchResultPress}
            onClearSearch={handleSearchCancel}
            theme={{ accent: '#A78BFA' }}
          />
        ) : loading || isLoadingMore ? (
          <SkeletonLoader count={6} cardHeight={CARD_HEIGHT} />
        ) : (
          <View style={styles.listWrapper}>
            <FlashList
              data={games}
              keyExtractor={gameKeyExtractor}
              estimatedItemSize={CARD_HEIGHT + 12}
              numColumns={2}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.flashListContent}
              renderItem={renderGameCard}
              ListFooterComponent={
                (currentPage > 1 || hasMore) ? (
                  <View style={styles.paginationContainer}>
                    {currentPage > 1 ? (
                      <Pressable style={styles.pageButton} onPress={handlePrevPage} accessibilityRole="button" accessibilityLabel="Previous page">
                        <Ionicons name="chevron-back" size={16} color="#A78BFA" />
                        <Text style={styles.pageButtonText}>Prev</Text>
                      </Pressable>
                    ) : <View style={styles.pageButtonPlaceholder} />}

                    <Text style={styles.pageIndicator}>Page {currentPage}</Text>

                    {hasMore ? (
                      <Pressable style={styles.pageButton} onPress={handleLoadMore} accessibilityRole="button" accessibilityLabel="Next page">
                        <Text style={styles.pageButtonText}>Next</Text>
                        <Ionicons name="chevron-forward" size={16} color="#A78BFA" />
                      </Pressable>
                    ) : <View style={styles.pageButtonPlaceholder} />}
                  </View>
                ) : null
              }
            />
          </View>
        )}
      </SafeAreaView>

      {/* Search Bar */}
      <KeyboardAwareSearchBar
        theme="games"
        placeholder="Search games..."
        value={searchQuery}
        onChangeText={handleSearchChange}
        onCancel={handleSearchCancel}
        onSubmit={handleSearchSubmit}
        defaultBottom={8}
        keyboardOffset={8}
        tabBarHeight={tabBarHeight}
      />

      {/* Search Suggestions Overlay */}
      {!isSearchSubmitted && (searchQuery.length >= 2 || isSearching) && (
        <SearchSuggestionsOverlay
          results={searchResults}
          isLoading={isSearching}
          searchQuery={searchQuery}
          onResultPress={handleSearchResultPress}
          onClose={handleSearchCancel}
          theme={{ accent: '#A78BFA' }}
        />
      )}

      {/* Sidebar */}
      <SideBar 
        isVisible={isSidebarVisible}
        onClose={() => setIsSidebarVisible(false)}
        activeSection={activeSection}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F23',
  },
  scanlineOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    opacity: 0.05,
    zIndex: 999,
  },
  gridBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },
  gridLine: {
    height: 1,
    backgroundColor: '#7C3AED',
    marginVertical: 40,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  
  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  menuButton: {
    width: 48,
    height: 48,
  },
  profileButton: {
    width: 48,
    height: 48,
  },
  neonButton: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  },
  titleContainer: {
    position: 'relative',
  },
  title: {
    fontFamily: 'System',
    fontSize: 32,
    fontWeight: '900',
    color: '#E2E8F0',
    letterSpacing: 4,
    textShadowColor: '#7C3AED',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  titleGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#7C3AED',
    opacity: 0.3,
    borderRadius: 8,
    borderCurve: 'continuous',
    transform: [{ scaleX: 1.1 }, { scaleY: 1.5 }],
  },

  // Category Pills - Arcade Buttons
  categoryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 8,
  },
  categoryButton: {
    flex: 1,
    height: 56,
    borderRadius: 8,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  categoryButtonActive: {
    transform: [{ translateY: 2 }],
  },
  categoryButtonPressed: {
    transform: [{ translateY: 4 }],
  },
  categoryGradient: {
    flex: 1,
    borderRadius: 8,
    borderCurve: 'continuous',
    borderWidth: 2,
    borderColor: '#7C3AED40',
  },
  categoryHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: '#FFFFFF20',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  categoryFace: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryText: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 2,
  },
  categoryTextActive: {
    color: '#E2E8F0',
    textShadowColor: '#7C3AED',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  categoryGlow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#7C3AED',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },

  // Featured Section
  featuredSection: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontFamily: 'System',
    fontSize: 18,
    fontWeight: '900',
    color: '#E2E8F0',
    letterSpacing: 3,
    marginBottom: 16,
    textShadowColor: '#7C3AED',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  featuredCard: {
    height: 200,
    borderRadius: 16,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  featuredGradient: {
    flex: 1,
    padding: 3,
  },
  holoBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    borderCurve: 'continuous',
    borderWidth: 2,
    borderColor: '#7C3AED',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
  },
  featuredImage: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: 3,
    bottom: 3,
    borderRadius: 13,
    borderCurve: 'continuous',
  },
  featuredImageOverlay: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: 3,
    bottom: 3,
    borderRadius: 13,
    borderCurve: 'continuous',
  },
  featuredContent: {
    flex: 1,
    borderRadius: 13,
    borderCurve: 'continuous',
    padding: 20,
    justifyContent: 'space-between',
  },
  featuredTitle: {
    fontFamily: 'System',
    fontSize: 28,
    fontWeight: '900',
    color: '#E2E8F0',
    letterSpacing: 1,
  },
  scoreBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  scoreGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#0F0F23',
  },
  scoreText: {
    fontFamily: 'System',
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  platformRow: {
    flexDirection: 'row',
    gap: 8,
  },
  platformBadge: {
    backgroundColor: '#7C3AED40',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: '#7C3AED',
  },
  platformText: {
    fontFamily: 'System',
    fontSize: 10,
    fontWeight: '700',
    color: '#A78BFA',
    letterSpacing: 1,
  },

  // Game Grid
  gridSection: {
    paddingHorizontal: 16,
    marginTop: 32,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '700',
    color: '#7C3AED',
    letterSpacing: 3,
    marginTop: 16,
  },
  gameGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  gameCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 12,
    borderCurve: 'continuous',
    overflow: 'hidden',
    margin: 6,
  },
  gameCardPressed: {
    transform: [{ scale: 0.95 }],
  },
  cardGradient: {
    flex: 1,
    padding: 4,
  },
  cardBezel: {
    flex: 1,
    backgroundColor: '#0F0F23',
    borderRadius: 8,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  cardImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 8,
    borderCurve: 'continuous',
  },
  cardImageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cardInnerShadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 20,
    backgroundColor: '#00000040',
  },
  cardContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
  },
  cardTitle: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '700',
    color: '#E2E8F0',
    lineHeight: 18,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 2,
  },
  miniScoreBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#7C3AED',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderCurve: 'continuous',
  },
  miniScoreText: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  cardAccent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#7C3AED',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  // ── Upcoming Games Section ──
  upcomingSection: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  upcomingSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  upcomingSectionTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  upcomingSectionTitle: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '700',
    color: '#A78BFA',
    letterSpacing: 3,
  },
  upcomingSectionSubtitle: {
    fontFamily: 'System',
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    letterSpacing: 0.3,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    borderRadius: 8,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.3)',
  },
  viewAllText: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '600',
    color: '#A78BFA',
    letterSpacing: 0.3,
  },
  upcomingCard: {
    width: 150,
    height: 200,
    borderRadius: 12,
    borderCurve: 'continuous',
    overflow: 'hidden',
    marginRight: 12,
    backgroundColor: '#1E1E3F',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.2)',
  },
  upcomingCardImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1E1E3F',
  },
  upcomingCardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  upcomingCardContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
  },
  upcomingCardTitle: {
    fontFamily: 'System',
    fontSize: 13,
    fontWeight: '700',
    color: '#E2E8F0',
    lineHeight: 17,
  },
  upcomingCardDate: {
    fontFamily: 'System',
    fontSize: 11,
    color: '#A78BFA',
    marginTop: 4,
    letterSpacing: 0.3,
  },
  // ── Gaming News Section ──
  newsSection: {
    paddingHorizontal: 16,
    marginTop: 24,
    paddingBottom: 24,
  },

  // ── FlashList grid ──
  listWrapper: {
    flex: 1,
    paddingHorizontal: 8,
  },
  flashListContent: {
    paddingBottom: 100,
    paddingTop: 8,
  },
  cardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cardPlaceholder: {
    backgroundColor: '#1E1E3F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metacriticBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderCurve: 'continuous',
  },
  metacriticText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#fff',
  },

  // ── Pagination row ──
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 8,
  },
  pageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(124,58,237,0.15)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.35)',
    minWidth: 90,
    justifyContent: 'center',
  },
  pageButtonPlaceholder: {
    minWidth: 90,
  },
  pageButtonText: {
    color: '#A78BFA',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  pageIndicator: {
    color: '#888',
    fontSize: 14,
    letterSpacing: 0.5,
  },
});

export default GameHome;
