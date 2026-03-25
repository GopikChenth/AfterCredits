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

const CategoryPill = ({ 
  categories = ['Trending', 'Popular', 'New'],
  onCategoryChange,
  width = 180,
  accentColor = '#FFB3C6',
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
  const hintLoopRef = useRef(null);

  // Fire once on mount after 600ms, then loop every 5s until user swipes
  useEffect(() => {
    const sequence = Animated.sequence([
      Animated.timing(hintAnim, { toValue: -8, duration: 150, useNativeDriver: true }),
      Animated.timing(hintAnim, { toValue: 8,  duration: 200, useNativeDriver: true }),
      Animated.timing(hintAnim, { toValue: -5, duration: 150, useNativeDriver: true }),
      Animated.timing(hintAnim, { toValue: 5,  duration: 150, useNativeDriver: true }),
      Animated.timing(hintAnim, { toValue: 0,  duration: 120, useNativeDriver: true }),
      Animated.delay(5000),
    ]);

    hintLoopRef.current = Animated.loop(sequence, { resetBeforeIteration: true });
    const initial = setTimeout(() => {
      if (!hasInteracted.current) {
        hintLoopRef.current?.start();
      }
    }, 600);

    return () => {
      clearTimeout(initial);
      hintLoopRef.current?.stop();
    };
  }, [hintAnim]);

  const changeCategory = useCallback((direction) => {
    const newIndex = currentIndexRef.current + direction;
    if (newIndex < 0 || newIndex >= categories.length) return;

    if (!hasInteracted.current) {
      hasInteracted.current = true;
      hintLoopRef.current?.stop();
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

  const changeCategoryRef = useRef(changeCategory);
  changeCategoryRef.current = changeCategory;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 8 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
      onPanResponderGrant: () => {
        handleGestureStart();
        triggerDragStart();
      },
      onPanResponderRelease: (_, gestureState) => {
        const swipeThreshold = 20;
        const velocityThreshold = 0.3;

        if (gestureState.dx > swipeThreshold || gestureState.vx > velocityThreshold) {
          changeCategoryRef.current(-1);
        } else if (gestureState.dx < -swipeThreshold || gestureState.vx < -velocityThreshold) {
          changeCategoryRef.current(1);
        }

        handleGestureEnd();
      },
      onPanResponderTerminate: () => {
        handleGestureEnd();
      },
    })
  ).current;

  useEffect(() => () => handleGestureEnd(), [handleGestureEnd]);

  return (
    <View style={styles.container}>
      {/*
        onTouchStart fires on Android ACTION_DOWN — BEFORE the pager's
        onInterceptTouchEvent (ACTION_MOVE). Disabling swipe here ensures
        the pager never gets a chance to intercept.
        onTouchEnd re-enables it when the finger lifts.
      */}
      <View
        onTouchStart={handleGestureStart}
        onTouchEnd={handleGestureEnd}
        onTouchCancel={handleGestureEnd}
      >
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
            <Text style={styles.categoryText}>
              {categories[activeIndex]}
            </Text>
          </Animated.View>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // No margin - parent controls spacing
  },
  pill: {
    backgroundColor: '#FFB3C6',
    height: PILL_HEIGHT,
    borderRadius: PILL_BORDER_RADIUS,
    borderCurve: 'continuous',
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    letterSpacing: 1.5,
  },
});

export default CategoryPill;
