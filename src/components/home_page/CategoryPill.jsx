import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
} from 'react-native';
import { getMediaTheme } from '../../utils/mediaThemes';

// Exported so home_game.jsx can read the same geometry for its panel path.
export const PILL_HEIGHT = 56;
export const PILL_BORDER_RADIUS = PILL_HEIGHT / 2;
const DEFAULT_THEME = getMediaTheme('anime');

const CategoryPill = ({ 
  categories = ['Trending', 'Popular', 'New'],
  onCategoryChange,
  width = 180,
  height = PILL_HEIGHT,
  borderRadius,
  accentColor = DEFAULT_THEME.accent,
  textColor = '#101010',
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const currentIndexRef = useRef(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const changeCategory = useCallback((direction) => {
    const newIndex = currentIndexRef.current + direction;
    if (newIndex < 0 || newIndex >= categories.length) return;

    currentIndexRef.current = newIndex;
    setActiveIndex(newIndex);
    if (onCategoryChange) {
      onCategoryChange(categories[newIndex]);
    }

    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: direction > 0 ? -15 : 15, duration: 100, useNativeDriver: true }),
      ]),
      Animated.timing(slideAnim, { toValue: direction > 0 ? 15 : -15, duration: 0, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      ]),
    ]).start();
  }, [categories, onCategoryChange, fadeAnim, slideAnim]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 5,
      onMoveShouldSetPanResponderCapture: (_, gestureState) =>
        Math.abs(gestureState.dx) > 5 &&
        Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
      onPanResponderRelease: (_, gestureState) => {
        const swipeThreshold = 30;

        if (gestureState.dx > swipeThreshold) {
          changeCategory(-1);
        } else if (gestureState.dx < -swipeThreshold) {
          changeCategory(1);
        }
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.pill,
          {
            width,
            height,
            borderRadius: borderRadius ?? height / 2,
            backgroundColor: accentColor,
          },
        ]}
        {...panResponder.panHandlers}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }],
          }}
        >
          <Text style={[styles.categoryText, { color: textColor }]}>
            {categories[activeIndex]}
          </Text>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // No margin - parent controls spacing
  },
  pill: {
    backgroundColor: DEFAULT_THEME.accent,
    height: PILL_HEIGHT,
    borderRadius: PILL_BORDER_RADIUS,
    borderCurve: 'continuous',
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryText: {
    fontSize: 17,
    fontFamily: 'Agdasima-Bold',
    fontWeight: '900',
    color: '#101010',
    letterSpacing: 1.2,
  },
});

export default CategoryPill;
