import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Dimensions,
  FlatList,
  I18nManager,
  Image,
  ImageBackground,
  Linking,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import BottomNav from "./Components/BottomNav";

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_MARGIN = 16;
const CARD_WIDTH = SCREEN_WIDTH * 0.7;
const API_URL = 'http://localhost:3000';


// ---------- Types ----------
export type PrayerItem = { id: string; time: string; titleAr: string; date: string };
export type EventItem = { id: string; title: string; parish: string; location: string; dateLabel: string; timeLabel?: string; imageUrl: string };
export type VerseOfDay = { id: string; imageUrl: string };
export type UserProfile = { fullName: string; parish: string; email?: string; avatarUrl?: string };

// ---------- Placeholder ----------
const Placeholder = {
  avatar: 'https://i.pravatar.cc/100?img=12',
  banner: 'https://images.unsplash.com/photo-1545420332-3f3a5c62fb54?q=80&w=1200&auto=format&fit=crop',
};

// ---------- Verse Images ----------
const verseImages: VerseOfDay[] = [
  { id: 'v1', imageUrl: 'https://res.cloudinary.com/firstwork/image/upload/v1757760343/Ekklesia/Banner/10_zxz8rk.png' },
  { id: 'v2', imageUrl: 'https://res.cloudinary.com/firstwork/image/upload/v1757760317/Ekklesia/Banner/3_a1lxfx.png' },
  { id: 'v3', imageUrl: 'https://res.cloudinary.com/firstwork/image/upload/v1757760317/Ekklesia/Banner/1_oaglss.png' },
  { id: 'v4', imageUrl: 'https://res.cloudinary.com/firstwork/image/upload/v1757759184/Ekklesia/Banner/9_y9zi2y.png' },
  { id: 'v5', imageUrl: 'https://res.cloudinary.com/firstwork/image/upload/v1757758899/Ekklesia/Banner/2_me5wne.png' },
  { id: 'v6', imageUrl: 'https://res.cloudinary.com/firstwork/image/upload/v1757758874/Ekklesia/Banner/5_bahbqo.png' },
  { id: 'v7', imageUrl: 'https://res.cloudinary.com/firstwork/image/upload/v1757758873/Ekklesia/Banner/8_oqdhwx.png' },
  { id: 'v8', imageUrl: 'https://res.cloudinary.com/firstwork/image/upload/v1757758867/Ekklesia/Banner/7_u5k81e.png' },
  { id: 'v9', imageUrl: 'https://res.cloudinary.com/firstwork/image/upload/v1757758837/Ekklesia/Banner/6_pyjuea.png' },
  { id: 'v10', imageUrl: 'https://res.cloudinary.com/firstwork/image/upload/v1757758837/Ekklesia/Banner/4_uyvb8j.png' },
];

// ---------- Api service ----------
const Api = {
  async getVerseOfDay(): Promise<VerseOfDay> {
    const day = new Date().getDate();
    const index = day % verseImages.length;
    return verseImages[index];
  },

  async getRecommendedEvents(): Promise<EventItem[]> {
    try {
      const res = await fetch(`${API_URL}/api/event`);
      if (!res.ok) throw new Error('Failed to fetch events');
      const data = await res.json();
      if (!Array.isArray(data)) return [];
      return data.map((e: any) => ({
        id: e.id || e._id,
        title: e.title || e.name || '',
        parish: e.parish || '',
        location: e.location || '',
        dateLabel: e.dateLabel || '',
        timeLabel: e.timeLabel || '',
        imageUrl: e.imageUrl,
      }));
    } catch (err) {
      console.error('Error fetching recommended events:', err);
      return [];
    }
  },

  async getPrayerScheduleForSelectedChurch(): Promise<PrayerItem[]> {
    try {
      const userRaw = await AsyncStorage.getItem('userProfile');
      if (!userRaw) return [];
      const user: UserProfile = JSON.parse(userRaw);
      if (!user?.parish) return [];

      const res = await fetch(`${API_URL}/api/church/${encodeURIComponent(user.parish)}/schedule`);
      if (!res.ok) throw new Error('Failed to fetch prayers');

      const data = await res.json();
      if (!data?.schedules) return [];

      // Sort by date & time
      const sortedSchedules = data.schedules.sort((a: any, b: any) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA.getTime() - dateB.getTime();
      });

      // Map backend schedule to PrayerItem
      return data.schedules.map((sch: any, index: number) => ({
        id: index.toString(),
        time: sch.time,
        titleAr: sch.name,
        date: sch.date,
      }));
    } catch (err) {
      console.error('Error fetching prayers:', err);
      return [];
    }
  },

  todayLabel() {
    const d = new Date();
    return d.toLocaleDateString(undefined, {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  },
};

// ---------- Date Formatter ----------
const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short', // Nov, Dec etc.
    year: 'numeric',
  });
};

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

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      let u: UserProfile | null = null;
      const token = await AsyncStorage.getItem('jwtToken');
      if (token) {
        const profileRes = await fetch(`${API_URL}/api/auth/profile`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (profileRes.ok) {
          u = await profileRes.json();
          await AsyncStorage.setItem('userProfile', JSON.stringify(u));
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

    } catch (err) {
      console.error('Error in loadAll:', err);
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
            <View style={[styles.profileTextWrap, isRTL && { marginRight: 10 }]}>
              <Text style={styles.nameText}>{user?.fullName || 'Full Name'}</Text>
              <View style={[styles.parishRow, isRTL && styles.rowRTL]}>
                <MaterialCommunityIcons name="map-marker" size={14} />
                <Text style={styles.parishText}>{user?.parish || 'Parish'}</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={28} color="black" />
          </TouchableOpacity>
        </View>

        {/* Verse Banner */}
        <View style={styles.bannerCard}>
          <ImageBackground
            source={{ uri: verse?.imageUrl || Placeholder.banner }}
            style={styles.bannerImage}
            imageStyle={styles.bannerImageRadius}
            resizeMode="cover"
          >
            <LinearGradient colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.35)']} style={styles.bannerGradient} />
          </ImageBackground>
        </View>

        {/* Daily Prayer Schedule */}
        <SectionHeader title={isRTL ? 'جدول الصلوات اليومية' : 'Daily Prayer Schedule'} />
        <View style={styles.prayersCard}>
          <Text style={styles.dateText}>{Api.todayLabel()}</Text>
          <View style={styles.prayersList}>
            {loading && prayers.length === 0 ? <SkeletonPrayerList /> :
              prayers.map((p) => (
                <View key={p.id} style={[styles.prayerRowCustom, isRTL && styles.rowRTL]}>
                  <View style={styles.timeColumn}>
                    <Text style={styles.prayerDate}>{formatDate(p.date)}</Text>
                    <Text style={styles.prayerTime}>{p.time}</Text>
                  </View>
                  <Text style={styles.prayerTitle}>{p.titleAr}</Text>
                </View>
              ))
            }
          </View>
        </View>

        {/* Recommendation Events */}
        <SectionHeader title={isRTL ? 'الفعاليات المقترحة' : 'Recommended Events'} />
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: SCREEN_WIDTH * 0.04 }}
          ListEmptyComponent={loading ? <SkeletonEventCard /> : null}
          renderItem={({ item }) => <EventCard item={item} onPress={() => navigation.navigate('EventDetails', { id: item.id })} />}
        />

        <View style={{ height: 80 }} />
      </ScrollView>

      <BottomNav active="Home" />
    </SafeAreaView>
  );
};

