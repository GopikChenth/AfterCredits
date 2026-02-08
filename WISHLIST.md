# AfterCredits - Wishlist & Future Enhancements

## Priority: High

### 1. Advanced Gesture Handling for CategoryPill

**Current Implementation**: FlatList with horizontal paging
**Enhancement**: Implement custom gesture handler for more fluid interactions

**Why upgrade?**

- ✅ More control over swipe animations
- ✅ Custom velocity-based transitions
- ✅ Diagonal swipe prevention
- ✅ Spring animations for bounce effect
- ✅ Haptic feedback on category change

**Implementation Details**:

```javascript
// Using react-native-gesture-handler + react-native-reanimated
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';

// Features:
- Custom swipe threshold (30% of width)
- Velocity detection (fast swipes skip to next category faster)
- Custom easing curves
- Parallax effects between categories
- Rubber-band edge bounce
```

**Dependencies Required**:

```bash
npx expo install react-native-gesture-handler
npx expo install react-native-reanimated
```

**Estimated Complexity**: Medium (4-6 hours)
**Priority**: Medium (current solution works well)

---

## Priority: Medium

### 2. Real-time Screen Orientation Support

- Detect portrait/landscape changes
- Adjust card columns (2 for portrait, 3-4 for landscape)
- Update navigation layout

### 3. Dark Mode Support

- Theme system with dark/light variants
- Per-page themes (anime: purple, movies: red, etc.)
- Respect system preferences

### 4. Skeleton Loading States

- Animated placeholders while loading API data
- Shimmer effect for cards
- Progressive image loading

### 5. Pull-to-Refresh

- Refresh anime list on pull down
- Custom animation matching app theme

### 6. Upgrade to MMKV Storage (Production Build Only)

**Current Implementation**: AsyncStorage (for Expo Go compatibility)
**Enhancement**: Switch to MMKV for production builds

**Why upgrade?**

- ✅ **60-100x faster** than AsyncStorage
- ✅ Synchronous operations (no async/await overhead)
- ✅ Lower memory footprint
- ✅ Built-in encryption support
- ✅ Type-safe APIs
- ✅ Battle-tested (used by Facebook/Meta)

**Performance Comparison**:

| Operation | AsyncStorage | MMKV   | Improvement |
| --------- | ------------ | ------ | ----------- |
| Read      | 3-5ms        | 0.05ms | **60-100x** |
| Write     | 5-10ms       | 0.1ms  | **50-100x** |

**Implementation Details**:

```javascript
// Current (AsyncStorage)
const settings = await getSettings(); // ~3-5ms

// Future (MMKV)
const settings = getSettings(); // ~0.05ms (synchronous!)
```

**Dependencies Required**:

```bash
npm install react-native-mmkv
npx expo prebuild  # Generate native code
```

**Requirements**:

- ⚠️ Requires native build (won't work in Expo Go)
- Must use `expo prebuild` or EAS Build
- Need to remove AsyncStorage and update all async calls to sync

**Estimated Complexity**: Low (2-3 hours - code already written, just needs native build)
**Priority**: Medium (only needed for production, AsyncStorage works fine for development)

**Note**: MMKV code is already implemented in `minor-changes` branch, just needs expo prebuild for native modules.

---

## Priority: Low

### 6. Advanced Animations

- Shared element transitions between screens
- Card flip animations for more details
- Parallax scrolling effects

### 7. Haptic Feedback

- Vibration on category change
- Tap feedback on cards
- Success/error haptics

### 8. Accessibility Improvements

- Screen reader support
- High contrast mode
- Larger text options

---

## Completed ✅

- [x] Responsive card layout with dynamic scaling
- [x] Masonry grid layout
- [x] Swipeable category pill (FlatList implementation)
- [x] Bottom navigation component
- [x] Pixel-perfect UI alignment

---

## Notes

- Keep implementations simple initially
- Add advanced features only when needed
- Prioritize performance over complex animations
- Follow systematic thinking approach (AG React Native.md)
