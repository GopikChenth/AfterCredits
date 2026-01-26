import { Dimensions } from 'react-native';

/**
 * Calculate card width for masonry grid layout
 * @param {number} columns - Number of columns (default: 2)
 * @param {number} horizontalPadding - Total horizontal padding in grid
 * @param {number} columnGap - Gap between columns
 * @returns {number} Calculated card width
 */
export const getCardWidth = (columns = 2, horizontalPadding = 32, columnGap = 16) => {
  const { width } = Dimensions.get('window');
  return (width - horizontalPadding - columnGap) / columns;
};

/**
 * Get responsive dimensions for card-based layouts
 * @returns {Object} { cardWidth, cardHeight, spacing, padding }
 */
export const getCardDimensions = () => {
  const horizontalPadding = 32; // 16px left + 16px right
  const columnGap = 16;
  const columns = 2;
  
  const cardWidth = getCardWidth(columns, horizontalPadding, columnGap);
  
  // Maintain aspect ratio: original was 180x260 = 9:13 ratio
  const aspectRatio = 260 / 180; // height/width = 1.444
  const cardHeight = cardWidth * aspectRatio;
  
  return {
    cardWidth,
    cardHeight,
    columns,
    horizontalPadding,
    columnGap,
    spacing: {
      paddingHorizontal: 16,
      marginBottom: 16,
      columnPadding: 8,
    },
  };
};
