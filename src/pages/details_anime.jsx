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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StatsPill from '../components/details_page/StatsPill';
import GenrePill from '../components/details_page/GenrePill';
import CrewMember from '../components/details_page/CrewMember';
import ReviewCard from '../components/details_page/ReviewCard';
import { getMediaTheme } from '../utils/mediaThemes';
import { getAnimeDetails, getStatusText } from '../services/api_anime';


const { width, height } = Dimensions.get('window');

const AnimeDetail = ({ route, navigation }) => {
  const [isCrewExpanded, setIsCrewExpanded] = useState(false);
  const [isReviewExpanded, setIsReviewExpanded] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={styles.loadingText}>Loading anime details...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
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
    );
  }

  // No data state
  if (!animeData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No anime data available.</Text>
        <TouchableOpacity 
          style={[styles.retryButton, { backgroundColor: theme.accent }]} 
          onPress={() => navigation?.goBack()}
        >
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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
        <View style={styles.gradientOverlay} />
        <View style={styles.titleOverlay}>
          <Text style={styles.title}>{animeData.title}</Text>
          <Text style={styles.subtitle}>{animeData.subtitle}</Text>
        </View>
      </View>

      {/* Description Section */}
      <View style={[styles.descriptionSection, { backgroundColor: theme.accent }]}>
        <View style={styles.titleYearRow}>
          <Text style={styles.mainTitle}>{animeData.title}</Text>
          <Text style={styles.year}>{animeData.year}</Text>
        </View>
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

      {/* Stats Section */}
      <View style={styles.statsSection}>
        <StatsPill label="Popularity" count={animeData.stats.members} color="#FF9AA2" />
        <StatsPill label="Reviews" count={animeData.stats.reviews} color="#B5EAD7" />
        <StatsPill label="Score" count={`${animeData.stats.score}%`} color="#A0C4FF" />
      </View>

      {/* Genre and Voice Actors Section */}
      <View style={[styles.genreCrewSection, { backgroundColor: theme.accent }]}>
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
          <Text style={styles.sectionLabel}>VOICE ACTORS</Text>
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

      {/* Reviews Section */}
      <View style={[styles.reviewsSection, { backgroundColor: theme.accent }]}>
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
            {(isReviewExpanded ? animeData.reviews : animeData.reviews.slice(0, 5)).map((review, index) => (
              <ReviewCard 
                key={index}
                name={review.name}
                rating={review.rating}
                text={review.text}
                avatar={review.avatar}
              />
            ))}
            
            {animeData.reviews.length > 5 && (
              <TouchableOpacity 
                style={styles.expandButton} 
                onPress={() => setIsReviewExpanded(!isReviewExpanded)}
              >
                <Text style={styles.expandButtonText}>
                  {isReviewExpanded ? 'Show Less' : `Show All (${animeData.reviews.length})`}
                </Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <Text style={styles.noDataText}>No reviews yet. Be the first to review!</Text>
        )}
      </View>

      {/* Related Shows Section */}
      <View style={styles.relatedSection}>
        <Text style={styles.sectionLabel}>Related Shows</Text>
        {animeData.recommendations.length > 0 ? (
          <ScrollView 
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.relatedShowsList}
            nestedScrollEnabled={true}
          >
            {animeData.recommendations.map((item) => (
              <TouchableOpacity 
                key={item.id}
                style={styles.relatedShowItem}
                onPress={() => navigation?.push('DetailsAnime', { animeId: item.id })}
                activeOpacity={0.7}
              >
                <Image source={{ uri: item.image }} style={styles.relatedShowImage} />
                <View style={styles.relatedShowOverlay}>
                  <Text style={styles.relatedShowTitle}>{item.title}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.noDataText}>No related shows available</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
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
    backgroundColor: '#ffffff',
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
  titleOverlay: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
    background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  title: {
    color: '#fff',
    fontSize: 24,
    letterSpacing: 2,
    fontWeight: 'bold',
    fontFamily: 'Midorima',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
    fontFamily: 'Agdasima',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  descriptionSection: {
    backgroundColor: '#ffb3d9',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    zIndex: 5,
    position: 'relative',
  },
  titleYearRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mainTitle: {
    fontSize: 18,
    letterSpacing: 1,
    fontWeight: 'bold',
    fontFamily: 'Midorima',
    color: '#000',
  },
  year: {
    fontSize: 16,
    fontFamily: 'Agdasima',
    letterSpacing: 0.5,
    color: '#666',
  },
  studioInfo: {
    fontSize: 16,
    fontFamily: 'Agdasima',
    letterSpacing: 0.5,
    color: '#666',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    fontFamily: 'Agdasima',
    letterSpacing: 0.5,
    color: '#000',
    lineHeight: 20,
    marginBottom: 8,
  },
  expandDescriptionText: {
    fontSize: 14,
    fontFamily: 'Agdasima',
    color: '#666',
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
  },
  status: {
    fontSize: 16,
    fontFamily: 'Agdasima',
    letterSpacing: 0.5,
    color: '#000',
    fontWeight: '500',
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 24,
    gap: 10,
  },
  genreCrewSection: {
    backgroundColor: '#ffb3d9',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  genreRow: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 16,
    letterSpacing: 1,
    fontWeight: 'bold',
    fontFamily: 'Midorima',
    color: '#000',
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
  reviewsSection: {
    backgroundColor: '#ffb3d9',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
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
  relatedShowItem: {
    width: 140,
    height: 190,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  relatedShowImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  relatedShowOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 8,
  },
  relatedShowTitle: {
    color: '#fff',
    fontSize: 11,
    fontFamily: 'Agdasima',
    fontWeight: 'bold',
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
});

export default AnimeDetail;
