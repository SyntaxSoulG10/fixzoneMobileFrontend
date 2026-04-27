import AsyncStorage from '@react-native-async-storage/async-storage';

export const BASE_URL = 'http://192.168.100.119:8081/api';

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  
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

  return data as T;
}
