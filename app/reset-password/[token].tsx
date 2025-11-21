import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

const API_URL = 'http://localhost:3000';

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const token = (params?.token as string) || '';

  const [email, setEmail] = useState('');
  const [emailPrefilled, setEmailPrefilled] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    // If token was passed in the route we try to verify it and prefill the email
    if (!token) {
      setError('Missing reset token. Please use the link from your email.');
      return;
    }

    let mounted = true;
    const fetchEmail = async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/verify-reset?token=${encodeURIComponent(token)}`);
        const data = await res.json().catch(() => ({}));
        if (!mounted) return;
        if (!res.ok) {
          setError(data.error || 'Invalid or expired token');
          return;
        }
        if (data.email) {
          setEmail(data.email);
          setEmailPrefilled(true);
        }
      } catch (err) {
        if (!mounted) return;
        console.error('Error verifying reset token', err);
        setError('Could not verify reset token');
      }
    };

    fetchEmail();
    return () => { mounted = false; };
  }, [token]);

  const onSubmit = async () => {
    setError(null);
    setSuccess(null);
    if (!token) { setError('Missing token.'); return; }
    if (!email) { setError('Please enter your email.'); return; }
    if (!password || !confirm) { setError('Please enter and confirm your new password.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 6) { setError('Password should be at least 6 characters.'); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email, newPassword: password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || data.message || 'Failed to reset password');
      } else {
        setSuccess(data.message || 'Password has been reset. Redirecting to login...');
        // short delay so user sees message
        setTimeout(() => router.replace('/login'), 1800);
      }
    } catch (err) {
      setError('Could not contact server');
      console.error('Reset password error', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: '#0b2b52' }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.header}>
          <Text style={styles.appTitle}>Reset Password</Text>
          <Text style={styles.subtitle}>Enter the email you used and choose a new password.</Text>
        </View>

        <View style={styles.sheet}>
          <View style={styles.inputRow}>
            <TextInput
              placeholder="Email"
              placeholderTextColor="#96a0b4"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!emailPrefilled}
            />
          </View>

          <View style={styles.inputRow}>
            <TextInput placeholder="New password" placeholderTextColor="#96a0b4" value={password} onChangeText={setPassword} style={styles.input} secureTextEntry />
          </View>

          <View style={styles.inputRow}>
            <TextInput placeholder="Confirm password" placeholderTextColor="#96a0b4" value={confirm} onChangeText={setConfirm} style={styles.input} secureTextEntry />
          </View>

          {error ? (
            <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>
          ) : null}

          {success ? (
            <View style={styles.successBox}><Text style={styles.successText}>{success}</Text></View>
          ) : null}

          <TouchableOpacity style={[styles.loginBtn, loading && { opacity: 0.7 }]} onPress={onSubmit} disabled={loading}>
            <Text style={styles.loginText}>{loading ? 'Working...' : 'Reset Password'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={{ marginTop: 12 }} onPress={() => router.replace('/login')}>
            <Text style={{ color: '#6d7486' }}>Back to Login</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 28, paddingHorizontal: 22, backgroundColor: '#0b2b52', alignItems: 'center' },
  appTitle: { marginTop: 10, fontSize: 28, fontWeight: '800', color: '#F4C430', letterSpacing: 2 },
  subtitle: { color: '#c6d3e6', marginTop: 8, textAlign: 'center', paddingHorizontal: 12 },
  sheet: { flexGrow: 1, backgroundColor: '#fff', marginTop: 16, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 20, paddingBottom: 34, alignItems: 'center' },
  inputRow: { width: '86%', flexDirection: 'row', alignItems: 'center', borderColor: '#4b5a79', borderWidth: 1.2, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 28, marginTop: 12, backgroundColor: '#fff' },
  input: { flex: 1, fontSize: 15, color: '#222' },
  loginBtn: { width: '86%', marginTop: 18, backgroundColor: '#0b2b52', paddingVertical: 14, borderRadius: 24, alignItems: 'center', borderWidth: 2, borderColor: '#e7ecf6' },
  loginText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  errorBox: { marginTop: 12, width: '86%', padding: 10, backgroundColor: '#ffecec', borderRadius: 10 },
  errorText: { color: '#9b2c2c' },
  successBox: { marginTop: 12, width: '86%', padding: 10, backgroundColor: '#eef6ff', borderRadius: 10 },
  successText: { color: '#173B65' },
});
