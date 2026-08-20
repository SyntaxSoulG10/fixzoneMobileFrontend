import AsyncStorage from '@react-native-async-storage/async-storage';

// export const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://fixzone-backend.onrender.com/api';
export const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.15.161.1:8081/api';

// Global session expiration listener callback
type UnauthorizedListener = () => void;
let unauthorizedListener: UnauthorizedListener | null = null;

export function setUnauthorizedListener(listener: UnauthorizedListener | null) {
  unauthorizedListener = listener;
}

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION_MS = 1000 * 60 * 2; // 2 minutes

export async function clearCache() {
  cache.clear();
}

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  console.log(`[API Request] ${options.method || 'GET'} ${url}`);
  
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

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (err: any) {
    console.error(`[API Network Error] ${url}:`, err);
    throw new Error(`Network error connecting to backend: ${err.message || 'Unable to reach server'}`);
  }


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
    const fullErrorMsg = `${errorMsg}${details}`;

    // Check for 401/403 or invalid deleted user token
    const isSessionInvalid = 
      response.status === 401 || 
      response.status === 403 ||
      fullErrorMsg.includes('User not found') ||
      fullErrorMsg.includes('Customer not found');

    if (isSessionInvalid) {
      console.warn(`Invalid session detected (${fullErrorMsg}). Clearing token...`);
      await AsyncStorage.multiRemove(['token', 'user', 'userRole']);
      cache.clear();

      if (unauthorizedListener) {
        unauthorizedListener();
      }

      throw new Error('SESSION_EXPIRED');
    }

    throw new Error(fullErrorMsg);
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
