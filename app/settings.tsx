import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, ThemeMode } from '@/app/context/ThemeContext';
import { setApiUrl, getApiUrl, API_CONFIG } from '@/app/config/api';

export default function SettingsScreen() {
  const { colors, theme, themeMode, setThemeMode } = useTheme();
  const [apiUrl, setApiUrlState] = useState('');
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);

  useEffect(() => {
    loadApiUrl();
  }, []);

  const loadApiUrl = async () => {
    try {
      const url = await getApiUrl();
      setApiUrlState(url);
    } catch (error) {
      console.error('Error loading API URL:', error);
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setTestStatus(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${apiUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        setTestStatus('✅ Connected successfully!');
        Alert.alert('Success', `Server is reachable!\nEnvironment: ${data.env || 'unknown'}`);
      } else {
        setTestStatus('❌ Server responded with error');
        Alert.alert('Error', `Server returned status: ${response.status}`);
      }
    } catch (error) {
      setTestStatus('❌ Failed to connect');
      Alert.alert(
        'Connection Failed',
        `Could not reach ${apiUrl}\n\nMake sure backend is running`
      );
    } finally {
      setTesting(false);
    }
  };

  const saveApiUrl = async () => {
    if (!apiUrl.trim()) {
      Alert.alert('Error', 'Please enter a valid API URL');
      return;
    }

    try {
      await setApiUrl(apiUrl);
      Alert.alert('Success', 'API URL saved! Restart the app.');
    } catch (error) {
      Alert.alert('Error', 'Failed to save API URL');
    }
  };

  const resetToDefault = async () => {
    Alert.alert(
      'Reset to Default?',
      `Default: ${API_CONFIG.DEFAULT_API_URL}`,
      [
        { text: 'Cancel' },
        {
          text: 'Reset',
          onPress: async () => {
            await setApiUrl(API_CONFIG.DEFAULT_API_URL);
            setApiUrlState(API_CONFIG.DEFAULT_API_URL);
            Alert.alert('Success', 'Reset to default. Restart the app.');
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const themeOptions: { label: string; value: ThemeMode; icon: string }[] = [
    { label: 'Light', value: 'light', icon: 'sunny' },
    { label: 'Dark', value: 'dark', icon: 'moon' },
    { label: 'Auto', value: 'auto', icon: 'phone-portrait' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Ionicons name="settings" size={32} color={colors.accent} />
        <Text style={[styles.title, { color: colors.textInverse }]}>Settings</Text>
      </View>

      {/* Theme Section */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          <Ionicons name="color-palette" size={18} color={colors.primary} /> Appearance
        </Text>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Theme Mode</Text>
        
        <View style={styles.themeOptions}>
          {themeOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.themeOption,
                {
                  backgroundColor: themeMode === option.value ? colors.primary : colors.backgroundSecondary,
                  borderColor: themeMode === option.value ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setThemeMode(option.value)}
            >
              <Ionicons
                name={option.icon as any}
                size={24}
                color={themeMode === option.value ? colors.textInverse : colors.icon}
              />
              <Text
                style={[
                  styles.themeOptionText,
                  {
                    color: themeMode === option.value ? colors.textInverse : colors.text,
                  },
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={[styles.hint, { color: colors.textMuted }]}>
          Current: {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
        </Text>
      </View>

      {/* Backend Section */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          <Ionicons name="server" size={18} color={colors.primary} /> Backend Configuration
        </Text>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Backend URL</Text>
        <TextInput
          style={[
            styles.input,
            {
              borderColor: colors.inputBorder,
              backgroundColor: colors.inputBackground,
              color: colors.text,
            },
          ]}
          placeholder="http://192.168.x.x:3001"
          placeholderTextColor={colors.placeholder}
          value={apiUrl}
          onChangeText={setApiUrlState}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text style={[styles.hint, { color: colors.textMuted }]}>Format: http://YOUR_IP:3001</Text>
      </View>

      {/* Actions Section */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.info }]}
          onPress={testConnection}
          disabled={testing}
        >
          {testing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.buttonText}>Test Connection</Text>
            </>
          )}
        </TouchableOpacity>

        {testStatus && (
          <Text
            style={[
              styles.statusText,
              { color: testStatus.includes('❌') ? colors.error : colors.success },
            ]}
          >
            {testStatus}
          </Text>
        )}
      </View>

      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.success }]}
          onPress={saveApiUrl}
        >
          <Ionicons name="save" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.buttonText}>Save Configuration</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.error }]}
          onPress={resetToDefault}
        >
          <Ionicons name="refresh" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.buttonText}>Reset to Default</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.currentUrl, { color: colors.textMuted }]}>
          Current URL: {apiUrl || 'Not set'}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 24, alignItems: 'center', paddingTop: 48 },
  title: { fontSize: 28, fontWeight: 'bold', marginTop: 12 },
  section: { margin: 16, padding: 20, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 12 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 15, marginBottom: 8 },
  hint: { fontSize: 12, marginTop: 4, fontStyle: 'italic' },
  themeOptions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  themeOption: { flex: 1, alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 2 },
  themeOptionText: { fontSize: 13, fontWeight: '600', marginTop: 8 },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 2 },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  statusText: { fontSize: 14, textAlign: 'center', marginTop: 12, fontWeight: '600' },
  footer: { padding: 24, alignItems: 'center' },
  currentUrl: { fontSize: 13, marginBottom: 40, textAlign: 'center' },
});
