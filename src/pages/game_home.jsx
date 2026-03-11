import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
  StatusBar,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Canvas, Path as SkiaPath, Skia } from '@shopify/react-native-skia';
import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useProfileStore } from '../stores/useProfileStore';
import { getCardDimensions } from '../utils/responsiveCard';
import { getMediaTheme } from '../utils/mediaThemes';
import CategoryPill from '../components/home_page/CategoryPill';
import SideBar from '../components/home_page/SideBar';
import SkeletonLoader from '../components/skeletons/SkeletonHome';
import { KeyboardAwareSearchBar } from '../components/home_page/SearchBar';
import SearchSuggestionsOverlay from '../components/home_page/SearchSuggestionsOverlay';
import InlineSearchResults from '../components/home_page/InlineSearchResults';
import {
  getTrendingGames,
  getPopularGames,
  getNewReleases,
} from '../services/api_rawg';
import { searchMedia, debounce } from '../services/search';

const GAME_ACCENT   = '#5DD62C';
const GAME_ACCENT2  = '#3BA818';
const GAME_BG       = '#0B0F0B';
const GAME_CARD_BG  = '#111711';
const GAME_SURFACE  = '#1E261E';

// ── Inverted-L panel constants ──
const STEP_X  = 140;  // how far from the left the narrow top section starts
const STEP_Y  = 68;   // height of the narrow top section before it steps out

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH  = (SCREEN_WIDTH - 56) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.35;

const GAME_THEME = {
  accent: GAME_ACCENT,
};

// Build the Skia path for the inverted-L panel:
//
//        (stepX, 0) ─────── (w, 0)
//        |                       |
//        |   GAMES title         |
//        |                       |
// (0, stepY) ────────────────────|
// |                              |
// |    category pill + cards     |
// |                              |
// (0, h) ─────────────── (w, h)
//
const buildPanelPath = (w, h) => {
  const p = Skia.Path.Make();
  // Start at top-left of the narrow section
  p.moveTo(STEP_X, 0);
  // Top edge
  p.lineTo(w, 0);
  // Right edge all the way down
  p.lineTo(w, h);
  // Bottom edge
  p.lineTo(0, h);
  // Left edge up to the step
  p.lineTo(0, STEP_Y);
  // Step inward (horizontal line to the right)
  p.lineTo(STEP_X, STEP_Y);
  // Up to starting point
  p.lineTo(STEP_X, 0);
  p.close();
  return p;
};

// ─── Game card ─────────────────────────────────────────────────────────────
const GameCardItem = React.memo(({ game, cardHeight, onPress }) => {
  const score = game.metacritic ?? Math.round((game.rating || 0) * 20);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.gameCard,
        { height: cardHeight },
        pressed && styles.gameCardPressed,
      ]}
      onPress={() => onPress(game)}
      accessibilityRole="button"
      accessibilityLabel={`View game: ${game.name}`}
    >
      {game.background_image ? (
        <Image
          source={{ uri: game.background_image }}
          style={styles.cardImage}
          contentFit="cover"
          recyclingKey={`game-${game.id}`}
        />
      ) : (
        <View style={[styles.cardImage, styles.cardPlaceholder]}>
          <Ionicons name="game-controller-outline" size={32} color="rgba(93,214,44,0.35)" />
        </View>
      )}

      <LinearGradient
        colors={['transparent', 'rgba(11,15,11,0.78)', 'rgba(11,15,11,0.97)']}
        style={styles.cardOverlay}
      />

      {score > 0 && (
        <View
          style={[
            styles.scoreBadge,
            {
              backgroundColor:
                score >= 75 ? '#3BA818' : score >= 50 ? '#FFBE0B' : '#EF4444',
            },
          ]}
        >
          <Text style={styles.scoreText}>{score}</Text>
        </View>
      )}

      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {game.name}
        </Text>
        <View style={styles.ratingRow}>
          {[...Array(5)].map((_, i) => (
            <Ionicons
              key={i}
              name={i < Math.round(game.rating || 0) ? 'star' : 'star-outline'}
              size={11}
              color="#FFBE0B"
            />
          ))}
        </View>
      </View>

      {/* bottom accent stripe — green instead of purple */}
      <View style={styles.cardAccentStripe} />
    </Pressable>
  );
});

