/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║              DETAILS GAMES PAGE                                  ║
 * ║                                                                  ║
 * ║  Hero: fullscreen banner → collapses to top-right corner         ║
 * ║  Sections: game-UI HUD style with staggered pop-in               ║
 * ║  Data: IGDB (Twitch API) for rich game details                   ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  Animated,
  InteractionManager,
  StatusBar,
  FlatList,
  Linking,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import GenrePill from "../components/details_page/GenrePill";
import ReviewCard from "../components/details_page/ReviewCard";
import StatusTag from "../components/details_page/StatusTag";
import { ScreenshotCard } from "../components/details_page/SharedListItems";
import CompletionChart from "../components/details_page/CompletionChart";
import CompletedWindow from "../components/details_page/CompletedWindow";
import PlayingWindow from "../components/details_page/PlayingWindow";
import CyberpunkFrame from "../components/details_page/CyberpunkFrame";
import CyberpunkFrame4 from "../components/details_page/CyberpunkFrame4";
import CyberpunkFrame2 from "../components/details_page/CyberpunkFrame2";
import DetailsSkeleton from "../components/skeletons/SkeletonDetails";
import { fetchIGDBByName, fetchIGDBById } from "../services/api_igdb";
import { hasIGDBCredentials } from "../services/settings";
import { getMediaReviews } from "../services/reviewService";
import {
  getMediaStatus,
  setMediaStatus,
  setWishlist,
} from "../services/mediaStatusService";

// ─── Theme ───────────────────────────────────────────────────────────────────
const ACCENT = "#0FA3B1";
const ACCENT2 = "#0B7285";
const BG = "#000000";
const SURFACE_BG = "#101010";
const SURFACE_SUBTLE = "#181818";
const TEXT_PRIMARY = "#FFFFFF";
const TEXT_SECONDARY = "#D3D3D3";
const TEXT_MUTED = "#999999";
const TEXT_DISABLED = "#666666";

