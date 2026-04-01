import { useCallback, useEffect, useMemo, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";

import { getAnimeDetails, getStatusText } from "../services/api_anilist";
import {
  getMediaReviews,
  getMediaReviewStats,
} from "../services/reviewService";
import {
  getMediaStatus,
  setMediaStatus,
  setWishlist,
} from "../services/mediaStatusService";

const AVATAR_COLORS = [
  "#A78BFA",
  "#C4B5FD",
  "#B5EAD7",
  "#C7CEEA",
  "#DDD6FE",
  "#E2F0CB",
  "#818CF8",
  "#A0C4FF",
  "#9F7AEA",
  "#E2F0CB",
];

const getSafeReviewStats = (stats) => ({
  count: stats?.count ?? 0,
  averageRating: stats?.averageRating ?? 0,
});

const formatAnimeDetails = (data) => {
  const voiceActors =
    data.characters?.edges
      ?.filter((edge) => edge.voiceActors && edge.voiceActors.length > 0)
      ?.map((edge, index) => ({
        id: edge.voiceActors[0]?.id,
        name: edge.voiceActors[0]?.name?.full || "Unknown",
        role: `Voice of ${edge.node?.name?.full || "Character"}`,
        avatar: AVATAR_COLORS[index % AVATAR_COLORS.length],
        image: edge.voiceActors[0]?.image?.medium,
        characterImage: edge.node?.image?.large || edge.node?.image?.medium,
        characterName: edge.node?.name?.full || "Character",
      }))
      ?.slice(0, 12) || [];

  const reviews =
    data.reviews?.nodes?.map((review, index) => ({
      name: review.user?.name || "Anonymous",
      rating: Math.round((review.rating || 0) / 20),
      text: review.summary || "No review text available.",
      avatar: AVATAR_COLORS[index % AVATAR_COLORS.length],
      userAvatar: review.user?.avatar?.medium,
    })) || [];

  const recommendations =
    data.recommendations?.nodes
      ?.filter((node) => node.mediaRecommendation)
      ?.filter((node) => {
        const genres = node.mediaRecommendation.genres || [];
        return !genres.includes("Hentai");
      })
      ?.map((node) => ({
        id: node.mediaRecommendation.id,
        title:
          node.mediaRecommendation.title?.english ||
          node.mediaRecommendation.title?.romaji,
        subtitle: node.mediaRecommendation.genres?.slice(0, 3).join(", ") || "",
        image: node.mediaRecommendation.coverImage?.large,
        genres: node.mediaRecommendation.genres,
      })) || [];

  return {
    id: data.id,
    title: data.title?.english || data.title?.romaji || "Unknown Title",
    subtitle: data.title?.romaji || "",
    nativeTitle: data.title?.native || "",
    year: data.seasonYear || data.startDate?.year || "N/A",
    description:
      data.description?.replace(/<[^>]*>/g, "") || "No description available.",
    episodeCount: data.episodes ? `${data.episodes} Episodes` : "Unknown",
    duration: data.duration ? `${data.duration} min` : null,
    status: getStatusText(data.status) || "Unknown",
    bannerImage: data.bannerImage || data.coverImage?.extraLarge,
    coverImage: data.coverImage?.extraLarge || data.coverImage?.large,
    stats: {
      members: data.popularity || 0,
      reviews: data.reviews?.nodes?.length || 0,
      score: data.averageScore || 0,
    },
    genres: data.genres || [],
    studio: data.studios?.nodes?.[0]?.name || "Unknown Studio",
    voiceActors,
    reviews,
    recommendations,
    relations: data.relations || null,
    season: data.season,
    format: data.format,
  };
};

export const useAnimeDetailsData = (animeId) => {
  const [animeData, setAnimeData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userStatus, setUserStatus] = useState(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [dbReviews, setDbReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(getSafeReviewStats());
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);

  const refreshReviews = useCallback(async () => {
    if (!animeId) return;

    setIsLoadingReviews(true);
    try {
      const reviewsResult = await getMediaReviews("anime", animeId);
      if (reviewsResult.success) {
        setDbReviews(reviewsResult.reviews || []);
      }

      const statsResult = await getMediaReviewStats("anime", animeId);
      if (statsResult.success) {
        setReviewStats(getSafeReviewStats(statsResult.stats));
      }
    } catch (fetchError) {
      console.error("Error fetching reviews:", fetchError);
    } finally {
      setIsLoadingReviews(false);
    }
  }, [animeId]);

  const refreshUserStatus = useCallback(async () => {
    if (!animeId) return;
    const result = await getMediaStatus("anime", animeId);
    if (result.success && result.data) {
      setUserStatus(result.data.status);
      setIsWishlisted(result.data.is_wishlisted);
    }
  }, [animeId]);

  const refreshAnimeDetails = useCallback(async () => {
    if (!animeId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await getAnimeDetails(animeId);
      if (data?.genres?.includes("Hentai")) {
        setError("This content is not available.");
        setAnimeData(null);
        return;
      }

      setAnimeData(formatAnimeDetails(data));
    } catch (fetchError) {
      console.error("Error fetching anime details:", fetchError);
      setError("Failed to load anime details. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [animeId]);

  const handleStatusChange = useCallback(
    async (newStatus) => {
      setUserStatus(newStatus);
      if (newStatus === "watched" && isWishlisted) {
        setIsWishlisted(false);
      }
      await setMediaStatus("anime", animeId, newStatus);
    },
    [animeId, isWishlisted]
  );

  const handleWishlistToggle = useCallback(
    async (wishlisted) => {
      setIsWishlisted(wishlisted);
      await setWishlist("anime", animeId, wishlisted);
    },
    [animeId]
  );

  useFocusEffect(
    useCallback(() => {
      refreshReviews();
    }, [refreshReviews])
  );

  useEffect(() => {
    refreshUserStatus();
  }, [refreshUserStatus]);

  useEffect(() => {
    refreshAnimeDetails();
  }, [refreshAnimeDetails]);

  return useMemo(
    () => ({
      animeData,
      dbReviews,
      error,
      handleStatusChange,
      handleWishlistToggle,
      isLoading,
      isLoadingReviews,
      isWishlisted,
      refreshAnimeDetails,
      reviewStats,
      userStatus,
    }),
    [
      animeData,
      dbReviews,
      error,
      handleStatusChange,
      handleWishlistToggle,
      isLoading,
      isLoadingReviews,
      isWishlisted,
      refreshAnimeDetails,
      reviewStats,
      userStatus,
    ]
  );
};
