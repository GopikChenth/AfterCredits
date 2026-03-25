/**
 * â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
 * â•‘              DETAILS GAMES PAGE                                  â•‘
 * â•‘                                                                  â•‘
 * â•‘  Data source: IGDB (Twitch API)                                  â•‘
 * â•‘    â€¢ Game is searched by name, full rich detail is fetched.      â•‘
 * â•‘    â€¢ If IGDB is unavailable an alert is shown and user goes back.â•‘
 * â•‘    â€¢ Route params supply instant cover/title during load.        â•‘
 * â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 */

import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
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
import GenrePill from "../components/details_page/GenrePill";
import ReviewCard from "../components/details_page/ReviewCard";
import StatusTag from "../components/details_page/StatusTag";
import {
  ScreenshotCard,
} from "../components/details_page/SharedListItems";
import CompletionChart from "../components/details_page/CompletionChart";
import DetailsSkeleton from "../components/skeletons/SkeletonDetails";
import { fetchIGDBByName } from "../services/api_igdb";
import { hasIGDBCredentials } from "../services/settings";
import { getCardDimensions } from "../utils/responsiveCard";
import {
  getMediaReviews,
} from "../services/reviewService";
import {
  getMediaStatus,
  setMediaStatus,
  setWishlist,
} from "../services/mediaStatusService";

const { width, height } = Dimensions.get("window");

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// ACCENT COLOURS  (purple / cyan â€” games palette)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const ACCENT = "#0FA3B1";
const ACCENT2 = "#0B7285";
const BG = "#000000";
const BLOB1 = "#083344";
const BLOB2 = "#0E7490";
const BLOB3 = "#155E75";

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// SUB-COMPONENTS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/** Pill showing a platform abbreviation */
const PlatformPill = ({ name, abbreviation }) => (
  <View style={styles.platformPill}>
    <Text style={styles.platformPillText}>{abbreviation || name}</Text>
  </View>
);

/** Pill for game modes (Single-player, Multiplayerâ€¦) */
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

