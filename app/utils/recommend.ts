const API_URL = 'http://localhost:3000';

export async function getRecommendations(ratings: Array<{ name: string; rating: number }>, topK = 5) {
  try {
    const res = await fetch(`${API_URL}/api/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ratings, topK }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Recommendation request failed');
    }
    return await res.json();
  } catch (err) {
    console.error('getRecommendations error', err);
    throw err;
  }
}

export default { getRecommendations };

export async function saveRatings(payload: { userId?: string; itemId: string; itemType?: string; rating?: number; metadata?: any }) {
  try {
    const res = await fetch(`${API_URL}/api/ratings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Save rating failed');
    }
    return await res.json();
  } catch (err) {
    console.error('saveRatings error', err);
    throw err;
  }
}

export async function fetchEvents(churchId?: string) {
  try {
    const url = churchId ? `${API_URL}/api/events?churchId=${encodeURIComponent(churchId)}` : `${API_URL}/api/events`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch events');
    return await res.json();
  } catch (err) {
    console.error('fetchEvents error', err);
    throw err;
  }
}

// Likes API
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function saveLike({ itemId, itemType, eventId, action = 'like' }: { itemId?: string; itemType?: string; eventId?: string; action?: 'like' | 'unlike' }) {
  try {
    const token = await AsyncStorage.getItem('jwtToken');
    // prefer explicit eventId, otherwise if itemType === 'event' use itemId
    const resolvedEventId = eventId || (itemType === 'event' ? itemId : undefined) || itemId;
    // Only send event likes to the server. Do not create or send church likes.
    if (!resolvedEventId) throw new Error('eventId required to save like');
    const res = await fetch(`${API_URL}/api/user/likes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ eventId: resolvedEventId, action }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Save like failed');
    }
    return await res.json();
  } catch (err) {
    console.error('saveLike error', err);
    throw err;
  }
}

export async function fetchUserLikes() {
  try {
    const token = await AsyncStorage.getItem('jwtToken');
    const res = await fetch(`${API_URL}/api/user/likes`, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    if (!res.ok) throw new Error('Failed to fetch likes');
    return await res.json();
  } catch (err) {
    console.error('fetchUserLikes error', err);
    throw err;
  }
}
