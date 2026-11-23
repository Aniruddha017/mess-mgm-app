import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getApiBaseUrl = (): string => {
  // Dynamic host extraction: Expo provides the computer's LAN IP automatically via hostUri!
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const hostIp = hostUri.split(':')[0];
    if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
      return `http://${hostIp}:8000/api/v1`;
    }
  }

  // Your computer's current Wi-Fi LAN IPv4
  const CURRENT_LAN_IP = '172.25.42.142';

  if (Platform.OS === 'android') {
    return `http://${CURRENT_LAN_IP}:8000/api/v1`;
  }

  return 'http://localhost:8000/api/v1';
};

export const CONFIG = {
  API_BASE_URL: getApiBaseUrl(),
  QR_HMAC_SECRET: 'messmate-hmac-qr-signing-secret-key-30s',
  QR_ROTATION_INTERVAL_SECONDS: 30,
  APP_NAME: 'MessMate',
  COLLEGE_NAME: 'KNIT Sultanpur',
};

export const COLORS = {
  primary: '#1E40AF',       // Royal Indigo
  primaryDark: '#1E3A8A',
  primaryLight: '#3B82F6',
  accent: '#F59E0B',        // Warm Amber
  success: '#10B981',       // Emerald Green
  danger: '#EF4444',        // Bright Red
  warning: '#F59E0B',       // Amber Warning
  background: '#F8FAFC',    // Slate 50
  card: '#FFFFFF',
  text: '#0F172A',          // Slate 900
  textMuted: '#64748B',     // Slate 500
  border: '#E2E8F0',        // Slate 200
  inputBg: '#F1F5F9',       // Slate 100
  vegBadge: '#16A34A',      // Green
  nonVegBadge: '#DC2626',   // Red
};
