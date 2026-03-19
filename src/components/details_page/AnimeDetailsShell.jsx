import React, { memo } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export const DetailBackgroundShapes = memo(({ styles }) => (
  <View style={styles.backgroundShapes}>
    <View style={styles.blobShape1} />
    <View style={styles.blobShape2} />
    <View style={styles.blobShape3} />
  </View>
));
DetailBackgroundShapes.displayName = "DetailBackgroundShapes";

export const DetailScreenState = memo(
  ({
    styles,
    message,
    primaryAction,
    primaryLabel,
    secondaryAction,
    secondaryLabel,
    themeAccent,
  }) => (
    <View style={styles.container}>
      <DetailBackgroundShapes styles={styles} />
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{message}</Text>
        {primaryAction && primaryLabel ? (
          <Pressable
            style={[styles.retryButton, { backgroundColor: themeAccent }]}
            onPress={primaryAction}
            accessibilityRole="button"
            accessibilityLabel={primaryLabel}
          >
            <Text style={styles.retryText}>{primaryLabel}</Text>
          </Pressable>
        ) : null}
        {secondaryAction && secondaryLabel ? (
          <Pressable
            style={[styles.retryButton, { marginTop: 10, backgroundColor: "#A0A0A0" }]}
            onPress={secondaryAction}
            accessibilityRole="button"
            accessibilityLabel={secondaryLabel}
          >
            <Text style={styles.retryText}>{secondaryLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  )
);
DetailScreenState.displayName = "DetailScreenState";

export const AnimatedDetailsHeader = memo(
  ({ styles, title, headerOpacity, onBackPress }) => (
    <SafeAreaView style={styles.headerSafeArea} edges={["top"]}>
      <Animated.View
        style={[
          styles.animatedHeader,
          {
            transform: [
              {
                translateY: headerOpacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-100, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.headerBlur}>
          <Pressable style={styles.headerBackButton} onPress={onBackPress}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title || "Anime Details"}
          </Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  )
);
AnimatedDetailsHeader.displayName = "AnimatedDetailsHeader";
