import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Canvas, BackdropBlur, RoundedRect, rect, rrect } from '@shopify/react-native-skia';

/**
 * SkiaBlurBox - GPU-accelerated frosted glass backdrop blur.
 * Uses Skia's BackdropBlur which runs on the GPU — consistent on iOS & Android.
 *
 * Usage:
 *   <SkiaBlurBox blur={20} borderRadius={16} style={...}>
 *     {children}
 *   </SkiaBlurBox>
 */
const SkiaBlurBox = ({
  children,
  blur = 20,
  borderRadius = 0,
  style,
  overlayColor = 'rgba(0,0,0,0.25)',
}) => {
  const [size, setSize] = useState({ width: 0, height: 0 });

  const onLayout = useCallback((e) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ width, height });
  }, []);

  // Web: CSS backdrop-filter (Skia not available on web)
  if (Platform.OS === 'web') {
    return (
      <View
        style={[
          styles.container,
          {
            borderRadius,
            backgroundColor: overlayColor,
            backdropFilter: `blur(${blur}px) saturate(180%)`,
            WebkitBackdropFilter: `blur(${blur}px) saturate(180%)`,
          },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  // Native: Skia BackdropBlur with measured clip region
  const { width, height } = size;
  const clipRect = borderRadius > 0
    ? rrect(rect(0, 0, width, height), borderRadius, borderRadius)
    : rect(0, 0, width, height);

  return (
    <View style={[styles.container, style]} onLayout={onLayout}>
      {/* Skia canvas fills the parent — renders blur behind children */}
      {width > 0 && height > 0 && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Canvas style={StyleSheet.absoluteFill}>
            <BackdropBlur blur={blur} clip={clipRect}>
              <RoundedRect
                x={0}
                y={0}
                width={width}
                height={height}
                r={borderRadius}
                color={overlayColor}
              />
            </BackdropBlur>
          </Canvas>
        </View>
      )}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});

export default SkiaBlurBox;
