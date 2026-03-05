import React, { useState, useRef } from 'react';
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

  const changeCategory = (direction) => {
    const newIndex = currentIndexRef.current + direction;
    
    // Boundary check
    if (newIndex < 0 || newIndex >= categories.length) {
      console.log('Boundary reached:', newIndex, 'current:', currentIndexRef.current);
      return;
    }

    console.log('Changing from', currentIndexRef.current, 'to', newIndex, 'direction:', direction);

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
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Detect horizontal swipe (more than 5px)
        return Math.abs(gestureState.dx) > 5;
      },
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
        // Capture horizontal swipes before parent ScrollView
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderGrant: () => {
        // User started touching
      },
      onPanResponderRelease: (evt, gestureState) => {
        // Lower threshold for better mobile responsiveness
        const swipeThreshold = 30;
        
        if (gestureState.dx > swipeThreshold) {
          // Swiped right -> previous category
          changeCategory(-1);
        } else if (gestureState.dx < -swipeThreshold) {
          // Swiped left -> next category
          changeCategory(1);
        }
      },
      onPanResponderTerminate: () => {
        // Gesture was interrupted
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
            transform: [{ translateX: slideAnim }],
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
