import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ReviewCard = ({ name, rating, text, avatar }) => {
  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => (
      <Text key={index} style={[styles.star, { color: index < rating ? '#000' : '#aaa' }]}>
        ★
      </Text>
    ));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: avatar }]} />
        <View style={styles.userInfo}>
          <Text style={styles.name}>{name}</Text>
          <View style={styles.rating}>
            {renderStars()}
          </View>
        </View>
      </View>
      <Text style={styles.reviewText}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Agdasima',
    letterSpacing: 0.5,
    color: '#000',
    flex: 1,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    fontSize: 12,
    marginRight: 2,
  },
  reviewText: {
    fontSize: 12,
    fontFamily: 'Agdasima',
    letterSpacing: 0.5,
    color: '#666',
    lineHeight: 16,
  },
});

export default ReviewCard;