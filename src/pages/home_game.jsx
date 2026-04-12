import React, { useState, useEffect, useCallback, useMemo, useRef, createRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  StatusBar,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Canvas, Path as SkiaPath, Skia } from '@shopify/react-native-skia';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useProfileStore } from '../stores/useProfileStore';
import { getMediaTheme } from '../utils/mediaThemes';
import { setWishlist, setMediaStatus } from '../services/mediaStatusService';
import CategoryPill from '../components/home_page/CategoryPill';
import SideBar from '../components/home_page/SideBar';
import SkeletonLoader from '../components/skeletons/SkeletonHome';
import { KeyboardAwareSearchBar } from '../components/home_page/SearchBar';
import SearchSuggestionsOverlay from '../components/home_page/SearchSuggestionsOverlay';
import InlineSearchResults from '../components/home_page/InlineSearchResults';
import QuickActionOverlay from '../components/shared/QuickActionOverlay';
import {
  getTrendingGames,
  getPopularGames,
  getNewReleases,
} from '../services/api_rawg';
import {
  getIGDBTrending,
  getIGDBPopular,
  getIGDBNewReleases,
} from '../services/api_igdb';
import { hasIGDBCredentials } from '../services/settings';
import { searchMedia, debounce } from '../services/search';

const GAME_PILL_HEIGHT = 60;
const GAME_PILL_RADIUS = 22;
const PAGE_SIZE = 20;
const GAME_ACCENT = '#2FD9F5';
const GAME_ACCENT_LIGHT = '#8EEFFF';
const GAME_ACCENT2 = '#0E6F88';
const GAME_BG = '#071118';
const GAME_CARD_BG = '#0C1D27';
const GAME_TEXT = '#F8F8F8';
const GAME_TEXT_MUTED = '#78AFC0';
const GAME_BORDER = '#123341';
const GAME_DANGER = '#FF6B6B';
const GAME_THEME = {
  ...getMediaTheme('game'),
  accent: GAME_ACCENT,
  accentLight: GAME_ACCENT_LIGHT,
  accentGlow: 'rgba(47, 217, 245, 0.55)',
};

// ── Inverted-L panel constants ──
// R matches the pill's own borderRadius so the notch corners look identical.
// STEP_X and STEP_Y are derived at runtime from the measured pill size so the
// shape stays flush on every screen width (see heroRow onLayout below).
const R = GAME_PILL_RADIUS; // shared radius for the game pill and panel notch

const buildPanelPath = (w, h, stepX, stepY) => {
  const p = Skia.Path.Make();
  // Keep every turn in the panel on the same rounded language as the pill.
  // Use softer continuous turns so the panel reads closer to a squircle than a
  // standard rounded rectangle, especially at the inner elbow.
  const outerRadius = Math.min(R, stepY * 0.46, stepX * 0.24);
  const topRadius = Math.min(R, stepY * 0.46, stepX * 0.2);
  const notchRadius = Math.min(R, stepY * 0.34, stepX * 0.18);
  const smooth = 0.44;

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
  p.moveTo(stepX + topRadius, 0);
  // Top edge → B
  p.lineTo(w - R, 0);
  // B: top-right corner
  p.cubicTo(w - R * smooth, 0, w, R * smooth, w, R);
  // Right edge down to just above F
  p.lineTo(w, h - R);
  // F: bottom-right corner
  p.cubicTo(w, h - R * smooth, w - R * smooth, h, w - R, h);
  // Bottom edge → E
  p.lineTo(R, h);
  // E: bottom-left corner
  p.cubicTo(R * smooth, h, 0, h - R * smooth, 0, h - R);
  // Left edge up to below G
  p.lineTo(0, stepY + outerRadius);
  // Outer elbow
  p.cubicTo(0, stepY + outerRadius * smooth, outerRadius * smooth, stepY, outerRadius, stepY);
  // Inner elbow
  p.lineTo(stepX - notchRadius, stepY);
  p.cubicTo(
    stepX - notchRadius * smooth,
    stepY,
    stepX,
    stepY - notchRadius * smooth,
    stepX,
    stepY - notchRadius,
  );
  // Vertical stem back to the top arm
  p.lineTo(stepX, topRadius);
  // Top-left corner of the narrow arm
  p.cubicTo(stepX, topRadius * smooth, stepX + topRadius * smooth, 0, stepX + topRadius, 0);
  p.close();
  return p;
};

