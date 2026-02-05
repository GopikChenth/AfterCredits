import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import StatsPill from '../components/details_page/StatsPill';
import GenrePill from '../components/details_page/GenrePill';
import CrewMember from '../components/details_page/CrewMember';
import ReviewCard from '../components/details_page/ReviewCard';
import RelatedShowCard from '../components/details_page/RelatedShowCard';
import { getMediaTheme } from '../utils/mediaThemes';
import { getAnimeDetails, getStatusText } from '../services/api_anime';


const { width, height } = Dimensions.get('window');

const AnimeDetail = ({ route, navigation }) => {
  const [isCrewExpanded, setIsCrewExpanded] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [currentReviewPage, setCurrentReviewPage] = useState(1);
  const [animeData, setAnimeData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Get anime ID from route params
  const animeId = route?.params?.animeId;
  
  // Get anime theme with integrated font utilities
  const theme = getMediaTheme('anime');

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
    const avatarColors = ['#FFB3C6', '#FFDAC1', '#B5EAD7', '#C7CEEA', '#FFF0E4', '#E2F0CB', '#FF9AA2', '#A0C4FF', '#FFB7B2', '#E2F0CB'];
    
    // Extract voice actors from characters
    const voiceActors = data.characters?.edges
      ?.filter(edge => edge.voiceActors && edge.voiceActors.length > 0)
      ?.map((edge, index) => ({
        name: edge.voiceActors[0]?.name?.full || 'Unknown',
        role: `Voice of ${edge.node?.name?.full || 'Character'}`,
        avatar: avatarColors[index % avatarColors.length],
        image: edge.voiceActors[0]?.image?.medium,
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

    // Format recommendations
    const recommendations = data.recommendations?.nodes
      ?.filter(node => node.mediaRecommendation)
      ?.map(node => ({
        id: node.mediaRecommendation.id,
        title: node.mediaRecommendation.title?.english || node.mediaRecommendation.title?.romaji,
        subtitle: node.mediaRecommendation.genres?.slice(0, 3).join(', ') || '',
        image: node.mediaRecommendation.coverImage?.large,
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
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={styles.loadingText}>Loading anime details...</Text>
        </View>
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
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: theme.accent }]} onPress={fetchAnimeDetails}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.retryButton, { marginTop: 10, backgroundColor: '#A0A0A0' }]} 
            onPress={() => navigation?.goBack()}
          >
            <Text style={styles.retryText}>Go Back</Text>
          </TouchableOpacity>
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
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: theme.accent }]} 
            onPress={() => navigation?.goBack()}
          >
            <Text style={styles.retryText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Organic Background Shapes - Fixed, non-scrollable */}
      <View style={styles.backgroundShapes}>
        <View style={styles.blobShape1} />
        <View style={styles.blobShape2} />
        <View style={styles.blobShape3} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        directionalLockEnabled={true}
      >
        {/* Back Button - positioned over hero */}
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation?.goBack()}
        >
          <Ionicons name="arrow-back" size={20} color="#fff"/>
        </TouchableOpacity>

      {/* Hero/Banner Section */}
      <View style={styles.heroSection}>
        <Image 
          source={{ uri: animeData.bannerImage || animeData.coverImage }} 
          style={styles.backdropImage} 
          resizeMode="cover"
        />
      </View>

      {/* Description Section */}
      {Platform.OS === 'web' ? (
        <View style={styles.descriptionSectionWeb}>
          <View style={styles.titleYearRow}>
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
            <TouchableOpacity onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}>
              <Text style={styles.expandDescriptionText}>
                {isDescriptionExpanded ? 'Show Less' : 'Read More'}
              </Text>
            </TouchableOpacity>
          )}
          <View style={styles.episodeStatusRow}>
            <Text style={styles.episodeCount}>{animeData.episodeCount}</Text>
            <Text style={styles.status}>Status: {animeData.status}</Text>
          </View>
        </View>
      ) : (
        <BlurView intensity={80} tint="dark" style={styles.descriptionSectionNative}>
          <View style={styles.titleYearRow}>
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
            <TouchableOpacity onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}>
              <Text style={styles.expandDescriptionText}>
                {isDescriptionExpanded ? 'Show Less' : 'Read More'}
              </Text>
            </TouchableOpacity>
          )}
          <View style={styles.episodeStatusRow}>
            <Text style={styles.episodeCount}>{animeData.episodeCount}</Text>
            <Text style={styles.status}>Status: {animeData.status}</Text>
          </View>
        </BlurView>
      )}

      {/* Stats Section */}
      <View style={styles.statsSection}>
        <StatsPill label="Popularity" count={animeData.stats.members} color="#FF9AA2" />
        <StatsPill label="Reviews" count={animeData.stats.reviews} color="#B5EAD7" />
        <StatsPill label="Score" count={`${animeData.stats.score}%`} color="#A0C4FF" />
      </View>

      {/* Genre and Cast & Crew Section */}
      {Platform.OS === 'web' ? (
        <View style={styles.genreCrewSectionWeb}>
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
                    />
                  ))}
                  {animeData.voiceActors.length > 5 && (
                    <TouchableOpacity 
                      style={styles.expandButton} 
                      onPress={() => setIsCrewExpanded(!isCrewExpanded)}
                    >
                      <Text style={styles.expandButtonText}>
                        {isCrewExpanded ? 'Show Less' : `Show All (${animeData.voiceActors.length})`}
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              ) : (
                <Text style={styles.noDataText}>No voice actor information available</Text>
              )}
            </View>
          </View>
        </View>
      ) : (
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
                    />
                  ))}
                  {animeData.voiceActors.length > 5 && (
                    <TouchableOpacity 
                      style={styles.expandButton} 
                      onPress={() => setIsCrewExpanded(!isCrewExpanded)}
                    >
                      <Text style={styles.expandButtonText}>
                        {isCrewExpanded ? 'Show Less' : `Show All (${animeData.voiceActors.length})`}
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              ) : (
                <Text style={styles.noDataText}>No voice actor information available</Text>
              )}
            </View>
          </View>
        </BlurView>
      )}

      {/* Reviews Section */}
      {Platform.OS === 'web' ? (
        <View style={styles.reviewsSectionWeb}>
          <View style={styles.reviewsHeader}>
            <Text style={styles.sectionLabel}>REVIEWS</Text>
            <TouchableOpacity 
              style={styles.addReviewButton}
              onPress={() => navigation?.navigate('ReviewAnime', { 
                animeId: animeData.id,
                id: animeData.id,
                title: animeData.title,
                coverImage: animeData.coverImage 
              })}
            >
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          
          {animeData.reviews.length > 0 ? (
            <>
              {(() => {
                const REVIEWS_PER_PAGE = 10;
                const totalPages = Math.ceil(animeData.reviews.length / REVIEWS_PER_PAGE);
                const startIndex = (currentReviewPage - 1) * REVIEWS_PER_PAGE;
                const endIndex = startIndex + REVIEWS_PER_PAGE;
                const currentReviews = animeData.reviews.slice(startIndex, endIndex);
                
                console.log('Total reviews:', animeData.reviews.length, 'Should show pagination:', animeData.reviews.length > REVIEWS_PER_PAGE);
                
                return (
                  <>
                    {currentReviews.map((review, index) => (
                      <ReviewCard 
                        key={startIndex + index}
                        name={review.name}
                        rating={review.rating}
                        text={review.text}
                        avatar={review.avatar}
                      />
                    ))}
                    
                    {animeData.reviews.length > REVIEWS_PER_PAGE && (
                      <View style={styles.paginationContainer}>
                        <TouchableOpacity 
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
                        </TouchableOpacity>
                        
                        <Text style={styles.pageIndicator}>
                          Page {currentReviewPage} of {totalPages}
                        </Text>
                        
                        <TouchableOpacity 
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
                        </TouchableOpacity>
                      </View>
                    )}
                  </>
                );
              })()}
            </>
          ) : (
            <Text style={styles.noDataText}>No reviews yet. Be the first to review!</Text>
          )}
        </View>
      ) : (
        <BlurView intensity={80} tint="dark" style={styles.reviewsSectionNative}>
          <View style={styles.reviewsHeader}>
            <Text style={styles.sectionLabel}>REVIEWS</Text>
            <TouchableOpacity 
              style={styles.addReviewButton}
              onPress={() => navigation?.navigate('ReviewAnime', { 
                animeId: animeData.id,
                id: animeData.id,
                title: animeData.title,
                coverImage: animeData.coverImage 
              })}
            >
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          
          {animeData.reviews.length > 0 ? (
            <>
              {(() => {
                const REVIEWS_PER_PAGE = 10;
                const totalPages = Math.ceil(animeData.reviews.length / REVIEWS_PER_PAGE);
                const startIndex = (currentReviewPage - 1) * REVIEWS_PER_PAGE;
                const endIndex = startIndex + REVIEWS_PER_PAGE;
                const currentReviews = animeData.reviews.slice(startIndex, endIndex);
                
                console.log('Total reviews:', animeData.reviews.length, 'Should show pagination:', animeData.reviews.length > REVIEWS_PER_PAGE);
                
                return (
                  <>
                    {currentReviews.map((review, index) => (
                      <ReviewCard 
                        key={startIndex + index}
                        name={review.name}
                        rating={review.rating}
                        text={review.text}
                        avatar={review.avatar}
                      />
                    ))}
                    
                    {animeData.reviews.length > REVIEWS_PER_PAGE && (
                      <View style={styles.paginationContainer}>
                        <TouchableOpacity 
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
                        </TouchableOpacity>
                        
                        <Text style={styles.pageIndicator}>
                          Page {currentReviewPage} of {totalPages}
                        </Text>
                        
                        <TouchableOpacity 
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
                        </TouchableOpacity>
                      </View>
                    )}
                  </>
                );
              })()}
            </>
          ) : (
            <Text style={styles.noDataText}>No reviews yet. Be the first to review!</Text>
          )}
        </BlurView>
      )}

      {/* Related Shows Section */}
      <View style={styles.relatedSection}>
        <Text style={styles.sectionLabel}>Related Shows</Text>
        {animeData.recommendations.length > 0 ? (
          <FlashList
            data={animeData.recommendations}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <RelatedShowCard
                title={item.title}
                image={item.image}
                onPress={() => navigation?.push('DetailsAnime', { animeId: item.id })}
              />
            )}
            estimatedItemSize={150}
            contentContainerStyle={styles.relatedShowsList}
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
    backgroundColor: '#1a1a1a',
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
    backgroundColor: '#FF69B4',
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
    backgroundColor: '#FF6B9D',
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
    backgroundColor: '#FFB3C6',
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
    backgroundColor: '#FFC0CB',
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
  descriptionSectionWeb: {
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    zIndex: 5,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    borderTopWidth: 2,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(0, 0, 0, 0.5)',
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(0, 0, 0, 0.3)',
    borderRightWidth: 2,
    borderRightColor: 'rgba(0, 0, 0, 0.3)',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
      },
    }),
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
    color: '#ffb3d9',
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
    color: '#ffb3d9',
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
  genreCrewSectionWeb: {
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(0, 0, 0, 0.5)',
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(0, 0, 0, 0.3)',
    borderRightWidth: 2,
    borderRightColor: 'rgba(0, 0, 0, 0.3)',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
      },
    }),
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
    color: '#FFFFFF',
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
  reviewsSectionWeb: {
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(0, 0, 0, 0.5)',
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(0, 0, 0, 0.3)',
    borderRightWidth: 2,
    borderRightColor: 'rgba(0, 0, 0, 0.3)',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
      },
    }),
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
    marginHorizontal: 20,
    marginBottom: 32,
  },
  relatedTitle: {
    fontSize: 16,
    letterSpacing: 1,
    fontWeight: 'bold',
    fontFamily: 'Midorima',
    color: '#000',
    marginBottom: 15,
  },
  relatedRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 5,
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
  relatedShowsList: {
    paddingRight: 20,
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
    backgroundColor: 'rgba(255, 179, 217, 0.2)',
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
