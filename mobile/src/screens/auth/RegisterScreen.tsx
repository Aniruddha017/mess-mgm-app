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
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../constants/config';
import { Ionicons } from '@expo/vector-icons';
import { UserRole, DietaryPreference } from '../../types';

export const RegisterScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { register, isLoading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [dietaryPref, setDietaryPref] = useState<DietaryPreference>('veg');
  const [errorMsg, setErrorMsg] = useState('');

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMsg('Please fill in all required fields');
      return;
    }
    setErrorMsg('');
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        dietary_pref: dietaryPref,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>

        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join MessMate to manage your hostel meals</Text>

        <View style={styles.formCard}>
          {errorMsg ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color={COLORS.danger} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name & Roll No.</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Aman Saini (23210)"
                placeholderTextColor="#94A3B8"
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

          {/* College Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>College Email</Text>
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

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Min 6 characters"
                placeholderTextColor="#94A3B8"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>
          </View>

          {/* Role Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Select Your Role</Text>
            <View style={styles.pillRow}>
              {(['student', 'mess_manager'] as UserRole[]).map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.pill, role === r && styles.pillActive]}
                  onPress={() => setRole(r)}
                >
                  <Text style={[styles.pillText, role === r && styles.pillTextActive]}>
                    {r === 'student' ? 'Student' : 'Mess Manager'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Dietary Preference (Module 01: dietary tags) */}
          {role === 'student' && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Dietary Preference</Text>
              <View style={styles.pillRow}>
                {(['veg', 'non_veg', 'jain', 'vegan'] as DietaryPreference[]).map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.pill, dietaryPref === d && styles.pillActiveDiet]}
                    onPress={() => setDietaryPref(d)}
                  >
                    <Text style={[styles.pillText, dietaryPref === d && styles.pillTextActive]}>
                      {d === 'veg' ? '🥦 Veg' : d === 'non_veg' ? '🍗 Non-Veg' : d === 'jain' ? '🌱 Jain' : '🥗 Vegan'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.submitBtn, isLoading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginText}>
              Already registered? <Text style={styles.loginBold}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
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
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
    marginBottom: 20,
  },
  formCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
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
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pillActiveDiet: {
    backgroundColor: COLORS.vegBadge,
    borderColor: COLORS.vegBadge,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  loginLink: {
    marginTop: 18,
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  loginBold: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});