// ─── Main screen ──────────────────────────────────────────────────────────
const GameHome = ({ navigation }) => {
  const tabBarHeight   = useBottomTabBarHeight();
  const dimensions     = getCardDimensions();
  const [cardHeight, setCardHeight] = useState(dimensions.cardHeight);

  const [selectedCategory, setSelectedCategory] = useState('Trending');
  const [isSidebarVisible, setIsSidebarVisible]  = useState(false);

  const [games, setGames]             = useState([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [error, setError]             = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore]         = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [searchQuery, setSearchQuery]         = useState('');
  const [searchResults, setSearchResults]     = useState([]);
  const [isSearching, setIsSearching]         = useState(false);
  const [isSearchSubmitted, setIsSearchSubmitted] = useState(false);

  const userProfile  = useProfileStore(s => s.profile);
  const fetchProfile = useProfileStore(s => s.fetchProfile);

  // Responsive card sizing
  useEffect(() => {
    const sub = Dimensions.addEventListener('change', () => {
      setCardHeight(getCardDimensions().cardHeight);
    });
    return () => sub?.remove();
  }, []);

  // Profile
  useEffect(() => {
    fetchProfile();
    const unsub = navigation.addListener('focus', fetchProfile);
    return unsub;
  }, [navigation, fetchProfile]);

  // Fetch games
  const fetchGames = useCallback(async (category, page = 1) => {
    setIsLoadingMore(page > 1);
    setIsLoading(page === 1);
    setError(null);
    try {
      let data;
      switch (category) {
        case 'Popular': data = await getPopularGames(page, 20);  break;
        case 'New':     data = await getNewReleases(page, 20);   break;
        default:        data = await getTrendingGames(page, 20); break;
      }
      setGames(data.results || []);
      setCurrentPage(page);
      setHasMore(Boolean(data.next));
    } catch (err) {
      console.error('Error loading games:', err);
      setError('Failed to load games. Please try again.');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => { fetchGames(selectedCategory); }, []);

  const handleCategoryChange = useCallback((cat) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
    setHasMore(true);
    fetchGames(cat, 1);
  }, [fetchGames]);

  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) fetchGames(selectedCategory, currentPage + 1);
  }, [isLoadingMore, hasMore, currentPage, selectedCategory, fetchGames]);

  const handlePrevPage = useCallback(() => {
    if (!isLoadingMore && currentPage > 1) fetchGames(selectedCategory, currentPage - 1);
  }, [isLoadingMore, currentPage, selectedCategory, fetchGames]);

  // Search
  const performSuggestionSearch = useCallback(
    debounce(async (query) => {
      if (!query || query.trim().length < 2) {
        setSearchResults([]); setIsSearching(false); return;
      }
      setIsSearching(true);
      try {
        setSearchResults(await searchMedia(query, 'games', 3));
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500),
    [],
  );

  const handleSearchChange = useCallback((text) => {
    setSearchQuery(text);
    setIsSearchSubmitted(false);
    if (text.trim().length >= 2) performSuggestionSearch(text);
    else { setSearchResults([]); setIsSearching(false); }
  }, [performSuggestionSearch]);

  const handleSearchSubmit = useCallback(async () => {
    if (!searchQuery || searchQuery.trim().length < 2) return;
    setIsSearchSubmitted(true);
    Keyboard.dismiss();
    setIsSearching(true);
    try { setSearchResults(await searchMedia(searchQuery, 'games', 50)); }
    catch { setSearchResults([]); }
    finally { setIsSearching(false); }
  }, [searchQuery]);

  const handleSearchCancel = useCallback(() => {
    setSearchQuery(''); setSearchResults([]);
    setIsSearching(false); setIsSearchSubmitted(false);
  }, []);

  const handleSearchResultPress = useCallback((item) => {
    navigation.navigate('DetailsGames', {
      gameId: item.id, gameName: item.title, coverImage: item.coverImage,
    });
    handleSearchCancel();
  }, [navigation, handleSearchCancel]);

  const handleGamePress = useCallback((game) => {
    navigation.navigate('DetailsGames', {
      gameId: game.id,
      gameName: game.name,
      coverImage: game.background_image,
      rating: game.rating,
      metacritic: game.metacritic,
      genres: game.genres?.map(g => g.name) || [],
      playtime: game.playtime,
      esrbRating: game.esrb_rating?.name || 'Not Rated',
    });
  }, [navigation]);

  const renderGameCard = useCallback(({ item }) => (
    <GameCardItem game={item} cardHeight={cardHeight} onPress={handleGamePress} />
  ), [cardHeight, handleGamePress]);

  const keyExtractor = useCallback((item) => item.id.toString(), []);

  const [panelSize, setPanelSize] = React.useState({ width: 0, height: 0 });

  const panelPath = React.useMemo(() => {
    const { width, height } = panelSize;
    if (!width || !height) return null;
    return buildPanelPath(width, height);
  }, [panelSize]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={GAME_BG} />

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Pressable
          style={styles.menuButton}
          onPress={() => setIsSidebarVisible(v => !v)}
          accessibilityRole="button"
          accessibilityLabel="Open sidebar menu"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="menu" size={22} color="#E0FFD4" />
        </Pressable>

        <Text style={styles.headerTitle}>AfterCredits</Text>

        <Pressable
          style={styles.profileButton}
          onPress={() => navigation.navigate('ProfilePage')}
          accessibilityRole="button"
          accessibilityLabel="Go to profile"
        >
          {userProfile ? (
            <Image
              source={{
                uri: userProfile.avatar_url ||
                  `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(userProfile.username || 'user')}`,
              }}
              style={styles.profileIcon}
            />
          ) : (
            <View style={styles.profileIconContainer}>
              <Ionicons name="person-circle-outline" size={48} color={GAME_ACCENT} />
            </View>
          )}
        </Pressable>
      </View>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {isSearchSubmitted ? (
            <InlineSearchResults
              results={searchResults}
              isLoading={isSearching}
              searchQuery={searchQuery}
              onResultPress={handleSearchResultPress}
              onClearSearch={handleSearchCancel}
              theme={GAME_THEME}
            />
          ) : (
            <>
              {/* ── Skia panel wrapping title + cards ── */}
              <View
                style={styles.panelShell}
                onLayout={e => {
                  const { width, height } = e.nativeEvent.layout;
                  setPanelSize(p =>
                    p.width === width && p.height === height ? p : { width, height }
                  );
                }}
              >
                {/* Skia canvas drawing the chamfered dark panel */}
                {panelPath ? (
                  <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
                    <SkiaPath path={panelPath} color="#0E170E" />
                    <SkiaPath
                      path={panelPath}
                      color="rgba(93,214,44,0.18)"
                      style="stroke"
                      strokeWidth={1.5}
                    />
                  </Canvas>
                ) : null}

                {/* ── Hero row: category pill + GAMES title ── */}
                <View style={styles.heroRow}>
                  <CategoryPill
                    categories={['Trending', 'Popular', 'New']}
                    onCategoryChange={handleCategoryChange}
                    width={160}
                    accentColor={GAME_ACCENT}
                  />
                  <Text style={styles.gamesText}>GAMES</Text>
                </View>

                {/* ── Cards area ── */}
                {isLoading || isLoadingMore ? (
                  <SkeletonLoader cardHeight={cardHeight} count={6} />
                ) : error ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <Pressable
                      style={styles.retryButton}
                      onPress={() => fetchGames(selectedCategory)}
                      accessibilityRole="button"
                      accessibilityLabel="Retry loading games"
                    >
                      <Text style={styles.retryText}>Retry</Text>
                    </Pressable>
                  </View>
                ) : (
                  <FlashList
                    data={games}
                    renderItem={renderGameCard}
                    keyExtractor={keyExtractor}
                    estimatedItemSize={cardHeight + 16}
                    numColumns={2}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.flashListContent}
                    ListFooterComponent={
                      currentPage > 1 || hasMore ? (
                        <View style={styles.paginationContainer}>
                          {currentPage > 1 ? (
                            <Pressable
                              style={styles.pageButton}
                              onPress={handlePrevPage}
                              accessibilityRole="button"
                              accessibilityLabel="Previous page"
                            >
                              <Ionicons name="chevron-back" size={16} color={GAME_ACCENT} />
                              <Text style={styles.pageButtonText}>Prev</Text>
                            </Pressable>
                          ) : (
                            <View style={styles.pageButtonPlaceholder} />
                          )}

                          <Text style={styles.pageIndicator}>Page {currentPage}</Text>

                          {hasMore ? (
                            <Pressable
                              style={styles.pageButton}
                              onPress={handleLoadMore}
                              accessibilityRole="button"
                              accessibilityLabel="Next page"
                            >
                              <Text style={styles.pageButtonText}>Next</Text>
                              <Ionicons name="chevron-forward" size={16} color={GAME_ACCENT} />
                            </Pressable>
                          ) : (
                            <View style={styles.pageButtonPlaceholder} />
                          )}
                        </View>
                      ) : null
                    }
                  />
                )}
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>


      {/* ── Search bar ─────────────────────────────────────────────────── */}
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

      {/* ── Search suggestions overlay ─────────────────────────────────── */}
      {!isSearchSubmitted && (searchQuery.length >= 2 || isSearching) && (
        <SearchSuggestionsOverlay
          results={searchResults}
          isLoading={isSearching}
          searchQuery={searchQuery}
          onResultPress={handleSearchResultPress}
          onClose={handleSearchCancel}
          theme={GAME_THEME}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <SideBar
        isVisible={isSidebarVisible}
        onClose={() => setIsSidebarVisible(false)}
        activeSection="game"
      />
    </SafeAreaView>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GAME_BG,
  },

  // ── Background blobs ──
  backgroundShapes: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 400,
    overflow: 'hidden',
  },
  blobShape1: {
    position: 'absolute',
    top: -48, right: -80,
    width: 304, height: 304,
    backgroundColor: '#1A5C0D',
    borderRadius: 152,
    borderCurve: 'continuous',
    opacity: 0.22,
    transform: [{ scaleX: 1.5 }, { rotate: '25deg' }],
  },
  blobShape2: {
    position: 'absolute',
    top: 96, left: -96,
    width: 248, height: 248,
    backgroundColor: '#3BA818',
    borderRadius: 124,
    borderCurve: 'continuous',
    opacity: 0.12,
    transform: [{ scaleY: 1.3 }, { rotate: '-15deg' }],
  },
  blobShape3: {
    position: 'absolute',
    top: 200, right: 48,
    width: 200, height: 200,
    backgroundColor: GAME_ACCENT,
    borderRadius: 100,
    borderCurve: 'continuous',
    opacity: 0.07,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    zIndex: 10,
  },
  menuButton: {
    width: 48, height: 48,
    borderRadius: 24,
    borderCurve: 'continuous',
    backgroundColor: '#1C2A1C',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: -4, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(93,214,44,0.18)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  profileButton: {
    width: 48, height: 48,
    borderRadius: 24,
    borderCurve: 'continuous',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  profileIcon: {
    width: 48, height: 48,
    borderRadius: 24,
    borderCurve: 'continuous',
    backgroundColor: GAME_ACCENT2,
  },
  profileIconContainer: {
    width: 48, height: 48,
    borderRadius: 24,
    borderCurve: 'continuous',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Skia panel shell ──
  scrollView: { flex: 1 },
  panelShell: {
    flex: 1,
    marginHorizontal: 0,
    overflow: 'hidden',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 8,
  },
  gamesText: {
    fontSize: 36,
    fontFamily: 'Genjiro',
    color: '#E8FFD8',
    letterSpacing: 3,
    textShadowColor: 'rgba(93,214,44,0.45)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  flashListContent: {
    paddingBottom: 80,
  },

  // ── Game card ──
  gameCard: {
    flex: 1,
    margin: 6,
    borderRadius: 16,
    borderCurve: 'continuous',
    overflow: 'hidden',
    backgroundColor: GAME_CARD_BG,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  gameCardPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
  cardImage: {
    ...StyleSheet.absoluteFillObject,
  },
  cardPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F160F',
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  scoreBadge: {
    position: 'absolute',
    top: 8, right: 8,
    minWidth: 30,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  cardContent: {
    position: 'absolute',
    left: 10, right: 10, bottom: 10,
  },
  cardTitle: {
    color: '#F0FFF0',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
    marginBottom: 5,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 2,
  },
  cardAccentStripe: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    height: 3,
    backgroundColor: GAME_ACCENT2,
  },

  // ── Error ──
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 96,
  },
  errorText: {
    fontSize: 16,
    color: '#ff6b6b',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: GAME_ACCENT2,
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 8,
    borderCurve: 'continuous',
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // ── Pagination ──
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
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(93,214,44,0.12)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: 'rgba(93,214,44,0.28)',
    minWidth: 90,
  },
  pageButtonPlaceholder: { minWidth: 90 },
  pageButtonText: {
    color: GAME_ACCENT,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Agdasima',
    letterSpacing: 0.5,
  },
  pageIndicator: {
    color: '#7A9B7A',
    fontSize: 14,
    fontFamily: 'Agdasima',
    letterSpacing: 0.5,
  },
});

export default GameHome;
