import React, { useMemo, useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    TextInput,
    Modal,
    Image,
    Dimensions,
    SafeAreaView,
    Pressable,
    ActivityIndicator,
    Linking,
    Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

type Book = {
    id: string;
    title: string;
    category: string;
    cover?: string;
    description?: string;
    pdfUrl: string;
};

// ----------------- BottomNav (kept mostly like yours) -----------------
const BottomNav = ({ active, onNavigate }: { active: string; onNavigate: (p: string) => void }) => {
    const buttons = [{ name: "Home", icon: "home-outline" }, { name: "Find Church", icon: "location-outline" }, { name: "Books", icon: "book-outline" },]; const router = useRouter(); return (<View style={bottomNavStyles.container}> {buttons.map((b) => (<TouchableOpacity key={b.name} onPress={() => {
        onNavigate(b.name); // keep active style in parent 
        if (b.name === "Home") router.push("/home"); if (b.name === "Find Church") router.push("/FindChurchScreen"); if (b.name === "Books") return; // this is the current page 
    }} style={[bottomNavStyles.button, active === b.name && bottomNavStyles.activeButton]} > <Ionicons name={b.icon as any} size={24} color={active === b.name ? "#fff" : "#173B65"} /> <Text style={[bottomNavStyles.label, active === b.name && bottomNavStyles.activeLabel]}>{b.name}</Text> </TouchableOpacity>))} </View>);
};

const FindBooksScreen = () => {
    const [activePage, setActivePage] = useState("Books");
    const [books, setBooks] = useState<Book[]>([]);
    const [query, setQuery] = useState("");
    const [selectedBook, setSelectedBook] = useState<Book | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // ----------------- Fetch books from backend -----------------
    useEffect(() => {
        const fetchBooks = async () => {
            try {
                const response = await fetch("http://localhost:3000/api/books/book");
                if (!response.ok) throw new Error("Failed to fetch books");
                const data: Book[] = await response.json();
                setBooks(data);
            } catch (error) {
                console.error("Error fetching books:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchBooks();
    }, []);

    // ----------------- Filter books -----------------
    const filteredBooks = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return books;
        return books.filter(
            (b) =>
                b.title.toLowerCase().includes(q) ||
                b.category.toLowerCase().includes(q)
        );
    }, [books, query]);

    const openBook = (book: Book) => {
        setSelectedBook(book);
        setModalVisible(true);
    };

    // const openBookReader = (book: Book) => {
    //     setModalVisible(true);
        
    // };

    const openBookReader = (book: Book) => {
  if (!book?.pdfUrl) return;

  Linking.canOpenURL(book.pdfUrl)
    .then((supported) => {
      if (supported) {
        Linking.openURL(book.pdfUrl);
      } else {
        alert("Cannot open this PDF.");
      }
    })
    .catch((err) => console.error("Error opening PDF:", err));
};

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" color="#173B65" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={filteredBooks}
                keyExtractor={(item) => item.id}
                numColumns={2}
                columnWrapperStyle={styles.columnWrapper}
                contentContainerStyle={{ padding: 20, paddingBottom: 140 }}
                ListHeaderComponent={
                    <>
                        <Text style={styles.title}>Find a Book</Text>
                        <View style={styles.searchContainer}>
                            <Ionicons name="search-outline" size={20} color="#fff" />
                            <TextInput
                                placeholder="Search by name or category"
                                placeholderTextColor="#ddd"
                                style={styles.searchInput}
                                value={query}
                                onChangeText={setQuery}
                            />
                        </View>
                    </>
                }
                renderItem={({ item }) => (
                    <TouchableOpacity
                        activeOpacity={0.85}
                        style={styles.card}
                        onPress={() => openBook(item)}
                    >
                        {item.cover ? (
                            <Image source={{ uri: item.cover }} style={styles.coverImage} resizeMode="cover" />
                        ) : (
                            <View style={[styles.coverImage, { justifyContent: "center", alignItems: "center" }]}>
                                <Ionicons name="book-outline" size={36} color="#173B65" />
                            </View>
                        )}
                        <Text numberOfLines={2} style={styles.cardTitle}>
                            {item.title}
                        </Text>
                        <Text style={styles.cardText}>
                            {item.category}
                        </Text>
                    </TouchableOpacity>
                )}
            />

            {/* Modal */}
            <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
                <View style={modalStyles.backdrop}>
                    <View style={modalStyles.sheet}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                            <Text style={{ fontSize: 18, fontWeight: "700", color: "#173B65" }}>{selectedBook?.title}</Text>
                            <Pressable onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={26} color="#444" />
                            </Pressable>
                        </View>

                        {selectedBook?.cover && <Image source={{ uri: selectedBook.cover }} style={modalStyles.cover} resizeMode="cover" />}
                        <Text style={{ marginTop: 4, color: "#666" }}>{selectedBook?.category}</Text>
                        <Text style={{ marginTop: 10, color: "#555" }}>{selectedBook?.description}</Text>

                        <View style={{ flexDirection: "row", marginTop: 16, justifyContent: "space-between" }}>
                            <TouchableOpacity style={modalStyles.buttonOutline} onPress={() => setModalVisible(false)}>
                                <Text style={modalStyles.buttonOutlineText}>Close</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={modalStyles.buttonPrimary}
                                onPress={() => selectedBook && openBookReader(selectedBook)}
                            >
                                <Text style={modalStyles.buttonPrimaryText}>Open Book</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Bottom Nav */}
            <BottomNav
                active={activePage}
                onNavigate={(p) => {
                    setActivePage(p);
                    if (p === "Home") router.push("/home");
                    if (p === "Find Church") router.push("/FindChurchScreen");
                }}
            />
        </SafeAreaView>
    );
};

