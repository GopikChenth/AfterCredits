import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  InteractionManager,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

import GlassCard from "../components/shared/GlassCard";
import StatsPill from "../components/details_page/StatsPill";
import GenrePill from "../components/details_page/GenrePill";
import CrewMember from "../components/details_page/CrewMember";
import ReviewCard from "../components/details_page/ReviewCard";
import StatusTag from "../components/details_page/StatusTag";
import { BackButton } from "../components/details_page/SharedListItems";
import DetailsSkeleton from "../components/skeletons/SkeletonDetails";
import {
  AnimatedDetailsHeader,
  DetailBackgroundShapes,
  DetailScreenState,
} from "../components/details_page/AnimeDetailsShell";
import { useAnimeDetailsData } from "../hooks/useAnimeDetailsData";
import { detailsAnimeStyles as styles } from "../stylehandler/detailsAnimeStyles";
import { getMediaTheme } from "../utils/mediaThemes";

const REVIEWS_PER_PAGE = 10;

const AnimeDetail = ({ route, navigation }) => {
  const [isCrewExpanded, setIsCrewExpanded] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [currentReviewPage, setCurrentReviewPage] = useState(1);
  const [showDeferredSections, setShowDeferredSections] = useState(false);

  const titleYRef = useRef(0);
  const headerOpacity = useRef(new Animated.Value(0)).current;

  const animeId = route?.params?.animeId;
  const theme = getMediaTheme("anime");

  const {
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
  } = useAnimeDetailsData(animeId);

  const handleScroll = useCallback(
    (event) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      const triggerPoint = titleYRef.current > 0 ? titleYRef.current : 100;
      headerOpacity.setValue(offsetY > triggerPoint ? 1 : 0);
    },
    [headerOpacity]
  );

  useEffect(() => {
    setShowDeferredSections(false);
    const task = InteractionManager.runAfterInteractions(() => {
      setShowDeferredSections(true);
    });

    return () => task.cancel?.();
  }, [animeId]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <DetailBackgroundShapes styles={styles} />
        <DetailsSkeleton />
      </View>
    );
  }

  if (error) {
    return (
      <DetailScreenState
        styles={styles}
        message={error}
        primaryAction={refreshAnimeDetails}
        primaryLabel="Retry"
        secondaryAction={() => navigation?.goBack()}
        secondaryLabel="Go Back"
        themeAccent={theme.accent}
      />
    );
  }

  if (!animeData) {
    return (
      <DetailScreenState
        styles={styles}
        message="No anime data available."
        primaryAction={() => navigation?.goBack()}
        primaryLabel="Go Back"
        themeAccent={theme.accent}
      />
    );
  }

  const visibleVoiceActors = useMemo(
    () =>
      isCrewExpanded
        ? animeData.voiceActors
        : animeData.voiceActors.slice(0, 5),
    [animeData.voiceActors, isCrewExpanded]
  );

  const totalReviewPages = useMemo(
    () => Math.ceil(dbReviews.length / REVIEWS_PER_PAGE),
    [dbReviews.length]
  );

  const currentReviews = useMemo(() => {
    const startIndex = (currentReviewPage - 1) * REVIEWS_PER_PAGE;
    return dbReviews.slice(startIndex, startIndex + REVIEWS_PER_PAGE);
  }, [currentReviewPage, dbReviews]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" />

      <AnimatedDetailsHeader
        styles={styles}
        title={animeData?.title}
        headerOpacity={headerOpacity}
        onBackPress={() => navigation?.goBack()}
      />

      <DetailBackgroundShapes styles={styles} />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <BackButton style={styles.backButton} onPress={() => navigation?.goBack()} />

        <View style={styles.heroSection}>
          <Image
            source={{ uri: animeData.bannerImage || animeData.coverImage }}
            style={styles.backdropImage}
            contentFit="cover"
            recyclingKey={`anime-hero-${animeId}`}
            transition={200}
          />
        </View>

        <GlassCard style={styles.descriptionSectionNative}>
          <View
            style={styles.titleYearRow}
            onLayout={(event) => {
              event.target.measure((x, y, width, height, pageX, pageY) => {
                titleYRef.current = pageY + height;
              });
            }}
          >
            <Text style={styles.mainTitle}>{animeData.title}</Text>
            <Text style={styles.year}>{animeData.year}</Text>
          </View>
          <Text style={styles.subtitleText}>{animeData.subtitle}</Text>
          <Text style={styles.studioInfo}>{animeData.studio}</Text>
          <Text
            style={styles.description}
            numberOfLines={isDescriptionExpanded ? undefined : 4}
          >
            {animeData.description}
          </Text>
          {animeData.description && animeData.description.length > 150 && (
            <Pressable
              onPress={() => setIsDescriptionExpanded((prev) => !prev)}
              accessibilityRole="button"
              accessibilityLabel={
                isDescriptionExpanded ? "Show less description" : "Show more description"
              }
            >
              <Text style={styles.expandDescriptionText}>
                {isDescriptionExpanded ? "Show Less" : "Read More"}
              </Text>
            </Pressable>
          )}
          <View style={styles.episodeStatusRow}>
            <Text style={styles.episodeCount}>{animeData.episodeCount}</Text>
            <Text style={styles.status}>Status: {animeData.status}</Text>
          </View>
        </GlassCard>

        <View style={styles.statsSection}>
          <StatsPill label="Popularity" count={animeData.stats.members} color="#FF9AA2" />
          <StatsPill label="Reviews" count={reviewStats.count} color="#B5EAD7" />
          <StatsPill label="Score" count={`${animeData.stats.score}%`} color="#A0C4FF" />
        </View>

        <View style={styles.statusSection}>
          <Text style={styles.statusSectionLabel}>MY STATUS</Text>
          <StatusTag
            status={userStatus}
            isWishlisted={isWishlisted}
            onStatusChange={handleStatusChange}
            onWishlistToggle={handleWishlistToggle}
          />
        </View>

        <GlassCard style={styles.genreCrewSectionNative}>
          <View style={styles.genreRow}>
            <Text style={styles.sectionLabel}>GENRE</Text>
            <View style={styles.genreList}>
              {animeData.genres.length > 0 ? (
                animeData.genres.map((genre) => <GenrePill key={genre} genre={genre} />)
              ) : (
                <Text style={styles.noDataText}>No genres available</Text>
              )}
            </View>
          </View>

          <View>
            <Text style={styles.sectionLabel}>CAST & CREW</Text>
            <View style={styles.crewList}>
              {animeData.voiceActors.length > 0 ? (
                <>
                  {visibleVoiceActors.map((member, index) => (
                    <CrewMember
                      key={`${member.id || member.name}-${index}`}
                      name={member.name}
                      role={member.role}
                      avatar={member.avatar}
                      image={member.image}
                      characterImage={member.characterImage}
                      characterName={member.characterName}
                      onPress={
                        member.id
                          ? () =>
                              navigation.navigate("CrewDetailPage", {
                                staffId: member.id,
                                staffName: member.name,
                              })
                          : undefined
                      }
                    />
                  ))}
                  {animeData.voiceActors.length > 5 && (
                    <Pressable
                      style={styles.expandButton}
                      onPress={() => setIsCrewExpanded((prev) => !prev)}
                      accessibilityRole="button"
                      accessibilityLabel={
                        isCrewExpanded ? "Show fewer crew members" : "Show all crew members"
                      }
                    >
                      <Text style={styles.expandButtonText}>
                        {isCrewExpanded
                          ? "Show Less"
                          : `Show All (${animeData.voiceActors.length})`}
                      </Text>
                    </Pressable>
                  )}
                </>
              ) : (
                <Text style={styles.noDataText}>No voice actor information available</Text>
              )}
            </View>
          </View>
        </GlassCard>

        {showDeferredSections ? (
          <>
            <GlassCard style={styles.reviewsSectionNative}>
              <View style={styles.reviewsHeader}>
                <Text style={styles.sectionLabel}>REVIEWS</Text>
                <Pressable
                  style={styles.addReviewButton}
                  onPress={() =>
                    navigation?.navigate("ReviewAnime", {
                      animeId: animeData.id,
                      id: animeData.id,
                      title: animeData.title,
                      coverImage: animeData.coverImage,
                      mediaType: "anime",
                    })
                  }
                  accessibilityRole="button"
                  accessibilityLabel="Write a review"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                </Pressable>
              </View>

              {dbReviews.length > 0 ? (
                <>
                  {currentReviews.map((review) => (
                    <ReviewCard
                      key={review.id}
                      name={
                        review.profiles?.use_display_name && review.profiles?.display_name
                          ? review.profiles.display_name
                          : review.profiles?.username || `User ${review.user_id.substring(0, 8)}`
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
                          currentReviewPage === 1 && styles.paginationButtonDisabled,
                        ]}
                        onPress={() => setCurrentReviewPage((prev) => Math.max(1, prev - 1))}
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
                            currentReviewPage === 1 && styles.paginationButtonTextDisabled,
                          ]}
                        >
                          Previous
                        </Text>
                      </Pressable>

                      <Text style={styles.pageIndicator}>
                        Page {currentReviewPage} of {totalReviewPages}
                      </Text>

                      <Pressable
                        style={[
                          styles.paginationButton,
                          currentReviewPage === totalReviewPages && styles.paginationButtonDisabled,
                        ]}
                        onPress={() =>
                          setCurrentReviewPage((prev) => Math.min(totalReviewPages, prev + 1))
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
                          color={currentReviewPage === totalReviewPages ? "#666" : "#fff"}
                        />
                      </Pressable>
                    </View>
                  )}
                </>
              ) : isLoadingReviews ? (
                <ActivityIndicator color="#fff" style={{ marginVertical: 20 }} />
              ) : (
                <Text style={styles.noDataText}>No reviews yet. Be the first to review!</Text>
              )}
            </GlassCard>

            <View style={styles.relatedSection}>
              <View style={{ paddingHorizontal: 20, marginBottom: 10 }}>
                <Text style={styles.sectionLabel}>RELATED SHOWS</Text>
              </View>
              {animeData.recommendations && animeData.recommendations.length > 0 ? (
                <FlatList
                  data={animeData.recommendations}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.relatedScrollContent}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => (
                    <Pressable
                      onPress={() => navigation?.push("DetailsAnime", { animeId: item.id })}
                      style={({ pressed }) => [
                        styles.relatedCard,
                        pressed && styles.relatedCardPressed,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`View related anime: ${item.title}`}
                    >
                      <Image
                        source={{ uri: item.image }}
                        style={styles.relatedCardImage}
                        contentFit="cover"
                        recyclingKey={`rel-${item.id}`}
                      />
                      <View style={styles.relatedCardOverlay}>
                        <Text style={styles.relatedCardTitle} numberOfLines={2}>
                          {item.title}
                        </Text>
                      </View>
                    </Pressable>
                  )}
                />
              ) : (
                <Text style={styles.noDataText}>No related shows available</Text>
              )}
            </View>
          </>
        ) : (
          <GlassCard style={styles.reviewsSectionNative}>
            <ActivityIndicator color="#fff" style={{ marginVertical: 20 }} />
          </GlassCard>
        )}
      </ScrollView>
    </View>
  );
};

export default AnimeDetail;