export default HomeScreen;

// ---------- Components ----------
const SectionHeader: React.FC<{ title: string; onPress?: () => void }> = ({ title }) => {
  const isRTL = I18nManager.isRTL;
  return (
    <View style={[styles.sectionHeader, isRTL && styles.rowRTL]}>
      <Text style={styles.sectionTitle}>{title}</Text>
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
  const openMap = () => {
    if (item.location) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location)}`;
      Linking.openURL(url);
    }
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.eventCard}>
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.eventImage} resizeMode="cover" />
      ) : null}
      <View style={styles.eventDetails}>
        <Text style={styles.eventTitle}>{item.title}</Text>
        <Text style={styles.eventText}>
          {Array.isArray(item.dateLabel)
            ? item.dateLabel.map(d => formatDate(d)).join(" - ")
            : formatDate(item.dateLabel)}
        </Text>
        <Text style={styles.eventText}>{item.timeLabel}</Text>
        <TouchableOpacity onPress={openMap} activeOpacity={0.7}>
          <Text style={styles.eventMeta}>{item.parish}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

// ---------- Styles ----------
const COLORS = { bg: '#f7f9fb', card: '#fff', primary: '#173B65', accent: '#1F7BC7', textDark: '#0b2239', textDim: '#5e6c79' };
const styles = StyleSheet.create({
  eventCard: {
    width: CARD_WIDTH,
    marginRight: CARD_MARGIN,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    overflow: 'hidden',
    minHeight: 230,
  },
  eventImage: {
    width: '100%',
    height: 160,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  eventDetails: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#173B65',
    marginBottom: 4,
  },
  eventText: {
    fontSize: 13,
    color: '#444',
    marginBottom: 6,
  },
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
  bannerImage: { width: '100%', height: SCREEN_WIDTH * 0.35, borderRadius: 14 },
  bannerImageRadius: { borderRadius: 14 },
  bannerGradient: { ...StyleSheet.absoluteFillObject },
  sectionHeader: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 13, color: COLORS.textDark, fontWeight: '700' },
  prayersCard: { backgroundColor: COLORS.bg, paddingHorizontal: 16, paddingBottom: 8 },
  dateText: { fontSize: 11, color: COLORS.textDim, marginBottom: 6 },
  prayersList: { borderRadius: 14, backgroundColor: COLORS.card, paddingHorizontal: 14, paddingVertical: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  prayerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#eef0f3' },
  skeletonRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 24, backgroundColor: '#e0e0e0', borderRadius: 6 },
  eventMeta: { fontSize: 10, color: COLORS.textDim },
  prayerRowCustom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eef0f3',
  },

  timeColumn: {
    flexDirection: 'column',
    alignItems: 'flex-start',  // date above time
    width: 80,                  // fixed width for all rows
  },

  prayerDate: {
    fontSize: 11,
    color: COLORS.textDim,
    marginBottom: 2,
    lineHeight: 14,
  },

  prayerTime: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
    lineHeight: 16,
  },

  prayerTitle: {
    fontSize: 12,
    color: COLORS.textDark,
    fontWeight: '500',
    flexShrink: 1,             // allow long titles to wrap
  },
});
