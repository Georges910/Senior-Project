import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ScrollView
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
const API_URL = "http://localhost:3000"



export default function SignupScreen() {
  const [fullName, setFullName] = useState('');
  const [parish, setParish] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [retype, setRetype] = useState('');
  const [agree, setAgree] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function validateEmail(e: string) {
    const re = /\S+@\S+\.\S+/;
    return re.test(e);
  }

  async function onSignUp() {
    if (!fullName.trim() || !parish.trim() || !email.trim() || !password || !retype) {
      Alert.alert('Validation', 'Please fill all fields.');
      return;
    }
    if (!validateEmail(email)) {
      Alert.alert('Validation', 'Please enter a valid email.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Validation', 'Password must be at least 6 characters.');
      return;
    }
    if (password !== retype) {
      Alert.alert('Validation', "Passwords don't match.");
      return;
    }
    if (!agree) {
      Alert.alert('Terms', 'You must agree to the Terms & Privacy.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ fullName, parish, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Signup failed');
      Alert.alert('Success', 'Account created.');

    // Navigate to Home page
    router.push("/home");
      // optionally navigate to Sign in screen or clear fields
      setFullName(''); setParish(''); setEmail(''); setPassword(''); setRetype(''); setAgree(false);
    } catch (err) {
      if (err instanceof Error) {
    Alert.alert('Error', err.message);
  } else {
    Alert.alert('Error', String(err));
  }
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{flex:1}}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.cardHeader}>
          <Text style={styles.smallTop}>Let's</Text>
          <Text style={styles.title}>Create{"\n"}Your{"\n"}Account</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputWrap}>
            <Ionicons name="person-outline" size={18} color="#58617a" style={styles.icon} />
            <TextInput
              placeholder="Full Name"
              placeholderTextColor="#96a0b4"
              value={fullName}
              onChangeText={setFullName}
              style={styles.input}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputWrap}>
            <MaterialCommunityIcons name="church" size={18} color="#58617a" style={styles.icon} />
            <TextInput
              placeholder="Your Parish"
              placeholderTextColor="#96a0b4"
              value={parish}
              onChangeText={setParish}
              style={styles.input}
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputWrap}>
            <Ionicons name="mail-outline" size={18} color="#58617a" style={styles.icon} />
            <TextInput
              placeholder="Email Address"
              placeholderTextColor="#96a0b4"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} color="#58617a" style={styles.icon} />
            <TextInput
              placeholder="Password"
              placeholderTextColor="#96a0b4"
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              secureTextEntry={!showPass}
              returnKeyType="next"
            />
            <TouchableOpacity onPress={() => setShowPass(s => !s)} style={{padding:8}}>
              <Ionicons name={showPass ? 'eye-off' : 'eye'} size={18} color="#58617a" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} color="#58617a" style={styles.icon} />
            <TextInput
              placeholder="Retype Password"
              placeholderTextColor="#96a0b4"
              value={retype}
              onChangeText={setRetype}
              style={styles.input}
              secureTextEntry={!showPass}
              returnKeyType="done"
            />
          </View>

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setAgree(a => !a)}
          >
            <View style={[styles.checkbox, agree && styles.checkboxChecked]}>
              {agree && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text style={styles.tinyText}>I agree to the </Text>
            <TouchableOpacity><Text style={[styles.tinyText, styles.linkText]}>Terms & Privacy</Text></TouchableOpacity>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.signBtn, loading && {opacity:0.7}]}
            onPress={onSignUp}
            disabled={loading}
          >
            <Text style={styles.signBtnText}>{loading ? 'Signing up...' : 'Sign Up'}</Text>
          </TouchableOpacity>

          <View style={{flexDirection:'row', justifyContent:'center', marginTop:12}}>
            <Text style={styles.smallGrey}>Have an account?</Text>
            <TouchableOpacity onPress={() => router.push("./login")}><Text style={[styles.linkText, {marginLeft:6}]}>Sign in</Text></TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingBottom: 40, paddingTop: 0 },
  cardHeader: {
    width: '100%',
    backgroundColor: '#0b2b52', // deep navy similar to screenshot
    paddingTop: 30,
    paddingBottom: 36,
    paddingHorizontal: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  smallTop: { color:'#e6eef7', fontSize: 16, marginBottom: 6 },
  title: { color:'#fff', fontSize: 36, fontWeight: '700', lineHeight: 40 },
  form: { width: '86%', marginTop: -22 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderColor: '#4b5a79',
    borderWidth: 1.2,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 28,
    marginTop: 12,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: {width:0, height:2},
    elevation: 1,
  },
  icon: { marginRight: 8 },
  input: { flex:1, fontSize: 15, color: '#222' },
  checkboxRow: { flexDirection:'row', alignItems:'center', marginTop: 14 },
  checkbox: {
    width:20, height:20, borderRadius:4, borderWidth:1.2, borderColor:'#4b5a79',
    alignItems:'center', justifyContent:'center', marginRight:8, backgroundColor:'#fff'
  },
  checkboxChecked: { backgroundColor:'#0b2b52', borderColor:'#0b2b52' },
  tinyText: { fontSize:12, color:'#6d7486' },
  linkText: { color:'#0b2b52', fontWeight:'600' },
  signBtn: {
    marginTop: 18,
    backgroundColor: '#0b2b52',
    paddingVertical: 14,
    borderRadius: 24,
    alignItems:'center',
    justifyContent:'center',
    shadowColor: '#0b2b52',
    shadowOpacity: 0.18,
    shadowOffset: {width:0, height:8},
    elevation: 3,
  },
  signBtnText: { color:'#fff', fontWeight:'600', fontSize:16 },
  smallGrey: { color:'#9aa1b6', fontSize:13 }
});
