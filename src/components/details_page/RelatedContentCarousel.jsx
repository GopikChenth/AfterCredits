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
 * Helper function to categorize and filter relations
 */
const categorizeRelations = (relations) => {
  if (!relations?.edges) return [];

  const relevantTypes = ['SEQUEL', 'PREQUEL', 'SIDE_STORY', 'PARENT', 'ALTERNATIVE'];
  const formatPriority = { 'TV': 1, 'MOVIE': 2, 'OVA': 3, 'ONA': 4, 'SPECIAL': 5, 'TV_SHORT': 6 };

  return relations.edges
    .filter(edge => relevantTypes.includes(edge.relationType))
    .filter(edge => edge.node && edge.node.title)
    .sort((a, b) => {
      // Sort by format priority, then by relation type
      const formatA = formatPriority[a.node.format] || 99;
      const formatB = formatPriority[b.node.format] || 99;
      
      if (formatA !== formatB) return formatA - formatB;
      
      // If same format, sort by relation type
      const typeOrder = ['PARENT', 'PREQUEL', 'SEQUEL', 'SIDE_STORY', 'ALTERNATIVE'];
      return typeOrder.indexOf(a.relationType) - typeOrder.indexOf(b.relationType);
    });
};

/**
 * Get display text for different anime formats and episodes
 */
const getDisplayInfo = (relation) => {
  const { format, episodes, status } = relation.node;
  
  let formatText = '';
  switch (format) {
    case 'TV':
      formatText = episodes ? `Season • ${episodes} Eps` : 'Season';
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
      formatText = episodes ? `${episodes} Episodes` : format;
  }
  
  return formatText;
};

const RelatedContentCarousel = ({ relations, onItemPress }) => {
  const processedRelations = useMemo(() => categorizeRelations(relations), [relations]);

  const renderRelationItem = useCallback(({ item }) => {
    const displayInfo = getDisplayInfo(item);
    const title = item.node.title.english || item.node.title.romaji;
    
    return (
      <Pressable
        style={({ pressed }) => [
          styles.relationCard,
          pressed && styles.relationCardPressed,
        ]}
        onPress={() => onItemPress?.(item.node)}
        accessibilityRole="button"
        accessibilityLabel={`View ${title}`}
      >
        <ImageBackground
          source={{ uri: item.node.coverImage.medium }}
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
                {item.relationType.replace('_', ' ')}
              </Text>
            </View>
          </BlurView>
        </ImageBackground>
      </Pressable>
    );
  }, [onItemPress]);

  if (!processedRelations.length) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>RELATED SERIES</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + CARD_MARGIN}
        snapToAlignment="center"
      >
        {processedRelations.map((relation, index) => (
          <View key={`${relation.node.id}-${index}`} style={styles.cardWrapper}>
            {renderRelationItem({ item: relation })}
          </View>
        ))}
      </ScrollView>
    </View>
  );
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
  relationCard: {
    width: '100%',
    height: CARD_HEIGHT,
    borderRadius: 12,
    borderCurve: 'continuous',
    overflow: 'hidden',
    backgroundColor: '#1A1A1A',
  },
  relationCardPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.8,
  },
  cardBackground: {
    flex: 1,
    justifyContent: 'flex-end',
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

export default RelatedContentCarousel;