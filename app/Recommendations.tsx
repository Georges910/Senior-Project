import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getRecommendations, saveRatings, saveLike, fetchUserLikes } from './utils/recommend';
import { Ionicons } from '@expo/vector-icons';

export default function RecommendationsScreen() {
  const [churches, setChurches] = useState<any[]>([]);
  const [ratingsMap, setRatingsMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | undefined>(undefined);
  
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('http://localhost:3000/api/church/ekklesia');
        const data = await res.json();
        if (Array.isArray(data.churches)) setChurches(data.churches.slice(0, 20));
      } catch (err) {
        console.warn('Failed to load churches', err);
      }
      const profileRaw = await AsyncStorage.getItem('userProfile');
      if (profileRaw) {
        try { const p = JSON.parse(profileRaw); setUserId(p?._id || p?.id || p?.email); } catch {}
      }
      // load user's likes (now a simple array of liked event ids)
      try {
        const likesRes = await fetchUserLikes();
        const likedIds = Array.isArray(likesRes?.likedEvents) ? likesRes.likedEvents.map((id: any) => String(id)) : [];
        setLikedSet(new Set(likedIds));
      } catch {}
    })();
  }, []);

  const [likedSet, setLikedSet] = useState<Set<string>>(new Set());

  function setRating(itemId: string, val: number) {
    setRatingsMap(prev => ({ ...prev, [itemId]: val }));
  }

  async function handleSaveAndRecommend() {
    setLoading(true);
    try {
      // Persist ratings to server
      const saves = Object.entries(ratingsMap).map(([itemId, rating]) =>
        saveRatings({ userId, itemId, itemType: 'church', rating })
      );
      await Promise.all(saves);

      // Build ratings array by name for existing recommend endpoint
      const ratingsByName = Object.entries(ratingsMap).map(([itemId, rating]) => {
        const c = churches.find(ch => String(ch._id) === String(itemId));
        return { name: c ? c.name : itemId, rating };
      });

      const rec = await getRecommendations(ratingsByName, 10);
      setResults(rec.recommendations || rec.recs || []);
    } catch (err) {
      console.error('Recommend flow error', err);
      const message = err instanceof Error ? err.message : String(err);
      alert('Failed to get recommendations: ' + message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Temporary AI Test — Rate Churches</Text>
        <Text style={styles.note}>Rate a few churches (1-5) then press Save & Recommend. Ratings are saved to the server for future training.</Text>

        {churches.map((c) => (
          <View key={String(c._id)} style={styles.item}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={styles.itemTitle}>{c.name}</Text>
                {/* Removed church-like button: likes are only stored for events now */}
            </View>
            <View style={styles.ratingsRow}>
              {[1,2,3,4,5].map((n) => (
                <TouchableOpacity key={n} onPress={() => setRating(String(c._id), n)} style={[styles.rateBtn, ratingsMap[String(c._id)] === n && styles.rateBtnActive]}>
                  <Text style={styles.rateText}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveAndRecommend} disabled={loading}>
          <Text style={styles.saveBtnText}>{loading ? 'Working...' : 'Save & Recommend'}</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />

        <Text style={styles.title}>Recommendations</Text>
        {results.length === 0 ? <Text style={styles.note}>No recommendations yet.</Text> : (
          <FlatList
            data={results}
            keyExtractor={(it) => String(it.id || it._id || it.name)}
            renderItem={({ item }) => (
                <View style={styles.resultItem}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.itemTitle}>{item.name}</Text>
                    {/* Removed church-like button from recommendations: likes are only for events */}
                  </View>
                  <Text style={styles.small}>{item.location || item.churchName || ''} {item.score ? ` — ${Number(item.score).toFixed(3)}` : ''}</Text>
                </View>
            )}
          />
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f7f9fb' },
  container: { padding: 16 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  note: { fontSize: 13, color: '#444', marginBottom: 12 },
  item: { backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 10 },
  itemTitle: { fontSize: 14, fontWeight: '700' },
  ratingsRow: { flexDirection: 'row', marginTop: 8 },
  rateBtn: { padding: 8, borderRadius: 6, backgroundColor: '#eef2f6', marginRight: 8 },
  rateBtnActive: { backgroundColor: '#173B65' },
  rateText: { color: '#173B65', fontWeight: '700' },
  saveBtn: { marginTop: 12, backgroundColor: '#173B65', padding: 12, borderRadius: 10, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700' },
  resultItem: { backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 8 },
  small: { color: '#666', marginTop: 6 }
});
