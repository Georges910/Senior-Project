import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

// 🔹 Bottom Navigation Component
const BottomNav = ({ active, onNavigate }: { active: string; onNavigate: (page: string) => void }) => {
  const buttons = [
    { name: "Home", icon: "home-outline" },
    { name: "Find Church", icon: "location-outline" },
    { name: "Books", icon: "book-outline" },
    //{ name: "Profile", icon: "person-outline" },
  ]
  const router = useRouter();

  ;

  return (
    <View style={bottomNavStyles.container}>
      {buttons.map((b) => (
        <TouchableOpacity
          key={b.name}
          onPress={() => {
            onNavigate(b.name); // keep button active style

            if (b.name === "Home") router.push("/home");
            if (b.name === "Find Church") router.push("/FindChurchScreen");
            if (b.name === "Books") return;
            //if (b.name === "Profile") router.push("/ProfileScreen");
          }}
          style={[
            bottomNavStyles.button,
            active === b.name && bottomNavStyles.activeButton,
          ]}
        >
          <Ionicons
            name={b.icon as any}
            size={24}
            color={active === b.name ? "#fff" : "#173B65"}
          />
          <Text
            style={[
              bottomNavStyles.label,
              active === b.name && bottomNavStyles.activeLabel,
            ]}
          >
            {b.name}
          </Text>
        </TouchableOpacity>

      ))}
    </View>
  );
};

// 🔹 Example Page (Find Church)
const FindChurchScreen = () => {
  const [activePage, setActivePage] = useState("Books");

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Find a Book</Text>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#fff" />
          <TextInput
            placeholder="Search by name or category"
            placeholderTextColor="#ddd"
            style={styles.searchInput}
          />
        </View>

        {/* Example Church Cards */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Book Name </Text>
          <Text style={styles.cardText}>Category</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Book Name </Text>
          <Text style={styles.cardText}>Category</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Book Name </Text>
          <Text style={styles.cardText}>Category</Text>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNav active={activePage} onNavigate={setActivePage} />
    </View>
  );
};

export default FindChurchScreen;

// 🔹 Page Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#173B65",
    marginBottom: 20,
    textAlign: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#173B65",
    borderRadius: 30,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginBottom: 20,
  },
  searchInput: {
    marginLeft: 10,
    color: "#fff",
    flex: 1,
  },
  card: {
    backgroundColor: "#f5f5f5",
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#173B65",
  },
  cardText: {
    fontSize: 14,
    color: "#444",
    marginTop: 4,
  },
});

// 🔹 Bottom Nav Styles
const bottomNavStyles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 16,
    alignSelf: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    width: "70%",
    borderRadius: 40,
    padding: 8,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  button: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 6,
    borderRadius: 30,
  },
  activeButton: {
    backgroundColor: "#173B65",
    borderRadius: 30,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: "#173B65",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    transform: [{ scale: 1.05 }],
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    color: "#173B65",
    marginTop: 2,
  },
  activeLabel: {
    color: "#fff",
  },
});