const SkiaSection = ({
  title,
  children,
  style,
  contentStyle,
  showTab = true,
}) => {
  return (
    <View style={[showTab ? styles.sectionShell : styles.sectionShellNoTab, style]}>
      {showTab && title ? <Text style={styles.sectionTabText}>{title}</Text> : null}
      <View
        style={[
          showTab ? styles.skiaSectionContent : styles.skiaSectionContentNoTab,
          contentStyle,
        ]}
      >
        {children}
      </View>
    </View>
  );
};

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// MAIN PAGE
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const GameDetail = ({ route, navigation }) => {
  // â”€â”€ Route params (from RAWG card) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const {
    gameId, // RAWG id
    gameName, // name (used for IGDB search)
    coverImage, // RAWG cover (fallback)
    genres: rawgGenres = [],
    playtime,
  } = route?.params || {};

  // â”€â”€ State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [igdbData, setIgdbData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  // null = not yet checked, false = has credentials, true = missing credentials
  const [noCredentials, setNoCredentials] = useState(null);

  const [userStatus, setUserStatus] = useState(null);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const [dbReviews, setDbReviews] = useState([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);

  const [currentReviewPage, setCurrentReviewPage] = useState(1);

  const scrollY = useRef(new Animated.Value(0)).current;
  const { cardWidth: homeCardWidth, cardHeight: homeCardHeight } = useMemo(
    () => getCardDimensions(),
    [],
  );

  const backBarHeight = 56;
  const posterExpandedWidth = width * 0.86;
  const posterExpandedHeight = height * 0.7;
  const posterExpandedTop =
    backBarHeight + Math.max(10, (height - backBarHeight - posterExpandedHeight) * 0.48);
  const posterCollapsedTop = backBarHeight + 10;
  const heroScrollRange = Math.max(
    140,
    posterExpandedHeight - homeCardHeight + (posterExpandedTop - posterCollapsedTop),
  );

  const heroHeight = scrollY.interpolate({
    inputRange: [0, heroScrollRange * 0.45, heroScrollRange],
    outputRange: [posterExpandedHeight, posterExpandedHeight - 76, homeCardHeight],
    extrapolate: "clamp",
  });

  const heroWidth = scrollY.interpolate({
    inputRange: [0, heroScrollRange],
    outputRange: [posterExpandedWidth, homeCardWidth],
    extrapolate: "clamp",
  });

  const heroTranslateY = scrollY.interpolate({
    inputRange: [0, heroScrollRange],
    outputRange: [posterExpandedTop, posterCollapsedTop],
    extrapolate: "clamp",
  });

  const posterRadius = scrollY.interpolate({
    inputRange: [0, heroScrollRange * 0.45, heroScrollRange],
    outputRange: [28, 20, 16],
    extrapolate: "clamp",
  });

  const posterOverlayOpacity = scrollY.interpolate({
    inputRange: [0, heroScrollRange],
    outputRange: [0.2, 0.55],
    extrapolate: "clamp",
  });

  const topBarBackdropOpacity = scrollY.interpolate({
    inputRange: [0, heroScrollRange * 0.9],
    outputRange: [0, 0.85],
    extrapolate: "clamp",
  });

  const posterParallax = scrollY.interpolate({
    inputRange: [0, heroScrollRange],
    outputRange: [0, -34],
    extrapolate: "clamp",
  });

  const metaBlockTranslateY = scrollY.interpolate({
    inputRange: [0, heroScrollRange],
    outputRange: [
      posterExpandedTop + posterExpandedHeight + 16,
      posterCollapsedTop + homeCardHeight + 12,
    ],
    extrapolate: "clamp",
  });

  const contentStartOffset = posterExpandedTop + posterExpandedHeight + 140;

  // â”€â”€ Data fetching â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  useEffect(() => {
    if (!gameId) return;
    // Check for user-supplied IGDB credentials first.
    // If missing, block the page entirely â€” do NOT attempt an API call.
    hasIGDBCredentials().then((has) => {
      if (!has) {
        setNoCredentials(true);
        setIsLoading(false);
      } else {
        setNoCredentials(false);
        fetchAll();
      }
    });
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

  // Reviews â€” re-runs every time this screen gains focus
  // so newly submitted reviews appear immediately after returning from the review form
  useFocusEffect(
    useCallback(() => {
      if (!gameId) return;
      const load = async () => {
        setIsLoadingReviews(true);
        try {
          const rv = await getMediaReviews("games", gameId);
          if (rv?.success) setDbReviews(rv.reviews || []);
        } finally {
          setIsLoadingReviews(false);
        }
      };
      load();
    }, [gameId])
  );

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

  // â”€â”€ Handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const handleStatusChange = async (newStatus) => {
    setUserStatus(newStatus);
    await setMediaStatus("games", gameId, newStatus);
  };

  const handleWishlistToggle = async (wishlisted) => {
    setIsWishlisted(wishlisted);
    await setWishlist("games", gameId, wishlisted);
  };

  const handleGoBack = useCallback(() => navigation?.goBack(), [navigation]);

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

  // â”€â”€ Derived data (from IGDB + route param fallbacks while loading) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const name = igdbData?.name || gameName || "Loadingâ€¦";
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
  const releaseDate = igdbData?.releaseDate || "TBA";
  const avgPlaytime = playtime || null;
  const gameDescription = summary || storyline || "No description available.";
  const playtimeValue = igdbData?.timeToBeat?.mainStory
    ? Math.max(1, Math.round(igdbData.timeToBeat.mainStory))
    : avgPlaytime
      ? Math.max(1, Math.round(avgPlaytime))
      : null;
  const playtimeText = playtimeValue
    ? `${playtimeValue}h Playtime`
    : "Playtime Unknown";
  const gameStatusText = igdbData?.status || "Unknown";

  // â”€â”€ Loading / Error states â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const Blobs = () => (
    <View style={styles.backgroundShapes} pointerEvents="none">
      <View style={styles.blobShape1} />
      <View style={styles.blobShape2} />
      <View style={styles.blobShape3} />
    </View>
  );

  // â”€â”€ No IGDB credentials â€” block the page entirely â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  if (noCredentials === true) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={BG} />
        <Blobs />
        <SafeAreaView style={styles.noCredSafeArea} edges={["top", "bottom"]}>
          <View style={styles.noCredContainer}>
            <View style={styles.noCredIconWrap}>
              <Ionicons name="game-controller-outline" size={56} color={ACCENT} />
            </View>
            <Text style={styles.noCredTitle}>IGDB API Key Required</Text>
            <Text style={styles.noCredBody}>
              Game details are powered by the IGDB database. To view this page
              you need to add your own Twitch / IGDB Client ID and Access Token
              in Settings.
            </Text>
            <Pressable
              style={styles.noCredPrimaryButton}
              onPress={() => navigation?.navigate("ProfilePage")}
              accessibilityRole="button"
              accessibilityLabel="Go to Settings to add IGDB credentials"
            >
              <Ionicons name="settings-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.noCredPrimaryText}>Go to Settings</Text>
            </Pressable>
            <Pressable
              style={styles.noCredSecondaryButton}
              onPress={() => navigation?.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Text style={styles.noCredSecondaryText}>Go Back</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // â”€â”€ Loading state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

  // â”€â”€ Main render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const REVIEWS_PER_PAGE = 10;
  const totalReviewPages = Math.ceil(dbReviews.length / REVIEWS_PER_PAGE);
  const visibleReviews = dbReviews.slice(
    (currentReviewPage - 1) * REVIEWS_PER_PAGE,
    currentReviewPage * REVIEWS_PER_PAGE,
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />

      <SafeAreaView style={styles.topBar} edges={["top"]}>
        <Animated.View style={[styles.topBarBackdrop, { opacity: topBarBackdropOpacity }]} />
        <Pressable
          style={styles.topBackButton}
          onPress={handleGoBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </Pressable>
      </SafeAreaView>

      {/* â”€â”€ Background blobs â”€â”€ */}
      <Blobs />

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: contentStartOffset }]}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={16}
      >
        <View style={styles.metaSpacer} />

        <View style={styles.descriptionBlock}>
          <Text style={styles.sectionTabText}>DESCRIPTION</Text>
          <Text style={styles.descriptionBody}>{gameDescription}</Text>
        </View>


        {/* â”€â”€ Completion Time chart (IGDB time-to-beat) â”€â”€ */}
        {igdbData?.timeToBeat && (
          <SkiaSection showTab={false}>
            <CompletionChart data={igdbData.timeToBeat} />
          </SkiaSection>
        )}

        {/* â”€â”€ User status â”€â”€ */}
        <SkiaSection title="MY STATUS">
          <StatusTag
            status={userStatus}
            isWishlisted={isWishlisted}
            onStatusChange={handleStatusChange}
            onWishlistToggle={handleWishlistToggle}
            mediaType="games"
          />
        </SkiaSection>

        {/* â”€â”€ Platforms â”€â”€ */}
        {platforms.length > 0 && (
          <SkiaSection title="PLATFORMS">
            <View style={styles.pillRow}>
              {platforms.map((p, i) => (
                <PlatformPill
                  key={i}
                  name={p.name}
                  abbreviation={p.abbreviation}
                />
              ))}
            </View>
          </SkiaSection>
        )}

        {/* â”€â”€ Genre, Themes & Modes â”€â”€ */}
        {(genres.length > 0 || themes.length > 0 || gameModes.length > 0) && (
          <SkiaSection title="GENRES & MODES">
            {genres.length > 0 && (
              <>
                <Text style={styles.subSectionLabel}>GENRES</Text>
                <View style={styles.pillRow}>
                  {genres.map((g, i) => (
                    <GenrePill key={i} genre={g} />
                  ))}
                </View>
              </>
            )}

            {themes.length > 0 && (
              <>
                <Text style={[styles.subSectionLabel, { marginTop: 16 }]}>
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
                <Text style={[styles.subSectionLabel, { marginTop: 16 }]}>
                  GAME MODES
                </Text>
                <View style={styles.pillRow}>
                  {gameModes.map((m, i) => (
                    <ModePill key={i} mode={m} />
                  ))}
                </View>
              </>
            )}
          </SkiaSection>
        )}

        {/* â”€â”€ Developers & Publishers â”€â”€ */}
        {(developers.length > 0 || publishers.length > 0) && (
          <SkiaSection title="CAST & CREW">
            <View style={styles.companyList}>
              {developers.map((d, i) => (
                <CompanyRow key={`dev-${i}`} name={d} role="Developer" />
              ))}
              {publishers.map((p, i) => (
                <CompanyRow key={`pub-${i}`} name={p} role="Publisher" />
              ))}
            </View>
          </SkiaSection>
        )}

        {/* â”€â”€ Trailers (IGDB) â”€â”€ */}
        {trailers.length > 0 && (
          <SkiaSection title="TRAILERS">
            <FlatList
              data={trailers}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalListTight}
              keyExtractor={(item) => item.id}
              renderItem={renderTrailer}
            />
          </SkiaSection>
        )}

        {/* â”€â”€ Screenshots (IGDB) â”€â”€ */}
        {screenshots.length > 0 && (
          <SkiaSection title="SCREENSHOTS">
            <FlatList
              data={screenshots}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalListTight}
              keyExtractor={(item, i) => `ss-${i}`}
              renderItem={renderScreenshot}
            />
          </SkiaSection>
        )}

        {/* â”€â”€ Reviews â”€â”€ */}
        <SkiaSection title="REVIEW">
            <View style={styles.reviewsHeader}>
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
        </SkiaSection>

        {/* â”€â”€ Similar Games (IGDB) â”€â”€ */}
        {similarGames.length > 0 && (
          <SkiaSection title="RELATED SHOWS" style={styles.relatedSectionShell}>
            <FlatList
              data={similarGames}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalListTight}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderSimilarGame}
            />
          </SkiaSection>
        )}
      </Animated.ScrollView>

      <Animated.View
        style={[
          styles.heroPosterWrap,
          {
            width: heroWidth,
            height: heroHeight,
            borderRadius: posterRadius,
            transform: [{ translateY: heroTranslateY }],
          },
        ]}
        pointerEvents="none"
      >
        <Animated.View
          style={[styles.heroPosterImageWrap, { transform: [{ translateY: posterParallax }] }]}
        >
          <Image
            source={{ uri: cover }}
            style={styles.heroPosterImage}
            contentFit="cover"
            recyclingKey={`game-poster-${gameId}`}
            transition={200}
          />
        </Animated.View>
        <Animated.View style={[styles.heroPosterOverlay, { opacity: posterOverlayOpacity }]} />
      </Animated.View>

      <Animated.View
        style={[styles.heroMetaBlock, { transform: [{ translateY: metaBlockTranslateY }] }]}
        pointerEvents="none"
      >
        <Text style={styles.heroMetaTitle} numberOfLines={2}>{name}</Text>
        <View style={styles.heroMetaLine}>
          {releaseDate ? <Text style={styles.heroMetaLineText}>{releaseDate}</Text> : null}
          <Text style={styles.heroMetaLineDot}>|</Text>
          <Text style={styles.heroMetaLineText}>{playtimeText}</Text>
          <Text style={styles.heroMetaLineDot}>|</Text>
          <Text style={styles.heroMetaLineText}>{gameStatusText}</Text>
        </View>
      </Animated.View>
    </View>
  );
};

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// STYLES
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },

  // Top controls
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    height: 56,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  topBarBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.85)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(15,163,177,0.2)",
  },
  topBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderCurve: "continuous",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  // â”€â”€ Background blobs â”€â”€
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

  // â”€â”€ Scroll â”€â”€
  scrollView: { flex: 1 },
  scrollContent: {
    paddingBottom: 24,
  },

  // Hero poster
  heroPosterWrap: {
    position: "absolute",
    alignSelf: "center",
    zIndex: 40,
    overflow: "hidden",
    backgroundColor: "#101010",
    borderWidth: 1,
    borderColor: "rgba(15,163,177,0.22)",
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 10,
  },
  heroPosterImageWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  heroPosterImage: {
    width: "100%",
    height: "100%",
  },
  heroPosterOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
  heroMetaBlock: {
    position: "absolute",
    left: 20,
    right: 20,
    zIndex: 30,
  },
  heroMetaTitle: {
    fontSize: 32,
    lineHeight: 38,
    color: "#fff",
    fontFamily: "Genjiro",
    marginBottom: 6,
  },
  heroMetaLine: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  heroMetaLineText: {
    fontSize: 12,
    color: "rgba(224,247,250,0.9)",
    fontWeight: "600",
  },
  heroMetaLineDot: {
    marginHorizontal: 8,
    color: "rgba(15,163,177,0.75)",
    fontSize: 11,
    fontWeight: "700",
  },
  metaSpacer: {
    height: 94,
  },
  descriptionBlock: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 10,
  },
  descriptionBody: {
    marginTop: 10,
    fontSize: 14,
    color: "#d3d3d3",
    lineHeight: 22,
  },

  sectionShell: {
    marginHorizontal: 20,
    marginBottom: 24,
    paddingTop: 18,
    position: "relative",
  },
  sectionShellNoTab: {
    marginHorizontal: 20,
    marginBottom: 24,
    position: "relative",
  },
  relatedSectionShell: {
    marginBottom: 32,
  },
  sectionTabText: {
    color: ACCENT,
    fontSize: 14,
    fontFamily: "Genjiro",
    letterSpacing: 1.1,
  },
  skiaSectionContent: {
    paddingHorizontal: 0,
    paddingTop: 10,
    paddingBottom: 20,
  },
  skiaSectionContentNoTab: {
    paddingHorizontal: 0,
    paddingTop: 10,
    paddingBottom: 20,
  },

  // â”€â”€ Meta chips â”€â”€
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

  // â”€â”€ Description â”€â”€
  description: { fontSize: 14, color: "#ddd", lineHeight: 22, marginBottom: 8 },
  expandText: {
    fontSize: 13,
    color: ACCENT,
    fontWeight: "600",
    marginBottom: 12,
  },

  // â”€â”€ Storyline â”€â”€
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

  // â”€â”€ Status â”€â”€
  statusSection: { marginHorizontal: 20, marginBottom: 20 },
  statusSectionLabel: {
    fontSize: 11,
    letterSpacing: 2,
    color: "#999",
    fontWeight: "600",
    marginBottom: 12,
  },

  // â”€â”€ Section label â”€â”€
  sectionLabel: {
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: "700",
    color: ACCENT,
    marginBottom: 12,
  },
  subSectionLabel: {
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: "700",
    color: ACCENT,
    marginBottom: 12,
  },

  // â”€â”€ Pill rows â”€â”€
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },

  // â”€â”€ Platform pill â”€â”€
  platformPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: ACCENT2,
    backgroundColor: "rgba(15,163,177,0.1)",
  },
  platformPillText: { fontSize: 12, color: ACCENT2, fontWeight: "600" },

  // â”€â”€ Mode pill â”€â”€
  modePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: ACCENT,
    backgroundColor: "rgba(15,163,177,0.1)",
  },
  modePillText: { fontSize: 12, color: ACCENT, fontWeight: "600" },

  // â”€â”€ Company â”€â”€
  companyList: { gap: 12 },
  companyRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  companyAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderCurve: "continuous",
    backgroundColor: "rgba(15,163,177,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  companyName: { fontSize: 14, color: "#fff", fontWeight: "600" },
  companyRole: { fontSize: 12, color: "#888", marginTop: 2 },

  // â”€â”€ Horizontal sections â”€â”€
  sectionOuter: { marginBottom: 20 },
  horizontalList: { paddingHorizontal: 20, gap: 12 },
  horizontalListTight: { paddingHorizontal: 2, gap: 12 },

  // â”€â”€ Trailers â”€â”€
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
    backgroundColor: "rgba(15,163,177,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  trailerName: { fontSize: 12, color: "#ccc", marginTop: 6 },

  // â”€â”€ Screenshots â”€â”€
  screenshot: {
    width: 240,
    height: 135,
    borderRadius: 8,
    backgroundColor: "#222",
  },

  // â”€â”€ Related / Similar cards â”€â”€
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

  // â”€â”€ Reviews â”€â”€
  reviewsHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginBottom: 12,
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

  // â”€â”€ Pagination â”€â”€
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
    backgroundColor: "rgba(15,163,177,0.2)",
    gap: 5,
  },
  paginationButtonDisabled: {
    backgroundColor: "rgba(0,0,0,0.1)",
    opacity: 0.5,
  },
  paginationButtonText: { fontSize: 14, color: "#fff", fontWeight: "500" },
  paginationButtonTextDisabled: { color: "#666" },
  pageIndicator: { fontSize: 14, color: "#fff", fontWeight: "500" },

  // â”€â”€ Error â”€â”€
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
  // â”€â”€ No credentials screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  noCredSafeArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noCredContainer: {
    alignItems: "center",
    paddingHorizontal: 32,
    maxWidth: 380,
    width: "100%",
  },
  noCredIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderCurve: "continuous",
    backgroundColor: "rgba(15,163,177,0.12)",
    borderWidth: 1,
    borderColor: "rgba(15,163,177,0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  noCredTitle: {
    fontSize: 22,
    fontFamily: "Genjiro",
    color: "#fff",
    letterSpacing: 0.5,
    textAlign: "center",
    marginBottom: 16,
  },
  noCredBody: {
    fontSize: 14,
    color: "#aaa",
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 32,
  },
  noCredPrimaryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: ACCENT,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    borderCurve: "continuous",
    width: "100%",
    justifyContent: "center",
    marginBottom: 12,
  },
  noCredPrimaryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  noCredSecondaryButton: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    width: "100%",
    alignItems: "center",
  },
  noCredSecondaryText: {
    color: "#888",
    fontSize: 15,
    fontWeight: "500",
  },
});

export default GameDetail;