// ─── Game card ─────────────────────────────────────────────────────────────
const GameCardItem = React.memo(
  React.forwardRef(({ game, cardHeight, onPress, onLongPress, columnIndex }, ref) => {
    return (
      <Pressable
        ref={ref}
        style={({ pressed }) => [
          styles.gameCard,
          { height: cardHeight },
          pressed && styles.gameCardPressed,
        ]}
        onPress={() => onPress(game)}
        onLongPress={() => onLongPress?.(game, columnIndex)}
        delayLongPress={400}
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
            <Ionicons name="game-controller-outline" size={32} color={GAME_ACCENT} />
          </View>
        )}

        <LinearGradient
          colors={['transparent', GAME_BG]}
          style={styles.cardOverlay}
        />

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {game.name}
          </Text>
        </View>
      </Pressable>
    );
  })
);

GameCardItem.displayName = 'GameCardItem';

// ─── Main screen ──────────────────────────────────────────────────────────
const GameHome = ({ navigation }) => {
  const tabBarHeight = 60; // NavBar height (material-top-tabs has no useBottomTabBarHeight)
  const { width: viewportWidth, height: viewportHeight } = useWindowDimensions();
  const isLandscape = viewportWidth > viewportHeight;
  const isTablet = Math.min(viewportWidth, viewportHeight) >= 768;
  const isCompactPhone = viewportWidth <= 360;
  const gridColumns = isTablet ? (isLandscape ? 4 : 3) : 2;

  const cardHeight = useMemo(() => {
    const panelHorizontalMargins = 24; // panelShell marginHorizontal * 2
    const listHorizontalPadding = (isTablet ? 10 : 6) * 2;
    const cardHorizontalMargins = gridColumns * 12; // each card has margin: 6
    const availableWidth = Math.max(
      260,
      viewportWidth - panelHorizontalMargins - listHorizontalPadding - cardHorizontalMargins,
    );
    const cardWidth = availableWidth / gridColumns;
    return Math.round(cardWidth * 1.44);
  }, [gridColumns, isTablet, viewportWidth]);

  const categoryPillWidth = useMemo(() => {
    if (isTablet) return isLandscape ? 220 : 200;
    if (isCompactPhone) return 136;
    if (viewportWidth <= 400) return 148;
    return 160;
  }, [isCompactPhone, isLandscape, isTablet, viewportWidth]);

  const gamesTitleDynamicStyle = useMemo(() => ({
    fontSize: isTablet ? (isLandscape ? 42 : 38) : (isCompactPhone ? 28 : 36),
    letterSpacing: isTablet ? 4 : (isCompactPhone ? 2 : 3),
  }), [isCompactPhone, isLandscape, isTablet]);

  const heroRowDynamicStyle = useMemo(() => ({
    gap: isCompactPhone ? 6 : 10,
    paddingTop: isTablet ? 18 : 16,
    paddingBottom: isTablet ? 18 : 16,
    paddingLeft: isTablet ? 18 : 16,
    paddingRight: isTablet ? 18 : 16,
  }), [isCompactPhone, isTablet]);

  const flashListContentStyle = useMemo(() => ({
    paddingTop: isTablet ? 24 : 20,
    paddingBottom: isTablet ? 96 : 80,
    paddingHorizontal: isTablet ? 10 : 6,
  }), [isTablet]);

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
  const [useIGDB, setUseIGDB]                 = useState(false);
  const [isRawgFallback, setIsRawgFallback]   = useState(false);
  const [credentialsChecked, setCredentialsChecked] = useState(false);
  const [forceRawg, setForceRawg]             = useState(false);
  const fetchRequestIdRef = useRef(0);
  const searchRequestIdRef = useRef(0);

  const userProfile  = useProfileStore(s => s.profile);
  const fetchProfile = useProfileStore(s => s.fetchProfile);

  // Profile
  useEffect(() => {
    fetchProfile();
    const unsub = navigation.addListener('focus', fetchProfile);
    return unsub;
  }, [navigation, fetchProfile]);

  // ── Long-press quick action state ──
  const [longPressTarget, setLongPressTarget] = useState(null);
  const [showAuthAlert, setShowAuthAlert] = useState(false);
  const cardRefsMap = useRef({});

  const getCardRef = useCallback((id) => {
    if (!cardRefsMap.current[id]) {
      cardRefsMap.current[id] = createRef();
    }
    return cardRefsMap.current[id];
  }, []);

  const handleCardLongPress = useCallback((game, columnIndex) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const ref = cardRefsMap.current[game.id];
    if (!ref?.current) return;

    ref.current.measure((x, y, width, height, pageX, pageY) => {
      setLongPressTarget({
        game,
        cardLayout: { x: pageX, y: pageY, width, height },
        isLeftColumn: columnIndex === 0,
      });
    });
  }, []);

  const handleQuickWishlist = useCallback(async (game, newWishlistState) => {
    if (!userProfile) {
      setLongPressTarget(null);
      setShowAuthAlert(true);
      return;
    }
    await setWishlist('games', game.id, newWishlistState);
  }, [userProfile]);

  const handleQuickCompleted = useCallback(async (game, newStatus) => {
    if (!userProfile) {
      setLongPressTarget(null);
      setShowAuthAlert(true);
      return;
    }
    await setMediaStatus('games', game.id, newStatus);
  }, [userProfile]);

  // Check IGDB credentials once — determines which API to use for listings
  useEffect(() => {
    hasIGDBCredentials().then(has => {
      setUseIGDB(!!has);
      setCredentialsChecked(true);
    });
  }, []);

  // Fetch games — waits for credential check, IGDB-only or RAWG-only
  const fetchGames = useCallback(async (category, page = 1) => {
    if (!credentialsChecked) return; // don't fetch until we know which API
    const requestId = ++fetchRequestIdRef.current;

    setIsLoadingMore(page > 1);
    setIsLoading(page === 1);
    setError(null);
    try {
      let data;

      if (useIGDB && !forceRawg) {
        // Use IGDB exclusively — no RAWG fallback
        switch (category) {
          case 'Popular': data = await getIGDBPopular(page, PAGE_SIZE);      break;
          case 'New':     data = await getIGDBNewReleases(page, PAGE_SIZE);  break;
          default:        data = await getIGDBTrending(page, PAGE_SIZE);     break;
        }
      } else {
        // Use RAWG (no IGDB credentials or user chose RAWG)
        switch (category) {
          case 'Popular': data = await getPopularGames(page, PAGE_SIZE);  break;
          case 'New':     data = await getNewReleases(page, PAGE_SIZE);   break;
          default:        data = await getTrendingGames(page, PAGE_SIZE); break;
        }
      }

      // Ignore stale responses when user changes category/page quickly.
      if (requestId !== fetchRequestIdRef.current) return;

      setGames(page === 1 ? (data?.results || []) : prev => [...prev, ...(data?.results || [])]);
      setCurrentPage(page);
      setHasMore(Boolean(data?.next));
      setIsRawgFallback(forceRawg);
    } catch (err) {
      if (requestId !== fetchRequestIdRef.current) return;
      console.error('Error loading games:', err);

      // If IGDB failed, ask user what to do
      if (useIGDB && !forceRawg) {
        setIsLoading(false);
        setIsLoadingMore(false);
        Alert.alert(
          'IGDB API Error',
          'Could not fetch games from IGDB. Your API credentials may be invalid or the server is unavailable.',
          [
            {
              text: 'Check API Settings',
              onPress: () => navigation.navigate('ProfilePage'),
            },
            {
              text: 'Continue with RAWG',
              style: 'destructive',
              onPress: () => {
                setForceRawg(true);
                setIsRawgFallback(true);
              },
            },
          ],
          { cancelable: false }
        );
        return;
      }

      setError('Failed to load games. Please try again.');
    } finally {
      if (requestId !== fetchRequestIdRef.current) return;
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [useIGDB, credentialsChecked, forceRawg, navigation]);

  // Trigger fetch when credentials resolve, forceRawg changes, or category changes
  useEffect(() => {
    if (credentialsChecked) fetchGames(selectedCategory);
  }, [credentialsChecked, forceRawg, selectedCategory, fetchGames]);

  const handleCategoryChange = useCallback((cat) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
    setHasMore(true);
    setGames([]);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (!isLoading && !isLoadingMore && hasMore) fetchGames(selectedCategory, currentPage + 1);
  }, [isLoading, isLoadingMore, hasMore, currentPage, selectedCategory, fetchGames]);

  // Search
  const performSuggestionSearch = useCallback(
    debounce(async (query) => {
      const requestId = ++searchRequestIdRef.current;
      if (!query || query.trim().length < 2) {
        setSearchResults([]); setIsSearching(false); return;
      }
      setIsSearching(true);
      try {
        const results = await searchMedia(query, 'games', 3);
        if (requestId !== searchRequestIdRef.current) return;
        setSearchResults(results);
      } catch {
        if (requestId !== searchRequestIdRef.current) return;
        setSearchResults([]);
      } finally {
        if (requestId !== searchRequestIdRef.current) return;
        setIsSearching(false);
      }
    }, 500),
    [],
  );

  useEffect(() => () => {
    performSuggestionSearch.cancel?.();
    searchRequestIdRef.current += 1;
  }, [performSuggestionSearch]);

  const handleSearchChange = useCallback((text) => {
    searchRequestIdRef.current += 1;
    setSearchQuery(text);
    setIsSearchSubmitted(false);
    if (text.trim().length >= 2) performSuggestionSearch(text);
    else { setSearchResults([]); setIsSearching(false); }
  }, [performSuggestionSearch]);

  const handleSearchSubmit = useCallback(async () => {
    if (!searchQuery || searchQuery.trim().length < 2) return;
    const requestId = ++searchRequestIdRef.current;
    performSuggestionSearch.cancel?.();
    setIsSearchSubmitted(true);
    Keyboard.dismiss();
    setIsSearching(true);
    try {
      const results = await searchMedia(searchQuery, 'games', 50);
      if (requestId !== searchRequestIdRef.current) return;
      setSearchResults(results);
    } catch {
      if (requestId !== searchRequestIdRef.current) return;
      setSearchResults([]);
    } finally {
      if (requestId !== searchRequestIdRef.current) return;
      setIsSearching(false);
    }
  }, [searchQuery, performSuggestionSearch]);

  const handleSearchCancel = useCallback(() => {
    setSearchQuery(''); setSearchResults([]);
    setIsSearching(false); setIsSearchSubmitted(false);
  }, []);

  const handleSearchResultPress = useCallback((item) => {
    navigation.navigate('DetailsGames', {
      gameId: item.id,
      gameName: item.title,
      coverImage: item.coverImage,
      igdbId: item.id,  // search uses IGDB — pass id for direct lookup
    });
    handleSearchCancel();
  }, [navigation, handleSearchCancel]);

  const handleGamePress = useCallback((game) => {
    navigation.navigate('DetailsGames', {
      gameId: game.id,
      gameName: game.name,
      coverImage: game.coverImage || game.background_image,
      // If from IGDB, pass igdbId so details page skips name-search
      ...(game._source === 'igdb' ? { igdbId: game.id } : {
        rating: game.rating,
        metacritic: game.metacritic,
        genres: game.genres?.map(g => g.name) || [],
        playtime: game.playtime,
        esrbRating: game.esrb_rating?.name || 'Not Rated',
      }),
    });
  }, [navigation]);

  const renderGameCard = useCallback(({ item, index }) => {
    const columnIndex = index % gridColumns;
    return (
      <GameCardItem 
        ref={getCardRef(item.id)}
        game={item} 
        cardHeight={cardHeight} 
        onPress={handleGamePress}
        onLongPress={handleCardLongPress}
        columnIndex={columnIndex}
      />
    );
  }, [cardHeight, handleGamePress, handleCardLongPress, getCardRef, gridColumns]);

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

    // Use the same inset around the pill on the top, right, and bottom so the
    // notch and the category pill run parallel with a consistent gap.
    const heroInset = Math.max(0, Math.round((heroRowHeight - GAME_PILL_HEIGHT) / 2));
    const stepX = heroInset + pillWidth + heroInset;
    const stepY = Math.min(heroRowHeight, heroInset + GAME_PILL_HEIGHT + heroInset);

    return buildPanelPath(width, height, stepX, stepY);
  }, [panelSize, heroRowHeight, pillWidth]);

  // heroRow is a fixed View (no longer a scrollable ListHeader)
  const renderListHeader = null;

  const renderListEmpty = useMemo(() => {
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

  const renderListFooter = useMemo(() => {
    if (!isLoadingMore) {
      return <View style={styles.listFooterSpacer} />;
    }
    return (
      <View style={[styles.loadMoreContainer, isTablet && styles.loadMoreContainerTablet]}>
        <ActivityIndicator size="small" color={GAME_ACCENT} />
      </View>
    );
  }, [isLoadingMore, isTablet]);

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
          <Ionicons name="menu" size={22} color={GAME_ACCENT} />
        </Pressable>

        <Text style={styles.headerTitle}>{GAME_THEME.name.toUpperCase()}</Text>

        <Pressable
          style={[styles.profileButton, isRawgFallback && styles.profileButtonFallback]}
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
          <View style={styles.searchResultsWrapper}>
            <InlineSearchResults
              results={searchResults}
              isLoading={isSearching}
              searchQuery={searchQuery}
              onResultPress={handleSearchResultPress}
              onClearSearch={handleSearchCancel}
              theme={GAME_THEME}
            />
          </View>
        ) : (
          <View
            style={[styles.panelShell, isTablet && styles.panelShellTablet]}
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
                <SkiaPath path={panelPath} color={GAME_ACCENT2} />
                <SkiaPath
                  path={panelPath}
                  color={GAME_ACCENT2}
                  style="stroke"
                  strokeWidth={1.5}
                />
              </Canvas>
            ) : null}

            {/* Fixed hero row — CategoryPill + GAMES title, does NOT scroll */}
            <View
              style={[styles.heroRow, heroRowDynamicStyle]}
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
                  width={categoryPillWidth}
                  height={GAME_PILL_HEIGHT}
                  borderRadius={GAME_PILL_RADIUS}
                  accentColor={GAME_ACCENT}
                />
              </View>
              <Text style={[styles.gamesText, gamesTitleDynamicStyle]} numberOfLines={1}>
                GAMES
              </Text>
            </View>

            {/* Scrollable cards only */}
            <FlashList
              key={`games-grid-${gridColumns}`}
              data={games}
              renderItem={renderGameCard}
              keyExtractor={keyExtractor}
              estimatedItemSize={cardHeight + 16}
              numColumns={gridColumns}
              style={styles.flashList}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={flashListContentStyle}
              ListEmptyComponent={renderListEmpty}
              ListFooterComponent={renderListFooter}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.35}
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

      {/* ── Quick Action Overlay ─────────────────────────────────────────── */}
      <QuickActionOverlay
        visible={!!longPressTarget}
        onClose={() => setLongPressTarget(null)}
        media={longPressTarget?.game}
        mediaType="games"
        cardLayout={longPressTarget?.cardLayout}
        isLeftColumn={longPressTarget?.isLeftColumn}
        onWishlist={handleQuickWishlist}
        onCompleted={handleQuickCompleted}
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
    backgroundColor: GAME_ACCENT2,
    borderRadius: 152,
    borderCurve: 'continuous',
    opacity: 0.15,
    transform: [{ scaleX: 1.5 }, { rotate: '25deg' }],
  },
  blobShape2: {
    position: 'absolute',
    top: 96, left: -96,
    width: 248, height: 248,
    backgroundColor: GAME_ACCENT2,
    borderRadius: 124,
    borderCurve: 'continuous',
    opacity: 0.10,
    transform: [{ scaleY: 1.3 }, { rotate: '-15deg' }],
  },
  blobShape3: {
    position: 'absolute',
    top: 200, right: 48,
    width: 200, height: 200,
    backgroundColor: GAME_ACCENT,
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
    backgroundColor: GAME_ACCENT2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: -4, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: GAME_ACCENT_LIGHT,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: GAME_TEXT,
    fontFamily: GAME_THEME.contentFont,
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
  profileButtonFallback: {
    overflow: 'visible',
    borderWidth: 2.5,
    borderColor: '#FF4444',
    shadowColor: '#FF4444',
    shadowOpacity: 0.5,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
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
  panelShellTablet: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 1180,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gamesText: {
    fontSize: 36,
    fontFamily: GAME_THEME.headingFont,
    color: GAME_TEXT,
    letterSpacing: 3,
    textShadowColor: GAME_ACCENT_LIGHT,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  flashList: {
    marginTop: 8,
  },
  searchResultsWrapper: {
    flex: 1,
    paddingTop: 20,
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
    borderColor: GAME_BORDER,
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
    backgroundColor: GAME_BG,
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  cardContent: {
    position: 'absolute',
    left: 10, right: 10, bottom: 10,
  },
  cardTitle: {
    color: GAME_TEXT,
    fontSize: 13,
    fontFamily: 'Blackbots',
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
    color: GAME_DANGER,
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

  loadMoreContainer: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadMoreContainerTablet: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 760,
  },
  listFooterSpacer: {
    height: 28,
  },

  // ── Legacy pagination styles ──
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 8,
  },
  paginationContainerTablet: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 760,
  },
  pageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(14,111,136,0.18)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: 'rgba(47,217,245,0.26)',
    minWidth: 90,
  },
  pageButtonDisabled: {
    opacity: 0.6,
  },
  pageButtonPlaceholder: { minWidth: 90 },
  pageButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: GAME_THEME.contentFont,
    letterSpacing: 0.5,
  },
  pageIndicator: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: GAME_THEME.contentFont,
    letterSpacing: 0.5,
  },
});

export default GameHome;
