import React, { useState, useEffect, useRef } from 'react';
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
 * SearchBar - Floating overlay search bar with frosted glass effect
 * Features: theme-aware, blur background, search icon, cancel button
 * Uses BlurView for mobile, CSS backdrop-filter for web
 */
const SearchBar = ({ 
  theme = 'anime',
  placeholder = 'Search...',
  onChangeText,
  onCancel,
  style,
}) => {
  const [searchText, setSearchText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  const handleChangeText = (text) => {
    setSearchText(text);
    if (onChangeText) {
      onChangeText(text);
    }
  };

  const handleCancel = () => {
    setSearchText('');
    setIsFocused(false);
    if (onCancel) {
      onCancel();
    }
  };

  const handleClear = () => {
    setSearchText('');
    if (onChangeText) {
      onChangeText('');
    }
  };

  // Content to render inside the blur container
  const inputContent = (
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
        value={searchText}
        onChangeText={handleChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        autoCapitalize="none"
        autoCorrect={false}
      />

      {/* Clear Button (shows when there's text) */}
      {searchText.length > 0 && (
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

  // Render based on platform - no pointerEvents anywhere
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.blurContainerWeb}>
          {inputContent}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <BlurView intensity={80} tint="dark" style={styles.blurContainerNative}>
        {inputContent}
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
        outline: 'none', // Remove web focus outline
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
    borderWidth: 0, // No borders
  },
  blurContainerNative: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 0, // No borders
  },
  searchWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
    borderWidth: 0, // No borders
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
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
});

/**
 * KeyboardAwareSearchBar - Wrapper that handles keyboard positioning
 * Uses Animated.Value and actual keyboard height for positioning
 */
export const KeyboardAwareSearchBar = ({ 
  defaultBottom = 93, // Default position above NavBar
  keyboardOffset = 16, // Offset above the keyboard
  ...props 
}) => {
  const bottomAnim = useRef(new Animated.Value(defaultBottom)).current;

  useEffect(() => {
    const keyboardShowEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const keyboardHideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(keyboardShowEvent, (event) => {
      // Get keyboard height and position SearchBar above it
      const keyboardHeight = event.endCoordinates.height;
      Animated.timing(bottomAnim, {
        toValue: keyboardHeight + keyboardOffset,
        duration: Platform.OS === 'ios' ? 250 : 100,
        useNativeDriver: false,
      }).start();
    });

    const hideSub = Keyboard.addListener(keyboardHideEvent, () => {
      Animated.timing(bottomAnim, {
        toValue: defaultBottom,
        duration: Platform.OS === 'ios' ? 250 : 100,
        useNativeDriver: false,
      }).start();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [defaultBottom, keyboardOffset]);

  return (
    <Animated.View style={{
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: bottomAnim,
      paddingHorizontal: 16,
      zIndex: 10,
    }}>
      <SearchBar {...props} />
    </Animated.View>
  );
};

export default SearchBar;
