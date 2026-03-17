import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  StatusBar,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
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
import CategoryPill, { PILL_BORDER_RADIUS } from '../components/home_page/CategoryPill';
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
const GAME_ACCENT2  = '#337418';
const GAME_BG       = '#0F0F0F';
const GAME_CARD_BG  = '#202020';
const GAME_TEXT     = '#F8F8F8';

const GAME_THEME = getMediaTheme('game');

// ── Inverted-L panel constants ──
// R matches the pill's own borderRadius so the notch corners look identical.
// STEP_X and STEP_Y are derived at runtime from the measured pill size so the
// shape stays flush on every screen width (see heroRow onLayout below).
const R = PILL_BORDER_RADIUS; // corner radius applied to every corner of the L

const buildPanelPath = (w, h, stepX, stepY) => {
  const p = Skia.Path.Make();

  //  Corners (clockwise from top of the step):
  //
  //        A ─────── B
  //        |         |         A = (stepX, 0)       — top-left of narrow arm
  //        |         |         B = (w, 0)            — top-right
  //  G────H|         |         H = (stepX, stepY)   — inner step corner
  //  |       C=w,stepY         G = (0, stepY)        — outer step corner
  //  |               |         F = (w, h)            — bottom-right
  //  F───────────────E         E = (0, h)            — bottom-left

  // Move to just after corner A (top-left of narrow arm)
  p.moveTo(stepX + R, 0);
  // Top edge → B
  p.lineTo(w - R, 0);
  // B: top-right corner (rounded)
  p.quadTo(w, 0, w, R);
  // Right edge down to just above F
  p.lineTo(w, h - R);
  // F: bottom-right corner (rounded)
  p.quadTo(w, h, w - R, h);
  // Bottom edge → E
  p.lineTo(R, h);
  // E: bottom-left corner (rounded)
  p.quadTo(0, h, 0, h - R);
  // Left edge up to just below G
  p.lineTo(0, stepY + R);
  // G: outer step corner — convex rounding going inward
  p.quadTo(0, stepY, R, stepY);
  // Step ledge → just before H
  p.lineTo(stepX - R, stepY);
  // H: inner step corner — concave, so control point is the corner itself
  p.quadTo(stepX, stepY, stepX, stepY - R);
  // Up to just below A
  p.lineTo(stepX, R);
  // A: top-left of narrow arm (rounded)
  p.quadTo(stepX, 0, stepX + R, 0);
  p.close();
  return p;
};

