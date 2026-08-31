import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@settings_notification_popup_enabled';

// In-memory cache for ultra-fast, zero-overhead sync reads inside the polling loop
let inMemoryPopupEnabled: boolean = true;
let isInitialized: boolean = false;

type Listener = (enabled: boolean) => void;
const listeners = new Set<Listener>();

/**
 * Initialize setting from AsyncStorage on app launch
 */
export const initNotificationPopupSetting = async (): Promise<boolean> => {
  if (isInitialized) return inMemoryPopupEnabled;
  try {
    const val = await AsyncStorage.getItem(STORAGE_KEY);
    if (val !== null) {
      inMemoryPopupEnabled = val === 'true';
    } else {
      inMemoryPopupEnabled = true;
    }
  } catch (e) {
    console.error('Failed to load notification popup preference:', e);
    inMemoryPopupEnabled = true;
  } finally {
    isInitialized = true;
  }
  return inMemoryPopupEnabled;
};

/**
 * Get current notification popup setting synchronously (using cached in-memory value)
 */
export const getNotificationPopupEnabledSync = (): boolean => {
  return inMemoryPopupEnabled;
};

/**
 * Get current notification popup setting asynchronously
 */
export const getNotificationPopupEnabled = async (): Promise<boolean> => {
  if (!isInitialized) {
    await initNotificationPopupSetting();
  }
  return inMemoryPopupEnabled;
};

/**
 * Update notification popup setting
 */
export const setNotificationPopupEnabled = async (enabled: boolean): Promise<void> => {
  inMemoryPopupEnabled = enabled;
  listeners.forEach(listener => {
    try {
      listener(enabled);
    } catch (e) {
      console.error('Error in notification popup listener:', e);
    }
  });
  try {
    await AsyncStorage.setItem(STORAGE_KEY, String(enabled));
  } catch (e) {
    console.error('Failed to save notification popup preference:', e);
  }
};

/**
 * Subscribe to changes in notification popup setting
 */
export const subscribeNotificationPopupEnabled = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
