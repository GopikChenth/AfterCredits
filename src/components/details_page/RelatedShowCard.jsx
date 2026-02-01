import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';

const RelatedShowCard = ({ title, subtitle, image, onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Image source={{ uri: image }} style={styles.image} />
      <View style={styles.overlay}>
        <Text style={styles.title}>{title}</Text>
        {/* <Text style={styles.subtitle}>{subtitle}</Text> */}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 150,
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
  },
  title: {
    color: '#fff',
    fontSize: 12,
    letterSpacing: 1,
    fontWeight: 'bold',
    fontFamily: 'agdasima',
    marginBottom: 2,
  },
  // subtitle: {
  //   color: '#fff',
  //   fontSize: 10,
  //   letterSpacing: 1,
  //   fontFamily: 'Agdasima',
  //   opacity: 0.8,
  // },
});

export default RelatedShowCard;