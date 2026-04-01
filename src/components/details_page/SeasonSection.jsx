import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from '@react-native-community/blur';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.75;
const CARD_HEIGHT = 120;
const CARD_MARGIN = 12;

const extractSeasonNumberFromTitle = (title) => {
  if (!title) return null;
  const match = title.match(/season\s*(\d+)/i);
  return match ? Number(match[1]) : null;
};

const parseEpisodeCount = (value) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const num = parseInt(value, 10);
    return Number.isNaN(num) ? 0 : num;
  }
  return 0;
};

const buildSeasonSlides = (relations, currentAnime) => {
  const edges = Array.isArray(relations?.edges) ? relations.edges : [];
  const seasonEdges = edges
    .filter((edge) => edge?.relationType && ['SEQUEL', 'PREQUEL', 'PARENT'].includes(edge.relationType))
    .filter((edge) => edge?.node?.format === 'TV')
    .filter((edge) => edge?.node?.title && (edge.node.title.english || edge.node.title.romaji));

  const prequels = seasonEdges.filter((edge) => edge.relationType === 'PREQUEL' || edge.relationType === 'PARENT');
  const sequels = seasonEdges.filter((edge) => edge.relationType === 'SEQUEL');

  const currentTitle = currentAnime?.title || '';
  const inferredCurrentSeason = extractSeasonNumberFromTitle(currentTitle) || 1;
  const currentEpisodes = parseEpisodeCount(currentAnime?.episodeCount);

  const slides = [
    ...prequels.map((edge) => ({
      id: edge.node.id,
      node: edge.node,
      offset: -1,
    })),
    {
      id: currentAnime?.id || 'current',
      node: {
        id: currentAnime?.id,
        title: { english: currentAnime?.title, romaji: currentAnime?.subtitle },
        coverImage: { medium: currentAnime?.coverImage, large: currentAnime?.coverImage },
        episodes: currentEpisodes,
      },
      offset: 0,
      isCurrent: true,
    },
    ...sequels.map((edge) => ({
      id: edge.node.id,
      node: edge.node,
      offset: 1,
    })),
  ];

  return slides.map((slide, index) => {
    const seasonNumber = inferredCurrentSeason + (index - prequels.length);
    return {
      ...slide,
      seasonNumber: seasonNumber > 0 ? seasonNumber : index + 1,
      episodeCount: parseEpisodeCount(slide.node?.episodes),
    };
  });
};

const SeasonSection = ({ relations, currentAnime, onItemPress }) => {
  const seasons = useMemo(() => buildSeasonSlides(relations, currentAnime), [relations, currentAnime]);

  const renderSeasonItem = useCallback(({ item }) => {
    try {
      if (!item?.node) {
        return null;
      }
      
      const title = item.node.title?.english || item.node.title?.romaji || 'Unknown Season';
      const imageUri = item.node.coverImage?.medium || item.node.coverImage?.large;
      
      return (
        <Pressable
          style={({ pressed }) => [
            styles.seasonCard,
            pressed && styles.seasonCardPressed,
          ]}
          onPress={() => onItemPress?.(item.node)}
          accessibilityRole="button"
          accessibilityLabel={`View ${title}`}
        >
          {imageUri ? (
            <ImageBackground
              source={{ uri: imageUri }}
              style={styles.cardBackground}
              resizeMode="cover"
            >
              <BlurView blurType="dark" blurAmount={8} style={styles.blurOverlay}>
                <LinearGradient
                  colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.7)']}
                  style={styles.gradientOverlay}
                />
                <View style={styles.cardContent}>
                  <Text style={styles.seasonText} numberOfLines={1}>
                    {`Season ${item.seasonNumber}`}
                  </Text>
                  <Text style={styles.episodesText} numberOfLines={1}>
                    {`${item.episodeCount || 0}Eps`}
                  </Text>
                </View>
              </BlurView>
            </ImageBackground>
          ) : (
            <View style={[styles.cardBackground, styles.fallbackBackground]}>
              <View style={styles.cardContent}>
                <Text style={styles.seasonText} numberOfLines={1}>
                  {`Season ${item.seasonNumber}`}
                </Text>
                <Text style={styles.episodesText} numberOfLines={1}>
                  {`${item.episodeCount || 0}Eps`}
                </Text>
              </View>
            </View>
          )}
        </Pressable>
      );
    } catch (error) {
      console.warn('Error rendering season item:', error);
      return null;
    }
  }, [onItemPress]);

  if (!seasons.length) return null;

  try {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>SEASON SECTION</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          decelerationRate="fast"
          snapToInterval={CARD_WIDTH + CARD_MARGIN}
          snapToAlignment="center"
        >
          {seasons.map((season, index) => (
            <View key={`${season.node?.id || index}-${index}`} style={styles.cardWrapper}>
              {renderSeasonItem({ item: season })}
            </View>
          ))}
        </ScrollView>
      </View>
    );
  } catch (error) {
    console.warn('Error rendering SeasonSection:', error);
    return null;
  }
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    marginHorizontal: 16,
    letterSpacing: 1,
    fontFamily: 'Agdasima',
  },
  scrollContent: {
    paddingHorizontal: (SCREEN_WIDTH - CARD_WIDTH) / 2,
  },
  cardWrapper: {
    width: CARD_WIDTH,
    marginHorizontal: CARD_MARGIN / 2,
  },
  seasonCard: {
    width: '100%',
    height: CARD_HEIGHT,
    borderRadius: 12,
    borderCurve: 'continuous',
    overflow: 'hidden',
    backgroundColor: '#1A1A1A',
  },
  seasonCardPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.8,
  },
  cardBackground: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  fallbackBackground: {
    backgroundColor: '#2A2A2A',
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  cardContent: {
    padding: 12,
    justifyContent: 'flex-end',
    minHeight: 60,
  },
  seasonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A78BFA',
    marginBottom: 4,
    fontFamily: 'Agdasima',
    letterSpacing: 0.5,
  },
  episodesText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 18,
  },
});

export default SeasonSection;
