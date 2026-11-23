import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { COLORS, CONFIG } from '../../constants/config';
import { Ionicons } from '@expo/vector-icons';
import { UserRole } from '../../types';
import { getEffectiveBaseUrl, setCustomBaseUrl } from '../../services/api';

export const LoginScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { login, quickLogin, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [serverUrl, setServerUrl] = useState(getEffectiveBaseUrl());
  const [showServerModal, setShowServerModal] = useState(false);
  const [tempUrl, setTempUrl] = useState(getEffectiveBaseUrl());

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both email and password');
      return;
    }
    setErrorMsg('');
    try {
      await login(email.trim(), password);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed');
    }
  };

  const handleQuickLogin = async (role: UserRole) => {
    setErrorMsg('');
    try {
      await quickLogin(role);
    } catch (err: any) {
      setErrorMsg(err.message || 'Demo login failed');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Ionicons name="restaurant" size={36} color="#FFFFFF" />
          </View>
          <Text style={styles.appTitle}>{CONFIG.APP_NAME}</Text>
          <Text style={styles.appSubtitle}>Smart Mess Management System</Text>
          <Text style={styles.collegeName}>{CONFIG.COLLEGE_NAME}</Text>
        </View>

        {/* Server URL Config Pill */}
        <TouchableOpacity
          style={styles.serverPill}
          onPress={() => {
            setTempUrl(getEffectiveBaseUrl());
            setShowServerModal(true);
          }}
        >
          <Ionicons name="server-outline" size={14} color={COLORS.primary} />
          <Text style={styles.serverPillText} numberOfLines={1}>
            Server: {serverUrl}
          </Text>
          <Ionicons name="pencil-outline" size={13} color={COLORS.primary} />
        </TouchableOpacity>

        {/* Login Form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Sign In</Text>

          {errorMsg ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color={COLORS.danger} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="e.g. aman@knit.ac.in"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="••••••••"
                placeholderTextColor="#94A3B8"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={COLORS.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.loginBtn, isLoading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginBtnText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.registerText}>
              Don't have an account? <Text style={styles.registerBold}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Demo Role Switcher */}
        <View style={styles.demoSection}>
          <Text style={styles.demoTitle}>🚀 ONE-TAP DEMO LOGIN</Text>
          <Text style={styles.demoSubtitle}>Instantly test all 3 roles from the specification:</Text>

          <View style={styles.demoButtonsContainer}>
            <TouchableOpacity
              style={[styles.demoBtn, { backgroundColor: '#10B981' }]}
              onPress={() => handleQuickLogin('student')}
              disabled={isLoading}
            >
              <Ionicons name="school-outline" size={18} color="#FFFFFF" />
              <Text style={styles.demoBtnText}>Student (Aman)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.demoBtn, { backgroundColor: '#F59E0B' }]}
              onPress={() => handleQuickLogin('mess_manager')}
              disabled={isLoading}
            >
              <Ionicons name="fast-food-outline" size={18} color="#FFFFFF" />
              <Text style={styles.demoBtnText}>Mess Manager</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.demoBtn, { backgroundColor: '#8B5CF6' }]}
              onPress={() => handleQuickLogin('college_admin')}
              disabled={isLoading}
            >
              <Ionicons name="shield-checkmark-outline" size={18} color="#FFFFFF" />
              <Text style={styles.demoBtnText}>College Admin</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Server Config Modal */}
        <Modal visible={showServerModal} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Backend Server URL</Text>
              <Text style={styles.modalSub}>
                Enter the IP address of your host machine running FastAPI. On Android physical phones, use your computer's Wi-Fi IP (e.g. http://172.25.42.142:8000/api/v1):
              </Text>
              <TextInput
                style={styles.serverInput}
                value={tempUrl}
                onChangeText={setTempUrl}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <View style={styles.modalBtns}>
                <TouchableOpacity
                  style={styles.modalCancel}
                  onPress={() => setShowServerModal(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalSave}
                  onPress={() => {
                    setCustomBaseUrl(tempUrl.trim());
                    setServerUrl(tempUrl.trim());
                    setShowServerModal(false);
                  }}
                >
                  <Text style={styles.modalSaveText}>Save URL</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 48,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  collegeName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 4,
  },
  formCard: {
    width: '100%',
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 18,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    height: 48,
    fontSize: 15,
    color: COLORS.text,
  },
  eyeBtn: {
    padding: 8,
  },
  loginBtn: {
    backgroundColor: COLORS.primary,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    elevation: 2,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  registerLink: {
    marginTop: 18,
    alignItems: 'center',
  },
  registerText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  registerBold: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  demoSection: {
    width: '100%',
    marginTop: 32,
    backgroundColor: '#EFF6FF',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  demoTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  demoSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    marginBottom: 12,
  },
  demoButtonsContainer: {
    gap: 8,
  },
  demoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 8,
  },
  demoBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  serverPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 16,
    gap: 6,
    maxWidth: '90%',
  },
  serverPillText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
    flexShrink: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    width: '100%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  modalSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginVertical: 10,
    lineHeight: 18,
  },
  serverInput: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 16,
  },
  modalBtns: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancel: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelText: {
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  modalSave: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

