import React, { useState, useRef } from 'react';
import { View, Pressable, Text, StyleSheet, Animated, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const STATUS_OPTIONS = [
  { key: null, label: 'Set Status', icon: 'add-circle-outline', bg: 'rgba(255,255,255,0.1)', border: 'rgba(255,255,255,0.2)', text: '#fff' },
  { key: 'watching', label: 'Watching', icon: 'eye', bg: '#FFF3B0', border: '#F0E68C', text: '#7A6B00' },
  { key: 'watched', label: 'Watched', icon: 'checkmark-circle', bg: '#B5EAD7', border: '#8FD4B4', text: '#1B6B3A' },
  { key: 'dropped', label: 'Dropped', icon: 'close-circle', bg: '#FFB5B5', border: '#F09090', text: '#8B1A1A' },
];

/**
 * StatusTag - A single cycling status pill + wishlist pill
 * @param {string} status - Current status ('watching' | 'watched' | 'dropped' | null)
 * @param {boolean} isWishlisted - Whether item is in wishlist
 * @param {function} onStatusChange - Callback when status changes
 * @param {function} onWishlistToggle - Callback when wishlist is toggled
 */
const StatusTag = ({ status, isWishlisted, onStatusChange, onWishlistToggle }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const currentStatus = STATUS_OPTIONS.find(s => s.key === status) || STATUS_OPTIONS[0];

  const handleStatusSelect = (key) => {
    // Animate press
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.92, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();

    setShowDropdown(false);
    onStatusChange(key);

    // Auto-remove from wishlist when marked as watched
    if (key === 'watched' && isWishlisted) {
      onWishlistToggle(false);
    }
  };

  const handleWishlistPress = () => {
    onWishlistToggle(!isWishlisted);
  };

  return (
    <View style={styles.wrapper}>
      {/* Status Pill */}
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Pressable
          style={[
            styles.pill,
            { backgroundColor: currentStatus.bg, borderColor: currentStatus.border },
          ]}
          onPress={() => setShowDropdown(true)}
        >
          <Ionicons name={currentStatus.icon} size={18} color={currentStatus.text} />
          <Text style={[styles.pillLabel, { color: currentStatus.text }]}>
            {currentStatus.label}
          </Text>
          <Ionicons name="chevron-down" size={14} color={currentStatus.text} style={{ marginLeft: 2 }} />
        </Pressable>
      </Animated.View>

      {/* Wishlist Pill */}
      <Pressable
        style={[
          styles.pill,
          isWishlisted
            ? { backgroundColor: '#D4BBFF', borderColor: '#B89AE8' }
            : { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)' },
        ]}
        onPress={handleWishlistPress}
      >
        <Ionicons
          name={isWishlisted ? 'bookmark' : 'bookmark-outline'}
          size={18}
          color={isWishlisted ? '#5B2D8E' : '#fff'}
        />
        <Text style={[styles.pillLabel, { color: isWishlisted ? '#5B2D8E' : '#fff' }]}>
          Wishlist
        </Text>
      </Pressable>

      {/* Dropdown Modal */}
      <Modal
        visible={showDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDropdown(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setShowDropdown(false)}>
          <View style={styles.dropdown}>
            <Text style={styles.dropdownTitle}>Set Status</Text>
            {STATUS_OPTIONS.filter(s => s.key !== null).map((option) => (
              <Pressable
                key={option.key}
                style={[
                  styles.dropdownItem,
                  { backgroundColor: option.bg, borderColor: option.border },
                  status === option.key && styles.dropdownItemActive,
                ]}
                onPress={() => handleStatusSelect(option.key)}
              >
                <Ionicons name={option.icon} size={20} color={option.text} />
                <Text style={[styles.dropdownItemLabel, { color: option.text }]}>
                  {option.label}
                </Text>
                {status === option.key && (
                  <Ionicons name="checkmark" size={18} color={option.text} style={{ marginLeft: 'auto' }} />
                )}
              </Pressable>
            ))}

            {/* Clear status option */}
            {status && (
              <Pressable
                style={[styles.dropdownItem, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.15)' }]}
                onPress={() => handleStatusSelect(null)}
              >
                <Ionicons name="remove-circle-outline" size={20} color="#aaa" />
                <Text style={[styles.dropdownItemLabel, { color: '#aaa' }]}>Clear Status</Text>
              </Pressable>
            )}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1.5,
    gap: 6,
    minWidth: 110,
  },
  pillLabel: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Agdasima',
    letterSpacing: 0.5,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdown: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 16,
    width: 260,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  dropdownTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Agdasima',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: 1,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 10,
  },
  dropdownItemActive: {
    borderWidth: 2.5,
  },
  dropdownItemLabel: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Agdasima',
    letterSpacing: 0.5,
  },
});

export default StatusTag;