import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
  Share,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { COLORS, CONFIG } from '../../constants/config';
import { Ionicons } from '@expo/vector-icons';

const SCREEN_WIDTH = Dimensions.get('window').width;

export const QRPresenterScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { bookingId, slot } = route.params;
  const { user } = useAuth();
  const [tokenData, setTokenData] = useState<{ token: string; manual_code: string; expires_in: number } | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(30);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const progressAnim = useRef(new Animated.Value(1)).current;

  const fetchToken = async () => {
    try {
      const res = await api.getQRToken(bookingId);
      setTokenData(res);
      setSecondsLeft(CONFIG.QR_ROTATION_INTERVAL_SECONDS);
      setErrorMsg('');

      // Restart progress animation
      progressAnim.setValue(1);
      Animated.timing(progressAnim, {
        toValue: 0,
        duration: CONFIG.QR_ROTATION_INTERVAL_SECONDS * 1000,
        useNativeDriver: false,
      }).start();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to generate signed QR token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchToken();

    // 1-second interval for countdown counter
    const countdownTimer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          fetchToken();
          return CONFIG.QR_ROTATION_INTERVAL_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownTimer);
  }, [bookingId]);

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Digital Meal Pass</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchToken}>
          <Ionicons name="refresh" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Pass Card */}
        <View style={styles.card}>
          {/* Slot Info Banner */}
          <View style={styles.slotInfoBanner}>
            <View>
              <Text style={styles.slotMealType}>{slot?.meal_type?.toUpperCase() || 'MEAL PASS'}</Text>
              <Text style={styles.slotDate}>{slot?.date || 'Today'}</Text>
            </View>
            <View style={styles.studentBadge}>
              <Text style={styles.studentRollText}>{user?.id}</Text>
              <Text style={styles.studentNameText}>{user?.name}</Text>
            </View>
          </View>

          {/* QR Container */}
          <View style={styles.qrWrapper}>
            {loading ? (
              <ActivityIndicator size="large" color={COLORS.primary} />
            ) : errorMsg ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={40} color={COLORS.danger} />
                <Text style={styles.errorText}>{errorMsg}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={fetchToken}>
                  <Text style={styles.retryBtnText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : tokenData ? (
              <View style={styles.qrCodeContainer}>
                <QRCode
                  value={tokenData.token}
                  size={SCREEN_WIDTH * 0.6}
                  color="#000000"
                  backgroundColor="#FFFFFF"
                />
              </View>
            ) : null}
          </View>

          {/* Dynamic Rotation Countdown */}
          <View style={styles.countdownSection}>
            <View style={styles.countdownRow}>
              <Ionicons name="sync" size={16} color={COLORS.primary} />
              <Text style={styles.countdownText}>
                Refreshing in <Text style={styles.countdownBold}>{secondsLeft}s</Text>
              </Text>
            </View>

            {/* Animated Progress Bar */}
            <View style={styles.progressBarTrack}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
          </View>

          {/* Fallback Manual Code (Module 02) */}
          <View style={styles.manualCodeBox}>
            <Text style={styles.manualCodeLabel}>CAMERA SCAN NOT WORKING?</Text>
            <Text style={styles.manualCodeSub}>Tell this 6-character code to the mess manager:</Text>
            <View style={styles.codePill}>
              <Text style={styles.codeText}>{tokenData?.manual_code || '------'}</Text>
            </View>
          </View>

          {/* Anti-fraud note */}
          <View style={styles.securityNote}>
            <Ionicons name="shield-checkmark" size={14} color={COLORS.success} />
            <Text style={styles.securityText}>
              HMAC signed & single-use. Screenshots stop working after 30s.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Dark aesthetic for contrast
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    elevation: 8,
  },
  slotInfoBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  slotMealType: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  slotDate: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  studentBadge: {
    alignItems: 'flex-end',
  },
  studentRollText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  studentNameText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  qrWrapper: {
    marginVertical: 20,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: SCREEN_WIDTH * 0.65,
  },
  qrCodeContainer: {
    padding: 8,
    backgroundColor: '#FFFFFF',
  },
  countdownSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  countdownText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  countdownBold: {
    fontWeight: '800',
    color: COLORS.primary,
  },
  progressBarTrack: {
    width: '80%',
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  manualCodeBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  manualCodeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  manualCodeSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
    marginBottom: 8,
  },
  codePill: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 8,
  },
  codeText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#38BDF8',
    letterSpacing: 4,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  securityText: {
    fontSize: 11,
    color: COLORS.success,
    fontWeight: '600',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 13,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});

