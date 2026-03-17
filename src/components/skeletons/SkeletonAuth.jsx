import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ShimmerBlock, { ShimmerProvider } from '../shared/ShimmerBlock';

/**
 * Skeleton for Auth page - shows placeholder for login/signup form
 */
const SkeletonAuth = () => (
  <ShimmerProvider>
  <View style={styles.container}>
    <LinearGradient
      colors={['#0B0B10', '#141421', '#0B0B10']}
      style={StyleSheet.absoluteFill}
    />
    <View style={styles.bgGlowOne} />
    <View style={styles.bgGlowTwo} />

    {/* Logo/Title area */}
    <View style={styles.logoSection}>
      <ShimmerBlock style={{ width: 80, height: 80, borderRadius: 40 }} />
      <ShimmerBlock style={{ width: 180, height: 28, marginTop: 20 }} />
      <ShimmerBlock style={{ width: 140, height: 14, marginTop: 8 }} />
    </View>

    <View style={styles.authCard}>
      {/* Form inputs */}
      <View style={styles.formSection}>
        <ShimmerBlock style={styles.input} />
        <ShimmerBlock style={styles.input} />
        <ShimmerBlock style={styles.input} />
      </View>

      {/* Submit button */}
      <ShimmerBlock style={styles.button} />

      {/* Divider */}
      <View style={styles.dividerRow}>
        <ShimmerBlock style={{ flex: 1, height: 1 }} />
        <ShimmerBlock style={{ width: 40, height: 12, marginHorizontal: 16 }} />
        <ShimmerBlock style={{ flex: 1, height: 1 }} />
      </View>

      {/* Social buttons */}
      <View style={styles.socialSection}>
        <ShimmerBlock style={styles.socialButton} />
        <ShimmerBlock style={styles.socialButton} />
      </View>

      {/* Footer link */}
      <View style={styles.footer}>
        <ShimmerBlock style={{ width: 200, height: 14 }} />
      </View>
    </View>
  </View>
  </ShimmerProvider>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    backgroundColor: '#0B0B10',
  },
  bgGlowOne: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#A78BFA',
    opacity: 0.12,
  },
  bgGlowTwo: {
    position: 'absolute',
    bottom: -100,
    left: -40,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#6EE7B7',
    opacity: 0.08,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  authCard: {
    backgroundColor: 'rgba(20, 20, 33, 0.92)',
    borderRadius: 20,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.25)',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 6,
  },
  formSection: {
    gap: 16,
    marginBottom: 24,
  },
  input: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    borderCurve: 'continuous',
  },
  button: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    borderCurve: 'continuous',
    marginBottom: 24,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  socialSection: {
    gap: 12,
    marginBottom: 32,
  },
  socialButton: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    borderCurve: 'continuous',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 8,
  },
});

export default SkeletonAuth;
