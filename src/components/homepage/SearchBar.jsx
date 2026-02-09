import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  Text,
  Platform,
  Keyboard,
  Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';

/**
 * SearchBar - Floating search bar with frosted glass effect
 * 
 * Features:
 * - Fully controlled component
 * - Keyboard-aware positioning
 * - Blur background effect
 * - Clean, efficient state management
 * - Proper keyboard persistence
 */
const SearchBar = ({ 
  theme = 'anime',
  placeholder = 'Search...',
  value = '',
  onChangeText,
  onCancel,
  onSubmit,
  style,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  // Handle text change
  const handleChangeText = useCallback((text) => {
    if (onChangeText) {
      onChangeText(text);
    }
  }, [onChangeText]);

  // Handle clear button
  const handleClear = useCallback(() => {
    if (onChangeText) {
      onChangeText('');
    }
    // Keep focus on input after clearing
    inputRef.current?.focus();
  }, [onChangeText]);

  // Handle submit (Enter key)
  const handleSubmit = useCallback(() => {
    if (onSubmit && value.trim().length > 0) {
      onSubmit(value);
    }
  }, [onSubmit, value]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    }
    setIsFocused(false);
  }, [onCancel]);

  // Render search input content
  const renderInputContent = () => (
    <View style={styles.searchWrapper}>
      {/* Search Icon */}
      <View style={styles.iconWrapper}>
        <Text style={styles.searchIcon}>🔍</Text>
      </View>

      {/* Input Field */}
      <TextInput
        ref={inputRef}
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="rgba(255, 255, 255, 0.5)"
        value={value}
        onChangeText={handleChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onSubmitEditing={handleSubmit}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        blurOnSubmit={false}
        keyboardType="default"
      />

      {/* Clear Button */}
      {value.length > 0 && (
        <TouchableOpacity 
          style={styles.clearButton}
          onPress={handleClear}
          activeOpacity={0.7}
        >
          <Text style={styles.clearIcon}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Render with blur effect
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.blurContainerWeb}>
          {renderInputContent()}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <BlurView intensity={80} tint="dark" style={styles.blurContainerNative}>
        {renderInputContent()}
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
      },
    }),
  },
  blurContainerWeb: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  },
  blurContainerNative: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  searchWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  iconWrapper: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchIcon: {
    fontSize: 20,
    color: '#fff',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    height: '100%',
    paddingVertical: 0,
    paddingHorizontal: 0,
    margin: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
      android: {
        textAlignVertical: 'center',
      },
    }),
  },
  clearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearIcon: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
  },
});

/**
 * KeyboardAwareSearchBar - Wrapper for keyboard-aware positioning
 * 
 * Features:
 * - Smooth keyboard animations
 * - Platform-specific timing
 * - Automatic position reset on mount
 * - Efficient listener management
 */
export const KeyboardAwareSearchBar = ({ 
  defaultBottom = 93,
  keyboardOffset = 16,
  ...props 
}) => {
  const bottomAnim = useRef(new Animated.Value(defaultBottom)).current;
  const keyboardListenersRef = useRef({ show: null, hide: null });

  useEffect(() => {
    // Reset position on mount/hot reload
    bottomAnim.setValue(defaultBottom);
    
    const keyboardShowEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const keyboardHideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    // Keyboard show handler
    const handleKeyboardShow = (event) => {
      const keyboardHeight = event.endCoordinates.height;
      const targetPosition = keyboardHeight + keyboardOffset;
      
      Animated.timing(bottomAnim, {
        toValue: targetPosition,
        duration: Platform.OS === 'ios' ? 250 : 100,
        useNativeDriver: false,
      }).start();
    };

    // Keyboard hide handler
    const handleKeyboardHide = () => {
      Animated.timing(bottomAnim, {
        toValue: defaultBottom,
        duration: Platform.OS === 'ios' ? 250 : 100,
        useNativeDriver: false,
      }).start();
    };

    // Add listeners
    keyboardListenersRef.current.show = Keyboard.addListener(keyboardShowEvent, handleKeyboardShow);
    keyboardListenersRef.current.hide = Keyboard.addListener(keyboardHideEvent, handleKeyboardHide);

    // Cleanup
    return () => {
      keyboardListenersRef.current.show?.remove();
      keyboardListenersRef.current.hide?.remove();
    };
  }, [defaultBottom, keyboardOffset, bottomAnim]);

  return (
    <Animated.View style={[styles.keyboardAwareContainer, { bottom: bottomAnim }]}>
      <SearchBar {...props} />
    </Animated.View>
  );
};

const keyboardAwareStyles = StyleSheet.create({
  keyboardAwareContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 100, // Higher than overlay backdrop (9) and overlay content (10)
  },
});

// Merge styles
Object.assign(styles, keyboardAwareStyles);

export default SearchBar;