// ─── Game card ─────────────────────────────────────────────────────────────
const GameCardItem = React.memo(({ game, cardHeight, onPress }) => {

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
          <Ionicons name="game-controller-outline" size={32} color="#337418" />
        </View>
      )}

      <LinearGradient
        colors={['transparent', GAME_BG]}
        style={styles.cardOverlay}
      />
      <LinearGradient
        colors={[GAME_BG, 'transparent']}
        style={styles.cardTopFade}
      />


      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {game.name}
        </Text>
      </View>
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
  // heroRowHeight: the measured height of the pill row — used as stepY so the
  // L-shape notch bottom aligns exactly with the bottom of the row.
  const [heroRowHeight, setHeroRowHeight] = React.useState(0);
  // pillWidth: the measured width of the CategoryPill — used as stepX anchor.
  const [pillWidth, setPillWidth] = React.useState(0);

  const panelPath = React.useMemo(() => {
    const { width, height } = panelSize;
    if (!width || !height || !heroRowHeight || !pillWidth) return null;

    // heroRow has paddingLeft:12. The pill sits flush against the left padding,
    // so its right edge is at paddingLeft + pillWidth from the panel's left edge.
    // We add paddingRight:12 as the gap between the pill and the notch wall so
    // both gaps (below and to the right) are equal.
    const HERO_PAD_LEFT  = 12;
    const HERO_PAD_RIGHT = 12;
    const stepX = HERO_PAD_LEFT + pillWidth + HERO_PAD_RIGHT;

    // stepY equals the full measured height of heroRow so the notch bottom sits
    // flush with the row bottom on every device.
    const stepY = heroRowHeight;

    return buildPanelPath(width, height, stepX, stepY);
  }, [panelSize, heroRowHeight, pillWidth]);

  // heroRow is a fixed View (no longer a scrollable ListHeader)
  const renderListHeader = null;

  const renderListEmpty = useCallback(() => {
    if (isLoading) {
      return <SkeletonLoader cardHeight={cardHeight} count={6} />;
    }
    if (error) {
      return (
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
      );
    }
    return null;
  }, [isLoading, error, cardHeight, fetchGames, selectedCategory]);

  const renderListFooter = useCallback(() => {
    if (!(currentPage > 1 || hasMore)) return null;
    return (
      <View style={styles.paginationContainer}>
        {currentPage > 1 ? (
          <Pressable
            style={[styles.pageButton, isLoadingMore && styles.pageButtonDisabled]}
            onPress={handlePrevPage}
            accessibilityRole="button"
            accessibilityLabel="Previous page"
            disabled={isLoadingMore}
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
            style={[styles.pageButton, isLoadingMore && styles.pageButtonDisabled]}
            onPress={handleLoadMore}
            accessibilityRole="button"
            accessibilityLabel="Next page"
            disabled={isLoadingMore}
          >
            {isLoadingMore ? (
              <ActivityIndicator size="small" color={GAME_ACCENT} />
            ) : (
              <>
                <Text style={styles.pageButtonText}>Next</Text>
                <Ionicons name="chevron-forward" size={16} color={GAME_ACCENT} />
              </>
            )}
          </Pressable>
        ) : (
          <View style={styles.pageButtonPlaceholder} />
        )}
      </View>
    );
  }, [currentPage, hasMore, isLoadingMore, handlePrevPage, handleLoadMore]);

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
          <View
            style={styles.panelShell}
            onLayout={e => {
              const { width, height } = e.nativeEvent.layout;
              setPanelSize(p =>
                p.width === width && p.height === height ? p : { width, height }
              );
            }}
          >
            {/* Skia canvas — behind content */}
            {panelPath ? (
              <Canvas style={[StyleSheet.absoluteFill, { zIndex: -1 }]} pointerEvents="none">
                <SkiaPath path={panelPath} color="#337418" />
                <SkiaPath
                  path={panelPath}
                  color="#337418"
                  style="stroke"
                  strokeWidth={1.5}
                />
              </Canvas>
            ) : null}

            {/* Fixed hero row — CategoryPill + GAMES title, does NOT scroll */}
            <View
              style={styles.heroRow}
              onLayout={e => {
                const h = e.nativeEvent.layout.height;
                setHeroRowHeight(prev => (prev === h ? prev : h));
              }}
            >
              <View
                onLayout={e => {
                  const w = e.nativeEvent.layout.width;
                  setPillWidth(prev => (prev === w ? prev : w));
                }}
              >
                <CategoryPill
                  categories={['Trending', 'Popular', 'New']}
                  onCategoryChange={handleCategoryChange}
                  width={160}
                  accentColor={GAME_ACCENT}
                />
              </View>
              <Text style={styles.gamesText}>GAMES</Text>
            </View>

            {/* Scrollable cards only */}
            <FlashList
              data={games}
              renderItem={renderGameCard}
              keyExtractor={keyExtractor}
              estimatedItemSize={cardHeight + 16}
              numColumns={2}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.flashListContent}
              ListEmptyComponent={renderListEmpty}
              ListFooterComponent={renderListFooter}
              removeClippedSubviews
              initialNumToRender={8}
              maxToRenderPerBatch={8}
              windowSize={6}
              updateCellsBatchingPeriod={50}
              drawDistance={200}
            />
          </View>
        )}
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
    backgroundColor: '#337418',
    borderRadius: 152,
    borderCurve: 'continuous',
    opacity: 0.15,
    transform: [{ scaleX: 1.5 }, { rotate: '25deg' }],
  },
  blobShape2: {
    position: 'absolute',
    top: 96, left: -96,
    width: 248, height: 248,
    backgroundColor: '#337418',
    borderRadius: 124,
    borderCurve: 'continuous',
    opacity: 0.10,
    transform: [{ scaleY: 1.3 }, { rotate: '-15deg' }],
  },
  blobShape3: {
    position: 'absolute',
    top: 200, right: 48,
    width: 200, height: 200,
    backgroundColor: '#5DD62C',
    borderRadius: 100,
    borderCurve: 'continuous',
    opacity: 0.06,
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
    backgroundColor: '#337418',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: -4, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#337418',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: GAME_TEXT,
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
  panelShell: {
    flex: 1,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 12,
    paddingBottom: 12,
  },
  gamesText: {
    fontSize: 36,
    fontFamily: 'Genjiro',
    color: GAME_TEXT,
    letterSpacing: 3,
    textShadowColor: '#337418',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  flashListContent: {
    paddingBottom: 80,
    paddingHorizontal: 6,
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
    borderColor: '#2A2A2A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
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
    backgroundColor: '#1A1A1A',
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  cardTopFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 20,
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
    color: GAME_TEXT,
  },
  cardContent: {
    position: 'absolute',
    left: 10, right: 10, bottom: 10,
  },
  cardTitle: {
    color: GAME_TEXT,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
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
  pageButtonDisabled: {
    opacity: 0.6,
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
