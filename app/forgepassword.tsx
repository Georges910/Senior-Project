import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

const API_URL = 'http://192.168.10.249:5000';


export default function ForgePassword() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [email, setEmail] = useState(params.email as string || '');
  const [loading, setLoading] = useState(false);
  const [sentMessage, setSentMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Automatically send reset email when email is provided via params
  useEffect(() => {
    if (params.email && !sentMessage && !loading) {
      requestReset();
    }
  }, []); // Run only once on mount

  const requestReset = async () => {
    if (!email) { setErrorMessage('Please enter your email to receive reset instructions.'); return; }
    try {
      setErrorMessage(null);
      setSentMessage(null);
      setLoading(true);
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.error || 'Failed to request password reset';
        setErrorMessage(msg);
        return;
      }
      if (data.token) {
        // In dev, server returns token for convenience
        setSentMessage(`Reset token (dev): ${data.token}`);
      } else {
        setSentMessage(`If an account exists for ${email}, a password reset email has been sent.`);
      }
    } catch (err) {
      console.error('Forgot password error', err);
      setErrorMessage('Could not contact server');
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: '#0b2b52' }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.header}>
          <View style={styles.illustrationWrap}>
            <Image
              source={require('../Images/Logo.png')}
              style={{ width: 180, height: 180 }}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.appTitle}>Ekklesia</Text>
        </View>

        <View style={styles.sheet}>
          <View style={styles.inputRow}>
            <Ionicons name="person-outline" size={18} color="#58617a" style={styles.leftIcon} />
            <TextInput
              placeholder="Email"
              placeholderTextColor="#96a0b4"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[styles.loginBtn, (loading || !!sentMessage) && { opacity: 0.7 }]}
            onPress={requestReset}
            disabled={loading || !!sentMessage}
          >
            <Text style={styles.loginText}>{loading ? 'Sending...' : (sentMessage ? 'Sent' : 'Send Reset Email')}</Text>
          </TouchableOpacity>

          {sentMessage ? (
            <View style={{ marginTop: 16, width: '86%', padding: 12, backgroundColor: '#eef6ff', borderRadius: 10 }}>
              <Text style={{ color: '#173B65' }}>{sentMessage}</Text>
            </View>
          ) : null}

          {errorMessage ? (
            <View style={{ marginTop: 12, width: '86%', padding: 12, backgroundColor: '#ffecec', borderRadius: 10 }}>
              <Text style={{ color: '#9b2c2c' }}>{errorMessage}</Text>
            </View>
          ) : null}

          <TouchableOpacity style={{ marginTop: 12 }} onPress={() => router.replace('/login')}>
            <Text style={{ color: '#6d7486' }}>Back to Login</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 28,
    paddingHorizontal: 22,
    backgroundColor: '#0b2b52',
    alignItems: 'center',
  },
  illustrationWrap: { alignItems: 'center', marginTop: 8 },
  appTitle: {
    marginTop: 10,
    fontSize: 36,
    fontWeight: '800',
    color: '#F4C430',
    letterSpacing: 3,
    marginBottom: 20,
  },
  sheet: {
    flexGrow: 1,
    backgroundColor: '#fff',
    marginTop: 16,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingTop: 18,
    paddingBottom: 34,
    alignItems: 'center',
  },
  inputRow: {
    width: '86%',
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#4b5a79',
    borderWidth: 1.2,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 28,
    marginTop: 12,
    backgroundColor: '#fff',
  },
  leftIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 15, color: '#222' },
  forgot: { fontSize: 12, color: '#6d7486' },
  loginBtn: {
    width: '86%',
    marginTop: 18,
    backgroundColor: '#0b2b52',
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e7ecf6',
  },
  loginText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
