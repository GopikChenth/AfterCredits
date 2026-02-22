/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║              DETAILS MOVIES PAGE                                ║
 * ║                                                                  ║
 * ║  Data source: TMDB (The Movie Database)                         ║
 * ║    • Fetch full movie detail via getMovieDetails (credits,       ║
 * ║      recommendations, reviews, videos, images).                  ║
 * ║    • Route params supply instant poster/title while loading.    ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  Dimensions,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
  Animated,
  StatusBar,
  FlatList,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import StatsPill from '../components/details_page/StatsPill';
import GenrePill from '../components/details_page/GenrePill';
import ReviewCard from '../components/details_page/ReviewCard';
import StatusTag from '../components/details_page/StatusTag';
import DetailsSkeleton from '../components/skeletons/SkeletonDetails';
import { getMovieDetails } from '../services/api_movies';
import { getMediaReviews, getMediaReviewStats } from '../services/reviewService';
import { getMediaStatus, setMediaStatus, setWishlist } from '../services/mediaStatusService';

const { width } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────────────────────
// ACCENT COLOURS  (Sunset Amber — movies palette)
// ─────────────────────────────────────────────────────────────────────────────
const ACCENT   = '#FF6B35';   // Sunset Orange
const ACCENT2  = '#FFB347';   // Amber
const BG       = '#0E0A07';   // Dark warm brown
const CARD_BG  = '#1F1209';   // Warm dark card
const BLOB1    = '#FF4500';   // Deep sunset red
const BLOB2    = '#FF6B35';   // Sunset orange
const BLOB3    = '#FFB347';   // Amber glow

const IMG_BASE = 'https://image.tmdb.org/t/p';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const formatRuntime = (minutes) => {
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};



// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

/** Cast member card (horizontal scroll) */
const CastCard = ({ person }) => (
  <View style={styles.castCard}>
    {person.profile_path ? (
      <Image
        source={{ uri: `${IMG_BASE}/w185${person.profile_path}` }}
        style={styles.castImage}
        resizeMode="cover"
      />
    ) : (
      <View style={[styles.castImage, styles.castPlaceholder]}>
        <Ionicons name="person" size={28} color="#555" />
      </View>
    )}
    <Text style={styles.castName} numberOfLines={2}>{person.name}</Text>
    <Text style={styles.castRole} numberOfLines={1}>{person.character}</Text>
  </View>
);

