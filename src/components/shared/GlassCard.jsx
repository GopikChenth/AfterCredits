/**
 * GlassCard — Frosted glass card with native blur + graceful fallback.
 *
 * Uses @react-native-community/blur on native platforms.
 * Falls back to a semi-transparent overlay if blur fails (OOM, etc.).
 *
 * Usage:
 *   <GlassCard style={styles.myCard} blurAmount={10} blurType="dark">
 *     <Text>Content stays sharp</Text>
 *   </GlassCard>
 */
import React, { memo, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from '@react-native-community/blur';

const GlassCard = memo(({
  children,
  style,
  blurAmount = 10,
  blurType = 'dark',
}) => {
  const [blurFailed, setBlurFailed] = useState(false);

  if (Platform.OS === 'web') {
    return (
      <View
        style={[
          style,
          {
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          },
        ]}
      >
        {children}
      </View>
    );
  }

  return (
    <View style={[style, styles.container]}>
      {!blurFailed ? (
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType={blurType}
          blurAmount={blurAmount}
          reducedTransparencyFallbackColor="rgba(0,0,0,0.85)"
          onError={() => setBlurFailed(true)}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.fallback]} />
      )}
      {children}
    </View>
  );
});

GlassCard.displayName = 'GlassCard';

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  fallback: {
    backgroundColor: 'rgba(13, 13, 13, 0.85)',
  },
});

export default GlassCard;
