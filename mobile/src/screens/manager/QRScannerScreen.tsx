import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { api } from '../../services/api';
import { MealCheckin } from '../../types';
import { COLORS } from '../../constants/config';
import { Ionicons } from '@expo/vector-icons';

const SCREEN_WIDTH = Dimensions.get('window').width;

export const QRScannerScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [manualCode, setManualCode] = useState('');

  // Result popup modal state
  const [resultModal, setResultModal] = useState<{
    visible: boolean;
    type: 'success' | 'already_collected' | 'expired' | 'error';
    data?: MealCheckin;
    message?: string;
  }>({ visible: false, type: 'success' });

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanned || processing) return;
    setScanned(true);
    setProcessing(true);

    try {
      const res = await api.verifyCheckin({ token: data });
      setResultModal({
        visible: true,
        type: 'success',
        data: res,
      });
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('ALREADY COLLECTED')) {
        setResultModal({
          visible: true,
          type: 'already_collected',
          message: msg,
        });
      } else if (msg.includes('expired') || msg.includes('Expired')) {
        setResultModal({
          visible: true,
          type: 'expired',
          message: msg,
        });
      } else {
        setResultModal({
          visible: true,
          type: 'error',
          message: msg || 'Verification failed. Wrong meal slot or invalid QR.',
        });
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleManualCodeSubmit = async () => {
    if (!manualCode.trim()) {
      Alert.alert('Empty Code', 'Please enter the 6-character booking code.');
      return;
    }
    setProcessing(true);
    setManualModalVisible(false);

    try {
      const res = await api.verifyCheckin({ manual_code: manualCode.trim().toUpperCase() });
      setResultModal({
        visible: true,
        type: 'success',
        data: res,
      });
      setManualCode('');
    } catch (err: any) {
      const msg = err.message || '';
      setResultModal({
        visible: true,
        type: msg.includes('ALREADY COLLECTED') ? 'already_collected' : 'error',
        message: msg,
      });
    } finally {
      setProcessing(false);
    }
  };

  const closeResultAndResume = () => {
    setResultModal({ visible: false, type: 'success' });
    setScanned(false);
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Counter QR Check-in</Text>
        <TouchableOpacity
          style={styles.manualCodeTriggerBtn}
          onPress={() => setManualModalVisible(true)}
        >
          <Ionicons name="keypad-outline" size={20} color="#FFFFFF" />
          <Text style={styles.manualCodeTriggerText}>Manual Code</Text>
        </TouchableOpacity>
      </View>

      {/* Camera View or Permission Request */}
      {!permission ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      ) : !permission.granted ? (
        <View style={styles.centerContainer}>
          <Ionicons name="camera-reverse-outline" size={54} color="#FFFFFF" />
          <Text style={styles.permText}>Camera permission is needed to scan QR passes.</Text>
          <TouchableOpacity style={styles.grantBtn} onPress={requestPermission}>
            <Text style={styles.grantBtnText}>Grant Camera Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.grantBtn, { backgroundColor: '#334155', marginTop: 12 }]}
            onPress={() => setManualModalVisible(true)}
          >
            <Text style={styles.grantBtnText}>Use Manual 6-Char Code</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.cameraContainer}>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
            onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          />

          {/* Scanner Overlay */}
          <View style={styles.overlay}>
            <View style={styles.scanTargetBox}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
              {processing && <ActivityIndicator size="large" color={COLORS.primary} />}
            </View>
            <Text style={styles.hintText}>
              Point camera at student's rotating HMAC QR code
            </Text>
          </View>
        </View>
      )}

      {/* Manual Code Entry Dialog */}
      <Modal visible={manualModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalDialog}>
            <Text style={styles.modalTitle}>Manual Booking Check-in</Text>
            <Text style={styles.modalSub}>
              Enter the student's 6-character backup code shown on their pass screen:
            </Text>

            <TextInput
              style={styles.manualInput}
              placeholder="e.g. KNIT01"
              placeholderTextColor="#94A3B8"
              value={manualCode}
              onChangeText={setManualCode}
              autoCapitalize="characters"
              maxLength={10}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setManualModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleManualCodeSubmit}
              >
                <Text style={styles.modalConfirmText}>Verify Code</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Scan Result Modal (Success / Already Collected / Expired / Error) */}
      <Modal visible={resultModal.visible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.resultCard}>
            {resultModal.type === 'success' ? (
              <>
                <View style={[styles.resultIconCircle, { backgroundColor: '#DCFCE7' }]}>
                  <Ionicons name="checkmark-circle" size={48} color={COLORS.success} />
                </View>
                <Text style={styles.resultTitle}>Meal Verified & Collected</Text>
                <Text style={styles.resultStudent}>{resultModal.data?.student_name}</Text>
                <Text style={styles.resultRoll}>Roll No: {resultModal.data?.student_roll}</Text>

                <View style={styles.receiptBox}>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLbl}>Meal Slot:</Text>
                    <Text style={styles.receiptVal}>{resultModal.data?.meal_type}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLbl}>Frozen Price:</Text>
                    <Text style={styles.receiptVal}>
                      ₹{resultModal.data ? (resultModal.data.price_paise / 100).toFixed(2) : '0.00'}
                    </Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLbl}>Verified via:</Text>
                    <Text style={styles.receiptVal}>
                      {resultModal.data?.verification_method === 'qr_scan' ? 'Dynamic HMAC QR' : 'Manual Code'}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.continueBtn} onPress={closeResultAndResume}>
                  <Text style={styles.continueBtnText}>Scan Next Student</Text>
                </TouchableOpacity>
              </>
            ) : resultModal.type === 'already_collected' ? (
              <>
                <View style={[styles.resultIconCircle, { backgroundColor: '#FEE2E2' }]}>
                  <Ionicons name="duplicate-outline" size={48} color={COLORS.danger} />
                </View>
                <Text style={[styles.resultTitle, { color: COLORS.danger }]}>Already Collected!</Text>
                <Text style={styles.resultMsgText}>
                  {resultModal.message || 'This meal was already recorded as collected.'}
                </Text>
                <View style={styles.fraudAlertBox}>
                  <Ionicons name="warning-outline" size={18} color={COLORS.danger} />
                  <Text style={styles.fraudAlertText}>
                    Unique constraint violated. Duplicate scan attempt was logged in Admin audit trail.
                  </Text>
                </View>
                <TouchableOpacity style={[styles.continueBtn, { backgroundColor: COLORS.danger }]} onPress={closeResultAndResume}>
                  <Text style={styles.continueBtnText}>Dismiss & Continue</Text>
                </TouchableOpacity>
              </>
            ) : resultModal.type === 'expired' ? (
              <>
                <View style={[styles.resultIconCircle, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="timer-outline" size={48} color={COLORS.warning} />
                </View>
                <Text style={[styles.resultTitle, { color: COLORS.warning }]}>QR Code Expired</Text>
                <Text style={styles.resultMsgText}>
                  {resultModal.message || 'Token is older than 60s. Please ask the student to refresh their screen.'}
                </Text>
                <TouchableOpacity style={[styles.continueBtn, { backgroundColor: COLORS.warning }]} onPress={closeResultAndResume}>
                  <Text style={styles.continueBtnText}>Try Again</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={[styles.resultIconCircle, { backgroundColor: '#FEE2E2' }]}>
                  <Ionicons name="close-circle" size={48} color={COLORS.danger} />
                </View>
                <Text style={[styles.resultTitle, { color: COLORS.danger }]}>Verification Failed</Text>
                <Text style={styles.resultMsgText}>{resultModal.message}</Text>
                <TouchableOpacity style={[styles.continueBtn, { backgroundColor: '#475569' }]} onPress={closeResultAndResume}>
                  <Text style={styles.continueBtnText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
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
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  manualCodeTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  manualCodeTriggerText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  cameraContainer: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanTargetBox: {
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_WIDTH * 0.7,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: '#38BDF8',
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 },
  hintText: {
    marginTop: 30,
    color: '#FFFFFF',
    fontSize: 13,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  permText: {
    color: '#E2E8F0',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  grantBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  grantBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalDialog: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  modalSub: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
    marginBottom: 16,
  },
  manualInput: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    height: 54,
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelText: {
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  modalConfirmBtn: {
    flex: 1,
    height: 46,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  resultCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  resultIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  resultStudent: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 4,
  },
  resultRoll: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  receiptBox: {
    width: '100%',
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    padding: 14,
    marginVertical: 18,
    gap: 8,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  receiptLbl: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  receiptVal: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  resultMsgText: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginVertical: 12,
  },
  fraudAlertBox: {
    flexDirection: 'row',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 10,
    gap: 8,
    marginBottom: 18,
  },
  fraudAlertText: {
    fontSize: 11,
    color: COLORS.danger,
    flex: 1,
    lineHeight: 16,
  },
  continueBtn: {
    backgroundColor: COLORS.primary,
    height: 48,
    width: '100%',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
