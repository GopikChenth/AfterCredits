import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ReviewCard = ({ name, rating, text, avatar }) => {
  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => (
      <Text key={index} style={[styles.star, { color: index < rating ? '#FFB3C6' : '#444' }]}>
        ★
      </Text>
    ));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {avatar ? (
          <Image source={{ uri: avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Ionicons name="person" size={16} color="#666" />
          </View>
        )}
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
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
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
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  avatarFallback: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: 12,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
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
    color: '#fff',
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
    color: '#999',
    lineHeight: 16,
  },
});

export default ReviewCard;