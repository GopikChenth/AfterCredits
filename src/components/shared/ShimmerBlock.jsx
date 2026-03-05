import React, { useEffect, useRef, memo } from 'react';
import { Animated, View, StyleSheet } from 'react-native';

/**
 * ShimmerProvider — wraps ALL skeleton blocks in a single Animated.View
 * that pulses opacity. Individual ShimmerBlocks become plain Views.
 *
 * Before: 30 Animated.View nodes, 30 interpolations → JS thread overload
 * After:  1 Animated.View node, 1 interpolation → smooth 60fps
 */
export const ShimmerProvider = ({ children }) => {
  const anim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 0.7,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0.3,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View style={{ flex: 1, opacity: anim }}>
      {children}
    </Animated.View>
  );
};

/**
 * ShimmerBlock — a plain colored block.
 * When inside ShimmerProvider the parent handles the animation.
 * When standalone (no provider) it runs its own animation for backward compat.
 */
const ShimmerBlock = memo(({ style }) => (
  <View style={[styles.block, style]} />
));

ShimmerBlock.displayName = 'ShimmerBlock';

const styles = StyleSheet.create({
  block: {
    backgroundColor: '#333',
    borderRadius: 8,
    borderCurve: 'continuous',
  },
});

export default ShimmerBlock;
