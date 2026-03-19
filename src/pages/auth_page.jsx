import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput,
  Pressable,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getMediaTheme } from '../utils/mediaThemes';
import { 
  signUp, 
  signIn, 
  signInWithGoogle, 
  signInWithApple, 
  signInWithFacebook,
  checkUsernameAvailability 
} from '../services/auth';
import { useProfileStore } from '../stores/useProfileStore';

const AuthPage = ({ navigation }) => {
  const theme = getMediaTheme('anime');
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const fetchProfile = useProfileStore((state) => state.fetchProfile);

  // Handle Login
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    const result = await signIn(email, password);
    setLoading(false);

    if (result.success) {
      await fetchProfile({ force: true });
      Alert.alert('Success', 'Logged in successfully!');
      navigation.goBack();
    } else {
      Alert.alert('Login Failed', result.error);
    }
  };

  // Handle Sign Up
  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword || !username) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (username.length < 2) {
      Alert.alert('Error', 'Name must be at least 2 characters');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    // Check if callsign (displayName) is available (if provided)
    if (displayName && displayName.trim()) {
      const availabilityCheck = await checkUsernameAvailability(displayName);
      
      if (!availabilityCheck.available) {
        setLoading(false);
        Alert.alert('Callsign Taken', 'This callsign is already taken. Please choose another one.');
        return;
      }
    }

    // Proceed with signup
    const result = await signUp(email, password, username, displayName);
    setLoading(false);

    if (result.success) {
      Alert.alert('Success', 'Account created successfully!');
      setIsLogin(true);
    } else {
      Alert.alert('Sign Up Failed', result.error);
    }
  };

  // Handle Social Login
  const handleSocialLogin = async (provider) => {
    setLoading(true);
    let result;
    
    if (provider === 'google') {
      result = await signInWithGoogle();
    } else if (provider === 'apple') {
      result = await signInWithApple();
    } else if (provider === 'facebook') {
      result = await signInWithFacebook();
    }

    setLoading(false);

    if (result.success) {
      await fetchProfile({ force: true });
      Alert.alert('Success', `Logged in with ${provider}!`);
      navigation.goBack();
    } else {
      Alert.alert('Login Failed', result.error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0B10" />
      <LinearGradient
        colors={['#0B0B10', '#141421', '#0B0B10']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.bgGlowOne} />
      <View style={styles.bgGlowTwo} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          bounces={false}
        >
          {/* Logo/Header */}
          <View style={styles.header}>
            <Text style={styles.logo}>AfterCredits</Text>
            <Text style={styles.tagline}>Track your entertainment journey</Text>
          </View>

          <View style={styles.authCard}>
            {/* Toggle Tabs */}
            <View style={styles.tabContainer}>
              <Pressable 
                style={[styles.tab, isLogin && [styles.activeTab, { backgroundColor: theme.accent }]]}
                onPress={() => setIsLogin(true)}
              >
                <Text style={[styles.tabText, isLogin && styles.activeTabText]}>
                  Login
                </Text>
              </Pressable>
              <Pressable 
                style={[styles.tab, !isLogin && [styles.activeTab, { backgroundColor: theme.accent }]]}
                onPress={() => setIsLogin(false)}
              >
                <Text style={[styles.tabText, !isLogin && styles.activeTabText]}>
                  Sign Up
                </Text>
              </Pressable>
            </View>

            {/* Form */}
            <View style={styles.form}>
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="#999" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Username Input (Sign Up only) - NOW ASKS FOR REAL NAME */}
            {!isLogin && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Name</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={20} color="#999" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Your real name"
                    placeholderTextColor="#999"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="words"
                  />
                </View>
                <Text style={styles.hintText}>This will be shown publicly (e.g., "John Doe")</Text>
              </View>
            )}

            {/* Display Name Input (Sign Up only) - NOW ASKS FOR CALLSIGN */}
            {!isLogin && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Callsign (Optional)</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="radio-outline" size={20} color="#999" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Cool callsign (optional)"
                    placeholderTextColor="#999"
                    value={displayName}
                    onChangeText={setDisplayName}
                    autoCapitalize="none"
                  />
                </View>
                <Text style={styles.hintText}>Choose this to stay anonymous (e.g., "Maverick")</Text>
              </View>
            )}

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons 
                    name={showPassword ? "eye-outline" : "eye-off-outline"} 
                    size={20} 
                    color="#999" 
                  />
                </Pressable>
              </View>
            </View>

            {/* Confirm Password (Sign Up only) */}
            {!isLogin && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm your password"
                    placeholderTextColor="#999"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                </View>
              </View>
            )}

            {/* Forgot Password (Login only) */}
            {isLogin && (
              <Pressable style={styles.forgotPassword}>
                <Text style={[styles.forgotPasswordText, { color: theme.accent }]}>
                  Forgot Password?
                </Text>
              </Pressable>
            )}

            {/* Submit Button */}
            <Pressable 
              style={[styles.submitButton, { backgroundColor: theme.accent }]}
              onPress={isLogin ? handleLogin : handleSignUp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {isLogin ? 'Login' : 'Sign Up'}
                </Text>
              )}
            </Pressable>

            {/* OAuth buttons temporarily hidden - requires additional setup */}
            {/* 
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialButtons}>
              <Pressable 
                style={styles.socialButton}
                onPress={() => handleSocialLogin('google')}
                disabled={loading}
              >
                <Ionicons name="logo-google" size={24} color="#DB4437" />
              </Pressable>
              <Pressable 
                style={styles.socialButton}
                onPress={() => handleSocialLogin('apple')}
                disabled={loading}
              >
                <Ionicons name="logo-apple" size={24} color="#000" />
              </Pressable>
              <Pressable 
                style={styles.socialButton}
                onPress={() => handleSocialLogin('facebook')}
                disabled={loading}
              >
                <Ionicons name="logo-facebook" size={24} color="#4267B2" />
              </Pressable>
            </View>
            */}

            {/* Terms & Privacy (Sign Up only) */}
            {!isLogin && (
              <Text style={styles.termsText}>
                By signing up, you agree to our{' '}
                <Text style={[styles.link, { color: theme.accent }]}>Terms of Service</Text>
                {' '}and{' '}
                <Text style={[styles.link, { color: theme.accent }]}>Privacy Policy</Text>
              </Text>
            )}
            </View>
          </View>

          {/* Bottom Spacing */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B10',
  },
  bgGlowOne: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#A78BFA',
    opacity: 0.12,
  },
  bgGlowTwo: {
    position: 'absolute',
    bottom: -100,
    left: -40,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#6EE7B7',
    opacity: 0.08,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 24,
  },
  logo: {
    fontSize: 34,
    fontFamily: 'Genjiro',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 14,
    color: '#9AA0B4',
    fontFamily: 'Agdasima',
  },
  authCard: {
    backgroundColor: 'rgba(20, 20, 33, 0.92)',
    borderRadius: 20,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.25)',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 6,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#11131C',
    borderRadius: 16,
    borderCurve: 'continuous',
    padding: 4,
    marginBottom: 22,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    borderCurve: 'continuous',
  },
  activeTab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Agdasima',
    letterSpacing: 1.5,
    color: '#8D93A8',
  },
  activeTabText: {
    color: '#0B0B10',
    fontFamily: 'Agdasima-Bold',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Agdasima-Bold',
    color: '#E6E8F0',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#11131C',
    borderRadius: 14,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: '#24273A',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Agdasima',
  },
  hintText: {
    fontSize: 12,
    color: '#8C91A8',
    marginTop: 6,
    fontFamily: 'Agdasima',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontFamily: 'Agdasima-Bold',
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 14,
    borderCurve: 'continuous',
    alignItems: 'center',
    marginBottom: 24,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Agdasima-Bold',
    letterSpacing: 1,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#999',
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderCurve: 'continuous',
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  termsText: {
    fontSize: 12,
    color: '#8C91A8',
    textAlign: 'center',
    lineHeight: 18,
    fontFamily: 'Agdasima',
  },
  link: {
    fontWeight: '600',
  },
});

export default AuthPage;
