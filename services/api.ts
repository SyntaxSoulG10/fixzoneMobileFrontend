import AsyncStorage from '@react-native-async-storage/async-storage';

export const BASE_URL = 'http://10.172.239.1:8081/api';

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION_MS = 1000 * 60 * 2; // 2 minutes

export async function clearCache() {
  cache.clear();
}

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  
  const method = (options.method || 'GET').toUpperCase();
  const isGet = method === 'GET';
  
  if (isGet) {
    const cached = cache.get(url);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
      return cached.data as T;
    }
  }

  const token = await AsyncStorage.getItem('token');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    data = { message: text };
  }

  if (!response.ok) {
    const errorMsg = data.message || data.error || `Server error: ${response.status}`;
    const details = data.details ? ` — ${data.details}` : '';
    throw new Error(`${errorMsg}${details}`);
  }

  if (isGet) {
    // Save successful GET requests to cache
    cache.set(url, { data, timestamp: Date.now() });
  } else {
    // If it's a POST/PUT/DELETE, clear the entire cache to ensure freshness 
    // for subsequent GET requests (e.g., if a booking is created, history updates)
    cache.clear();
  }

  return data as T;
}
