import React from 'react';
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CrewMember = ({ name, role, avatar, image, characterImage, characterName, onPress }) => {
  const Container = onPress ? Pressable : View;
  const containerProps = onPress ? { onPress, style: ({ pressed }) => [styles.container, pressed && styles.pressed] } : { style: styles.container };

  return (
    <Container {...containerProps}>
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
      {characterImage && (
        <Image 
          source={{ uri: characterImage }} 
          style={styles.characterAvatar}
        />
      )}
      {onPress && (
        <Ionicons name="chevron-forward" size={16} color="#555" style={styles.chevron} />
      )}
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRadius: 8,
    borderCurve: 'continuous',
  },
  pressed: {
    backgroundColor: 'rgba(255, 179, 198, 0.1)',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderCurve: 'continuous',
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
  characterAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderCurve: 'continuous',
    marginLeft: 10,
  },
  chevron: {
    marginLeft: 6,
  },
});

export default CrewMember;