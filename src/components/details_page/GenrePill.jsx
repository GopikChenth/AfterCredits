import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const GenrePill = ({ genre }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{genre}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    borderCurve: 'continuous',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  text: {
    fontSize: 12,
    color: '#000',
    fontFamily: 'Agdasima-Bold',
    letterSpacing: 0.5,
  },
});

export default GenrePill;
