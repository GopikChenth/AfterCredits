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

/**
 * Helper function to filter non-season related content (side stories, alternatives, etc.)
 */
const filterRelatedShows = (relations) => {
  if (!relations?.edges || !Array.isArray(relations.edges)) return [];

  // Show other types of relations that are not direct seasons
  const relatedTypes = ['SIDE_STORY', 'ALTERNATIVE', 'SPIN_OFF', 'OTHER'];
  
  try {
    return relations.edges
      .filter(edge => edge && edge.relationType && relatedTypes.includes(edge.relationType))
      .filter(edge => edge.node && edge.node.title && (edge.node.title.english || edge.node.title.romaji))
      .sort((a, b) => {
        // Sort by format priority, then by relation type
        const formatPriority = { 'TV': 1, 'MOVIE': 2, 'OVA': 3, 'ONA': 4, 'SPECIAL': 5, 'TV_SHORT': 6 };
        const formatA = formatPriority[a.node?.format] || 99;
        const formatB = formatPriority[b.node?.format] || 99;
        
        if (formatA !== formatB) return formatA - formatB;
        
        const typeOrder = ['SIDE_STORY', 'SPIN_OFF', 'ALTERNATIVE', 'OTHER'];
        return typeOrder.indexOf(a.relationType) - typeOrder.indexOf(b.relationType);
      });
  } catch (error) {
    console.warn('Error in filterRelatedShows:', error);
    return [];
  }
};

/**
 * Get display text for different related content formats
 */
const getRelatedDisplayInfo = (relation) => {
  try {
    if (!relation?.node) {
      return 'Unknown';
    }
    
    const { format, episodes } = relation.node;
    
    let formatText = '';
    switch (format) {
      case 'TV':
        formatText = episodes ? `Series • ${episodes} Eps` : 'Series';
        break;
      case 'MOVIE':
        formatText = 'Movie';
        break;
      case 'OVA':
        formatText = episodes ? `OVA • ${episodes} Eps` : 'OVA';
        break;
      case 'ONA':
        formatText = episodes ? `ONA • ${episodes} Eps` : 'ONA';
        break;
      case 'SPECIAL':
        formatText = episodes ? `Special • ${episodes} Eps` : 'Special';
        break;
      case 'TV_SHORT':
        formatText = episodes ? `Short • ${episodes} Eps` : 'Short';
        break;
      default:
        formatText = episodes ? `${episodes} Episodes` : (format || 'Unknown');
    }
    
    return formatText;
  } catch (error) {
    console.warn('Error in getRelatedDisplayInfo:', error);
    return 'Unknown';
  }
};

const RelatedShowsSection = ({ relations, onItemPress }) => {
  const relatedShows = useMemo(() => {
    try {
      return filterRelatedShows(relations);
    } catch (error) {
      console.warn('Error processing related shows:', error);
      return [];
    }
  }, [relations]);

  const renderRelatedItem = useCallback(({ item }) => {
    try {
      if (!item?.node) {
        return null;
      }
      
      const displayInfo = getRelatedDisplayInfo(item);
      const title = item.node.title?.english || item.node.title?.romaji || 'Unknown Title';
      const imageUri = item.node.coverImage?.medium || item.node.coverImage?.large;
      const relationType = item.relationType?.replace('_', ' ') || 'Related';
      
      return (
        <Pressable
          style={({ pressed }) => [
            styles.relatedCard,
            pressed && styles.relatedCardPressed,
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
                  <Text style={styles.formatText} numberOfLines={1}>
                    {displayInfo}
                  </Text>
                  <Text style={styles.titleText} numberOfLines={2}>
                    {title}
                  </Text>
                  <Text style={styles.relationTypeText}>
                    {relationType}
                  </Text>
                </View>
              </BlurView>
            </ImageBackground>
          ) : (
            <View style={[styles.cardBackground, styles.fallbackBackground]}>
              <View style={styles.cardContent}>
                <Text style={styles.formatText} numberOfLines={1}>
                  {displayInfo}
                </Text>
                <Text style={styles.titleText} numberOfLines={2}>
                  {title}
                </Text>
                <Text style={styles.relationTypeText}>
                  {relationType}
                </Text>
              </View>
            </View>
          )}
        </Pressable>
      );
    } catch (error) {
      console.warn('Error rendering related item:', error);
      return null;
    }
  }, [onItemPress]);

  if (!relatedShows.length) return null;

  try {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>RELATED SHOWS</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          decelerationRate="fast"
          snapToInterval={CARD_WIDTH + CARD_MARGIN}
          snapToAlignment="center"
        >
          {relatedShows.map((show, index) => (
            <View key={`${show.node?.id || index}-${index}`} style={styles.cardWrapper}>
              {renderRelatedItem({ item: show })}
            </View>
          ))}
        </ScrollView>
      </View>
    );
  } catch (error) {
    console.warn('Error rendering RelatedShowsSection:', error);
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
  relatedCard: {
    width: '100%',
    height: CARD_HEIGHT,
    borderRadius: 12,
    borderCurve: 'continuous',
    overflow: 'hidden',
    backgroundColor: '#1A1A1A',
  },
  relatedCardPressed: {
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
  formatText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A78BFA',
    marginBottom: 4,
    fontFamily: 'Agdasima',
    letterSpacing: 0.5,
  },
  titleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 18,
    marginBottom: 2,
  },
  relationTypeText: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
    textTransform: 'capitalize',
    fontFamily: 'Agdasima',
  },
});

export default RelatedShowsSection;