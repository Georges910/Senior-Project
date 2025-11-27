import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ScrollView
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';

//const API_URL = "http://10.65.189.128:3000"
const API_URL = "http://localhost:3000";

export default function SignupScreen() {
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
    const fetchChurches = async () => {
      try {
        console.log("Fetching churches from:", `${API_URL}/api/church/churches`);
        const res = await fetch(`${API_URL}/api/church/churches`);
        const data = await res.json();
        console.log("Churches response:", data);
        
        if (res.ok && data.churches) {
          console.log("Churches loaded:", data.churches.length);
          setChurches(data.churches);
        } else {
          console.log("Failed to load churches:", data.error);
          Alert.alert("Error", "Failed to load churches. Please check your connection.");
        }
      } catch (err) {
        console.error("Error fetching churches:", err);
        Alert.alert("Error", "Could not connect to server to load churches.");
      }
    };
    fetchChurches();
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
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, parish, email, password }),
      });
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
      const loginRes = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const loginData = await loginRes.json();
      if (loginData.token) {
        await AsyncStorage.setItem("jwtToken", loginData.token);
        // Fetch profile
        const profileRes = await fetch(`${API_URL}/api/auth/profile`, {
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
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.cardHeader}>
          <Text style={styles.smallTop}>Let's</Text>
          <Text style={styles.title}>Create{"\n"}Your{"\n"}Account</Text>
        </View>

        <View style={styles.form}>
          {/* Full name */}
          <View style={styles.inputWrap}>
            <Ionicons
              name="person-outline"
              size={18}
              color="#58617a"
              style={styles.icon}
            />
            <TextInput
              placeholder="Full Name"
              placeholderTextColor="#96a0b4"
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
              style={styles.input}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>

          {/* Parish */}
          <View style={styles.inputWrap}>
            <MaterialCommunityIcons
              name="church"
              size={18}
              color="#58617a"
              style={styles.icon}
            />

            <Picker
              selectedValue={parish}
              onValueChange={(itemValue) => setParish(itemValue)}
              style={{
                flex: 1,
                fontSize: 15,
                color: parish ? "#222" : "#96a0b4", // ✅ dynamic color here
                borderWidth: 0,
                backgroundColor: "transparent",
              }}
            >
              <Picker.Item 
                label={churches.length === 0 ? "Loading churches..." : "Select your parish"} 
                value="" 
                color="#96a0b4" 
              />
              {churches.map((p, index) => (
                <Picker.Item key={p.name || index} label={p.name} value={p.name} />
              ))}
            </Picker>

          </View>


          {/* Email */}
          <View style={styles.inputWrap}>
            <Ionicons
              name="mail-outline"
              size={18}
              color="#58617a"
              style={styles.icon}
            />
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

          {/* Password */}
          <View style={styles.inputWrap}>
            <Ionicons
              name="lock-closed-outline"
              size={18}
              color="#58617a"
              style={styles.icon}
            />
            <TextInput
              placeholder="Password"
              placeholderTextColor="#96a0b4"
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              secureTextEntry={!showPass}
              returnKeyType="next"
            />
            <TouchableOpacity onPress={() => setShowPass((s) => !s)} style={{ padding: 8 }}>
              <Ionicons
                name={showPass ? "eye-off" : "eye"}
                size={18}
                color="#58617a"
              />
            </TouchableOpacity>
          </View>

          {/* Retype Password */}
          <View style={styles.inputWrap}>
            <Ionicons
              name="lock-closed-outline"
              size={18}
              color="#58617a"
              style={styles.icon}
            />
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

          {/* Agree checkbox */}
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setAgree((a) => !a)}
          >
            <View style={[styles.checkbox, agree && styles.checkboxChecked]}>
              {agree && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text style={styles.tinyText}>I agree to the </Text>
            <TouchableOpacity>
              <Text style={[styles.tinyText, styles.linkText]}>Terms & Privacy</Text>
            </TouchableOpacity>
          </TouchableOpacity>

          {/* Sign up button */}
          <TouchableOpacity
            style={[styles.signBtn, loading && { opacity: 0.7 }]}
            onPress={onSignUp}
            disabled={loading}
          >
            <Text style={styles.signBtnText}>
              {loading ? "Signing up..." : "Sign Up"}
            </Text>
          </TouchableOpacity>

          {errorMsg ? (
            <Text style={{ color: "red", marginTop: 8, textAlign: "center", fontSize: 13 }}>
              {errorMsg}
            </Text>
          ) : null}

          <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 12 }}>
            <Text style={styles.smallGrey}>Have an account?</Text>
            <TouchableOpacity onPress={() => router.push("./login")}>
              <Text style={[styles.linkText, { marginLeft: 6 }]}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", paddingBottom: 40, paddingTop: 0 },
  cardHeader: {
    width: "100%",
    backgroundColor: "#0b2b52",
    paddingTop: 30,
    paddingBottom: 36,
    paddingHorizontal: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  smallTop: { color: "#e6eef7", fontSize: 16, marginBottom: 6 },
  title: { color: "#fff", fontSize: 36, fontWeight: "700", lineHeight: 40 },
  form: { width: "86%", marginTop: 22 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: "#4b5a79",
    borderWidth: 1.2,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 28,
    marginTop: 12,
    // ✅ Updated: use boxShadow instead of shadow*
    boxShadow: "0px 2px 4px rgba(0,0,0,0.05)",
  },
  icon: { marginRight: 8 },
  input: { flex: 1, fontSize: 15, color: "#222" },
  checkboxRow: { flexDirection: "row", alignItems: "center", marginTop: 14 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.2,
    borderColor: "#4b5a79",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    backgroundColor: "#fff",
  },
  checkboxChecked: { backgroundColor: "#0b2b52", borderColor: "#0b2b52" },
  tinyText: { fontSize: 12, color: "#6d7486" },
  linkText: { color: "#0b2b52", fontWeight: "600" },
  signBtn: {
    marginTop: 18,
    backgroundColor: "#0b2b52",
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    // ✅ Updated: use boxShadow instead of shadow*
    boxShadow: "0px 4px 8px rgba(11,43,82,0.2)",
  },
  signBtnText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  smallGrey: { color: "#9aa1b6", fontSize: 13 },

});
