import React from 'react';
import { View, StyleSheet } from 'react-native';
import ShimmerBlock from '../shared/ShimmerBlock';

/**
 * Skeleton for Auth page - shows placeholder for login/signup form
 */
const SkeletonAuth = () => (
  <View style={styles.container}>
    {/* Logo/Title area */}
    <View style={styles.logoSection}>
      <ShimmerBlock style={{ width: 80, height: 80, borderRadius: 40 }} />
      <ShimmerBlock style={{ width: 180, height: 28, marginTop: 20 }} />
      <ShimmerBlock style={{ width: 140, height: 14, marginTop: 8 }} />
    </View>

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
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  formSection: {
    gap: 16,
    marginBottom: 24,
  },
  input: {
    width: '100%',
    height: 52,
    borderRadius: 12,
  },
  button: {
    width: '100%',
    height: 52,
    borderRadius: 12,
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
    borderRadius: 12,
  },
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
    paddingBottom: 20,
  },
});

export default SkeletonAuth;
