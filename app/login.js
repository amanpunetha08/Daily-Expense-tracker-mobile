import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '../lib/auth';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = '1047002583869-88qg66d397r239kmj6ffr1gfgqjg4vc6.apps.googleusercontent.com';

export default function Login() {
  const { loginWithEmail, register, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [, googleResponse, promptGoogle] = Google.useAuthRequest({ clientId: GOOGLE_CLIENT_ID });

  const handleEmailAuth = async () => {
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await register(name, email, password);
      } else {
        await loginWithEmail(email, password);
      }
      router.replace('/');
    } catch (e) {
      setError(e.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await promptGoogle();
      if (result?.type === 'success') {
        await loginWithGoogle(result.authentication.accessToken);
        router.replace('/');
      }
    } catch (e) {
      setError(e.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.card}>
        <Text style={styles.title}>{isRegister ? 'Create Account' : 'Sign In'}</Text>

        {!!error && <Text style={styles.error}>{error}</Text>}

        {isRegister && (
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={name}
            onChangeText={setName}
            placeholderTextColor="#9ca3af"
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholderTextColor="#9ca3af"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor="#9ca3af"
        />

        <TouchableOpacity style={styles.primaryBtn} onPress={handleEmailAuth} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryBtnText}>{isRegister ? 'Register' : 'Sign In'}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleSignIn} disabled={loading}>
          <Text style={styles.googleBtnText}>Sign in with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => { setIsRegister(!isRegister); setError(''); }}>
          <Text style={styles.toggleText}>
            {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 24, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  title: { fontSize: 24, fontWeight: '700', color: '#1f2937', textAlign: 'center', marginBottom: 20 },
  error: { color: '#dc2626', textAlign: 'center', marginBottom: 12, fontSize: 14 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 12, color: '#1f2937', backgroundColor: '#f9fafb' },
  primaryBtn: { backgroundColor: '#4f46e5', borderRadius: 8, padding: 14, alignItems: 'center', marginBottom: 12 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  googleBtn: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 14, alignItems: 'center', marginBottom: 16 },
  googleBtnText: { color: '#1f2937', fontSize: 16, fontWeight: '500' },
  toggleText: { color: '#4f46e5', textAlign: 'center', fontSize: 14 },
});