export default FindBooksScreen;

/* ---------------------- Styles ---------------------- */
const windowWidth = Dimensions.get("window").width;
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff" },
    title: { fontSize: 20, fontWeight: "700", color: "#173B65", marginBottom: 12, textAlign: "center" },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#173B65",
        borderRadius: 30,
        paddingHorizontal: 15,
        paddingVertical: 8,
        marginBottom: 16,
    },
    searchInput: { marginLeft: 10, color: "#fff", flex: 1 },
    columnWrapper: { justifyContent: "space-between", marginBottom: 12 },
    card: {
        flex: 1,
        marginHorizontal: 6,
        backgroundColor: "#f5f5f5",
        borderRadius: 12,
        padding: 10,
        // ensure min height so tiles look even
        minHeight: 190,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
        elevation: 3,
    },
    coverImage: {
        width: "100%",
        height: 110,
        borderRadius: 8,
        marginBottom: 8,
        backgroundColor: "#eee",
    },
    cardTitle: { fontSize: 14, fontWeight: "700", color: "#173B65" },
    cardText: { fontSize: 12, color: "#444", marginTop: 6 },
});

/* Bottom Nav styles (unchanged from your original) */
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
    button: { flex: 1, alignItems: "center", paddingVertical: 6, borderRadius: 30 },
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
    label: { fontSize: 11, fontWeight: "600", color: "#173B65", marginTop: 2 },
    activeLabel: { color: "#fff" },
});

/* Modal styles */
const modalStyles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.45)",
        justifyContent: "flex-end",
    },
    sheet: {
        backgroundColor: "#fff",
        padding: 18,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        maxHeight: "85%",
    },
    cover: { width: "100%", height: 180, borderRadius: 10, marginTop: 12 },
    buttonPrimary: {
        backgroundColor: "#173B65",
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 10,
        minWidth: 120,
        alignItems: "center",
        justifyContent: "center",
    },
    buttonPrimaryText: { color: "#fff", fontWeight: "700" },
    buttonOutline: {
        borderWidth: 1,
        borderColor: "#ccc",
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 10,
        minWidth: 120,
        alignItems: "center",
        justifyContent: "center",
    },
    buttonOutlineText: { color: "#444", fontWeight: "700" },
});
