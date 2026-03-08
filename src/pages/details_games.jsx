/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║              DETAILS GAMES PAGE                                  ║
 * ║                                                                  ║
 * ║  Data source: IGDB (Twitch API)                                  ║
 * ║    • Game is searched by name, full rich detail is fetched.      ║
 * ║    • If IGDB is unavailable an alert is shown and user goes back. ║
 * ║    • Route params supply instant cover/title during load.        ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import {
  View,
  Text,
  ScrollView,
  Image as RNImage,
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
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import GlassCard from "../components/shared/GlassCard";
import StatsPill from "../components/details_page/StatsPill";
import GenrePill from "../components/details_page/GenrePill";
import ReviewCard from "../components/details_page/ReviewCard";
import StatusTag from "../components/details_page/StatusTag";
import {
  BackButton,
  ScreenshotCard,
} from "../components/details_page/SharedListItems";
import CompletionChart from "../components/details_page/CompletionChart";
import DetailsSkeleton from "../components/skeletons/SkeletonDetails";
import { getMetacriticColor } from "../services/api_rawg";
import { fetchIGDBByName } from "../services/api_igdb";
import {
  getMediaReviews,
  getMediaReviewStats,
} from "../services/reviewService";
import {
  getMediaStatus,
  setMediaStatus,
  setWishlist,
} from "../services/mediaStatusService";

const { width } = Dimensions.get("window");

// ─────────────────────────────────────────────────────────────────────────────
// ACCENT COLOURS  (purple / cyan — games palette)
// ─────────────────────────────────────────────────────────────────────────────
const ACCENT = "#A78BFA"; // violet
const ACCENT2 = "#22D3EE"; // cyan
const BG = "#0F0F23";
const CARD_BG = "#1A1A3E";
const BLOB1 = "#7C3AED";
const BLOB2 = "#4F46E5";
const BLOB3 = "#06B6D4";

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

/** Pill showing a platform abbreviation */
const PlatformPill = ({ name, abbreviation }) => (
  <View style={styles.platformPill}>
    <Text style={styles.platformPillText}>{abbreviation || name}</Text>
  </View>
);

/** Pill for game modes (Single-player, Multiplayer…) */
const ModePill = ({ mode }) => (
  <View style={styles.modePill}>
    <Text style={styles.modePillText}>{mode}</Text>
  </View>
);

/** Developer / publisher row */
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

/** Trailer thumbnail card */
const TrailerCard = memo(({ trailer }) => {
  const handlePress = useCallback(
    () => Linking.openURL(trailer.url),
    [trailer.url],
  );
  return (
    <Pressable
      style={styles.trailerCard}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`Play trailer: ${trailer.name}`}
    >
      <Image
        source={{ uri: trailer.thumbnail }}
        style={styles.trailerThumb}
        contentFit="cover"
        recyclingKey={trailer.url}
      />
      <View style={styles.trailerOverlay}>
        <View style={styles.playButton}>
          <Ionicons name="play" size={20} color="#fff" />
        </View>
      </View>
      <Text style={styles.trailerName} numberOfLines={1}>
        {trailer.name}
      </Text>
    </Pressable>
  );
});
TrailerCard.displayName = "TrailerCard";

