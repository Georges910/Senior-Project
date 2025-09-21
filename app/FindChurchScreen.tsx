import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';

const FindChurchScreen = () => {
  const [search, setSearch] = useState("");
  const navigation = useNavigation<any>();
  const router = useRouter();
  
  // Set "FindChurch" as active
  const [activePage, setActivePage] = useState("FindChurch");

  const [churches, setChurches] = useState<Array<{ _id: string; name: string }>>([]);
  useEffect(() => {
    const fetchChurches = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/church/ekklesia');
        const data = await res.json();
        if (Array.isArray(data.churches)) {
          setChurches(data.churches.map((c: any) => ({ _id: c._id, name: c.name })));
        } else {
          setChurches([]);
        }
      } catch (err) {
        console.error('Failed to fetch churches:', err);
      }
    };
    fetchChurches();
  }, []);

  const filteredChurches = churches.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  const renderChurchCard = ({ item }: any) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{item.name}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.header}>Find a church</Text>

      {/* Search bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={20} color="#fff" />
        <TextInput
          style={styles.searchInput}
          placeholder="Find a church"
          placeholderTextColor="#fff"
          value={search}
          onChangeText={setSearch}
        />
      </View>


      {/* Churches list */}
      {filteredChurches.length === 0 && search.trim() !== '' ? (
        <Text style={styles.noResults}>No churches found matching your search.</Text>
      ) : filteredChurches.length === 0 ? (
        <Text style={styles.noResults}>No churches available.</Text>
      ) : (
        <FlatList
          data={filteredChurches}
          keyExtractor={(item) => item._id}
          renderItem={renderChurchCard}
          contentContainerStyle={{ paddingBottom: 90 }}
        />
      )}

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <BottomNav
          active={activePage}
          onNavigate={(page) => {
            setActivePage(page); // update active page dynamically
            if (page === 'Home') router.push("/home");
            if (page === "FindChurch") return;
            if (page === "Books") router.push("/BooksScreen");
            navigation.navigate(page);
          }}
        />
      </View>
    </View>
  );
};

export default FindChurchScreen;

// ---------- Bottom Navigation ----------
const BottomNav: React.FC<{ active: string; onNavigate: (page: string) => void }> = ({ active, onNavigate }) => {
  const buttons = [
    { name: 'Home', icon: 'home' },
    { name: 'FindChurch', icon: 'search' },
    { name: 'Books', icon: 'book' },
    //{ name: 'Profile', icon: 'person' },
  ];

  return (
    <View style={bottomNavStyles.container}>
      {buttons.map((b) => (
        <TouchableOpacity
          key={b.name}
          onPress={() => onNavigate(b.name)}
          style={[
            bottomNavStyles.button,
            active === b.name && bottomNavStyles.activeButton,
          ]}
        >
          <Ionicons
            name={b.icon as any}
            size={24}
            color={active === b.name ? '#fff' : '#173B65'}
          />
          <Text style={[bottomNavStyles.label, active === b.name && bottomNavStyles.activeLabel]}>
            {b.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// ---------- Styles ----------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f6fa",
    paddingHorizontal: 12,
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 16,
    color: "#173B65",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#173B65",
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    marginLeft: 8,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 14,
    overflow: "hidden",
    elevation: 2,
  },
  cardImage: {
    width: 100,
    height: 100,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  cardContent: {
    flex: 1,
    padding: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  cardLocation: {
    fontSize: 12,
    color: "#555",
    marginTop: 2,
  },
  cardAbout: {
    fontSize: 12,
    color: "#777",
    marginVertical: 4,
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailButton: {
    backgroundColor: "#173B65",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  detailButtonText: {
    color: "#fff",
    fontSize: 12,
  },
  iconsRow: {
    flexDirection: "row",
    gap: 8,
  },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#e6ebf2",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: "#ccc",
  },
  noResults: {
    textAlign: "center",
    fontSize: 16,
    color: "#666",
    marginTop: 20,
  },
});

const bottomNavStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    width: '70%',
    borderRadius: 40,
    padding: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 30,
  },
  activeButton: {
    backgroundColor: '#173B65',
    borderRadius: 30,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#173B65',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    transform: [{ scale: 1.05 }],
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#173B65',
    marginTop: 2,
  },
  activeLabel: {
    color: '#fff',
  },
});
