import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const StatsPill = ({ label, count, color }) => {
  return (
    <View style={[styles.container, { backgroundColor: color }]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.count}>{count}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  label: {
    color: '#000',
    letterSpacing: 1,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Agdasima',
    marginBottom: 2,
  },
  count: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Agdasima',
  },
});

export default StatsPill;