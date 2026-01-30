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
    backgroundColor: '#e0e0e0',
    borderRadius: 15,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  text: {
    fontSize: 12,
    color: '#000',
    fontWeight: '500',
    fontFamily: 'Agdasima',
    letterSpacing: 0.5,
    fontWeight: 'bold',
  },
});

export default GenrePill;