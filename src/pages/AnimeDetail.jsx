import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList
} from 'react-native';
import StatsPill from '../components/StatsPill';
import GenrePill from '../components/GenrePill';
import CrewMember from '../components/CrewMember';
import ReviewCard from '../components/ReviewCard';
import RelatedShowCard from '../components/RelatedShowCard';
import { getMediaTheme } from '../utils/mediaThemes';

const { width, height } = Dimensions.get('window');

const AnimeDetail = ({ route, navigation }) => {
  const [isCrewExpanded, setIsCrewExpanded] = useState(false);
  const [isReviewExpanded, setIsReviewExpanded] = useState(false);
  
  // Get anime theme with integrated font utilities
  const theme = getMediaTheme('anime');
  
  // Mock data - in real app this would come from route params or API
  const animeData = {
    title: "YOUR NAME",
    subtitle: "Kimi no Na wa",
    year: "2020",
    description: "In a world where magic is governed by one's heartbeat, a young boy born with a silent heart must find a way to defy the heavens and protect his village from the encroaching \"Eternal Night.\"",
    episodeCount: "24 Episodes",
    status: "Completed",
    backdropImage: "https://picsum.photos/400/225?random=1",
    posterImage: "https://picsum.photos/120/170?random=2",
    stats: {
      members: 40,
      reviews: 40,
      lists: 40
    },
    genres: ["Horror", "Action"],
    crew: [
      { name: "Makoto Shinkai", role: "Director", avatar: "#00ffff" },
      { name: "Genki Kawamura", role: "Producer", avatar: "#ff6b6b" },
      { name: "Radwimps", role: "Music", avatar: "#51cf66" },
      { name: "Masashi Ando", role: "Character Design", avatar: "#74c0fc" },
      { name: "Ryunosuke Kamiki", role: "Voice Actor", avatar: "#ffd43b" },
      { name: "Mone Kamishiraishi", role: "Voice Actor", avatar: "#ff8cc8" },
      { name: "Yojiro Noda", role: "Theme Song", avatar: "#69db7c" },
      { name: "Koichiro Ito", role: "Art Director", avatar: "#91a7ff" },
      { name: "Atsushi Tamura", role: "Animation Director", avatar: "#ffa8a8" },
      { name: "Katsuhiko Kitada", role: "Sound Director", avatar: "#d0bfff" },
      { name: "Noritaka Kawaguchi", role: "CG Director", avatar: "#96f2d7" },
      { name: "Takumi Tanji", role: "Editor", avatar: "#ffec99" }
    ],
    reviews: [
      { name: "Alex Johnson", rating: 5, text: "Absolutely stunning visually and emotionally powerful. A masterpiece.", avatar: "#0066ff" },
      { name: "Sarah Chen", rating: 4, text: "Beautiful animation and touching story about connection and fate.", avatar: "#ff6b6b" },
      { name: "Mike Rodriguez", rating: 5, text: "Makoto Shinkai outdid himself with this incredible work of art.", avatar: "#51cf66" },
      { name: "Emma Thompson", rating: 4, text: "Visually breathtaking with a heartfelt story that resonates deeply.", avatar: "#74c0fc" },
      { name: "David Kim", rating: 5, text: "Perfect blend of romance, drama, and supernatural elements.", avatar: "#ffd43b" },
      { name: "Lisa Wang", rating: 4, text: "The animation quality is top-notch and the story is compelling.", avatar: "#ff8cc8" },
      { name: "Tom Anderson", rating: 5, text: "One of the best anime films I've ever watched. Highly recommend!", avatar: "#69db7c" },
      { name: "Maria Garcia", rating: 4, text: "Beautiful cinematography and excellent character development.", avatar: "#91a7ff" }
    ],
    relatedShows: [
      { id: 1, title: "Weathering With You", subtitle: "Romance, Drama, Fantasy", image: "https://picsum.photos/150/200?random=3" },
      { id: 2, title: "5 Centimeters Per Second", subtitle: "Romance, Drama", image: "https://picsum.photos/150/200?random=4" },
      { id: 3, title: "The Garden of Words", subtitle: "Romance, Drama", image: "https://picsum.photos/150/200?random=5" },
      { id: 4, title: "A Silent Voice", subtitle: "Drama, Romance", image: "https://picsum.photos/150/200?random=6" },
      { id: 5, title: "I Want to Eat Your Pancreas", subtitle: "Drama, Romance", image: "https://picsum.photos/150/200?random=7" },
      { id: 6, title: "Spirited Away", subtitle: "Adventure, Family, Fantasy", image: "https://picsum.photos/150/200?random=8" },
      { id: 7, title: "Princess Mononoke", subtitle: "Adventure, Drama, Fantasy", image: "https://picsum.photos/150/200?random=9" },
      { id: 8, title: "Castle in the Sky", subtitle: "Adventure, Family, Fantasy", image: "https://picsum.photos/150/200?random=10" },
      { id: 9, title: "Howl's Moving Castle", subtitle: "Adventure, Drama, Fantasy", image: "https://picsum.photos/150/200?random=11" },
      { id: 10, title: "My Neighbor Totoro", subtitle: "Family, Fantasy", image: "https://picsum.photos/150/200?random=12" }
    ]
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Section - positioned over hero */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>anime-Card Detailed</Text>
      </View>

      {/* Hero/Poster Section */}
      <View style={styles.heroSection}>
        <Image source={{ uri: animeData.backdropImage }} style={styles.backdropImage} />
        {/* <View style={styles.gradientOverlay} /> */}
        <View style={styles.titleOverlay}>
          <Text style={styles.title}>{animeData.title}</Text>
          <Text style={styles.subtitle}>{animeData.subtitle}</Text>
        </View>
      </View>

      {/* Description Section */}
      <View style={styles.descriptionSection}>
        <View style={styles.titleYearRow}>
          <Text style={styles.mainTitle}>{animeData.title}</Text>
          <Text style={styles.year}>{animeData.year}</Text>
        </View>
        <Text style={styles.episodeInfo}>All Pictures</Text>
        <Text style={styles.description}>{animeData.description}</Text>
        <View style={styles.episodeStatusRow}>
          <Text style={styles.episodeCount}>Episode Count: {animeData.episodeCount}</Text>
          <Text style={styles.status}>Status: {animeData.status}</Text>
        </View>
      </View>

      {/* Stats Section */}
      <View style={styles.statsSection}>
        <StatsPill label="Members" count={animeData.stats.members} color="#ff6b6b" />
        <StatsPill label="Reviews" count={animeData.stats.reviews} color="#51cf66" />
        <StatsPill label="Lists" count={animeData.stats.lists} color="#74c0fc" />
      </View>

      {/* Genre and Crew Section */}
      <View style={styles.genreCrewSection}>
        <View style={styles.genreRow}>
          <Text style={styles.sectionLabel}>GENRE</Text>
          <View style={styles.genreList}>
            {animeData.genres.map((genre, index) => (
              <GenrePill key={index} genre={genre} />
            ))}
          </View>
        </View>
        
        <View style={styles.crewRow}>
          <Text style={styles.sectionLabel}>CREW</Text>
          <View style={styles.crewList}>
            {(isCrewExpanded ? animeData.crew : animeData.crew.slice(0, 5)).map((member, index) => (
              <CrewMember 
                key={index} 
                name={member.name} 
                role={member.role} 
                avatar={member.avatar} 
              />
            ))}
            {animeData.crew.length > 5 && (
              <TouchableOpacity 
                style={styles.expandButton} 
                onPress={() => setIsCrewExpanded(!isCrewExpanded)}
              >
                <Text style={styles.expandButtonText}>
                  {isCrewExpanded ? 'Show Less' : `Show All (${animeData.crew.length})`}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Reviews Section */}
      <View style={styles.reviewsSection}>
        <View style={styles.reviewsHeader}>
          <Text style={styles.sectionLabel}>REVIEWS</Text>
          <TouchableOpacity 
            style={styles.addReviewButton}
            onPress={() => navigation?.navigate('AnimeReview')}
          >
            <Text style={styles.addReviewIcon}>+</Text>
          </TouchableOpacity>
        </View>
        
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
        
        
      </View>

      {/* Related Shows Section */}
      <View style={styles.relatedSection}>
        <Text style={styles.relatedTitle}>Related Shows</Text>
        <FlatList
          data={animeData.relatedShows}
          renderItem={({ item }) => (
            <View style={styles.relatedShowItem}>
              <RelatedShowCard 
                title={item.title}
                subtitle={item.subtitle}
                image={item.image}
              />
            </View>
          )}
          keyExtractor={(item) => item.id.toString()}
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.relatedShowsList}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'Agdasima',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  heroSection: {
    position: 'relative',
    height: 280,
    marginBottom: -60,
    overflow: 'hidden',
  },
  backdropImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
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
    height: 120,
    backgroundColor: 'rgba(0,0,0,0.3)',
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
  episodeInfo: {
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
  addReviewIcon: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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
    width: 150,
    marginRight: 15,
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
