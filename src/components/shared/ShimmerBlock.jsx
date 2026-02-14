import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

/**
 * Reusable shimmer animation block — pulsing opacity effect
 * Used across all skeleton loaders for consistent loading UX
 */
const ShimmerBlock = ({ style }) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        { backgroundColor: '#333', borderRadius: 8, opacity },
        style,
      ]}
    />
  );
};

export default ShimmerBlock;
