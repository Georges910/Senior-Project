import React, { useCallback, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
  I18nManager,
  RefreshControl,
  FlatList,
  Dimensions,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ---------- Types ----------
export type PrayerItem = { id: string; time: string; titleAr: string };
export type EventItem = { id: string; title: string; parish: string; dateLabel: string; imageUrl: string };
export type VerseOfDay = { id: string; imageUrl: string; };
export type UserProfile = { fullName: string; parish: string; email?: string; avatarUrl?: string };

// ---------- HomeScreen ----------
const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const isRTL = I18nManager.isRTL;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [verse, setVerse] = useState<VerseOfDay | null>(null);
  const [prayers, setPrayers] = useState<PrayerItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);

  // Active page state for bottom nav
  const [activePage, setActivePage] = useState('Home');

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      let u = null;
      const token = await AsyncStorage.getItem('jwtToken');
      if (token) {
        //const API_URL = 'http://10.163.217.128:3000'; // your API URL
        const API_URL = "http://localhost:3000"; 
        const profileRes = await fetch(`${API_URL}/api/auth/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (profileRes.ok) {
          u = await profileRes.json();
        }
      }
      const [v, p, e] = await Promise.all([
        Api.getVerseOfDay(),
        Api.getPrayerScheduleForSelectedChurch(),
        Api.getRecommendedEvents(),
      ]);
      setUser(u);
      setVerse(v);
      setPrayers(p);
      setEvents(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const router = useRouter();
  const handleLogout = async () => {
    await AsyncStorage.removeItem('userProfile');
    await AsyncStorage.removeItem('jwtToken');
    router.replace('/login');
  };

  useFocusEffect(useCallback(() => { loadAll(); }, [loadAll]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }, [loadAll]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Top Bar */}
        <View style={styles.topRow}>
          <View style={[styles.profileRow, isRTL && styles.rowRTL]}>
            <Image source={{ uri: user?.avatarUrl || Placeholder.avatar }} style={styles.avatar} />
            <View style={[styles.profileTextWrap, isRTL && { marginRight: 10 }]}>
              <Text style={styles.nameText}>{user?.fullName || 'Full Name'}</Text>
              <View style={[styles.parishRow, isRTL && styles.rowRTL]}>
                <MaterialCommunityIcons name="map-marker" size={14} />
                <Text style={styles.parishText}>{user?.parish || 'Parish'}</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.notifBtn}>
            <Ionicons name="notifications-outline" size={20} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={28} color="black" />
          </TouchableOpacity>
        </View>

        {/* Verse Banner */}
        <View style={styles.bannerCard}>
          <ImageBackground
            source={{ uri: verse?.imageUrl }}
            style={styles.bannerImage}
            imageStyle={styles.bannerImageRadius}
            resizeMode="cover"
            >
            <LinearGradient colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.35)']} style={styles.bannerGradient} />
          </ImageBackground>
        </View>

        {/* Daily Prayer Schedule */}
        <SectionHeader title={isRTL ? 'جدول الصلوات اليومية' : 'Daily Prayer Schedule'} onPress={() => navigation.navigate('PrayerSchedule')} />
        <View style={styles.prayersCard}>
          <Text style={styles.dateText}>{Api.todayLabel()}</Text>
          <View style={styles.prayersList}>
            {loading && prayers.length === 0 ? <SkeletonPrayerList /> :
              prayers.map((p) => (
                <View key={p.id} style={[styles.prayerRow, isRTL && styles.rowRTL]}>
                  <Text style={styles.prayerTime}>{p.time}</Text>
                  <Text style={styles.prayerTitle}>{p.titleAr}</Text>
                </View>
              ))}
          </View>
        </View>

        {/* Recommendation Events */}
        <SectionHeader title={isRTL ? 'الفعاليات المقترحة' : 'Recommendation Events'} onPress={() => navigation.navigate('Events')} />
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          ListEmptyComponent={loading ? <SkeletonEventCard /> : null}
          renderItem={({ item }) => <EventCard item={item} onPress={() => navigation.navigate('EventDetails', { id: item.id })} />}
        />

        <View style={{ height: 80 }} /> {/* space for bottom nav */}
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNav
        active={activePage}
        onNavigate={(page) => {
          setActivePage(page);
          if (page === 'Home') return;
          navigation.navigate(page);
          if (page === "FindChurch") router.push("/FindChurchScreen");
          if (page === "Books") router.push("/BooksScreen");
        }}
      />
    </SafeAreaView>
  );
};

export default HomeScreen;

// ---------- Components ----------
const SectionHeader: React.FC<{ title: string; onPress?: () => void }> = ({ title, onPress }) => {
  const isRTL = I18nManager.isRTL;
  return (
    <View style={[styles.sectionHeader, isRTL && styles.rowRTL]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <TouchableOpacity onPress={onPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={styles.seeAllText}>{isRTL ? 'عرض الكل' : 'See All'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const SkeletonPrayerList = () => (
  <View style={{ gap: 12 }}>
    {Array.from({ length: 3 }).map((_, i) => (
      <View key={i} style={styles.skeletonRow} />
    ))}
  </View>
);

const SkeletonEventCard = () => <View style={[styles.eventCard, { backgroundColor: '#eee' }]} />;

const EventCard: React.FC<{ item: EventItem; onPress: () => void }> = ({ item, onPress }) => {
  const isRTL = I18nManager.isRTL;
  return (
    <TouchableOpacity onPress={onPress} style={styles.eventCard} activeOpacity={0.9}>
      <Image source={{ uri: item.imageUrl }} style={styles.eventImage} />
      <View style={styles.eventContent}>
        <Text numberOfLines={2} style={styles.eventTitle}>{item.title}</Text>
        <View style={[styles.eventRow, isRTL && styles.rowRTL]}>
          <Ionicons name="location" size={14} />
          <Text style={styles.eventMeta} numberOfLines={1}>{item.parish}</Text>
        </View>
        <View style={[styles.eventRow, isRTL && styles.rowRTL]}>
          <Ionicons name="calendar" size={14} />
          <Text style={styles.eventMeta} numberOfLines={1}>{item.dateLabel}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ---------- Bottom Navigation ----------
const BottomNav: React.FC<{ active: string; onNavigate: (page: string) => void }> = ({ active, onNavigate }) => {
  const buttons = [
    { name: 'Home', icon: 'home' },
    { name: 'FindChurch', icon: 'search' },
    { name: 'Books', icon: 'book' },
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
          <Ionicons name={b.icon as any} size={24} color={active === b.name ? '#fff' : '#173B65'} />
          <Text style={[bottomNavStyles.label, active === b.name && bottomNavStyles.activeLabel]}>
            {b.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// ---------- Styles ----------
const COLORS = { bg: '#f7f9fb', card: '#fff', primary: '#173B65', accent: '#1F7BC7', textDark: '#0b2239', textDim: '#5e6c79' };

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: { paddingBottom: 24 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  rowRTL: { flexDirection: 'row-reverse' },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#ddd' },
  profileTextWrap: { marginLeft: 10 },
  parishRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  nameText: { fontSize: 14, fontWeight: '700', color: COLORS.textDark },
  parishText: { fontSize: 12, color: COLORS.textDim },
  notifBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  iconButton: { marginLeft: 15 },
  bannerCard: { paddingHorizontal: 16, paddingVertical: 8 },
  bannerImage: {
    width: '100%',
    height: SCREEN_WIDTH * 0.35, // 35% of screen width
    borderRadius: 14,
  },

  bannerImageRadius: { borderRadius: 14 },
  bannerGradient: { ...StyleSheet.absoluteFillObject },
  bannerTextWrap: { position: 'absolute', bottom: 10, left: 14, right: 14 },
  alignRight: { alignItems: 'flex-end' },
  bannerVerse: { color: '#fff', fontSize: 13, fontWeight: '600', lineHeight: 18 },
  bannerRef: { color: '#fff', opacity: 0.9, marginTop: 4, fontSize: 11 },
  sectionHeader: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 13, color: COLORS.textDark, fontWeight: '700' },
  seeAllText: { fontSize: 12, color: COLORS.accent, fontWeight: '600' },
  prayersCard: { backgroundColor: COLORS.bg, paddingHorizontal: 16, paddingBottom: 8 },
  dateText: { fontSize: 11, color: COLORS.textDim, marginBottom: 6 },
  prayersList: { borderRadius: 14, backgroundColor: COLORS.card, paddingHorizontal: 14, paddingVertical: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  prayerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#eef0f3' },
  prayerTime: { fontSize: 12, color: COLORS.textDark, fontWeight: '600' },
  prayerTitle: { fontSize: 12, color: COLORS.textDark },
  skeletonRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 15, backgroundColor: '#f0f0f0', borderRadius: 8, marginBottom: 10 },
  eventCard: {
    width: SCREEN_WIDTH * 0.8, // 70% of screen width
    marginRight: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  eventImage: {
    width: '100%',
    height: SCREEN_WIDTH * 0.4, // 40% of screen width
  },

  eventContent: { padding: 12, gap: 6 },
  eventTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textDark },
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  eventMeta: { fontSize: 12, color: COLORS.textDim },
});

const bottomNavStyles = StyleSheet.create({
  container: {
    position: 'absolute', bottom: 16, alignSelf: 'center', flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: '#fff', width: '70%', borderRadius: 40, padding: 8, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 5
  },
  button: { flex: 1, alignItems: 'center', paddingVertical: 6 },
  activeButton: { backgroundColor: '#173B65', borderRadius: 30 },
  label: { fontSize: 11, fontWeight: '600', color: '#173B65', marginTop: 2 },
  activeLabel: { color: '#fff' },
});

// ---------- Placeholder ----------
const Placeholder = {
  avatar: 'https://i.pravatar.cc/100?img=12',
  banner: 'https://images.unsplash.com/photo-1545420332-3f3a5c62fb54?q=80&w=1200&auto=format&fit=crop',
};

// ---------- Api service ----------
const Api = {
  async getVerseOfDay(): Promise<VerseOfDay> {
    const day = new Date().getDate(); // 1-31
    const index = day % verseImages.length; // rotate over 10 banners
    return verseImages[index];
  },

  async getPrayerScheduleForSelectedChurch(): Promise<PrayerItem[]> {
    return [
      { id: 'p1', time: '8:09 AM', titleAr: 'صلاة السحر' },
      { id: 'p2', time: '9:09 AM', titleAr: 'القداس الإلهي' },
      { id: 'p3', time: '4:59 PM', titleAr: 'صلاة الغروب' },
    ];
  },
  async getRecommendedEvents(): Promise<EventItem[]> {
    return [
      { id: 'e1', title: 'THE CHOIR OF EPARCHY OF TRIPOLI', parish: 'St. Georges, Mina', dateLabel: 'Friday, August 1 2025', imageUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1400&auto=format&fit=crop' },
      { id: 'e2', title: 'KIDS SUMMER CLUB — WEEK 3', parish: 'St. Georges, Mina', dateLabel: 'Saturday, August 2 2025', imageUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1400&auto=format&fit=crop' },
    ];
  },
  todayLabel() {
    const d = new Date();
    return d.toLocaleDateString(undefined, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  },
};

//Store the claudinary URL

const verseImages = [
  {
    id: 'v1',
    imageUrl: 'https://res.cloudinary.com/firstwork/image/upload/v1757760343/Ekklesia/Banner/10_zxz8rk.png',
  },
  {
    id: 'v2',
    imageUrl: 'https://res.cloudinary.com/firstwork/image/upload/v1757760317/Ekklesia/Banner/3_a1lxfx.png',
  },
  {
    id: 'v3',
    imageUrl: 'https://res.cloudinary.com/firstwork/image/upload/v1757760317/Ekklesia/Banner/1_oaglss.png',
  },
  {
    id: 'v4',
    imageUrl: 'https://res.cloudinary.com/firstwork/image/upload/v1757759184/Ekklesia/Banner/9_y9zi2y.png',
  },
  {
    id: 'v5',
    imageUrl: 'https://res.cloudinary.com/firstwork/image/upload/v1757758899/Ekklesia/Banner/2_me5wne.png',
  },
  {
    id: 'v6',
    imageUrl: 'https://res.cloudinary.com/firstwork/image/upload/v1757758874/Ekklesia/Banner/5_bahbqo.png',
  },
  {
    id: 'v7',
    imageUrl: 'https://res.cloudinary.com/firstwork/image/upload/v1757758873/Ekklesia/Banner/8_oqdhwx.png',
  },
  {
    id: 'v8',
    imageUrl: 'https://res.cloudinary.com/firstwork/image/upload/v1757758867/Ekklesia/Banner/7_u5k81e.png',
  },
  {
    id: 'v9',
    imageUrl: 'https://res.cloudinary.com/firstwork/image/upload/v1757758837/Ekklesia/Banner/6_pyjuea.png',
  },
  {
    id: 'v10',
    imageUrl: 'https://res.cloudinary.com/firstwork/image/upload/v1757758837/Ekklesia/Banner/4_uyvb8j.png',
  },
];

