import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  Pressable, 
  StyleSheet, 
  Animated,
  PanResponder,
} from 'react-native';

const CategoryPill = ({ 
  categories = ['Trending', 'Popular', 'New'],
  onCategoryChange,
  width = 180,
  accentColor = '#FFB3C6',
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const currentIndexRef = useRef(0); // Track actual current index
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const hintAnim = useRef(new Animated.Value(0)).current;
  const hasInteracted = useRef(false); // Stop hinting once user swipes
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

  const changeCategory = (direction) => {
    const newIndex = currentIndexRef.current + direction;
    
    // Boundary check
    if (newIndex < 0 || newIndex >= categories.length) return;

    // Stop hint animation loop after first interaction
    if (!hasInteracted.current) {
      hasInteracted.current = true;
      hintLoopRef.current?.stop();
      hintAnim.setValue(0);
    }

    // Update ref immediately
    currentIndexRef.current = newIndex;
    
    // Update state
    setActiveIndex(newIndex);
    if (onCategoryChange) {
      onCategoryChange(categories[newIndex]);
    }

    // Animate text change with whoosh effect
    Animated.sequence([
      // Fade out and slide
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: direction > 0 ? -15 : 15,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
      // Reset position
      Animated.timing(slideAnim, {
        toValue: direction > 0 ? 15 : -15,
        duration: 0,
        useNativeDriver: true,
      }),
      // Fade in and slide back
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  // Swipe gesture handler
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only claim horizontal swipes
        return Math.abs(gestureState.dx) > 8 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 15 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderRelease: (evt, gestureState) => {
        const swipeThreshold = 20;
        const velocityThreshold = 0.3;
        
        if (gestureState.dx > swipeThreshold || gestureState.vx > velocityThreshold) {
          // Swiped right -> previous category
          changeCategory(-1);
        } else if (gestureState.dx < -swipeThreshold || gestureState.vx < -velocityThreshold) {
          // Swiped left -> next category
          changeCategory(1);
        }
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      <View 
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
    borderRadius: 20,
    borderCurve: 'continuous',
    paddingVertical: 18,
    paddingHorizontal: 20,
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