/** Age rating badge */
const AgeRatingBadge = ({ system, rating }) => (
  <View style={styles.ageBadge}>
    <Text style={styles.ageBadgeSystem}>{system}</Text>
    <Text style={styles.ageBadgeRating}>{rating}</Text>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

const GameDetail = ({ route, navigation }) => {
  // ── Route params (from RAWG card) ──────────────────────────────────────────
  const {
    gameId, // RAWG id
    gameName, // name (used for IGDB search)
    coverImage, // RAWG cover (fallback)
    rating,
    metacritic,
    genres: rawgGenres = [],
    playtime,
    esrbRating,
  } = route?.params || {};

  // ── State ──────────────────────────────────────────────────────────────────
  const [igdbData, setIgdbData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [userStatus, setUserStatus] = useState(null);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const [dbReviews, setDbReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({
    count: 0,
    averageRating: 0,
  });
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);

  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [currentReviewPage, setCurrentReviewPage] = useState(1);
  const titleYRef = useRef(0);

  // Scroll-reveal header
  const headerOpacity = useRef(new Animated.Value(0)).current;

  // ── Data fetching ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (gameId) fetchAll();
  }, [gameId]);

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const result = await fetchIGDBByName(gameName);
      if (!result) throw new Error("No IGDB data returned.");
      setIgdbData(result);
    } catch (err) {
      console.error("GameDetail IGDB fetch error:", err);
      Alert.alert(
        "IGDB API Not Found",
        "Could not load game details from IGDB. Please check your API credentials and try again.",
        [
          {
            text: "Go Back",
            onPress: () => navigation?.goBack(),
            style: "cancel",
          },
          { text: "Retry", onPress: () => fetchAll() },
        ],
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Reviews
  useEffect(() => {
    if (!gameId) return;
    const load = async () => {
      setIsLoadingReviews(true);
      try {
        const [rv, st] = await Promise.allSettled([
          getMediaReviews("games", gameId),
          getMediaReviewStats("games", gameId),
        ]);
        if (rv.status === "fulfilled" && rv.value?.success)
          setDbReviews(rv.value.reviews || []);
        if (st.status === "fulfilled" && st.value?.success)
          setReviewStats(st.value.stats);
      } finally {
        setIsLoadingReviews(false);
      }
    };
    load();
  }, [gameId]);

  // User status
  useEffect(() => {
    if (!gameId) return;
    getMediaStatus("games", gameId).then((r) => {
      if (r.success && r.data) {
        setUserStatus(r.data.status);
        setIsWishlisted(r.data.is_wishlisted);
      }
    });
  }, [gameId]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleStatusChange = async (newStatus) => {
    setUserStatus(newStatus);
    await setMediaStatus("games", gameId, newStatus);
  };

  const handleWishlistToggle = async (wishlisted) => {
    setIsWishlisted(wishlisted);
    await setWishlist("games", gameId, wishlisted);
  };

  const handleGoBack = useCallback(() => navigation?.goBack(), [navigation]);

  const handleScroll = useCallback(
    (event) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      const trigger = titleYRef.current > 0 ? titleYRef.current : 120;
      headerOpacity.setValue(offsetY > trigger ? 1 : 0);
    },
    [headerOpacity],
  );

  const renderScreenshot = useCallback(
    ({ item }) => <ScreenshotCard uri={item} style={styles.screenshot} />,
    [],
  );

  const renderSimilarGame = useCallback(
    ({ item }) => (
      <Pressable
        style={styles.relatedCard}
        onPress={() =>
          navigation?.push("DetailsGames", {
            gameId: item.id,
            gameName: item.name,
            coverImage: item.coverImage,
          })
        }
        accessibilityRole="button"
        accessibilityLabel={`View similar game: ${item.name}`}
      >
        <Image
          source={{ uri: item.coverImage }}
          style={styles.relatedCardImage}
          contentFit="cover"
          recyclingKey={`sim-${item.id}`}
        />
        <View style={styles.relatedCardOverlay}>
          <Text style={styles.relatedCardTitle} numberOfLines={2}>
            {item.name}
          </Text>
        </View>
      </Pressable>
    ),
    [navigation],
  );

  const renderTrailer = useCallback(
    ({ item }) => <TrailerCard trailer={item} />,
    [],
  );

  // ── Derived data (from IGDB + route param fallbacks while loading) ──────────

  const name = igdbData?.name || gameName || "Loading…";
  const summary = igdbData?.summary || "";
  const storyline = igdbData?.storyline || "";
  const cover = igdbData?.coverImage || coverImage;
  const genres = igdbData?.genres || rawgGenres;
  const themes = igdbData?.themes || [];
  const gameModes = igdbData?.gameModes || [];
  const developers = igdbData?.developers || [];
  const publishers = igdbData?.publishers || [];
  const platforms = igdbData?.platforms || [];
  const screenshots = igdbData?.screenshots || [];
  const trailers = igdbData?.trailers || [];
  const similarGames = igdbData?.similarGames || [];
  const ageRatings = igdbData?.ageRatings || [];
  const esrb = igdbData?.esrb || esrbRating || "NR";
  const releaseDate = igdbData?.releaseDate || "TBA";
  const franchise = igdbData?.franchise || null;
  const avgPlaytime = playtime || null;
  const metacriticScore = metacritic || null;
  const igdbRating = igdbData?.totalRating || null;

  // ── Loading / Error states ─────────────────────────────────────────────────

  const Blobs = () => (
    <View style={styles.backgroundShapes} pointerEvents="none">
      <View style={styles.blobShape1} />
      <View style={styles.blobShape2} />
      <View style={styles.blobShape3} />
    </View>
  );

  // ── Loading state ──────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Blobs />
        <DetailsSkeleton />
      </View>
    );
  }

  // If igdbData is null (alert shown, waiting for user action) show nothing extra
  if (!igdbData)
    return (
      <View style={styles.container}>
        <Blobs />
      </View>
    );

  // ── Main render ────────────────────────────────────────────────────────────

  const REVIEWS_PER_PAGE = 10;
  const totalReviewPages = Math.ceil(dbReviews.length / REVIEWS_PER_PAGE);
  const visibleReviews = dbReviews.slice(
    (currentReviewPage - 1) * REVIEWS_PER_PAGE,
    currentReviewPage * REVIEWS_PER_PAGE,
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />

      {/* ── Scroll-reveal header ── */}
      <SafeAreaView style={styles.headerSafeArea} edges={["top"]}>
        <Animated.View
          style={[
            styles.animatedHeader,
            {
              transform: [
                {
                  translateY: headerOpacity.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-100, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.headerBlur}>
            <BackButton
              style={styles.headerBackButton}
              onPress={handleGoBack}
              size={24}
            />
            <Text style={styles.headerTitle} numberOfLines={1}>
              {name}
            </Text>
          </View>
        </Animated.View>
      </SafeAreaView>

      {/* ── Background blobs ── */}
      <Blobs />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Back button over hero */}
        <BackButton style={styles.backButton} onPress={handleGoBack} />

        {/* ── Hero / Cover ── */}
        <View style={styles.heroSection}>
          <Image
            source={{ uri: cover }}
            style={styles.backdropImage}
            contentFit="cover"
            recyclingKey={`game-hero-${gameId}`}
            transition={200}
          />
          {/* Gradient overlay */}
          <View style={styles.heroGradient} />
        </View>

        {/* ── Description card ── */}
        <GlassCard style={styles.blurCard}>
          <View
            style={styles.titleRow}
            onLayout={(e) => {
              e.target.measure(
                (x, y, w, h, px, py) => (titleYRef.current = py + h),
              );
            }}
          >
            <Text style={styles.mainTitle}>{name}</Text>
            <Text style={styles.releaseYear}>{releaseDate}</Text>
          </View>

          {franchise ? (
            <Text style={styles.franchiseText}>📦 {franchise}</Text>
          ) : null}

          {/* Summary */}
          <Text
            style={styles.description}
            numberOfLines={isDescriptionExpanded ? undefined : 4}
          >
            {summary || "No description available."}
          </Text>
          {summary.length > 200 && (
            <Pressable
              onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
            >
              <Text style={styles.expandText}>
                {isDescriptionExpanded ? "Show Less" : "Read More"}
              </Text>
            </Pressable>
          )}

          {/* Storyline (IGDB-only) */}
          {storyline ? (
            <View style={styles.storylineBox}>
              <Text style={styles.storylineLabel}>STORYLINE</Text>
              <Text style={styles.storylineText}>{storyline}</Text>
            </View>
          ) : null}
        </GlassCard>

        {/* ── Completion Time chart (IGDB time-to-beat) ── */}
        {igdbData?.timeToBeat && <CompletionChart data={igdbData.timeToBeat} />}

        {/* ── Stats pills ── */}
        <View style={styles.statsSection}>
          <StatsPill
            label="Rating"
            count={
              igdbRating ? `${igdbRating}%` : rating ? rating.toFixed(1) : "N/A"
            }
            color="#A78BFA"
          />
          <StatsPill
            label="Reviews"
            count={reviewStats.count}
            color="#22D3EE"
          />
          <StatsPill
            label="Playtime"
            count={avgPlaytime ? `${avgPlaytime}h` : "N/A"}
            color="#34D399"
          />
        </View>

        {/* ── User status ── */}
        <View style={styles.statusSection}>
          <Text style={styles.statusSectionLabel}>MY STATUS</Text>
          <StatusTag
            status={userStatus}
            isWishlisted={isWishlisted}
            onStatusChange={handleStatusChange}
            onWishlistToggle={handleWishlistToggle}
            mediaType="games"
          />
        </View>

        {/* ── Platforms ── */}
        {platforms.length > 0 && (
          <GlassCard style={styles.blurCard}>
            <Text style={styles.sectionLabel}>PLATFORMS</Text>
            <View style={styles.pillRow}>
              {platforms.map((p, i) => (
                <PlatformPill
                  key={i}
                  name={p.name}
                  abbreviation={p.abbreviation}
                />
              ))}
            </View>
          </GlassCard>
        )}

        {/* ── Genre, Themes & Modes ── */}
        <GlassCard style={styles.blurCard}>
          {genres.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>GENRES</Text>
              <View style={styles.pillRow}>
                {genres.map((g, i) => (
                  <GenrePill key={i} genre={g} />
                ))}
              </View>
            </>
          )}

          {themes.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { marginTop: 16 }]}>
                THEMES
              </Text>
              <View style={styles.pillRow}>
                {themes.map((t, i) => (
                  <GenrePill key={i} genre={t} />
                ))}
              </View>
            </>
          )}

          {gameModes.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { marginTop: 16 }]}>
                GAME MODES
              </Text>
              <View style={styles.pillRow}>
                {gameModes.map((m, i) => (
                  <ModePill key={i} mode={m} />
                ))}
              </View>
            </>
          )}
        </GlassCard>

        {/* ── Developers & Publishers ── */}
        {(developers.length > 0 || publishers.length > 0) && (
          <GlassCard style={styles.blurCard}>
            <Text style={styles.sectionLabel}>DEVELOPERS & PUBLISHERS</Text>
            <View style={styles.companyList}>
              {developers.map((d, i) => (
                <CompanyRow key={`dev-${i}`} name={d} role="Developer" />
              ))}
              {publishers.map((p, i) => (
                <CompanyRow key={`pub-${i}`} name={p} role="Publisher" />
              ))}
            </View>
          </GlassCard>
        )}

        {/* ── Trailers (IGDB) ── */}
        {trailers.length > 0 && (
          <View style={styles.sectionOuter}>
            <Text
              style={[
                styles.sectionLabel,
                { paddingHorizontal: 20, marginBottom: 10 },
              ]}
            >
              TRAILERS
            </Text>
            <FlatList
              data={trailers}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              keyExtractor={(item) => item.id}
              renderItem={renderTrailer}
            />
          </View>
        )}

        {/* ── Screenshots (IGDB) ── */}
        {screenshots.length > 0 && (
          <View style={styles.sectionOuter}>
            <Text
              style={[
                styles.sectionLabel,
                { paddingHorizontal: 20, marginBottom: 10 },
              ]}
            >
              SCREENSHOTS
            </Text>
            <FlatList
              data={screenshots}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              keyExtractor={(item, i) => `ss-${i}`}
              renderItem={renderScreenshot}
            />
          </View>
        )}

        {/* ── Reviews ── */}
        <GlassCard style={styles.blurCard}>
          <View style={styles.reviewsHeader}>
            <Text style={styles.sectionLabel}>REVIEWS</Text>
            <Pressable
              style={styles.addReviewButton}
              onPress={() =>
                navigation?.navigate("ReviewAnime", {
                  animeId: gameId,
                  id: gameId,
                  title: name,
                  coverImage: cover,
                  mediaType: "games",
                })
              }
              accessibilityRole="button"
              accessibilityLabel="Write a review"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
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
                  name={
                    review.profiles?.use_display_name &&
                    review.profiles?.display_name
                      ? review.profiles.display_name
                      : review.profiles?.username ||
                        `User ${review.user_id?.substring(0, 8)}`
                  }
                  rating={Math.ceil(review.overall_rating / 2)}
                  text={review.content}
                  avatarUrl={review.profiles?.avatar_url}
                />
              ))}

              {dbReviews.length > REVIEWS_PER_PAGE && (
                <View style={styles.paginationContainer}>
                  <Pressable
                    style={[
                      styles.paginationButton,
                      currentReviewPage === 1 &&
                        styles.paginationButtonDisabled,
                    ]}
                    onPress={() =>
                      setCurrentReviewPage((p) => Math.max(1, p - 1))
                    }
                    disabled={currentReviewPage === 1}
                    accessibilityRole="button"
                    accessibilityLabel="Previous reviews page"
                  >
                    <Ionicons
                      name="chevron-back"
                      size={20}
                      color={currentReviewPage === 1 ? "#666" : "#fff"}
                    />
                    <Text
                      style={[
                        styles.paginationButtonText,
                        currentReviewPage === 1 &&
                          styles.paginationButtonTextDisabled,
                      ]}
                    >
                      Previous
                    </Text>
                  </Pressable>
                  <Text style={styles.pageIndicator}>
                    {currentReviewPage} / {totalReviewPages}
                  </Text>
                  <Pressable
                    style={[
                      styles.paginationButton,
                      currentReviewPage === totalReviewPages &&
                        styles.paginationButtonDisabled,
                    ]}
                    onPress={() =>
                      setCurrentReviewPage((p) =>
                        Math.min(totalReviewPages, p + 1),
                      )
                    }
                    disabled={currentReviewPage === totalReviewPages}
                    accessibilityRole="button"
                    accessibilityLabel="Next reviews page"
                  >
                    <Text
                      style={[
                        styles.paginationButtonText,
                        currentReviewPage === totalReviewPages &&
                          styles.paginationButtonTextDisabled,
                      ]}
                    >
                      Next
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={
                        currentReviewPage === totalReviewPages ? "#666" : "#fff"
                      }
                    />
                  </Pressable>
                </View>
              )}
            </>
          ) : (
            <Text style={styles.noDataText}>
              No reviews yet. Be the first to review!
            </Text>
          )}
        </GlassCard>

        {/* ── Similar Games (IGDB) ── */}
        {similarGames.length > 0 && (
          <View style={[styles.sectionOuter, { marginBottom: 32 }]}>
            <Text
              style={[
                styles.sectionLabel,
                { paddingHorizontal: 20, marginBottom: 10 },
              ]}
            >
              SIMILAR GAMES
            </Text>
            <FlatList
              data={similarGames}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderSimilarGame}
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
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  animatedHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  headerBlur: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    backgroundColor: BG,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(167,139,250,0.2)",
  },
  headerBackButton: { marginRight: 12, padding: 4 },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    letterSpacing: 0.5,
  },

  // ── Background blobs ──
  backgroundShapes: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 500,
    overflow: "hidden",
  },
  blobShape1: {
    position: "absolute",
    top: -60,
    right: -80,
    width: 320,
    height: 320,
    borderRadius: 160,
    borderCurve: "continuous",
    backgroundColor: BLOB1,
    opacity: 0.12,
    transform: [{ scaleX: 1.4 }, { rotate: "20deg" }],
  },
  blobShape2: {
    position: "absolute",
    top: 120,
    left: -100,
    width: 260,
    height: 260,
    borderRadius: 130,
    borderCurve: "continuous",
    backgroundColor: BLOB2,
    opacity: 0.1,
    transform: [{ scaleY: 1.3 }, { rotate: "-10deg" }],
  },
  blobShape3: {
    position: "absolute",
    top: 260,
    right: 40,
    width: 200,
    height: 200,
    borderRadius: 100,
    borderCurve: "continuous",
    backgroundColor: BLOB3,
    opacity: 0.08,
  },

  // ── Scroll ──
  scrollView: { flex: 1 },

  // ── Back button ──
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderCurve: "continuous",
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
  },

  // ── Hero ──
  heroSection: {
    width: "100%",
    aspectRatio: 16 / 9,
    marginBottom: -60,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  backdropImage: { width: "100%", height: "100%" },
  heroGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: "transparent",
    // Simulate gradient with a semi-transparent overlay
  },

  // ── Blur cards ──
  blurCard: {
    marginHorizontal: 20,
    borderRadius: 12,
    borderCurve: "continuous",
    padding: 20,
    marginBottom: 20,
    overflow: "hidden",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.15)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.5)",
    borderLeftWidth: 1,
    borderLeftColor: "rgba(0,0,0,0.3)",
    borderRightWidth: 1,
    borderRightColor: "rgba(0,0,0,0.3)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: { elevation: 8 },
    }),
  },

  // ── Title row ──
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
    flexWrap: "wrap",
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    flex: 1,
    marginRight: 12,
    letterSpacing: 0.5,
  },
  releaseYear: { fontSize: 14, color: ACCENT, flexShrink: 0 },
  franchiseText: { fontSize: 13, color: "#aaa", marginBottom: 10 },

  // ── Meta chips ──
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: ACCENT2,
  },
  metaChipText: { fontSize: 11, color: ACCENT2, fontWeight: "600" },

  // ── Description ──
  description: { fontSize: 14, color: "#ddd", lineHeight: 22, marginBottom: 8 },
  expandText: {
    fontSize: 13,
    color: ACCENT,
    fontWeight: "600",
    marginBottom: 12,
  },

  // ── Storyline ──
  storylineBox: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  storylineLabel: {
    fontSize: 11,
    letterSpacing: 2,
    color: ACCENT,
    fontWeight: "700",
    marginBottom: 8,
  },
  storylineText: { fontSize: 13, color: "#ccc", lineHeight: 20 },

  // ── Stats ──
  statsSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },

  // ── Status ──
  statusSection: { marginHorizontal: 20, marginBottom: 20 },
  statusSectionLabel: {
    fontSize: 11,
    letterSpacing: 2,
    color: "#999",
    fontWeight: "600",
    marginBottom: 12,
  },

  // ── Section label ──
  sectionLabel: {
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: "700",
    color: ACCENT,
    marginBottom: 12,
  },

  // ── Pill rows ──
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },

  // ── Platform pill ──
  platformPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: ACCENT2,
    backgroundColor: "rgba(34,211,238,0.08)",
  },
  platformPillText: { fontSize: 12, color: ACCENT2, fontWeight: "600" },

  // ── Mode pill ──
  modePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#34D399",
    backgroundColor: "rgba(52,211,153,0.08)",
  },
  modePillText: { fontSize: 12, color: "#34D399", fontWeight: "600" },

  // ── Company ──
  companyList: { gap: 12 },
  companyRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  companyAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderCurve: "continuous",
    backgroundColor: "rgba(167,139,250,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  companyName: { fontSize: 14, color: "#fff", fontWeight: "600" },
  companyRole: { fontSize: 12, color: "#888", marginTop: 2 },

  // ── Age rating ──
  ageBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ACCENT,
    alignItems: "center",
    minWidth: 60,
  },
  ageBadgeSystem: {
    fontSize: 10,
    color: ACCENT,
    fontWeight: "700",
    letterSpacing: 1,
  },
  ageBadgeRating: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "800",
    marginTop: 2,
  },

  // ── Horizontal sections ──
  sectionOuter: { marginBottom: 20 },
  horizontalList: { paddingHorizontal: 20, gap: 12 },

  // ── Trailers ──
  trailerCard: { width: 200 },
  trailerThumb: {
    width: 200,
    height: 112,
    borderRadius: 8,
    backgroundColor: "#222",
  },
  trailerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 112,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderCurve: "continuous",
    backgroundColor: "rgba(167,139,250,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  trailerName: { fontSize: 12, color: "#ccc", marginTop: 6 },

  // ── Screenshots ──
  screenshot: {
    width: 240,
    height: 135,
    borderRadius: 8,
    backgroundColor: "#222",
  },

  // ── Related / Similar cards ──
  relatedCard: {
    width: 120,
    height: 170,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#252525",
  },
  relatedCardImage: { width: "100%", height: "100%" },
  relatedCardOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  relatedCardTitle: { fontSize: 11, color: "#fff", fontWeight: "600" },

  // ── Reviews ──
  reviewsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  addReviewButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderCurve: "continuous",
    backgroundColor: ACCENT,
    justifyContent: "center",
    alignItems: "center",
  },
  noDataText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    paddingVertical: 20,
  },

  // ── Pagination ──
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  paginationButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "rgba(167,139,250,0.2)",
    gap: 5,
  },
  paginationButtonDisabled: {
    backgroundColor: "rgba(0,0,0,0.1)",
    opacity: 0.5,
  },
  paginationButtonText: { fontSize: 14, color: "#fff", fontWeight: "500" },
  paginationButtonTextDisabled: { color: "#666" },
  pageIndicator: { fontSize: 14, color: "#fff", fontWeight: "500" },

  // ── Error ──
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#ff6b6b",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: ACCENT,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderCurve: "continuous",
  },
  retryText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});

export default GameDetail;