/** Trailer thumbnail */
const TrailerCard = ({ video }) => {
  const thumbnail = `https://img.youtube.com/vi/${video.key}/hqdefault.jpg`;
  return (
    <Pressable
      style={styles.trailerCard}
      onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${video.key}`)}
    >
      <Image source={{ uri: thumbnail }} style={styles.trailerThumb} resizeMode="cover" />
      <View style={styles.trailerOverlay}>
        <View style={styles.playButton}>
          <Ionicons name="play" size={20} color="#fff" />
        </View>
      </View>
      <Text style={styles.trailerName} numberOfLines={1}>{video.name}</Text>
    </Pressable>
  );
};

/** Production company row */
const CompanyRow = ({ name, role }) => (
  <View style={styles.companyRow}>
    <View style={styles.companyAvatar}>
      <Ionicons name="business-outline" size={16} color={ACCENT} />
    </View>
    <View>
      <Text style={styles.companyName}>{name}</Text>
      <Text style={styles.companyRole}>{role}</Text>
    </View>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

const MovieDetail = ({ route, navigation }) => {
  // Route params (instant display while loading)
  const {
    movieId,
    movieTitle,
    coverImage: routeCover,
  } = route?.params || {};

  // State
  const [movieData, setMovieData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [userStatus, setUserStatus] = useState(null);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const [dbReviews, setDbReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ count: 0, averageRating: 0 });
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);

  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [currentReviewPage, setCurrentReviewPage] = useState(1);
  const [titleY, setTitleY] = useState(0);

  const headerOpacity = useRef(new Animated.Value(0)).current;

  // ── Data fetching ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (movieId) fetchAll();
  }, [movieId]);

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const data = await getMovieDetails(movieId);
      if (!data) throw new Error('No data returned.');
      setMovieData(data);
    } catch (err) {
      console.error('MovieDetail fetch error:', err);
      Alert.alert(
        'TMDB Error',
        'Could not load movie details. Please check your API key and try again.',
        [
          { text: 'Go Back', onPress: () => navigation?.goBack(), style: 'cancel' },
          { text: 'Retry', onPress: () => fetchAll() },
        ],
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Reviews (from Supabase)
  useEffect(() => {
    if (!movieId) return;
    const load = async () => {
      setIsLoadingReviews(true);
      try {
        const [rv, st] = await Promise.allSettled([
          getMediaReviews('movies', movieId),
          getMediaReviewStats('movies', movieId),
        ]);
        if (rv.status === 'fulfilled' && rv.value?.success) setDbReviews(rv.value.reviews || []);
        if (st.status === 'fulfilled' && st.value?.success) setReviewStats(st.value.stats);
      } finally {
        setIsLoadingReviews(false);
      }
    };
    load();
  }, [movieId]);

  // User status
  useEffect(() => {
    if (!movieId) return;
    getMediaStatus('movies', movieId).then(r => {
      if (r.success && r.data) {
        setUserStatus(r.data.status);
        setIsWishlisted(r.data.is_wishlisted);
      }
    });
  }, [movieId]);

  // Handlers
  const handleStatusChange = async (newStatus) => {
    setUserStatus(newStatus);
    await setMediaStatus('movies', movieId, newStatus);
  };

  const handleWishlistToggle = async (wishlisted) => {
    setIsWishlisted(wishlisted);
    await setWishlist('movies', movieId, wishlisted);
  };

  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const trigger = titleY > 0 ? titleY : 120;
    headerOpacity.setValue(offsetY > trigger ? 1 : 0);
  };

  // ── Derived data ──────────────────────────────────────────────────────────

  const title       = movieData?.title || movieTitle || 'Loading…';
  const tagline     = movieData?.tagline || '';
  const overview    = movieData?.overview || '';
  const backdrop    = movieData?.backdrop_path ? `${IMG_BASE}/w780${movieData.backdrop_path}` : routeCover;
  const poster      = movieData?.poster_path ? `${IMG_BASE}/w500${movieData.poster_path}` : routeCover;
  const genres      = movieData?.genres?.map(g => g.name) || [];
  const runtime     = formatRuntime(movieData?.runtime);
  const releaseDate = movieData?.release_date || 'TBA';
  const releaseYear = releaseDate !== 'TBA' ? new Date(releaseDate).getFullYear() : 'TBA';
  const status      = movieData?.status || 'Unknown';
  const voteAvg     = movieData?.vote_average ? Math.round(movieData.vote_average * 10) : null;
  const voteCount   = movieData?.vote_count || 0;


  // Cast (top 20)
  const cast = movieData?.credits?.cast?.slice(0, 20) || [];

  // Key crew (Director, Writer, Producer)
  const director = movieData?.credits?.crew?.find(c => c.job === 'Director');
  const writers  = movieData?.credits?.crew?.filter(c => c.department === 'Writing')?.slice(0, 3) || [];
  const producers = movieData?.production_companies?.slice(0, 5) || [];

  // Trailers (YouTube only)
  const trailers = movieData?.videos?.results?.filter(
    v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
  )?.slice(0, 6) || [];

  // Recommendations
  const recommendations = movieData?.recommendations?.results?.slice(0, 15) || [];

  // TMDB reviews
  const tmdbReviews = movieData?.reviews?.results?.slice(0, 5) || [];

  // ── Background blobs ──

  const Blobs = () => (
    <View style={styles.backgroundShapes} pointerEvents="none">
      <View style={styles.blobShape1} />
      <View style={styles.blobShape2} />
      <View style={styles.blobShape3} />
    </View>
  );

  // ── Loading ──

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Blobs />
        <DetailsSkeleton />
      </View>
    );
  }

  if (!movieData) return <View style={styles.container}><Blobs /></View>;

  // ── Pagination for user reviews ──

  const REVIEWS_PER_PAGE = 10;
  const allReviews = [
    ...dbReviews.map(r => ({
      id: r.id,
      name: r.profiles?.use_display_name && r.profiles?.display_name
        ? r.profiles.display_name
        : r.profiles?.username || `User ${r.user_id?.substring(0, 8)}`,
      rating: Math.ceil(r.overall_rating / 2),
      text: r.content,
      avatarUrl: r.profiles?.avatar_url,
      source: 'app',
    })),
    ...tmdbReviews.map(r => ({
      id: r.id,
      name: r.author_details?.username || r.author || 'TMDB User',
      rating: r.author_details?.rating ? Math.ceil(r.author_details.rating / 2) : null,
      text: r.content?.substring(0, 500) + (r.content?.length > 500 ? '…' : ''),
      avatarUrl: r.author_details?.avatar_path
        ? (r.author_details.avatar_path.startsWith('/http')
          ? r.author_details.avatar_path.substring(1)
          : `${IMG_BASE}/w45${r.author_details.avatar_path}`)
        : null,
      source: 'tmdb',
    })),
  ];
  const totalReviewPages = Math.ceil(allReviews.length / REVIEWS_PER_PAGE);
  const visibleReviews = allReviews.slice(
    (currentReviewPage - 1) * REVIEWS_PER_PAGE,
    currentReviewPage * REVIEWS_PER_PAGE,
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />

      {/* Scroll-reveal header */}
      <SafeAreaView style={styles.headerSafeArea} edges={['top']}>
        <Animated.View
          style={[
            styles.animatedHeader,
            {
              transform: [{
                translateY: headerOpacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-100, 0],
                }),
              }],
            },
          ]}
        >
          <View style={styles.headerBlur}>
            <Pressable style={styles.headerBackButton} onPress={() => navigation?.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </Pressable>
            <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
          </View>
        </Animated.View>
      </SafeAreaView>

      {/* Background blobs */}
      <Blobs />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Back button over hero */}
        <Pressable style={styles.backButton} onPress={() => navigation?.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </Pressable>

        {/* ── Hero / Backdrop ── */}
        <View style={styles.heroSection}>
          <Image
            source={{ uri: backdrop }}
            style={styles.backdropImage}
            resizeMode="cover"
          />
          <View style={styles.heroGradient} />
        </View>

        {/* ── Description card ── */}
        <BlurView intensity={80} tint="dark" style={styles.blurCard}>
          <View
            style={styles.titleRow}
            onLayout={(e) => {
              e.target.measure((x, y, w, h, px, py) => setTitleY(py + h));
            }}
          >
            <Text style={styles.mainTitle}>{title}</Text>
            <Text style={styles.releaseYear}>{releaseYear}</Text>
          </View>

          {tagline ? <Text style={styles.taglineText}>"{tagline}"</Text> : null}

          {/* Meta row */}
          <View style={styles.metaRow}>
            {runtime && (
              <View style={styles.metaChip}>
                <Ionicons name="time-outline" size={12} color={ACCENT2} />
                <Text style={styles.metaChipText}>{runtime}</Text>
              </View>
            )}
            <View style={styles.metaChip}>
              <Ionicons name="calendar-outline" size={12} color={ACCENT2} />
              <Text style={styles.metaChipText}>{releaseDate}</Text>
            </View>
            <View style={styles.metaChip}>
              <Ionicons name="flag-outline" size={12} color={ACCENT2} />
              <Text style={styles.metaChipText}>{status}</Text>
            </View>
          </View>

          {/* Overview */}
          <Text
            style={styles.description}
            numberOfLines={isDescriptionExpanded ? undefined : 4}
          >
            {overview || 'No description available.'}
          </Text>
          {overview.length > 200 && (
            <Pressable onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}>
              <Text style={styles.expandText}>
                {isDescriptionExpanded ? 'Show Less' : 'Read More'}
              </Text>
            </Pressable>
          )}
        </BlurView>

        {/* ── Stats pills ── */}
        <View style={styles.statsSection}>
          <StatsPill label="Rating" count={voteAvg ? `${voteAvg}%` : 'N/A'} color={ACCENT} />
          <StatsPill label="Votes" count={voteCount.toLocaleString()} color={ACCENT2} />
          <StatsPill label="Runtime" count={runtime || 'N/A'} color="#F9A8D4" />
        </View>



        {/* ── User status ── */}
        <View style={styles.statusSection}>
          <Text style={styles.statusSectionLabel}>MY STATUS</Text>
          <StatusTag
            status={userStatus}
            isWishlisted={isWishlisted}
            onStatusChange={handleStatusChange}
            onWishlistToggle={handleWishlistToggle}
            mediaType="movies"
          />
        </View>

        {/* ── Genres ── */}
        {genres.length > 0 && (
          <BlurView intensity={80} tint="dark" style={styles.blurCard}>
            <Text style={styles.sectionLabel}>GENRES</Text>
            <View style={styles.pillRow}>
              {genres.map((g, i) => <GenrePill key={i} genre={g} />)}
            </View>
          </BlurView>
        )}

        {/* ── Director & Production ── */}
        {(director || producers.length > 0) && (
          <BlurView intensity={80} tint="dark" style={styles.blurCard}>
            <Text style={styles.sectionLabel}>PRODUCTION</Text>
            <View style={styles.companyList}>
              {director && <CompanyRow name={director.name} role="Director" />}
              {writers.map((w, i) => <CompanyRow key={`w-${i}`} name={w.name} role={w.job} />)}
              {producers.map((p, i) => <CompanyRow key={`p-${i}`} name={p.name} role="Production Company" />)}
            </View>
          </BlurView>
        )}

        {/* ── Cast ── */}
        {cast.length > 0 && (
          <View style={styles.sectionOuter}>
            <Text style={[styles.sectionLabel, { paddingHorizontal: 20, marginBottom: 10 }]}>CAST</Text>
            <FlatList
              data={cast}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              keyExtractor={(item) => item.credit_id || item.id?.toString()}
              renderItem={({ item }) => <CastCard person={item} />}
            />
          </View>
        )}

        {/* ── Trailers ── */}
        {trailers.length > 0 && (
          <View style={styles.sectionOuter}>
            <Text style={[styles.sectionLabel, { paddingHorizontal: 20, marginBottom: 10 }]}>TRAILERS</Text>
            <FlatList
              data={trailers}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <TrailerCard video={item} />}
            />
          </View>
        )}

        {/* ── Reviews ── */}
        <BlurView intensity={80} tint="dark" style={styles.blurCard}>
          <View style={styles.reviewsHeader}>
            <Text style={styles.sectionLabel}>REVIEWS</Text>
            <Pressable
              style={styles.addReviewButton}
              onPress={() => navigation?.navigate('ReviewAnime', {
                animeId: movieId,
                id: movieId,
                title,
                coverImage: poster,
                mediaType: 'movies',
              })}
            >
              <Ionicons name="add" size={20} color="#fff" />
            </Pressable>
          </View>

          {isLoadingReviews ? (
            <ActivityIndicator color={ACCENT} style={{ marginVertical: 20 }} />
          ) : visibleReviews.length > 0 ? (
            <>
              {visibleReviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  name={review.name}
                  rating={review.rating}
                  text={review.text}
                  avatarUrl={review.avatarUrl}
                />
              ))}

              {allReviews.length > REVIEWS_PER_PAGE && (
                <View style={styles.paginationContainer}>
                  <Pressable
                    style={[styles.paginationButton, currentReviewPage === 1 && styles.paginationButtonDisabled]}
                    onPress={() => setCurrentReviewPage(p => Math.max(1, p - 1))}
                    disabled={currentReviewPage === 1}
                  >
                    <Ionicons name="chevron-back" size={20} color={currentReviewPage === 1 ? '#666' : '#fff'} />
                    <Text style={[styles.paginationButtonText, currentReviewPage === 1 && styles.paginationButtonTextDisabled]}>
                      Previous
                    </Text>
                  </Pressable>
                  <Text style={styles.pageIndicator}>
                    {currentReviewPage} / {totalReviewPages}
                  </Text>
                  <Pressable
                    style={[styles.paginationButton, currentReviewPage === totalReviewPages && styles.paginationButtonDisabled]}
                    onPress={() => setCurrentReviewPage(p => Math.min(totalReviewPages, p + 1))}
                    disabled={currentReviewPage === totalReviewPages}
                  >
                    <Text style={[styles.paginationButtonText, currentReviewPage === totalReviewPages && styles.paginationButtonTextDisabled]}>
                      Next
                    </Text>
                    <Ionicons name="chevron-forward" size={20} color={currentReviewPage === totalReviewPages ? '#666' : '#fff'} />
                  </Pressable>
                </View>
              )}
            </>
          ) : (
            <Text style={styles.noDataText}>No reviews yet. Be the first to review!</Text>
          )}
        </BlurView>

        {/* ── Recommendations ── */}
        {recommendations.length > 0 && (
          <View style={[styles.sectionOuter, { marginBottom: 32 }]}>
            <Text style={[styles.sectionLabel, { paddingHorizontal: 20, marginBottom: 10 }]}>RECOMMENDED</Text>
            <FlatList
              data={recommendations}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.relatedCard}
                  onPress={() => navigation?.push('DetailsMovies', {
                    movieId: item.id,
                    movieTitle: item.title,
                    coverImage: item.poster_path ? `${IMG_BASE}/w500${item.poster_path}` : null,
                  })}
                >
                  <Image
                    source={{ uri: item.poster_path ? `${IMG_BASE}/w500${item.poster_path}` : null }}
                    style={styles.relatedCardImage}
                    resizeMode="cover"
                  />
                  <View style={styles.relatedCardOverlay}>
                    <Text style={styles.relatedCardTitle} numberOfLines={2}>{item.title}</Text>
                  </View>
                </Pressable>
              )}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },

  // ── Header ──
  headerSafeArea: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000,
  },
  animatedHeader: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000,
  },
  headerBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    backgroundColor: BG,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,107,53,0.2)',
  },
  headerBackButton: { marginRight: 12, padding: 4 },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0.5,
  },

  // ── Background blobs ──
  backgroundShapes: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 500, overflow: 'hidden',
  },
  blobShape1: {
    position: 'absolute', top: -60, right: -80,
    width: 320, height: 320, borderRadius: 160,
    backgroundColor: BLOB1, opacity: 0.12,
    transform: [{ scaleX: 1.4 }, { rotate: '20deg' }],
  },
  blobShape2: {
    position: 'absolute', top: 120, left: -100,
    width: 260, height: 260, borderRadius: 130,
    backgroundColor: BLOB2, opacity: 0.1,
    transform: [{ scaleY: 1.3 }, { rotate: '-10deg' }],
  },
  blobShape3: {
    position: 'absolute', top: 260, right: 40,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: BLOB3, opacity: 0.08,
  },

  // ── Scroll ──
  scrollView: { flex: 1 },

  // ── Back button ──
  backButton: {
    position: 'absolute', top: 50, left: 20, zIndex: 10,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center', alignItems: 'center',
  },

  // ── Hero ──
  heroSection: {
    width: '100%', aspectRatio: 16 / 9,
    marginBottom: -60, overflow: 'hidden', backgroundColor: '#000',
  },
  backdropImage: { width: '100%', height: '100%' },
  heroGradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
    backgroundColor: 'transparent',
  },

  // ── Blur cards ──
  blurCard: {
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.5)',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(0,0,0,0.3)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(0,0,0,0.3)',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 8 },
    }),
  },

  // ── Title row ──
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  mainTitle: {
    fontSize: 20, fontWeight: 'bold', color: '#fff',
    flex: 1, marginRight: 12, letterSpacing: 0.5,
  },
  releaseYear: { fontSize: 14, color: ACCENT, flexShrink: 0 },
  taglineText: { fontSize: 13, color: '#aaa', fontStyle: 'italic', marginBottom: 10 },

  // ── Meta chips ──
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  metaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1, borderColor: ACCENT2,
  },
  metaChipText: { fontSize: 11, color: ACCENT2, fontWeight: '600' },

  // ── Description ──
  description: { fontSize: 14, color: '#ddd', lineHeight: 22, marginBottom: 8 },
  expandText: { fontSize: 13, color: ACCENT, fontWeight: '600', marginBottom: 12 },

  // ── Stats ──
  statsSection: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginHorizontal: 20, marginBottom: 20, gap: 10,
  },

  // ── Status ──
  statusSection: { marginHorizontal: 20, marginBottom: 20 },
  statusSectionLabel: { fontSize: 11, letterSpacing: 2, color: '#999', fontWeight: '600', marginBottom: 12 },

  // ── Section label ──
  sectionLabel: {
    fontSize: 12, letterSpacing: 2, fontWeight: '700',
    color: ACCENT, marginBottom: 12,
  },

  // ── Pill rows ──
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  // ── Company ──
  companyList: { gap: 12 },
  companyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  companyAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,107,53,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  companyName: { fontSize: 14, color: '#fff', fontWeight: '600' },
  companyRole: { fontSize: 12, color: '#888', marginTop: 2 },

  // ── Cast ──
  castCard: { width: 100, marginRight: 4, alignItems: 'center' },
  castImage: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#252525', marginBottom: 6 },
  castPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  castName: { fontSize: 11, color: '#fff', fontWeight: '600', textAlign: 'center' },
  castRole: { fontSize: 10, color: '#999', textAlign: 'center', marginTop: 2 },

  // ── Horizontal sections ──
  sectionOuter: { marginBottom: 20 },
  horizontalList: { paddingHorizontal: 20, gap: 12 },

  // ── Trailers ──
  trailerCard: { width: 200 },
  trailerThumb: { width: 200, height: 112, borderRadius: 8, backgroundColor: '#222' },
  trailerOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 112,
    borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center', alignItems: 'center',
  },
  playButton: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,107,53,0.85)',
    justifyContent: 'center', alignItems: 'center',
  },
  trailerName: { fontSize: 12, color: '#ccc', marginTop: 6 },

  // ── Related / Recommended cards ──
  relatedCard: { width: 120, height: 170, borderRadius: 8, overflow: 'hidden', backgroundColor: '#252525' },
  relatedCardImage: { width: '100%', height: '100%' },
  relatedCardOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 8, backgroundColor: 'rgba(0,0,0,0.7)',
  },
  relatedCardTitle: { fontSize: 11, color: '#fff', fontWeight: '600' },

  // ── Reviews ──
  reviewsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  addReviewButton: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: ACCENT, justifyContent: 'center', alignItems: 'center',
  },
  noDataText: { fontSize: 14, color: '#999', textAlign: 'center', paddingVertical: 20 },

  // ── Pagination ──
  paginationContainer: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 20, paddingTop: 15, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)',
  },
  paginationButton: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: 6, backgroundColor: 'rgba(255,107,53,0.2)', gap: 5,
  },
  paginationButtonDisabled: { backgroundColor: 'rgba(0,0,0,0.1)', opacity: 0.5 },
  paginationButtonText: { fontSize: 14, color: '#fff', fontWeight: '500' },
  paginationButtonTextDisabled: { color: '#666' },
  pageIndicator: { fontSize: 14, color: '#fff', fontWeight: '500' },
});

export default MovieDetail;
