import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const AnimeReview = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Review Upcoming</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 24,
    fontFamily: 'Agdasima',
    letterSpacing: 1,
    color: '#000',
  },
});

export default AnimeReview;
