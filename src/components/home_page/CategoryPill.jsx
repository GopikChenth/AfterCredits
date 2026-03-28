import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated,
  PanResponder,
  Platform,
} from 'react-native';
import { usePagerSwipe } from '../../context/PagerSwipeContext';
import { getMediaTheme } from '../../utils/mediaThemes';

let HapticsModule = null;
try {
  const mod = require('@mhpdev/react-native-haptics');
  HapticsModule = mod?.default ?? mod;
} catch {
  HapticsModule = null;
}

// Exported so home_game.jsx can read the same value for its Skia corner radius.
const PILL_HEIGHT = 56;
export const PILL_BORDER_RADIUS = PILL_HEIGHT / 2;
const DEFAULT_THEME = getMediaTheme('anime');

const CategoryPill = ({ 
  categories = ['Trending', 'Popular', 'New'],
  onCategoryChange,
  width = 180,
  accentColor = DEFAULT_THEME.accent,
  textColor = '#101010',
  onSwipeGestureStart,
  onSwipeGestureEnd,
}) => {
  const { disableSwipe, enableSwipe } = usePagerSwipe();
  const [activeIndex, setActiveIndex] = useState(0);
  const currentIndexRef = useRef(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const hintAnim = useRef(new Animated.Value(0)).current;
  const hasInteracted = useRef(false);

  // Gentle one-shot hint on mount (avoid continuous loop to reduce idle CPU/GPU work).
  useEffect(() => {
    const sequence = Animated.sequence([
      Animated.timing(hintAnim, { toValue: -8, duration: 150, useNativeDriver: true }),
      Animated.timing(hintAnim, { toValue: 8,  duration: 200, useNativeDriver: true }),
      Animated.timing(hintAnim, { toValue: -5, duration: 150, useNativeDriver: true }),
      Animated.timing(hintAnim, { toValue: 5,  duration: 150, useNativeDriver: true }),
      Animated.timing(hintAnim, { toValue: 0,  duration: 120, useNativeDriver: true }),
    ]);

    const initial = setTimeout(() => {
      if (!hasInteracted.current) {
        sequence.start();
      }
    }, 600);

    return () => {
      clearTimeout(initial);
      hintAnim.stopAnimation();
    };
  }, [hintAnim]);

  const changeCategory = useCallback((direction) => {
    const newIndex = currentIndexRef.current + direction;
    if (newIndex < 0 || newIndex >= categories.length) return;

    if (!hasInteracted.current) {
      hasInteracted.current = true;
      hintAnim.stopAnimation();
      hintAnim.setValue(0);
    }

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
  }, [categories, onCategoryChange, fadeAnim, slideAnim, hintAnim]);

  const triggerDragStart = useCallback(() => {
    if (Platform.OS !== 'android') return;
    if (!HapticsModule?.androidHaptics) return;
    try {
      const maybePromise = HapticsModule.androidHaptics('drag-start');
      if (maybePromise?.catch) maybePromise.catch(() => {});
    } catch { /* no-op */ }
  }, []);

  const handleGestureStart = useCallback(() => {
    disableSwipe();
    onSwipeGestureStart?.();
  }, [disableSwipe, onSwipeGestureStart]);

  const handleGestureEnd = useCallback(() => {
    enableSwipe();
    onSwipeGestureEnd?.();
  }, [enableSwipe, onSwipeGestureEnd]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 6 &&
        Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
      onMoveShouldSetPanResponderCapture: (_, gestureState) =>
        Math.abs(gestureState.dx) > 6 &&
        Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
      onPanResponderGrant: () => {
        handleGestureStart();
        triggerDragStart();
      },
      onPanResponderRelease: (_, gestureState) => {
        const swipeThreshold = 30;

        if (gestureState.dx > swipeThreshold) {
          changeCategory(-1);
        } else if (gestureState.dx < -swipeThreshold) {
          changeCategory(1);
        }

        handleGestureEnd();
      },
      onPanResponderTerminate: () => {
        handleGestureEnd();
      },
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
    })
  ).current;

  useEffect(() => () => handleGestureEnd(), [handleGestureEnd]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[styles.pill, { width, backgroundColor: accentColor }]}
        {...panResponder.panHandlers}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateX: Animated.add(slideAnim, hintAnim) }],
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
    fontSize: 16,
    fontFamily: 'Agdasima-Bold',
    color: '#101010',
    letterSpacing: 1.2,
  },
});

export default CategoryPill;
