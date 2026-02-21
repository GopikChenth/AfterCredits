import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  Dimensions,
  Pressable,
  ActivityIndicator,
  Platform,
  Animated,
  StatusBar,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import StatsPill from '../components/details_page/StatsPill';
import GenrePill from '../components/details_page/GenrePill';
import CrewMember from '../components/details_page/CrewMember';
import ReviewCard from '../components/details_page/ReviewCard';
import StatusTag from '../components/details_page/StatusTag';
import DetailsSkeleton from '../components/skeletons/SkeletonDetails';
import { getMediaTheme } from '../utils/mediaThemes';
import { getAnimeDetails, getStatusText } from '../services/api_anilist';
import { getMediaReviews, getMediaReviewStats } from '../services/reviewService';
import { getMediaStatus, setMediaStatus, setWishlist } from '../services/mediaStatusService';


const { width, height } = Dimensions.get('window');

const AnimeDetail = ({ route, navigation }) => {
  const [isCrewExpanded, setIsCrewExpanded] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [currentReviewPage, setCurrentReviewPage] = useState(1);
  const [currentRelatedPage, setCurrentRelatedPage] = useState(1);
  const [animeData, setAnimeData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userStatus, setUserStatus] = useState(null); // 'watching', 'watched', 'dropped', or null
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [dbReviews, setDbReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ count: 0, averageRating: 0 });
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  
  // Scroll position tracking for header reveal
  const [scrollY, setScrollY] = useState(0);
  const [titleY, setTitleY] = useState(0); // Track title position
  const headerOpacity = useRef(new Animated.Value(0)).current;
  
  // Gesture and animation refs
  const translateX = useRef(new Animated.Value(0)).current;
  const gestureStartX = useRef(0);
  
  // Get anime ID from route params
  const animeId = route?.params?.animeId;
  
  // Get anime theme with integrated font utilities
  const theme = getMediaTheme('anime');

  // Fetch reviews from database
  useEffect(() => {
    const fetchReviews = async () => {
      if (!animeId) return;
      
      setIsLoadingReviews(true);
      
      try {
        // Fetch reviews
        const reviewsResult = await getMediaReviews('anime', animeId);
        if (reviewsResult.success) {
          setDbReviews(reviewsResult.reviews || []);
        }
        
        // Fetch stats
        const statsResult = await getMediaReviewStats('anime', animeId);
        if (statsResult.success) {
          setReviewStats(statsResult.stats);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setIsLoadingReviews(false);
      }
    };
    
    fetchReviews();
  }, [animeId]);

  // Fetch user's status for this anime
  useEffect(() => {
    const fetchStatus = async () => {
      if (!animeId) return;
      const result = await getMediaStatus('anime', animeId);
      if (result.success && result.data) {
        setUserStatus(result.data.status);
        setIsWishlisted(result.data.is_wishlisted);
      }
    };
    fetchStatus();
  }, [animeId]);

  // Handle status change
  const handleStatusChange = async (newStatus) => {
    setUserStatus(newStatus);
    if (newStatus === 'watched' && isWishlisted) {
      setIsWishlisted(false);
    }
    await setMediaStatus('anime', animeId, newStatus);
  };

  // Handle wishlist toggle
  const handleWishlistToggle = async (wishlisted) => {
    setIsWishlisted(wishlisted);
    await setWishlist('anime', animeId, wishlisted);
  };

  // Fetch anime details on mount
  useEffect(() => {
    if (animeId) {
      fetchAnimeDetails();
    }
  }, [animeId]);

  const fetchAnimeDetails = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getAnimeDetails(animeId);
      
      // Check if anime contains Hentai genre
      if (data?.genres?.includes('Hentai')) {
        setError('This content is not available.');
        setAnimeData(null);
        return;
      }
      
      setAnimeData(formatAnimeDetails(data));
    } catch (err) {
      console.error('Error fetching anime details:', err);
      setError('Failed to load anime details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Format API data for display
  const formatAnimeDetails = (data) => {
    // Generate avatar colors for voice actors (Pastel Palette)
    const avatarColors = ['#A78BFA', '#C4B5FD', '#B5EAD7', '#C7CEEA', '#DDD6FE', '#E2F0CB', '#818CF8', '#A0C4FF', '#9F7AEA', '#E2F0CB'];
    
    // Extract voice actors from characters
    const voiceActors = data.characters?.edges
      ?.filter(edge => edge.voiceActors && edge.voiceActors.length > 0)
      ?.map((edge, index) => ({
        id: edge.voiceActors[0]?.id,
        name: edge.voiceActors[0]?.name?.full || 'Unknown',
        role: `Voice of ${edge.node?.name?.full || 'Character'}`,
        avatar: avatarColors[index % avatarColors.length],
        image: edge.voiceActors[0]?.image?.medium,
        characterImage: edge.node?.image?.large || edge.node?.image?.medium,
        characterName: edge.node?.name?.full || 'Character',
      }))
      ?.slice(0, 12) || [];

    // Format reviews
    const reviews = data.reviews?.nodes?.map((review, index) => ({
      name: review.user?.name || 'Anonymous',
      rating: Math.round((review.rating || 0) / 20), // Convert to 5-star scale
      text: review.summary || 'No review text available.',
      avatar: avatarColors[index % avatarColors.length],
      userAvatar: review.user?.avatar?.medium,
    })) || [];

    // Format recommendations - Filter out Hentai content
    const recommendations = data.recommendations?.nodes
      ?.filter(node => node.mediaRecommendation)
      ?.filter(node => {
        const genres = node.mediaRecommendation.genres || [];
        return !genres.includes('Hentai');
      })
      ?.map(node => ({
        id: node.mediaRecommendation.id,
        title: node.mediaRecommendation.title?.english || node.mediaRecommendation.title?.romaji,
        subtitle: node.mediaRecommendation.genres?.slice(0, 3).join(', ') || '',
        image: node.mediaRecommendation.coverImage?.large,
        genres: node.mediaRecommendation.genres,
      })) || [];

    return {
      id: data.id,
      title: data.title?.english || data.title?.romaji || 'Unknown Title',
      subtitle: data.title?.romaji || '',
      nativeTitle: data.title?.native || '',
      year: data.seasonYear || data.startDate?.year || 'N/A',
      description: data.description?.replace(/<[^>]*>/g, '') || 'No description available.',
      episodeCount: data.episodes ? `${data.episodes} Episodes` : 'Unknown',
      duration: data.duration ? `${data.duration} min` : null,
      status: getStatusText(data.status) || 'Unknown',
      bannerImage: data.bannerImage || data.coverImage?.extraLarge,
      coverImage: data.coverImage?.extraLarge || data.coverImage?.large,
      stats: {
        members: data.popularity || 0,
        reviews: data.reviews?.nodes?.length || 0,
        score: data.averageScore || 0,
      },
      genres: data.genres || [],
      studio: data.studios?.nodes?.[0]?.name || 'Unknown Studio',
      voiceActors,
      reviews,
      recommendations,
      season: data.season,
      format: data.format,
    };
  };

  // Handle scroll to show/hide header
  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setScrollY(offsetY);
    
    // Show header when title scrolls out of view
    // Use titleY if measured, otherwise fallback to 100px
    const triggerPoint = titleY > 0 ? titleY : 100;
    const newOpacity = offsetY > triggerPoint ? 1 : 0;
    
    // Set opacity instantly without animation
    headerOpacity.setValue(newOpacity);
  };

  // Render action buttons (Watch/Wishlist)
  const renderActionButtons = () => (
    <View style={styles.actionsRow}>
      <Pressable 
        style={[
          styles.actionButton, 
          isWatched && { backgroundColor: theme.accent }
        ]} 
        onPress={() => setIsWatched(!isWatched)}
      >
        <Ionicons 
          name={isWatched ? "eye" : "eye-outline"} 
          size={20} 
          color={isWatched ? "#000" : "#fff"} 
        />
        <Text style={[
          styles.actionButtonText, 
          isWatched && { color: '#000', fontWeight: 'bold' }
        ]}>
          {isWatched ? "Watched" : "Watch"}
        </Text>
      </Pressable>

      <Pressable 
        style={[
          styles.actionButton, 
          isWishlisted && { backgroundColor: theme.accent }
        ]} 
        onPress={() => setIsWishlisted(!isWishlisted)}
      >
        <Ionicons 
          name={isWishlisted ? "heart" : "heart-outline"} 
          size={20} 
          color={isWishlisted ? "#E0245E" : "#fff"} 
        />
        <Text style={[
          styles.actionButtonText, 
          isWishlisted && { color: '#000', fontWeight: 'bold' }
        ]}>
          {isWishlisted ? "Saved" : "Save"}
        </Text>
      </Pressable>
    </View>
  );

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        {/* Organic Background Shapes */}
        <View style={styles.backgroundShapes}>
          <View style={styles.blobShape1} />
          <View style={styles.blobShape2} />
          <View style={styles.blobShape3} />
        </View>
        
        <DetailsSkeleton />
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.container}>
        {/* Organic Background Shapes */}
        <View style={styles.backgroundShapes}>
          <View style={styles.blobShape1} />
          <View style={styles.blobShape2} />
          <View style={styles.blobShape3} />
        </View>
        
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={[styles.retryButton, { backgroundColor: theme.accent }]} onPress={fetchAnimeDetails}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
          <Pressable 
            style={[styles.retryButton, { marginTop: 10, backgroundColor: '#A0A0A0' }]} 
            onPress={() => navigation?.goBack()}
          >
            <Text style={styles.retryText}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // No data state
  if (!animeData) {
    return (
      <View style={styles.container}>
        {/* Organic Background Shapes */}
        <View style={styles.backgroundShapes}>
          <View style={styles.blobShape1} />
          <View style={styles.blobShape2} />
          <View style={styles.blobShape3} />
        </View>
        
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No anime data available.</Text>
          <Pressable 
            style={[styles.retryButton, { backgroundColor: theme.accent }]} 
            onPress={() => navigation?.goBack()}
          >
            <Text style={styles.retryText}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" />
      
      {/* Animated Header - Reveals on Scroll */}
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
            <Pressable 
              style={styles.headerBackButton} 
              onPress={() => navigation?.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#fff"/>
            </Pressable>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {animeData?.title || 'Anime Details'}
            </Text>
          </View>
        </Animated.View>
      </SafeAreaView>

      {/* Organic Background Shapes - Fixed, non-scrollable */}
      <View style={styles.backgroundShapes}>
        <View style={styles.blobShape1} />
        <View style={styles.blobShape2} />
        <View style={styles.blobShape3} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Back Button - positioned over hero */}
        <Pressable 
          style={styles.backButton} 
          onPress={() => navigation?.goBack()}
        >
          <Ionicons name="arrow-back" size={20} color="#fff"/>
        </Pressable>

      {/* Hero/Banner Section */}
      <View style={styles.heroSection}>
        <Image 
          source={{ uri: animeData.bannerImage || animeData.coverImage }} 
          style={styles.backdropImage} 
          resizeMode="cover"
        />
      </View>

      {/* Description Section */}
      <BlurView intensity={80} tint="dark" style={styles.descriptionSectionNative}>
        <View 
          style={styles.titleYearRow}
          onLayout={(event) => {
            // Measure title position relative to scroll view
            event.target.measure((x, y, width, height, pageX, pageY) => {
              setTitleY(pageY + height); // Set trigger point to bottom of title
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
          <Pressable onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}>
            <Text style={styles.expandDescriptionText}>
              {isDescriptionExpanded ? 'Show Less' : 'Read More'}
            </Text>
          </Pressable>
        )}
        <View style={styles.episodeStatusRow}>
          <Text style={styles.episodeCount}>{animeData.episodeCount}</Text>
          <Text style={styles.status}>Status: {animeData.status}</Text>
        </View>
      </BlurView>    

      {/* Stats Section */}
      <View style={styles.statsSection}>
        <StatsPill label="Popularity" count={animeData.stats.members} color="#FF9AA2" />
        <StatsPill label="Reviews" count={reviewStats.count} color="#B5EAD7" />
        <StatsPill label="Score" count={`${animeData.stats.score}%`} color="#A0C4FF" />
      </View>

      {/* User Status Section */}
      <View style={styles.statusSection}>
        <Text style={styles.statusSectionLabel}>MY STATUS</Text>
        <StatusTag 
          status={userStatus}
          isWishlisted={isWishlisted}
          onStatusChange={handleStatusChange}
          onWishlistToggle={handleWishlistToggle}
        />
      </View>

      {/* Genre and Cast & Crew Section */}
      <BlurView intensity={80} tint="dark" style={styles.genreCrewSectionNative}>
        <View style={styles.genreRow}>
          <Text style={styles.sectionLabel}>GENRE</Text>
          <View style={styles.genreList}>
            {animeData.genres.length > 0 ? (
              animeData.genres.map((genre, index) => (
                <GenrePill key={index} genre={genre} />
              ))
            ) : (
              <Text style={styles.noDataText}>No genres available</Text>
            )}
          </View>
        </View>
        
        <View style={styles.crewRow}>
          <Text style={styles.sectionLabel}>CAST & CREW</Text>
          <View style={styles.crewList}>
            {animeData.voiceActors.length > 0 ? (
              <>
                {(isCrewExpanded ? animeData.voiceActors : animeData.voiceActors.slice(0, 5)).map((member, index) => (
                  <CrewMember 
                    key={index} 
                    name={member.name} 
                    role={member.role} 
                    avatar={member.avatar}
                    image={member.image}
                    characterImage={member.characterImage}
                    characterName={member.characterName}
                    onPress={member.id ? () => navigation.navigate('CrewDetailPage', { staffId: member.id, staffName: member.name }) : undefined}
                  />
                ))}
                {animeData.voiceActors.length > 5 && (
                  <Pressable 
                    style={styles.expandButton} 
                    onPress={() => setIsCrewExpanded(!isCrewExpanded)}
                  >
                    <Text style={styles.expandButtonText}>
                      {isCrewExpanded ? 'Show Less' : `Show All (${animeData.voiceActors.length})`}
                    </Text>
                  </Pressable>
                )}
              </>
            ) : (
              <Text style={styles.noDataText}>No voice actor information available</Text>
            )}
          </View>
        </View>
      </BlurView>

      {/* Reviews Section */}
      <BlurView intensity={80} tint="dark" style={styles.reviewsSectionNative}>
          <View style={styles.reviewsHeader}>
            <Text style={styles.sectionLabel}>REVIEWS</Text>
            <Pressable 
              style={styles.addReviewButton}
              onPress={() => navigation?.navigate('ReviewAnime', { 
                animeId: animeData.id,
                id: animeData.id,
                title: animeData.title,
                coverImage: animeData.coverImage 
              })}
            >
              <Ionicons name="add" size={20} color="#fff" />
            </Pressable>
          </View>
          
          {dbReviews.length > 0 ? (
            <>
              {(() => {
                const REVIEWS_PER_PAGE = 10;
                const totalPages = Math.ceil(dbReviews.length / REVIEWS_PER_PAGE);
                const startIndex = (currentReviewPage - 1) * REVIEWS_PER_PAGE;
                const endIndex = startIndex + REVIEWS_PER_PAGE;
                const currentReviews = dbReviews.slice(startIndex, endIndex);
                
                return (
                  <>
                    {currentReviews.map((review) => (
                      <ReviewCard 
                        key={review.id}
                        name={(review.profiles?.use_display_name && review.profiles?.display_name) ? review.profiles.display_name : (review.profiles?.username || `User ${review.user_id.substring(0, 8)}`)}
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
                            currentReviewPage === 1 && styles.paginationButtonDisabled
                          ]}
                          onPress={() => setCurrentReviewPage(prev => Math.max(1, prev - 1))}
                          disabled={currentReviewPage === 1}
                        >
                          <Ionicons 
                            name="chevron-back" 
                            size={20} 
                            color={currentReviewPage === 1 ? '#666' : '#fff'} 
                          />
                          <Text style={[
                            styles.paginationButtonText,
                            currentReviewPage === 1 && styles.paginationButtonTextDisabled
                          ]}>Previous</Text>
                        </Pressable>
                        
                        <Text style={styles.pageIndicator}>
                          Page {currentReviewPage} of {totalPages}
                        </Text>
                        
                        <Pressable 
                          style={[
                            styles.paginationButton,
                            currentReviewPage === totalPages && styles.paginationButtonDisabled
                          ]}
                          onPress={() => setCurrentReviewPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentReviewPage === totalPages}
                        >
                          <Text style={[
                            styles.paginationButtonText,
                            currentReviewPage === totalPages && styles.paginationButtonTextDisabled
                          ]}>Next</Text>
                          <Ionicons 
                            name="chevron-forward" 
                            size={20} 
                            color={currentReviewPage === totalPages ? '#666' : '#fff'} 
                          />
                        </Pressable>
                      </View>
                    )}
                  </>
                );
              })()}
            </>
          ) : isLoadingReviews ? (
            <ActivityIndicator color="#fff" style={{ marginVertical: 20 }} />
          ) : (
            <Text style={styles.noDataText}>No reviews yet. Be the first to review!</Text>
          )}
        </BlurView>

      {/* Related Shows Section */}
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
                onPress={() => navigation?.push('DetailsAnime', { animeId: item.id })}
                style={({ pressed }) => [
                  styles.relatedCard,
                  pressed && styles.relatedCardPressed
                ]}
              >
                <Image 
                  source={{ uri: item.image }} 
                  style={styles.relatedCardImage}
                  resizeMode="cover"
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
    </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  headerSafeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  animatedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  headerBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    backgroundColor: '#0D0D0D',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerBackButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Agdasima-Bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    fontFamily: 'Agdasima',
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Agdasima',
    color: '#ff6b6b',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#A78BFA',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Agdasima',
    fontWeight: '600',
  },
  noDataText: {
    fontSize: 14,
    fontFamily: 'Agdasima',
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
  backgroundShapes: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 400,
    overflow: 'hidden',
  },
  blobShape1: {
    position: 'absolute',
    top: -48,
    right: -80,
    width: 304,
    height: 304,
    backgroundColor: '#7C3AED',
    borderRadius: 152,
    opacity: 0.15,
    transform: [{ scaleX: 1.5 }, { rotate: '25deg' }],
  },
  blobShape2: {
    position: 'absolute',
    top: 96,
    left: -96,
    width: 248,
    height: 248,
    backgroundColor: '#A78BFA',
    borderRadius: 124,
    opacity: 0.1,
    transform: [{ scaleY: 1.3 }, { rotate: '-15deg' }],
  },
  blobShape3: {
    position: 'absolute',
    top: 200,
    right: 48,
    width: 200,
    height: 200,
    backgroundColor: '#C4B5FD',
    borderRadius: 100,
    opacity: 0.08,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroSection: {
    position: 'relative',
    width: '100%',
    aspectRatio: 16 / 9,
    marginBottom: -60,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  backdropImage: {
    width: '100%',
    height: '100%',
  },
  descriptionSectionNative: {
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    zIndex: 5,
    position: 'relative',
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.5)',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(0, 0, 0, 0.3)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(0, 0, 0, 0.3)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  titleYearRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  mainTitle: {
    fontSize: 18,
    letterSpacing: 1,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 12,
  },
  year: {
    fontSize: 16,
    fontFamily: 'Agdasima',
    letterSpacing: 0.5,
    color: '#fff',
    flexShrink: 0,
  },
  subtitleText: {
    fontSize: 14,
    fontFamily: 'Agdasima',
    letterSpacing: 0.5,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 8,
  },
  studioInfo: {
    fontSize: 16,
    fontFamily: 'Agdasima',
    letterSpacing: 0.5,
    color: '#C4B5FD',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    fontFamily: 'Agdasima',
    letterSpacing: 0.5,
    color: '#FFFFFF',
    lineHeight: 20,
    marginBottom: 8,
  },
  expandDescriptionText: {
    fontSize: 14,
    fontFamily: 'Agdasima',
    color: '#C4B5FD',
    fontWeight: '600',
    marginBottom: 15,
  },
  episodeStatusRow: {
    gap: 5,
  },
  episodeCount: {
    fontSize: 16,
    fontFamily: 'Agdasima',
    letterSpacing: 0.5,
    fontWeight: '500',
    color: '#fff',
  },
  status: {
    fontSize: 16,
    fontFamily: 'Agdasima',
    letterSpacing: 0.5,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 24,
    gap: 10,
  },
  statusSection: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  statusSectionLabel: {
    fontSize: 12,
    fontFamily: 'Agdasima',
    letterSpacing: 2,
    color: '#999',
    fontWeight: '600',
    marginBottom: 12,
  },
  statusTagsContainer: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  genreCrewSectionNative: {
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(0, 0, 0, 0.5)',
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(0, 0, 0, 0.3)',
    borderRightWidth: 2,
    borderRightColor: 'rgba(0, 0, 0, 0.3)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  genreRow: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 16,
    letterSpacing: 1,
    fontWeight: 'bold',
    fontFamily: 'Agdasima',
    color: '#C4B5FD',
    marginBottom: 10,
  },
  genreList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  
  crewList: {
    gap: 8,
  },
  reviewsSectionNative: {
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(0, 0, 0, 0.5)',
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(0, 0, 0, 0.3)',
    borderRightWidth: 2,
    borderRightColor: 'rgba(0, 0, 0, 0.3)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  addReviewButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  seeAllText: {
    fontSize: 14,
    fontFamily: 'Agdasima',
    letterSpacing: 0.5,
    color: '#000',
    fontWeight: '500',
  },
  relatedSection: {
    marginBottom: 32,
  },
  relatedScrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  relatedCarousel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 8,
  },
  relatedCardWrapper: {
    flex: 1,
    maxWidth: '32%',
  },
  relatedCard: {
    width: 120,
    height: 170,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#252525',
  },
  relatedCardPressed: {
    opacity: 0.7,
  },
  relatedCardImage: {
    width: '100%',
    height: '100%',
  },
  relatedCardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  relatedCardTitle: {
    fontSize: 12,
    fontFamily: 'Agdasima',
    color: '#fff',
    fontWeight: '600',
  },
  relatedPaginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    gap: 20,
  },
  relatedPaginationButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(167, 139, 250, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dotActive: {
    width: 24,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#A78BFA',
  },
  expandButton: {
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 5,
  },
  expandButtonText: {
    fontSize: 12,
    fontFamily: 'Agdasima',
    letterSpacing: 0.5,
    color: '#666',
    fontWeight: '500',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  paginationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(167, 139, 250, 0.2)',
    gap: 5,
  },
  paginationButtonDisabled: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    opacity: 0.5,
  },
  paginationButtonText: {
    fontSize: 14,
    fontFamily: 'Agdasima',
    letterSpacing: 0.5,
    color: '#fff',
    fontWeight: '500',
  },
  paginationButtonTextDisabled: {
    color: '#666',
  },
  pageIndicator: {
    fontSize: 14,
    fontFamily: 'Agdasima',
    letterSpacing: 0.5,
    color: '#fff',
    fontWeight: '500',
  },
});

export default AnimeDetail;