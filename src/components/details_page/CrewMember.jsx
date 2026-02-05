import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

const CrewMember = ({ name, role, avatar, image }) => {
  return (
    <View style={styles.container}>
      {image ? (
        <Image 
          source={{ uri: image }} 
          style={styles.avatar}
        />
      ) : (
        <View style={[styles.avatar, { backgroundColor: avatar || '#666' }]} />
      )}
      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.role}>{role}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 10,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Agdasima',
    letterSpacing: 0.5,
    color: '#ffffffff',
  },
  role: {
    fontSize: 12,
    fontFamily: 'Agdasima',
    letterSpacing: 0.5,
    color: '#838383ff',
  },
});

export default CrewMember;