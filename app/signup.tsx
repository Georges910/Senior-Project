import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ScrollView
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { getApiUrl } from '@/app/config/api';
import { useTheme } from '@/app/context/ThemeContext';

export default function SignupScreen() {
  const { colors, theme } = useTheme();
  const [apiUrl, setApiUrl] = useState('');
  const [fullName, setFullName] = useState("");
  const [parish, setParish] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [retype, setRetype] = useState("");
  const [agree, setAgree] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [churches, setChurches] = useState<{ name: string }[]>([]);
  const router = useRouter();

  function validateEmail(e: string) {
    const re = /\S+@\S+\.\S+/;
    return re.test(e);
  }

  useEffect(() => {
    const loadApiAndFetchChurches = async () => {
      try {
        // Load API URL from storage
        const url = await getApiUrl();
        setApiUrl(url);
        console.log("📡 API URL loaded:", url);
        
        // Fetch churches
        console.log("🔍 Fetching churches from:", `${url}/api/church/churches`);
        const res = await fetch(`${url}/api/church/churches`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        console.log("📥 Response status:", res.status);
        console.log("📥 Response ok:", res.ok);
        console.log("📥 Response headers:", JSON.stringify(Object.fromEntries(res.headers)));
        
        // Get response text first to debug
        const text = await res.text();
        console.log("📦 Raw response (first 500 chars):", text.substring(0, 500));
        
        // Try to parse as JSON
        let data;
        try {
          data = JSON.parse(text);
        } catch (parseErr) {
          console.error("❌ JSON Parse error:", parseErr instanceof Error ? parseErr.message : String(parseErr));
          console.error("❌ Response starts with:", text.substring(0, 100));
          Alert.alert(
            "Server Error", 
            `Server is returning an error page instead of JSON.\n\nURL: ${url}/api/church/churches\nStatus: ${res.status}\nResponse: ${text.substring(0, 200)}`
          );
          return;
        }
        
        console.log("📦 Churches response data:", JSON.stringify(data, null, 2));
        
        if (res.ok && data.churches && Array.isArray(data.churches)) {
          console.log("✅ Churches loaded successfully:", data.churches.length);
          setChurches(data.churches);
        } else {
          console.log("❌ Failed to load churches. Status:", res.status);
          console.log("❌ Error message:", data.error || data.message || 'Unknown error');
          Alert.alert(
            "Connection Issue", 
            `Failed to load churches.\n\nServer: ${url}\nStatus: ${res.status}\nMessage: ${data.error || data.message || 'Unknown'}`
          );
        }
      } catch (err) {
        console.error("❌ Error fetching churches:");
        console.error("Error type:", err instanceof Error ? err.name : typeof err);
        console.error("Error message:", err instanceof Error ? err.message : String(err));
        console.error("Full error:", err);
        Alert.alert(
          "Connection Error", 
          `Could not connect to server.\n\nError: ${err instanceof Error ? err.message : String(err)}\n\nMake sure:\n1. Backend is running\n2. Phone is on same network\n3. Firewall allows port 3001`
        );
      }
    };
    loadApiAndFetchChurches();
  }, []);


  async function onSignUp() {
    setErrorMsg("");
    if (!fullName.trim() || !parish.trim() || !email.trim() || !password || !retype) {
      setErrorMsg("Please fill all fields.");
      return;
    }
    if (fullName.length > 20) {
      setErrorMsg("Full name cannot be more than 20 characters.");
      return;
    }
    if (!validateEmail(email)) {
      setErrorMsg("Please enter a valid email.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }
    if (password !== retype) {
      setErrorMsg("Passwords don't match.");
      return;
    }
    if (!agree) {
      setErrorMsg("You must agree to the Terms & Privacy.");
      return;
    }

    setLoading(true);
    try {
      console.log("📝 Attempting signup to:", `${apiUrl}/api/auth/register`);
      const res = await fetch(`${apiUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, parish, email, password }),
      });
      console.log("📥 Signup response status:", res.status);
      const data = await res.json();
      if (!res.ok) {
        if (data?.error === "Email already registered") {
          setErrorMsg("This email is already in use.");
          setLoading(false);
          return;
        }
        if (data?.error === "Username already taken") {
          setErrorMsg("This username is already taken.");
          setLoading(false);
          return;
        }
        throw new Error(data.message || "Signup failed");
      }
      Alert.alert("Success", "Account created.");
      // Log in user after signup
      console.log("🔐 Auto-login to:", `${apiUrl}/api/auth/login`);
      const loginRes = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const loginData = await loginRes.json();
      if (loginData.token) {
        await AsyncStorage.setItem("jwtToken", loginData.token);
        // Fetch profile
        console.log("👤 Fetching profile from:", `${apiUrl}/api/auth/profile`);
        const profileRes = await fetch(`${apiUrl}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${loginData.token}` },
        });
        const profile = await profileRes.json();
        if (profile.fullName && profile.parish && profile.email) {
          await AsyncStorage.setItem(
            "userProfile",
            JSON.stringify({
              fullName: profile.fullName,
              parish: profile.parish,
              email: profile.email,
            })
          );
        }
      }
      router.push("/home");
      setFullName("");
      setParish("");
      setEmail("");
      setPassword("");
      setRetype("");
      setAgree(false);
      setErrorMsg("");
    } catch (err) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg(String(err));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.cardHeader, { backgroundColor: colors.primaryDark }]}>
          <Text style={[styles.smallTop, { color: colors.textSecondary }]}>Let's</Text>
          <Text style={[styles.title, { color: colors.textInverse }]}>Create{"\n"}Your{"\n"}Account</Text>
        </View>

        <View style={styles.form}>
          {/* Full name */}
          <View style={[styles.inputWrap, { 
            borderColor: colors.inputBorder, 
            backgroundColor: colors.inputBackground 
          }]}>
            <Ionicons
              name="person-outline"
              size={20}
              color={colors.icon}
              style={styles.icon}
            />
            <TextInput
              placeholder="Full Name"
              placeholderTextColor={colors.placeholder}
              value={fullName}
              onChangeText={(text) => {
                if (text.length <= 20) {
                  setFullName(text);
                  if (errorMsg === "Full name cannot be more than 20 characters.")
                    setErrorMsg("");
                } else {
                  setErrorMsg("Full name cannot be more than 20 characters.");
                }
              }}
              maxLength={20}
              style={[styles.input, { color: colors.text }]}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>

          {/* Parish */}
          <View style={[styles.inputWrap, { 
            borderColor: colors.inputBorder, 
            backgroundColor: colors.inputBackground 
          }]}>
            <MaterialCommunityIcons
              name="church"
              size={20}
              color={colors.icon}
              style={styles.icon}
            />

            <Picker
              selectedValue={parish}
              onValueChange={(itemValue) => setParish(itemValue)}
              style={{
                flex: 1,
                fontSize: 16,
                color: parish ? colors.text : colors.placeholder,
                borderWidth: 0,
                backgroundColor: "transparent",
              }}
            >
              <Picker.Item 
                label={churches.length === 0 ? "Loading churches..." : "Select your parish"} 
                value="" 
                color={colors.placeholder} 
              />
              {churches.map((p, index) => (
                <Picker.Item key={p.name || index} label={p.name} value={p.name} />
              ))}
            </Picker>

          </View>


          {/* Email */}
          <View style={[styles.inputWrap, { 
            borderColor: colors.inputBorder, 
            backgroundColor: colors.inputBackground 
          }]}>
            <Ionicons
              name="mail-outline"
              size={20}
              color={colors.icon}
              style={styles.icon}
            />
            <TextInput
              placeholder="Email Address"
              placeholderTextColor={colors.placeholder}
              value={email}
              onChangeText={setEmail}
              style={[styles.input, { color: colors.text }]}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
            />
          </View>

          {/* Password */}
          <View style={[styles.inputWrap, { 
            borderColor: colors.inputBorder, 
            backgroundColor: colors.inputBackground 
          }]}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={colors.icon}
              style={styles.icon}
            />
            <TextInput
              placeholder="Password"
              placeholderTextColor={colors.placeholder}
              value={password}
              onChangeText={setPassword}
              style={[styles.input, { color: colors.text }]}
              secureTextEntry={!showPass}
              returnKeyType="next"
            />
            <TouchableOpacity onPress={() => setShowPass((s) => !s)} style={{ padding: 8 }}>
              <Ionicons
                name={showPass ? "eye-off" : "eye"}
                size={20}
                color={colors.icon}
              />
            </TouchableOpacity>
          </View>

          {/* Retype Password */}
          <View style={[styles.inputWrap, { 
            borderColor: colors.inputBorder, 
            backgroundColor: colors.inputBackground 
          }]}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={colors.icon}
              style={styles.icon}
            />
            <TextInput
              placeholder="Retype Password"
              placeholderTextColor={colors.placeholder}
              value={retype}
              onChangeText={setRetype}
              style={[styles.input, { color: colors.text }]}
              secureTextEntry={!showPass}
              returnKeyType="done"
            />
          </View>

          {/* Agree checkbox */}
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setAgree((a) => !a)}
          >
            <View style={[
              styles.checkbox, 
              { borderColor: colors.border, backgroundColor: colors.inputBackground },
              agree && { backgroundColor: colors.primary, borderColor: colors.primary }
            ]}>
              {agree && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
            <Text style={[styles.tinyText, { color: colors.textSecondary }]}>I agree to the </Text>
            <TouchableOpacity>
              <Text style={[styles.tinyText, { color: colors.primary, fontWeight: '700' }]}>Terms & Privacy</Text>
            </TouchableOpacity>
          </TouchableOpacity>

          {/* Sign up button */}
          <TouchableOpacity
            style={[
              styles.signBtn, 
              { backgroundColor: colors.primary },
              loading && { opacity: 0.7 }
            ]}
            onPress={onSignUp}
            disabled={loading}
          >
            <Text style={styles.signBtnText}>
              {loading ? "Signing up..." : "Sign Up"}
            </Text>
          </TouchableOpacity>

          {errorMsg ? (
            <View style={[styles.errorBox, { backgroundColor: colors.errorBg }]}>
              <Ionicons name="alert-circle" size={18} color={colors.error} />
              <Text style={[styles.errorMsg, { color: colors.errorText }]}>
                {errorMsg}
              </Text>
            </View>
          ) : null}

          <View style={styles.footerRow}>
            <Text style={[styles.smallGrey, { color: colors.textSecondary }]}>Have an account?</Text>
            <TouchableOpacity onPress={() => router.push("./login")}>
              <Text style={[styles.linkText, { color: colors.primary }]}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { alignItems: "center", paddingBottom: 40 },
  cardHeader: {
    width: "100%",
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 28,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  smallTop: { fontSize: 17, marginBottom: 8, fontWeight: '600' },
  title: { fontSize: 40, fontWeight: "900", lineHeight: 48, letterSpacing: 1 },
  form: { width: "88%", marginTop: 24 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 14,
  },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, fontWeight: '500' },
  checkboxRow: { flexDirection: "row", alignItems: "center", marginTop: 18 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  tinyText: { fontSize: 13, fontWeight: '500' },
  linkText: { fontWeight: "700", marginLeft: 6 },
  signBtn: {
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  signBtnText: { color: "#fff", fontWeight: "800", fontSize: 17, letterSpacing: 0.5 },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  errorMsg: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  footerRow: { flexDirection: "row", justifyContent: "center", marginTop: 20, alignItems: 'center' },
  smallGrey: { fontSize: 14, fontWeight: '500' },
});