const hexToRgba = (hex, alpha) => {
  const normalized = hex.replace("#", "");
  const expanded = normalized.length === 3
    ? normalized.split("").map((ch) => ch + ch).join("")
    : normalized;
  const value = Number.parseInt(expanded, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r},${g},${b},${alpha})`;
};

const parseStoredNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return numeric;
};

// ─── Hero geometry ───────────────────────────────────────────────────────────
const BAR_H = 76;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const buildHeroGeometry = (width, height, isTablet, isLandscape) => {
  const expWidth = clamp(
    width * (isTablet ? 0.72 : 0.88),
    280,
    isTablet ? 620 : width * 0.92,
  );
  const expHeight = clamp(
    height * (isTablet ? (isLandscape ? 0.52 : 0.48) : (isLandscape ? 0.56 : 0.62)),
    260,
    isTablet ? 560 : height * 0.72,
  );
  const expLeft = (width - expWidth) / 2;
  const expTop = BAR_H + (isLandscape ? 12 : 28);

  const colWidth = clamp(width * (isTablet ? 0.15 : 0.24), 90, isTablet ? 150 : 118);
  const colHeight = Math.round(colWidth * 1.4);
  const colLeft = width - colWidth - 16;
  const colTop = BAR_H + 28;

  const colScaleX = colWidth / expWidth;
  const colScaleY = colHeight / expHeight;
  const colTx = colLeft - expLeft - (expWidth * (1 - colScaleX)) / 2;
  const colTy = colTop - expTop - (expHeight * (1 - colScaleY)) / 2;

  const contentTop = expTop + expHeight + (isTablet ? 88 : 80);
  const range = Math.max(120, contentTop - (colTop + colHeight + 16));

  return {
    expWidth,
    expHeight,
    expLeft,
    expTop,
    colWidth,
    colHeight,
    colTop,
    colScaleX,
    colScaleY,
    colTx,
    colTy,
    contentTop,
    range,
  };
};

// ─── Sub-components ──────────────────────────────────────────────────────────

// ── HUD Podium Stats ──────────────────────────────────────────────────────────
const PODIUM_GOLD   = '#F4C542';
const PODIUM_SILVER = '#A8B8C8';
const PODIUM_BRONZE = '#C8835A';

const PodiumBar = memo(({ value, label, sublabel, rank, delay, maxH }) => {
  const growAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const rankColor = rank === 1 ? PODIUM_GOLD : rank === 2 ? PODIUM_SILVER : PODIUM_BRONZE;
  // Heights: 2nd tallest (silver) on left, tallest (gold) center, 3rd (bronze) right
  const barHeightMap = { 1: maxH, 2: maxH * 0.72, 3: maxH * 0.54 };
  const barH = barHeightMap[rank] || maxH * 0.5;

  useEffect(() => {
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.spring(growAnim, {
          toValue: 1, useNativeDriver: true,
          tension: 55, friction: 12, delay: 0,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, { toValue: 1, duration: 1400, useNativeDriver: true }),
            Animated.timing(glowAnim, { toValue: 0.3, duration: 1400, useNativeDriver: true }),
          ])
        ),
      ]).start();
    }, delay);
    return () => clearTimeout(t);
  }, [growAnim, glowAnim, delay]);

  const scaleY = growAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' });
  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.55] });

  return (
    <View style={podiumStyles.col}>
      {/* Value + label float above the bar */}
      <View style={podiumStyles.statAbove}>
        <Text style={[podiumStyles.statValue, { color: rankColor }]} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Text>
        <Text style={podiumStyles.statLabel} numberOfLines={1}>{label}</Text>
        {sublabel ? <Text style={podiumStyles.statSublabel} numberOfLines={1}>{sublabel}</Text> : null}
      </View>

      {/* The podium column itself */}
      <View style={[podiumStyles.barTrack, { height: barH }]}>
        {/* Glow behind bar */}
        <Animated.View style={[podiumStyles.barGlow, { backgroundColor: rankColor, opacity: glowOpacity }]} />
        {/* Growing bar */}
        <Animated.View
          style={[
            podiumStyles.bar,
            { backgroundColor: rankColor, transformOrigin: 'bottom', transform: [{ scaleY }] },
          ]}
        />
        {/* Rank badge on top of bar */}
        <View style={[podiumStyles.rankBadge, { borderColor: rankColor }]}>
          <Text style={[podiumStyles.rankText, { color: rankColor }]}>
            {rank === 1 ? '▲' : rank === 2 ? '◆' : '■'}
          </Text>
        </View>
        {/* Tick marks on the side */}
        {[0.25, 0.5, 0.75].map(frac => (
          <View key={frac} style={[podiumStyles.tick, { bottom: barH * frac, backgroundColor: rankColor }]} />
        ))}
      </View>

      {/* Base plate */}
      <View style={[podiumStyles.base, { borderColor: rankColor }]}>
        <View style={[podiumStyles.baseAccent, { backgroundColor: rankColor }]} />
      </View>
    </View>
  );
});

const PodiumStats = memo(({ rating, ratingCount, mainStoryH, completionistH, playtime, platforms, genres }) => {
  // Build 3 most interesting available stats
  const stats = [];

  if (rating != null) {
    stats.push({
      value: `${Math.round(rating)}`,
      label: 'RATING',
      sublabel: ratingCount ? `${ratingCount >= 1000 ? `${(ratingCount / 1000).toFixed(1)}K` : ratingCount} reviews` : null,
      priority: 1,
    });
  }
  if (completionistH != null) {
    stats.push({
      value: `${completionistH}h`,
      label: 'COMPLETE',
      sublabel: '100% run',
      priority: 2,
    });
  } else if (mainStoryH != null) {
    stats.push({
      value: `${mainStoryH}h`,
      label: 'MAIN STORY',
      sublabel: 'to finish',
      priority: 2,
    });
  } else if (playtime != null) {
    stats.push({
      value: `${playtime}h`,
      label: 'PLAYTIME',
      sublabel: 'avg.',
      priority: 2,
    });
  }
  if (platforms > 0) {
    stats.push({
      value: `${platforms}`,
      label: 'PLATFORMS',
      sublabel: null,
      priority: 3,
    });
  } else if (genres > 0) {
    stats.push({
      value: `${genres}`,
      label: 'GENRES',
      sublabel: null,
      priority: 3,
    });
  }

  // Pad to 3 if needed
  while (stats.length < 3) stats.push({ value: '—', label: 'N/A', sublabel: null, priority: stats.length + 1 });

  // Order: 2nd, 1st, 3rd (classic podium arrangement)
  const [p1, p2, p3] = stats;
  const ordered = [p2, p1, p3]; // silver left, gold center, bronze right
  const ranks   = [2,  1,  3];
  const delays  = [120, 0, 240];
  const MAX_H = 110;

  return (
    <View style={podiumStyles.container}>
      <View style={podiumStyles.header}>
        <View style={s.secSlant} />
        <Text style={s.secTitle}>STATS</Text>
        <View style={s.secScanLine} />
      </View>
      <View style={podiumStyles.podium}>
        {ordered.map((stat, i) => (
          <PodiumBar
            key={ranks[i]}
            value={stat.value}
            label={stat.label}
            sublabel={stat.sublabel}
            rank={ranks[i]}
            delay={delays[i]}
            maxH={MAX_H}
          />
        ))}
      </View>
    </View>
  );
});

const podiumStyles = StyleSheet.create({
  container: { paddingTop: 4 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 8 },
  podium: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 8,
  },
  col: {
    flex: 1,
    alignItems: 'center',
  },
  statAbove: {
    alignItems: 'center',
    marginBottom: 8,
    minHeight: 52,
    justifyContent: 'flex-end',
  },
  statValue: {
    fontSize: 22,
    fontFamily: 'Blackbots',
    letterSpacing: 1,
    marginBottom: 3,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: TEXT_MUTED,
    letterSpacing: 2,
    textAlign: 'center',
  },
  statSublabel: {
    fontSize: 8,
    color: TEXT_DISABLED,
    letterSpacing: 1,
    marginTop: 2,
    textAlign: 'center',
  },
  barTrack: {
    width: '100%',
    position: 'relative',
    overflow: 'visible',
    justifyContent: 'flex-end',
  },
  barGlow: {
    position: 'absolute',
    bottom: 0,
    left: '15%',
    right: '15%',
    height: '100%',
    borderRadius: 4,
    filter: 'blur(8px)',
  },
  bar: {
    width: '100%',
    height: '100%',
    borderRadius: 3,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    opacity: 0.85,
  },
  rankBadge: {
    position: 'absolute',
    top: -14,
    alignSelf: 'center',
    width: 22,
    height: 22,
    borderRadius: 2,
    borderWidth: 1,
    backgroundColor: '#101010',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 8,
    fontWeight: '900',
  },
  tick: {
    position: 'absolute',
    right: -4,
    width: 4,
    height: 1,
    opacity: 0.4,
  },
  base: {
    width: '100%',
    height: 8,
    borderWidth: 1,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: '#181818',
    marginTop: 1,
  },
  baseAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '35%',
    opacity: 0.5,
  },
});


const PlatformPill = ({ name, abbreviation }) => (
  <View style={s.platformPill}>
    <Text style={s.platformPillText}>{abbreviation || name}</Text>
  </View>
);

const ModePill = ({ mode }) => (
  <View style={s.modePill}>
    <Text style={s.modePillText}>{mode}</Text>
  </View>
);

const CompanyRow = ({ name, role }) => (
  <View style={s.companyRow}>
    <View style={s.companyAvatar}>
      <Ionicons name="business-outline" size={16} color={ACCENT} />
    </View>
    <View>
      <Text style={s.companyName}>{name}</Text>
      <Text style={s.companyRole}>{role}</Text>
    </View>
  </View>
);

const GameTrailerCard = memo(({ trailer, cardWidth, cardHeight }) => {
  const open = useCallback(() => Linking.openURL(trailer.url), [trailer.url]);
  return (
    <Pressable style={[s.trailerCard, { width: cardWidth }]} onPress={open} accessibilityRole="button"
      accessibilityLabel={`Play trailer: ${trailer.name}`}>
      <Image source={{ uri: trailer.thumbnail }} style={[s.trailerThumb, { width: cardWidth, height: cardHeight }]}
        contentFit="cover" recyclingKey={trailer.url} />
      <View style={[s.trailerOverlay, { height: cardHeight }]}>
        <View style={s.playBtn}>
          <Ionicons name="play" size={20} color={TEXT_PRIMARY} />
        </View>
      </View>
      <Text style={s.trailerName} numberOfLines={1}>{trailer.name}</Text>
    </Pressable>
  );
});
GameTrailerCard.displayName = "GameTrailerCard";

const Blobs = () => (
  <View style={s.bgShapes} pointerEvents="none">
    <View style={s.blob1} />
    <View style={s.blob2} />
    <View style={s.blob3} />
  </View>
);

// ─── Futuristic section helpers ──────────────────────────────────────────────
const SectionHeader = ({ title }) => (
  <View style={s.secTitleRow}>
    <View style={s.secSlant} />
    <Text style={s.secTitle}>{title}</Text>
    <View style={s.secScanLine} />
  </View>
);

/** Angular corner bracket decorations — top-left & bottom-right */
const HudFrame = () => (
  <>
    <View style={s.cornerTL}>
      <View style={s.cornerH} />
      <View style={s.cornerV} />
    </View>
    <View style={s.cornerBR}>
      <View style={s.cornerH} />
      <View style={s.cornerV} />
    </View>
    <View style={s.cornerTR}>
      <View style={s.cornerH} />
      <View style={s.cornerV} />
    </View>
  </>
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

const GameDetail = ({ route, navigation }) => {
  const {
    gameId: rawGameId, gameName, coverImage, genres: rawgGenres = [], playtime,
    igdbId,  // present when navigated from IGDB home (skip name search)
  } = route?.params || {};
  // If game came from IGDB, use its IGDB id as the stable identifier
  const gameId = igdbId || rawGameId;
  const { width: viewportWidth, height: viewportHeight } = useWindowDimensions();
  const isLandscape = viewportWidth > viewportHeight;
  const isTablet = Math.min(viewportWidth, viewportHeight) >= 768;
  const hero = useMemo(
    () => buildHeroGeometry(viewportWidth, viewportHeight, isTablet, isLandscape),
    [viewportWidth, viewportHeight, isTablet, isLandscape],
  );
  const sectionHorizontalInset = isTablet ? 24 : 16;
  const sectionPadding = isTablet ? 18 : 16;
  const horizontalListGap = isTablet ? 16 : 12;
  const trailerCardWidth = useMemo(
    () => clamp(viewportWidth * (isTablet ? 0.34 : 0.56), 190, isTablet ? 320 : 260),
    [viewportWidth, isTablet],
  );
  const trailerCardHeight = Math.round(trailerCardWidth * 0.56);
  const screenshotWidth = useMemo(
    () => clamp(viewportWidth * (isTablet ? 0.42 : 0.66), 220, isTablet ? 420 : 320),
    [viewportWidth, isTablet],
  );
  const screenshotHeight = Math.round(screenshotWidth * 9 / 16);
  const relatedCardWidth = useMemo(
    () => clamp(viewportWidth * (isTablet ? 0.2 : 0.32), 120, isTablet ? 190 : 150),
    [viewportWidth, isTablet],
  );
  const relatedCardHeight = Math.round(relatedCardWidth * 1.42);

  // ── State ──
  const [igdbData, setIgdbData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [noCredentials, setNoCredentials] = useState(null);
  const [userStatus, setUserStatus] = useState(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [dbReviews, setDbReviews] = useState([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [currentReviewPage, setCurrentReviewPage] = useState(1);
  const [showDeferredSections, setShowDeferredSections] = useState(false);
  const [showCompletionSheet, setShowCompletionSheet] = useState(false);
  const [showPlayingWindow, setShowPlayingWindow]     = useState(false);
  const [userPlaytimeHours, setUserPlaytimeHours]     = useState(null);
  const [userStoryProgress, setUserStoryProgress]     = useState(null);
  const [userOverallProgress, setUserOverallProgress] = useState(null);

  // ── Scroll-driven animations ──
  const scrollY = useRef(new Animated.Value(0)).current;
  // snapAnim: 0 = expanded, 1 = collapsed — spring-snaps when scroll crosses threshold
  const snapAnim = useRef(new Animated.Value(0)).current;
  // snapAnimLayout: same snap but JS-driven so it can animate layout (height/paddingTop)
  const snapAnimLayout = useRef(new Animated.Value(0)).current;
  // bubbleAnim: 0 → 1 bubbly bounce on sections after snap-to-collapsed
  const bubbleAnim = useRef(new Animated.Value(1)).current;
  const snapState = useRef(0); // 0 or 1
  const scrollYVal = useRef(0);

  useEffect(() => {
    const id = scrollY.addListener(({ value }) => {
      scrollYVal.current = value;
      const threshold = hero.range * 0.20;
      const target = value >= threshold ? 1 : 0;
      if (target !== snapState.current) {
        snapState.current = target;
        const springCfg = { tension: 200, friction: 24, overshootClamping: true };
        Animated.parallel([
          Animated.spring(snapAnim,       { toValue: target, useNativeDriver: true,  ...springCfg }),
          Animated.spring(snapAnimLayout, { toValue: target, useNativeDriver: false, ...springCfg }),
        ]).start();
        // bubbly bounce fires only when collapsing
        if (target === 1) {
          bubbleAnim.setValue(0);
          Animated.spring(bubbleAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 55,
            friction: 5,
            overshootClamping: false, // allow overshoot for the bubbly feel
          }).start();
        }
      }
    });
    return () => scrollY.removeListener(id);
  }, [scrollY, snapAnim, snapAnimLayout, hero.range]);

  // Section stagger pop-in
  const SEC_N = 10;
  const secAnims = useRef(Array.from({ length: SEC_N }, () => new Animated.Value(0))).current;

  // Hero poster interpolations — snap spring between expanded and collapsed
  const heroScaleX = snapAnim.interpolate({ inputRange: [0, 1], outputRange: [1, hero.colScaleX], extrapolate: "clamp" });
  const heroScaleY = snapAnim.interpolate({ inputRange: [0, 1], outputRange: [1, hero.colScaleY], extrapolate: "clamp" });
  const heroTX = snapAnim.interpolate({ inputRange: [0, 1], outputRange: [0, hero.colTx], extrapolate: "clamp" });
  const heroTY = snapAnim.interpolate({ inputRange: [0, 1], outputRange: [0, hero.colTy], extrapolate: "clamp" });

  // Expanded title (on poster) fades out — still scroll-driven for feel
  const expTitleOp = snapAnim.interpolate({ inputRange: [0, 0.35], outputRange: [1, 0], extrapolate: "clamp" });
  // Collapsed header fades in
  const colHeaderOp = snapAnim.interpolate({ inputRange: [0.5, 1], outputRange: [0, 1], extrapolate: "clamp" });
  // Top bar bg — still scroll-driven for gradual feel
  const barBgOp = scrollY.interpolate({ inputRange: [0, hero.range * 0.8], outputRange: [0, 0.94], extrapolate: "clamp" });
  // Poster glow border when collapsed
  const borderOp = snapAnim.interpolate({ inputRange: [0.7, 1], outputRange: [0, 0.7], extrapolate: "clamp" });

  // Game title — snap spring from expanded to collapsed position
  const titleInset = isTablet ? 16 : 12;
  const titleTX = snapAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 16 - (hero.expLeft + titleInset)],
    extrapolate: "clamp",
  });
  const titleTY = snapAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, (hero.colTop + 4) - (hero.expTop + hero.expHeight + 10)],
    extrapolate: "clamp",
  });

  // Meta row — snap spring from expanded to collapsed position
  const metaTX = snapAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 16 - (hero.expLeft + titleInset)],
    extrapolate: "clamp",
  });
  const metaTY = snapAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, (hero.colTop + 4 + 28) - (hero.expTop + hero.expHeight + 38)],
    extrapolate: "clamp",
  });

  // ── Section animation helper ──
  const secStyle = (i) => ({
    opacity: secAnims[Math.min(i, SEC_N - 1)],
    transform: [{
      translateY: secAnims[Math.min(i, SEC_N - 1)].interpolate({
        inputRange: [0, 1], outputRange: [28, 0],
      }),
    }],
  });

  // ── Trigger section pop-in ──
  useEffect(() => {
    if (igdbData) {
      secAnims.forEach((a) => a.setValue(0));
      Animated.stagger(80,
        secAnims.map((a) => Animated.spring(a, { toValue: 1, tension: 50, friction: 9, useNativeDriver: true }))
      ).start();
    }
  }, [igdbData]);

  // Defer heavy carousels/reviews until initial interactions settle.
  useEffect(() => {
    setShowDeferredSections(false);
    if (!igdbData) return;
    const task = InteractionManager.runAfterInteractions(() => {
      setShowDeferredSections(true);
    });
    return () => task.cancel?.();
  }, [igdbData, gameId]);

  // ── Data fetching ──
  useEffect(() => {
    if (!gameId) return;
    hasIGDBCredentials().then((has) => {
      if (!has) { setNoCredentials(true); setIsLoading(false); }
      else { setNoCredentials(false); fetchAll(); }
    });
  }, [gameId]);

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      // If we have a direct IGDB id, skip name search for guaranteed match
      const result = igdbId
        ? await fetchIGDBById(igdbId)
        : await fetchIGDBByName(gameName);
      if (!result) throw new Error("No IGDB data returned.");
      setIgdbData(result);
    } catch (err) {
      console.error("GameDetail IGDB fetch error:", err);
      Alert.alert("IGDB API Not Found",
        "Could not load game details from IGDB. Please check your API credentials and try again.",
        [{ text: "Go Back", onPress: () => navigation?.goBack(), style: "cancel" },
         { text: "Retry", onPress: () => fetchAll() }]);
    } finally { setIsLoading(false); }
  };

  const loadUserGameTracking = useCallback(async () => {
    if (!gameId) return;
    try {
      const pairs = await AsyncStorage.multiGet([
        `game_playtime_${gameId}`,
        `game_story_progress_${gameId}`,
        `game_overall_progress_${gameId}`,
      ]);
      const playtime = parseStoredNumber(pairs[0]?.[1]);
      const story = parseStoredNumber(pairs[1]?.[1]);
      const overall = parseStoredNumber(pairs[2]?.[1]);

      setUserPlaytimeHours(playtime !== null && playtime >= 0 ? playtime : null);
      setUserStoryProgress(story !== null ? clamp(story, 0, 100) : null);
      setUserOverallProgress(overall !== null ? clamp(overall, 0, 100) : null);
    } catch (error) {
      console.warn('Failed to load user game tracking from storage:', error);
    }
  }, [gameId]);

  useFocusEffect(useCallback(() => {
    if (!gameId) return;
    (async () => {
      setIsLoadingReviews(true);
      try {
        const rv = await getMediaReviews("games", gameId);
        if (rv?.success) setDbReviews(rv.reviews || []);
      } finally { setIsLoadingReviews(false); }
    })();
  }, [gameId]));

  useEffect(() => {
    loadUserGameTracking();
  }, [loadUserGameTracking]);

  useFocusEffect(useCallback(() => {
    loadUserGameTracking();
  }, [loadUserGameTracking]));

  useEffect(() => {
    if (!gameId) return;
    getMediaStatus("games", gameId).then((r) => {
      if (r.success && r.data) { setUserStatus(r.data.status); setIsWishlisted(r.data.is_wishlisted); }
    });
  }, [gameId]);

  // ── Handlers ──
  const handleStatusChange = async (ns) => {
    const previousStatus = userStatus;
    setUserStatus(ns);

    // Open popup instantly; persist status in the background.
    if (ns === 'watched') {
      setShowCompletionSheet(true);
      AsyncStorage.setItem(`game_story_progress_${gameId}`, "100").catch(() => {});
    }
    if (ns === 'watching') {
      setShowPlayingWindow(true);
    }

    try {
      await setMediaStatus("games", gameId, ns);
    } catch (error) {
      console.warn("Failed to persist game status:", error);
      setUserStatus(previousStatus);
      if (ns === 'watched') setShowCompletionSheet(false);
      if (ns === 'watching') setShowPlayingWindow(false);
    }
  };
  const handleWishlistToggle = async (w) => { setIsWishlisted(w); await setWishlist("games", gameId, w); };
  const handleGoBack = useCallback(() => navigation?.goBack(), [navigation]);
  const handleCompletionWindowClose = useCallback(() => {
    setShowCompletionSheet(false);
    loadUserGameTracking();
  }, [loadUserGameTracking]);
  const handlePlayingWindowClose = useCallback(() => {
    setShowPlayingWindow(false);
    loadUserGameTracking();
  }, [loadUserGameTracking]);

  const renderScreenshot = useCallback(({ item }) => (
    <ScreenshotCard uri={item} style={[s.screenshot, { width: screenshotWidth, height: screenshotHeight }]} />
  ), [screenshotHeight, screenshotWidth]);
  const renderTrailer = useCallback(({ item }) => (
    <GameTrailerCard trailer={item} cardWidth={trailerCardWidth} cardHeight={trailerCardHeight} />
  ), [trailerCardHeight, trailerCardWidth]);
  const renderSimilar = useCallback(({ item }) => (
    <Pressable style={[s.relatedCard, { width: relatedCardWidth, height: relatedCardHeight }]}
      onPress={() => navigation?.push("DetailsGames", { gameId: item.id, gameName: item.name, coverImage: item.coverImage })}
      accessibilityRole="button" accessibilityLabel={`View similar game: ${item.name}`}>
      <Image source={{ uri: item.coverImage }} style={s.relatedImg} contentFit="cover" recyclingKey={`sim-${item.id}`} />
      <View style={s.relatedOverlay}>
        <Text style={s.relatedTitle} numberOfLines={2}>{item.name}</Text>
      </View>
    </Pressable>
  ), [navigation, relatedCardHeight, relatedCardWidth]);

  // ── Derived data ──
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
  const releaseDate = igdbData?.releaseDate || "TBA";
  const gameDescription = summary || storyline || "No description available.";
  const estimatedPlaytimeFromProgress = useMemo(() => {
    const mainStoryHours = parseStoredNumber(igdbData?.timeToBeat?.mainStory);
    const completionistHours = parseStoredNumber(igdbData?.timeToBeat?.completionist);

    const estimateFromStory = (mainStoryHours !== null && userStoryProgress !== null)
      ? (mainStoryHours * userStoryProgress) / 100
      : null;
    const estimateFromOverall = (completionistHours !== null && userOverallProgress !== null)
      ? (completionistHours * userOverallProgress) / 100
      : null;

    if (estimateFromStory !== null && estimateFromOverall !== null) {
      return Math.max(estimateFromStory, estimateFromOverall);
    }
    return estimateFromOverall ?? estimateFromStory;
  }, [
    igdbData?.timeToBeat?.mainStory,
    igdbData?.timeToBeat?.completionist,
    userStoryProgress,
    userOverallProgress,
  ]);

  const resolvedPlayedHours = useMemo(() => {
    if (userPlaytimeHours !== null && userPlaytimeHours > 0) return userPlaytimeHours;
    if (estimatedPlaytimeFromProgress !== null && estimatedPlaytimeFromProgress > 0) return estimatedPlaytimeFromProgress;
    if (igdbData?.timeToBeat?.mainStory) return igdbData.timeToBeat.mainStory;
    if (playtime) return playtime;
    return null;
  }, [userPlaytimeHours, estimatedPlaytimeFromProgress, igdbData?.timeToBeat?.mainStory, playtime]);

  const playtimeVal = resolvedPlayedHours ? Math.max(1, Math.round(resolvedPlayedHours)) : null;
  const isEstimatedPlaytime = userPlaytimeHours === null && estimatedPlaytimeFromProgress !== null;
  const playtimeText = playtimeVal
    ? `${playtimeVal}h ${isEstimatedPlaytime ? "Played (Est.)" : "Playtime"}`
    : "Playtime Unknown";
  const statusText = igdbData?.status || "Unknown";

  // Reviews pagination
  const PER_PAGE = 10;
  const totalPages = useMemo(() => Math.ceil(dbReviews.length / PER_PAGE), [dbReviews.length]);
  const visibleReviews = useMemo(
    () => dbReviews.slice((currentReviewPage - 1) * PER_PAGE, currentReviewPage * PER_PAGE),
    [dbReviews, currentReviewPage]
  );
  const sectionCardStyle = useMemo(
    () => ({ marginHorizontal: sectionHorizontalInset, padding: sectionPadding }),
    [sectionHorizontalInset, sectionPadding],
  );

  // ── No credentials ──
  if (noCredentials === true) {
    return (
      <View style={s.container}>
        <StatusBar barStyle="light-content" backgroundColor={BG} />
        <Blobs />
        <SafeAreaView style={s.noCredSafe} edges={["top", "bottom"]}>
          <View style={s.noCredBox}>
            <View style={s.noCredIcon}><Ionicons name="game-controller-outline" size={56} color={ACCENT} /></View>
            <Text style={s.noCredTitle}>IGDB API Key Required</Text>
            <Text style={s.noCredBody}>
              Game details are powered by the IGDB database. To view this page you need to add your own Twitch / IGDB Client ID and Access Token in Settings.
            </Text>
            <Pressable style={s.noCredPrimBtn} onPress={() => navigation?.navigate("ProfilePage")}
              accessibilityRole="button" accessibilityLabel="Go to Settings">
              <Ionicons name="settings-outline" size={18} color={TEXT_PRIMARY} style={{ marginRight: 8 }} />
              <Text style={s.noCredPrimText}>Go to Settings</Text>
            </Pressable>
            <Pressable style={s.noCredSecBtn} onPress={() => navigation?.goBack()}
              accessibilityRole="button" accessibilityLabel="Go back">
              <Text style={s.noCredSecText}>Go Back</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ── Loading ──
  if (isLoading) {
    return (<View style={s.container}><Blobs /><DetailsSkeleton /></View>);
  }
  if (!igdbData) {
    return (<View style={s.container}><Blobs /></View>);
  }

  // ── Main render ──
  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />

      {/* ── Fixed top bar ── */}
      <SafeAreaView style={s.topBar} edges={["top"]}>
        <Animated.View style={[s.topBarBg, { opacity: barBgOp }]} />
        <View style={s.topBarRow}>
          <Pressable style={s.backBtn} onPress={handleGoBack}
            accessibilityRole="button" accessibilityLabel="Go back">
            <Ionicons name="arrow-back" size={24} color={TEXT_PRIMARY} />
          </Pressable>
        </View>
      </SafeAreaView>

      {/* ── Blobs ── */}
      <Blobs />

      {/* ── Hero poster (center → top-right) ── */}
      <Animated.View style={[s.heroWrap, {
        left: hero.expLeft,
        top: hero.expTop,
        width: hero.expWidth,
        height: hero.expHeight,
        borderRadius: isTablet ? 28 : 24,
        transform: [
          { translateX: heroTX }, { translateY: heroTY },
          { scaleX: heroScaleX }, { scaleY: heroScaleY },
          // bubbly pop: slight scale overshoot then settle
          { scale: bubbleAnim.interpolate({ inputRange: [0, 1], outputRange: [1.07, 1], extrapolate: 'clamp' }) },
        ],
      }]} pointerEvents="none">
        <Image source={{ uri: cover }} style={s.heroImg} contentFit="cover"
          recyclingKey={`game-poster-${gameId}`} transition={200} />
        {/* Cyan glow border when collapsed */}
        <Animated.View style={[s.heroBorder, { opacity: borderOp }]} />
      </Animated.View>

      {/* ── Collapsed header gradient backdrop — renders AFTER hero so it layers on top on Android ── */}
      <Animated.View style={[s.colGradWrap, { opacity: colHeaderOp }]} pointerEvents="none">
        <LinearGradient
          colors={["rgba(0,0,0,0.95)", "rgba(0,0,0,0.88)", "rgba(0,0,0,0.4)", "transparent"]}
          locations={[0, 0.4, 0.7, 1]}
          style={[s.colGrad, { height: hero.colTop + hero.colHeight + (isTablet ? 70 : 50) }]}
        />
      </Animated.View>

      {/* ── Game title — physically moves from expanded to collapsed position ── */}
      <Animated.View
        style={{
          position: "absolute",
          zIndex: 47,
          left: hero.expLeft + titleInset,
          top: hero.expTop + hero.expHeight + 10,
          width: viewportWidth - 16 - hero.colWidth - (isTablet ? 52 : 40),
          transform: [
            { translateX: titleTX }, { translateY: titleTY },
            // bubbly micro-jump upward then settle
            { translateY: bubbleAnim.interpolate({ inputRange: [0, 1], outputRange: [-7, 0], extrapolate: 'clamp' }) },
          ],
        }}
        pointerEvents="none"
      >
        <Text style={s.expTitle} numberOfLines={1}>{name}</Text>
      </Animated.View>

      {/* ── Meta row (date/playtime/status) — physically moves from expanded to collapsed position ── */}
      <Animated.View
        style={{
          position: "absolute",
          zIndex: 47,
          left: hero.expLeft + titleInset,
          top: hero.expTop + hero.expHeight + 38,
          width: viewportWidth - 16 - hero.colWidth - (isTablet ? 52 : 40),
          transform: [
            { translateX: metaTX }, { translateY: metaTY },
            // bubbly micro-jump (slightly less than title for layered feel)
            { translateY: bubbleAnim.interpolate({ inputRange: [0, 1], outputRange: [-5, 0], extrapolate: 'clamp' }) },
          ],
        }}
        pointerEvents="none"
      >
        <View style={s.expMetaRow}>
          <Text style={s.expMetaText}>{releaseDate}</Text>
          <Text style={s.expDot}>•</Text>
          <Text style={s.expMetaText}>{playtimeText}</Text>
          <Text style={s.expDot}>•</Text>
          <Text style={s.expMetaText}>{statusText}</Text>
        </View>
      </Animated.View>

      {/* ── Scrollable content ── */}
      <Animated.ScrollView style={s.scroll}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}>

        {/* Animated spacer — springs from expanded height to collapsed height so
            content snaps up to sit right below the collapsed poster then scrolls normally */}
        <Animated.View style={{
          height: snapAnimLayout.interpolate({
            inputRange: [0, 1],
            outputRange: [hero.contentTop, hero.colTop + hero.colHeight + 24],
            extrapolate: 'clamp',
          }),
        }} />

        {/* Sections wrapper — bubbly bounce after snap */}
        <Animated.View style={{
          transform: [
            { translateY: bubbleAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
            { scaleY:     bubbleAnim.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) },
            { scaleX:     bubbleAnim.interpolate({ inputRange: [0, 1], outputRange: [0.99, 1] }) },
          ],
        }}>

        {/* §0 — Description */}
        <Animated.View style={[sectionCardStyle, s.descriptionSection, secStyle(0)]}>
          <CyberpunkFrame color={ACCENT} style={s.descriptionFrame}>
            <SectionHeader title="DESCRIPTION" />
            <Text style={s.descBody}>{gameDescription}</Text>
          </CyberpunkFrame>
        </Animated.View>

        {/* §1 — Completion Time */}
        {igdbData?.timeToBeat && (igdbData.timeToBeat.mainStory || igdbData.timeToBeat.mainExtra || igdbData.timeToBeat.completionist) && (
          <Animated.View style={[sectionCardStyle, s.howLongSection, secStyle(1)]}>
            <CyberpunkFrame4 color={ACCENT} style={s.howLongFrame}>
              <CompletionChart data={igdbData.timeToBeat} />
            </CyberpunkFrame4>
          </Animated.View>
        )}

        {/* §2 — My Status */}
        <Animated.View style={[sectionCardStyle, s.unboxedSection, secStyle(2)]}>
          <SectionHeader title="MY STATUS" />
          <StatusTag status={userStatus} isWishlisted={isWishlisted}
            onStatusChange={handleStatusChange} onWishlistToggle={handleWishlistToggle} mediaType="games" />
        </Animated.View>

        {/* §3 — Platforms */}
        {platforms.length > 0 && (
          <Animated.View style={[sectionCardStyle, s.unboxedSection, secStyle(3)]}>
            <SectionHeader title="PLATFORMS" />
            <View style={s.pillRow}>
              {platforms.map((p, i) => <PlatformPill key={i} name={p.name} abbreviation={p.abbreviation} />)}
            </View>
          </Animated.View>
        )}

        {/* §4 — Genres, Themes, Modes */}
        {(genres.length > 0 || themes.length > 0 || gameModes.length > 0) && (
          <Animated.View style={[sectionCardStyle, s.unboxedSection, secStyle(4)]}>
            <SectionHeader title="GENRES & MODES" />
            {genres.length > 0 && (
              <>
                <Text style={s.subLabel}>GENRES</Text>
                <View style={s.pillRow}>{genres.map((g, i) => <GenrePill key={i} genre={g} />)}</View>
              </>
            )}
            {themes.length > 0 && (
              <>
                <Text style={[s.subLabel, { marginTop: 14 }]}>THEMES</Text>
                <View style={s.pillRow}>{themes.map((t, i) => <GenrePill key={i} genre={t} />)}</View>
              </>
            )}
            {gameModes.length > 0 && (
              <>
                <Text style={[s.subLabel, { marginTop: 14 }]}>GAME MODES</Text>
                <View style={s.pillRow}>{gameModes.map((m, i) => <ModePill key={i} mode={m} />)}</View>
              </>
            )}
          </Animated.View>
        )}

        {showDeferredSections ? (
          <>
            {/* §5 — Developers & Publishers */}
            {(developers.length > 0 || publishers.length > 0) && (
              <Animated.View style={[sectionCardStyle, s.framedSection, secStyle(5)]}>
                <CyberpunkFrame2 color={ACCENT} style={s.studioFrame}>
                  <SectionHeader title="STUDIO" />
                  <View style={s.companyList}>
                    {developers.map((d, i) => <CompanyRow key={`d-${i}`} name={d} role="Developer" />)}
                    {publishers.map((p, i) => <CompanyRow key={`p-${i}`} name={p} role="Publisher" />)}
                  </View>
                </CyberpunkFrame2>
              </Animated.View>
            )}

            {/* §6 — Trailers */}
            {trailers.length > 0 && (
              <Animated.View style={[sectionCardStyle, s.unboxedSection, secStyle(6)]}>
                <SectionHeader title="TRAILERS" />
                <FlatList data={trailers} horizontal showsHorizontalScrollIndicator={false}
                  contentContainerStyle={[s.hList, { gap: horizontalListGap }]} keyExtractor={(t) => t.id} renderItem={renderTrailer} />
              </Animated.View>
            )}

            {/* §7 — Screenshots */}
            {screenshots.length > 0 && (
              <Animated.View style={[sectionCardStyle, s.unboxedSection, secStyle(7)]}>
                <SectionHeader title="SCREENSHOTS" />
                <FlatList data={screenshots} horizontal showsHorizontalScrollIndicator={false}
                  contentContainerStyle={[s.hList, { gap: horizontalListGap }]} keyExtractor={(_, i) => `ss-${i}`} renderItem={renderScreenshot} />
              </Animated.View>
            )}

            {/* §8 — Reviews */}
            <Animated.View style={[sectionCardStyle, s.framedSection, secStyle(8)]}>
              <View style={s.reviewFramePlain}>
                <View style={s.reviewHeader}>
                  <Text style={s.reviewTitlePlain}>REVIEWS</Text>
                  <Pressable style={s.addReviewBtn}
                    onPress={() => navigation?.navigate("ReviewAnime", { animeId: gameId, id: gameId, title: name, coverImage: cover, mediaType: "games" })}
                    accessibilityRole="button" accessibilityLabel="Write a review" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="add" size={22} color={ACCENT} />
                  </Pressable>
                </View>
                {isLoadingReviews ? (
                  <ActivityIndicator color={ACCENT} style={{ marginVertical: 20 }} />
                ) : visibleReviews.length > 0 ? (
                  <>
                    {visibleReviews.map((r) => (
                      <ReviewCard key={r.id}
                        name={r.profiles?.use_display_name && r.profiles?.display_name ? r.profiles.display_name : r.profiles?.username || `User ${r.user_id?.substring(0, 8)}`}
                        rating={Math.ceil(r.overall_rating / 2)}
                        text={r.content}
                        avatarUrl={r.profiles?.avatar_url}
                        mediaType="games"
                      />
                    ))}
                    {dbReviews.length > PER_PAGE && (
                      <View style={s.pagRow}>
                        <Pressable style={[s.pagBtn, currentReviewPage === 1 && s.pagBtnOff]}
                          onPress={() => setCurrentReviewPage((p) => Math.max(1, p - 1))} disabled={currentReviewPage === 1}>
                          <Ionicons name="chevron-back" size={20} color={currentReviewPage === 1 ? TEXT_DISABLED : TEXT_PRIMARY} />
                          <Text style={[s.pagText, currentReviewPage === 1 && s.pagTextOff]}>Previous</Text>
                        </Pressable>
                        <Text style={s.pagInd}>{currentReviewPage} / {totalPages}</Text>
                        <Pressable style={[s.pagBtn, currentReviewPage === totalPages && s.pagBtnOff]}
                          onPress={() => setCurrentReviewPage((p) => Math.min(totalPages, p + 1))} disabled={currentReviewPage === totalPages}>
                          <Text style={[s.pagText, currentReviewPage === totalPages && s.pagTextOff]}>Next</Text>
                          <Ionicons name="chevron-forward" size={20} color={currentReviewPage === totalPages ? TEXT_DISABLED : TEXT_PRIMARY} />
                        </Pressable>
                      </View>
                    )}
                  </>
                ) : (
                  <Text style={s.noData}>No reviews yet. Be the first to review!</Text>
                )}
              </View>
            </Animated.View>

            {/* §9 — Similar Games */}
            {similarGames.length > 0 && (
              <Animated.View style={[sectionCardStyle, s.unboxedSection, { marginBottom: 32 }, secStyle(9)]}>
                <SectionHeader title="SIMILAR GAMES" />
                <FlatList data={similarGames} horizontal showsHorizontalScrollIndicator={false}
                  contentContainerStyle={[s.hList, { gap: horizontalListGap }]} keyExtractor={(g) => g.id.toString()} renderItem={renderSimilar} />
              </Animated.View>
            )}
          </>
        ) : (
          <View style={s.deferredPlaceholder}>
            <ActivityIndicator color={ACCENT} />
          </View>
        )}
        </Animated.View>{/* end sections bubble wrapper */}
      </Animated.ScrollView>

      {/* ── Completion popup (playtime + DLC tracker) ── */}
      <CompletedWindow
        visible={showCompletionSheet}
        gameId={String(gameId)}
        igdbId={igdbData?.igdbId}
        gameName={name}
        timeToBeat={igdbData?.timeToBeat}
        onClose={handleCompletionWindowClose}
      />

      {/* ── Playing popup (story + overall progress) ── */}
      <PlayingWindow
        visible={showPlayingWindow}
        gameId={String(gameId)}
        gameName={name}
        onClose={handlePlayingWindowClose}
      />
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  // ── Background blobs ──
  bgShapes: { position: "absolute", top: 0, left: 0, right: 0, height: 500, overflow: "hidden" },
  blob1: { position: "absolute", top: -60, right: -80, width: 320, height: 320, borderRadius: 160, backgroundColor: "#083344", opacity: 0.12, transform: [{ scaleX: 1.4 }, { rotate: "20deg" }] },
  blob2: { position: "absolute", top: 120, left: -100, width: 260, height: 260, borderRadius: 130, backgroundColor: "#0E7490", opacity: 0.1, transform: [{ scaleY: 1.3 }, { rotate: "-10deg" }] },
  blob3: { position: "absolute", top: 260, right: 40, width: 200, height: 200, borderRadius: 100, backgroundColor: "#155E75", opacity: 0.08 },

  // ── Top bar ──
  topBar: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 100, height: BAR_H, justifyContent: "center", paddingHorizontal: 12 },
  topBarBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.92)",
    borderBottomWidth: 1,
    borderBottomColor: hexToRgba(ACCENT, 0.2),
  },
  topBarRow: { flexDirection: "row", alignItems: "center" },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.4)" },

  // ── Collapsed header (left of poster) ──
  colGradWrap: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 45 },
  colGrad: { width: "100%", height: 190 },
  colHeader: { position: "absolute", top: 68, left: 16, right: 122, zIndex: 90 },
  colTitle: { fontSize: 20, fontFamily: "Blackbots", color: TEXT_PRIMARY, marginBottom: 4 },
  colMeta: { fontSize: 11, color: hexToRgba(ACCENT2, 0.85), fontWeight: "600", marginBottom: 2 },
  colStatus: { fontSize: 10, color: ACCENT, fontWeight: "700", letterSpacing: 1 },

  // ── Hero poster ──
  heroWrap: { position: "absolute", zIndex: 50, overflow: "hidden", backgroundColor: SURFACE_BG },
  heroImg: { width: "100%", height: "100%" },
  heroGrad: { position: "absolute", bottom: 0, left: 0, right: 0, height: "40%" },
  heroBorder: { ...StyleSheet.absoluteFillObject, borderWidth: 1.5, borderColor: ACCENT, borderRadius: 12 },

  // ── Expanded title (below poster) ──
  expMeta: { position: "absolute", zIndex: 55 },
  expTitle: {
    fontSize: 24,
    lineHeight: 30,
    color: TEXT_PRIMARY,
    fontFamily: "Blackbots",
    marginBottom: 5,
  },
  expMetaRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center" },
  expMetaText: { fontSize: 12, color: hexToRgba(ACCENT2, 0.9), fontWeight: "600" },
  expDot: { marginHorizontal: 8, color: hexToRgba(ACCENT, 0.75), fontSize: 11, fontWeight: "700" },

  // ── Scroll ──
  scroll: { flex: 1 },
  deferredPlaceholder: {
    paddingVertical: 18,
    alignItems: "center",
  },

  // ── Section container (futuristic HUD — with smooth corner brackets) ──
  sec: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: hexToRgba(ACCENT, 0.05),
    borderRadius: 6,
    padding: 16,
    borderWidth: 1,
    borderColor: hexToRgba(ACCENT, 0.2),
    overflow: "visible",
  },
  // Corner bracket decorations (rounded ends to match pill curve)
  cornerTL: { position: "absolute", top: -1, left: -1, width: 24, height: 24 },
  cornerBR: { position: "absolute", bottom: -1, right: -1, width: 24, height: 24, transform: [{ rotate: "180deg" }] },
  cornerTR: { position: "absolute", top: -1, right: -1, width: 18, height: 18, transform: [{ rotate: "90deg" }] },
  cornerH: { position: "absolute", top: 0, left: 0, width: "100%", height: 2, backgroundColor: ACCENT, borderRadius: 1 },
  cornerV: { position: "absolute", top: 0, left: 0, width: 2, height: "100%", backgroundColor: ACCENT, borderRadius: 1 },
  // Section header with slanted accent + scan line
  secTitleRow: { flexDirection: "row", alignItems: "center", marginBottom: 14, gap: 8 },
  secSlant: { width: 4, height: 16, backgroundColor: ACCENT, transform: [{ skewX: "-14deg" }] },
  secTitle: { color: ACCENT, fontSize: 13, fontFamily: "Blackbots", letterSpacing: 1.8, textTransform: "uppercase" },
  secScanLine: { flex: 1, height: 1, backgroundColor: hexToRgba(ACCENT, 0.18), marginLeft: 8 },
  subLabel: { fontSize: 10, letterSpacing: 3, fontWeight: "700", color: hexToRgba(ACCENT, 0.7), marginBottom: 10, textTransform: "uppercase" },

  // ── Description ──
  descriptionSection: {
    backgroundColor: "transparent",
    borderWidth: 0,
    paddingTop: 4,
    paddingHorizontal: 0,
    paddingBottom: 6,
    marginBottom: 16,
    overflow: "visible",
  },
  descriptionFrame: {
    minHeight: 180,
    width: "100%",
    backgroundColor: "#071421",
  },
  descBody: { fontSize: 14, color: TEXT_SECONDARY, lineHeight: 22, paddingRight: 2 },
  howLongFrame: {
    width: "100%",
    backgroundColor: "#071421",
  },
  howLongSection: {
    backgroundColor: "transparent",
    borderWidth: 0,
    paddingTop: 4,
    paddingHorizontal: 0,
    paddingBottom: 6,
    marginBottom: 16,
    overflow: "visible",
  },
  unboxedSection: {
    backgroundColor: "transparent",
    borderWidth: 0,
    marginBottom: 16,
    overflow: "visible",
  },
  framedSection: {
    backgroundColor: "transparent",
    borderWidth: 0,
    paddingTop: 4,
    paddingHorizontal: 0,
    paddingBottom: 6,
    marginBottom: 16,
    overflow: "visible",
  },
  studioFrame: {
    width: "100%",
    backgroundColor: "#071421",
    paddingTop: 8,
  },
  reviewFramePlain: {
    width: "100%",
    backgroundColor: "transparent",
    borderWidth: 0,
    borderColor: "transparent",
    borderRadius: 0,
    padding: 0,
  },

  // ── Pills (angular — not rounded) ──
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  platformPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: ACCENT2,
    backgroundColor: hexToRgba(ACCENT, 0.08),
  },
  platformPillText: { fontSize: 11, color: ACCENT2, fontWeight: "700", letterSpacing: 0.8 },
  modePill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: ACCENT,
    backgroundColor: hexToRgba(ACCENT, 0.08),
  },
  modePillText: { fontSize: 11, color: ACCENT, fontWeight: "700", letterSpacing: 0.8 },

  // ── Companies ──
  companyList: { gap: 12 },
  companyRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  companyAvatar: {
    width: 34,
    height: 34,
    borderRadius: 4,
    backgroundColor: hexToRgba(ACCENT, 0.12),
    borderWidth: 1,
    borderColor: hexToRgba(ACCENT, 0.25),
    justifyContent: "center",
    alignItems: "center",
  },
  companyName: { fontSize: 13, color: TEXT_PRIMARY, fontWeight: "700", letterSpacing: 0.5 },
  companyRole: { fontSize: 11, color: ACCENT2, marginTop: 2, letterSpacing: 1 },

  // ── Trailers ──
  trailerCard: { width: 200 },
  trailerThumb: { width: 200, height: 112, borderRadius: 4, backgroundColor: SURFACE_SUBTLE },
  trailerOverlay: { position: "absolute", top: 0, left: 0, right: 0, height: 112, borderRadius: 4, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "center", alignItems: "center" },
  playBtn: { width: 44, height: 44, borderRadius: 4, backgroundColor: hexToRgba(ACCENT, 0.9), justifyContent: "center", alignItems: "center", transform: [{ rotate: "0deg" }] },
  trailerName: { fontSize: 12, color: "#ccc", marginTop: 6 },

  // ── Screenshots ──
  screenshot: { width: 240, height: 135, borderRadius: 3, backgroundColor: SURFACE_SUBTLE, borderWidth: 1, borderColor: hexToRgba(ACCENT, 0.1) },

  // ── Horizontal list ──
  hList: { paddingHorizontal: 2, gap: 12 },

  // ── Related / Similar ──
  relatedCard: { width: 120, height: 170, borderRadius: 3, overflow: "hidden", backgroundColor: SURFACE_SUBTLE, borderWidth: 1, borderColor: hexToRgba(ACCENT, 0.12) },
  relatedImg: { width: "100%", height: "100%" },
  relatedOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 8, backgroundColor: "rgba(0,0,0,0.75)" },
  relatedTitle: { fontSize: 11, color: TEXT_PRIMARY, fontWeight: "700", letterSpacing: 0.3 },

  // ── Reviews ──
  reviewHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  reviewTitlePlain: { flex: 1, minWidth: 0, color: ACCENT, fontSize: 13, fontFamily: "Blackbots", letterSpacing: 1.8, textTransform: "uppercase" },
  addReviewBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: "transparent", justifyContent: "center", alignItems: "center", flexShrink: 0 },
  noData: { fontSize: 14, color: hexToRgba(ACCENT, 0.78), textAlign: "center", paddingVertical: 20 },

  // ── Pagination ──
  pagRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 20, paddingTop: 15, borderTopWidth: 1, borderTopColor: hexToRgba(ACCENT, 0.2) },
  pagBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 2,
    backgroundColor: hexToRgba(ACCENT, 0.12),
    borderWidth: 1,
    borderColor: hexToRgba(ACCENT, 0.25),
    gap: 5,
  },
  pagBtnOff: { backgroundColor: "rgba(0,0,0,0.1)", opacity: 0.5 },
  pagText: { fontSize: 14, color: TEXT_PRIMARY, fontWeight: "500" },
  pagTextOff: { color: TEXT_DISABLED },
  pagInd: { fontSize: 14, color: TEXT_PRIMARY, fontWeight: "500" },

  // ── No credentials ──
  noCredSafe: { flex: 1, justifyContent: "center", alignItems: "center" },
  noCredBox: { alignItems: "center", paddingHorizontal: 32, maxWidth: 380, width: "100%" },
  noCredIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: hexToRgba(ACCENT, 0.12),
    borderWidth: 1,
    borderColor: hexToRgba(ACCENT, 0.3),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  noCredTitle: { fontSize: 22, fontFamily: "Genjiro", color: TEXT_PRIMARY, letterSpacing: 0.5, textAlign: "center", marginBottom: 16 },
  noCredBody: { fontSize: 14, color: "#aaa", lineHeight: 22, textAlign: "center", marginBottom: 32 },
  noCredPrimBtn: { flexDirection: "row", alignItems: "center", backgroundColor: ACCENT, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12, width: "100%", justifyContent: "center", marginBottom: 12 },
  noCredPrimText: { color: TEXT_PRIMARY, fontSize: 16, fontWeight: "700" },
  noCredSecBtn: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.15)", width: "100%", alignItems: "center" },
  noCredSecText: { color: "#888", fontSize: 15, fontWeight: "500" },
});

export default GameDetail;
