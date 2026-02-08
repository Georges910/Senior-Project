import React, { useState, useEffect } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl } from '@/app/config/api';
import { useTheme } from '@/app/context/ThemeContext';

const DEBUG = true;  // Set to false in production

export default function Login() {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const [apiUrl, setApiUrl] = useState('');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    loadApiUrl();
  }, []);

  const loadApiUrl = async () => {
    try {
      const url = await getApiUrl();
      setApiUrl(url);
      if (DEBUG) console.log("API URL loaded:", url);
    } catch (error) {
      console.error("Error loading API URL:", error);
      Alert.alert("Error", "Could not load API configuration");
    }
  };

  const onLogin = async () => {
    console.log("Login button pressed");
    console.log("API_URL:", apiUrl);

    if (!email || !password) {
      Alert.alert("Validation", "Please fill in both fields.");
      return;
    }
    setLoading(true);

    try {
      setErrorMsg("");
      console.log("Attempting to connect to:", `${apiUrl}/api/auth/login`);
      
      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, password }),
      });

      console.log("Response status:", res.status);
      const data = await res.json();
      console.log("Response body:", data);

      if (!res.ok) {
        setErrorMsg(data.error || "Login failed");
        return;
      }

      // Save JWT token
      if (data.token) {
        await AsyncStorage.setItem("jwtToken", data.token);
      }

      // Save user profile from login response (no extra API call needed)
      if (data.user?.fullName && data.user?.parish && data.user?.email) {
        await AsyncStorage.setItem(
          "userProfile",
          JSON.stringify({
            fullName: data.user.fullName,
            parish: data.user.parish,
            email: data.user.email,
          })
        );
      }

      Alert.alert("Success", "Login successful");
      setErrorMsg("");
      router.replace("/home");
    } catch (err) {
      console.error("Login error:", err);
      setErrorMsg("Could not connect to server");
    } finally {
      setLoading(false);
    }
  };

  

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.container, { backgroundColor: colors.primaryDark }]}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.primaryDark }]}>
          <View style={styles.adminWrap}>
            <TouchableOpacity onPress={() => router.push("/adminlogin")}>
              <Text style={[styles.adminText, { color: colors.textSecondary }]}>
                Are You Church Admin?
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.illustrationWrap}>
            <Image
              source={require("../Images/Logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <Text style={[styles.appTitle, { color: colors.accent }]}>Ekklesia</Text>
        </View>

        {/* White sheet */}
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          {/* Email */}
          <View style={[styles.inputRow, { 
            borderColor: colors.inputBorder,
            backgroundColor: colors.inputBackground 
          }]}>
            <Ionicons
              name="person-outline"
              size={20}
              color={colors.icon}
              style={styles.leftIcon}
            />
            <TextInput
              placeholder="Email or Phone"
              placeholderTextColor={colors.placeholder}
              value={email}
              onChangeText={setEmail}
              style={[styles.input, { color: colors.text }]}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Password */}
          <View style={[styles.inputRow, { 
            borderColor: colors.inputBorder,
            backgroundColor: colors.inputBackground 
          }]}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={colors.icon}
              style={styles.leftIcon}
            />
            <TextInput
              placeholder="Password"
              placeholderTextColor={colors.placeholder}
              value={password}
              onChangeText={setPassword}
              style={[styles.input, { color: colors.text }]}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={colors.icon} 
              />
            </TouchableOpacity>
          </View>

          {/* Forgot password */}
          <TouchableOpacity 
            style={styles.forgotWrapper} 
            onPress={() => router.push({ pathname: '/forgepassword', params: { email } })}
          >
            <Text style={[styles.forgot, { color: colors.textSecondary }]}>
              Forgot Password?
            </Text>
          </TouchableOpacity>

          {/* Login */}
          <TouchableOpacity
            style={[
              styles.loginBtn,
              { backgroundColor: colors.primary, borderColor: colors.borderLight },
              loading && { opacity: 0.7 }
            ]}
            onPress={onLogin}
            disabled={loading}
          >
            <Text style={styles.loginText}>
              {loading ? "Logging in..." : "Login"}
            </Text>
          </TouchableOpacity>

          {/* Error message */}
          {errorMsg ? (
            <View style={[styles.errorBox, { backgroundColor: colors.errorBg }]}>
              <Ionicons name="alert-circle" size={18} color={colors.error} />
              <Text style={[styles.errorMsg, { color: colors.errorText }]}>
                {errorMsg}
              </Text>
            </View>
          ) : null}

          <Text style={[styles.or, { color: colors.textMuted }]}>or</Text>

          {/* Create account */}
          <TouchableOpacity
            style={[styles.createBtn, { 
              backgroundColor: colors.background,
              borderColor: colors.border 
            }]}
            onPress={() => router.push("/signup")}
          >
            <Text style={[styles.createText, { color: colors.primary }]}>
              Create an account
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 40,
    paddingHorizontal: 24,
    alignItems: "center",
    paddingBottom: 20,
  },
  adminWrap: {
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  adminText: {
    fontSize: 13,
    fontWeight: "500",
  },
  illustrationWrap: { 
    alignItems: "center", 
    marginVertical: 16 
  },
  logo: {
    width: 180,
    height: 180,
  },
  appTitle: {
    fontSize: 42,
    fontWeight: "900",
    letterSpacing: 4,
    marginBottom: 8,
  },
  sheet: {
    flexGrow: 1,
    marginTop: 20,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingTop: 32,
    paddingBottom: 40,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  inputRow: {
    width: "88%",
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 14,
  },
  leftIcon: { marginRight: 10 },
  input: { 
    flex: 1, 
    fontSize: 16, 
    fontWeight: "500" 
  },
  forgotWrapper: { 
    alignSelf: "center", 
    marginTop: 14 
  },
  forgot: { 
    fontSize: 13, 
    fontWeight: "600" 
  },
  loginBtn: {
    width: "88%",
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  loginText: { 
    color: "#fff", 
    fontWeight: "800", 
    fontSize: 17,
    letterSpacing: 0.5,
  },
  errorBox: {
    width: "88%",
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
  },
  or: { 
    marginTop: 20, 
    fontSize: 14,
    fontWeight: "500",
  },
  createBtn: {
    width: "88%",
    marginTop: 14,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1.5,
  },
  createText: { 
    fontWeight: "800", 
    fontSize: 17,
    letterSpacing: 0.5,
  },
});

