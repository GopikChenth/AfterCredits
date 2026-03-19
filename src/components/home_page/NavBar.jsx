import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Pressable, StyleSheet, Animated, Easing, Platform, AccessibilityInfo } from 'react-native';
import { useMediaType } from '../../context/MediaTypeContext';
import { getMediaTheme } from '../../utils/mediaThemes';

let HapticsModule = null;
try {
  const mod = require('@mhpdev/react-native-haptics');
  HapticsModule = mod?.default ?? mod;
} catch {
  HapticsModule = null;
}

const MEDIA_THEME_KEY = {
  anime: 'anime',
  movies: 'movie',
  games: 'game',
  comics: 'comic',
  manga: 'manga',
};

const DARK_NAV = {
  background: '#0B0B0F',
  border: '#17181F',
  label: '#8F95A3',
  labelNear: '#BCC2CF',
};

const TAB_CONFIG = {
  Home: { label: 'Home', icon: '🏠' },
  PostPage: { label: 'Post', icon: '📝' },
  DiscoverPage: { label: 'Discover', icon: '🔍' },
  PodiumPage: { label: 'Podium', icon: '📋' },
};

/**
 * Custom Tab Bar for Bottom Tab Navigator
 * Receives props from @react-navigation/bottom-tabs
 */
const NavBar = ({ state, navigation }) => {
  const { mediaType } = useMediaType();
  const theme = getMediaTheme(MEDIA_THEME_KEY[mediaType] || 'anime');
  const [barWidth, setBarWidth] = useState(0);
  const [reduceMotionEnabled, setReduceMotionEnabled] = useState(false);
  const activeIndexAnim = useRef(new Animated.Value(state.index)).current;
  const delightAnim = useRef(new Animated.Value(0)).current;
  const previousIndexRef = useRef(state.index);
  const routeCount = state.routes.length;

  useEffect(() => {
    let isMounted = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (isMounted) setReduceMotionEnabled(enabled);
      })
      .catch(() => {});

    const subscription = AccessibilityInfo.addEventListener?.(
      'reduceMotionChanged',
      (enabled) => setReduceMotionEnabled(enabled)
    );

    return () => {
      isMounted = false;
      subscription?.remove?.();
    };
  }, []);

  useEffect(() => {
    if (reduceMotionEnabled) {
      activeIndexAnim.setValue(state.index);
      return;
    }

    Animated.timing(activeIndexAnim, {
      toValue: state.index,
      duration: 280,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: true,
    }).start();
  }, [activeIndexAnim, reduceMotionEnabled, state.index]);

  useEffect(() => {
    if (previousIndexRef.current === state.index) return;
    previousIndexRef.current = state.index;

    if (reduceMotionEnabled) {
      delightAnim.setValue(1);
      return;
    }

    delightAnim.setValue(0);
    Animated.timing(delightAnim, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [delightAnim, reduceMotionEnabled, state.index]);

  const handleBarLayout = useCallback((event) => {
    const nextWidth = event.nativeEvent.layout.width;
    setBarWidth((currentWidth) => (currentWidth === nextWidth ? currentWidth : nextWidth));
  }, []);

  const tabWidth = barWidth && routeCount ? barWidth / routeCount : 0;
  const inputRange = useMemo(
    () => Array.from({ length: routeCount }, (_, index) => index),
    [routeCount]
  );
  const indicatorTranslateX = useMemo(() => (
    tabWidth
      ? activeIndexAnim.interpolate({
        inputRange,
        outputRange: inputRange.map((index) => index * tabWidth + (tabWidth - 28) / 2),
      })
      : 0
  ), [activeIndexAnim, inputRange, tabWidth]);
  const auraTranslateX = useMemo(() => (
    tabWidth
      ? activeIndexAnim.interpolate({
        inputRange,
        outputRange: inputRange.map((index) => index * tabWidth + tabWidth / 2 - 32),
      })
      : 0
  ), [activeIndexAnim, inputRange, tabWidth]);
  const auraOpacity = useMemo(() => delightAnim.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0, 0.26, 0.12],
    extrapolate: 'clamp',
  }), [delightAnim]);
  const auraScale = useMemo(() => delightAnim.interpolate({
    inputRange: [0, 0.25, 1],
    outputRange: [0.82, 1.06, 1],
    extrapolate: 'clamp',
  }), [delightAnim]);
  const indicatorScaleX = useMemo(() => delightAnim.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [0.8, 1.18, 1],
    extrapolate: 'clamp',
  }), [delightAnim]);
  const tabAnimations = useMemo(
    () =>
      inputRange.map((index) => ({
        iconTranslateY: activeIndexAnim.interpolate({
          inputRange,
          outputRange: inputRange.map((routeIndex) => (routeIndex === index ? -1 : 0)),
          extrapolate: 'clamp',
        }),
        iconOpacity: activeIndexAnim.interpolate({
          inputRange,
          outputRange: inputRange.map((routeIndex) => {
            const distance = Math.abs(routeIndex - index);
            if (distance === 0) return 1;
            if (distance === 1) return 0.78;
            return 0.64;
          }),
          extrapolate: 'clamp',
        }),
        iconScale: activeIndexAnim.interpolate({
          inputRange,
          outputRange: inputRange.map((routeIndex) => (routeIndex === index ? 1.06 : 1)),
          extrapolate: 'clamp',
        }),
        labelOpacity: activeIndexAnim.interpolate({
          inputRange,
          outputRange: inputRange.map((routeIndex) => (routeIndex === index ? 1 : 0.72)),
          extrapolate: 'clamp',
        }),
      })),
    [activeIndexAnim, inputRange]
  );

  const triggerSelectionHaptic = useCallback(() => {
    if (Platform.OS === 'web') return;
    if (!HapticsModule?.impact) return;
    try {
      const maybePromise = HapticsModule.impact('light');
      if (maybePromise?.catch) maybePromise.catch(() => {});
    } catch {
      // No-op when native haptics are unavailable.
    }
  }, []);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: DARK_NAV.background,
          borderTopColor: DARK_NAV.border,
          shadowColor: '#000000',
        },
      ]}
      onLayout={handleBarLayout}
    >
      {!reduceMotionEnabled && tabWidth ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.activeAura,
            {
              backgroundColor: theme.accent,
              opacity: auraOpacity,
              transform: [{ translateX: auraTranslateX }, { scale: auraScale }],
            },
          ]}
        />
      ) : null}
      {tabWidth ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.activeIndicator,
            {
              width: 28,
              backgroundColor: theme.accent,
              shadowColor: theme.accent,
              transform: [{ translateX: indicatorTranslateX }, { scaleX: indicatorScaleX }],
            },
          ]}
        />
      ) : null}
      {state.routes.map((route, index) => {
        const config = TAB_CONFIG[route.name];
        if (!config) return null;

        const isFocused = state.index === index;
        const animations = tabAnimations[index];

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            triggerSelectionHaptic();
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={route.key}
            style={styles.tab}
            onPress={onPress}
          >
            <Animated.Text
              style={[
                styles.icon,
                {
                  color: isFocused ? theme.accentLight : DARK_NAV.labelNear,
                  opacity: animations.iconOpacity,
                  transform: [{ scale: animations.iconScale }, { translateY: animations.iconTranslateY }],
                },
              ]}
            >
              {config.icon}
            </Animated.Text>
            <Animated.Text
              style={[
                styles.label,
                {
                  color: isFocused ? theme.accentLight : DARK_NAV.label,
                  opacity: animations.labelOpacity,
                },
                isFocused && styles.activeLabel,
              ]}
            >
              {config.label}
            </Animated.Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingBottom: 10,
    paddingTop: 10,
    paddingHorizontal: 10,
    elevation: 8,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    position: 'relative',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    position: 'relative',
    zIndex: 1,
    minHeight: 56,
  },
  icon: {
    fontSize: 24,
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  activeLabel: {
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 2,
    height: 3,
    borderRadius: 2,
    borderCurve: 'continuous',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    left: 0,
  },
  activeAura: {
    position: 'absolute',
    top: 4,
    width: 64,
    height: 46,
    borderRadius: 23,
    left: 0,
  },
});

export default React.memo(NavBar);
