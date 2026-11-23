import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../constants/config';
import { Ionicons } from '@expo/vector-icons';

export const PendingApprovalScreen: React.FC = () => {
  const { user, refreshUser, logout } = useAuth();
  const [checking, setChecking] = useState(false);

  const handleRefresh = async () => {
    setChecking(true);
    await refreshUser();
    setChecking(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Ionicons name="time-outline" size={48} color={COLORS.warning} />
        </View>

        <Text style={styles.title}>Account Pending Approval</Text>
        <Text style={styles.message}>
          Hello <Text style={styles.bold}>{user?.name}</Text>, your account ({user?.email}) has been registered and is currently waiting for approval by the College Administrator.
        </Text>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
          <Text style={styles.infoText}>
            College Admins verify student roll numbers and mess subscriptions before granting active meal booking privileges.
          </Text>
        </View>

        <TouchableOpacity style={styles.refreshBtn} onPress={handleRefresh} disabled={checking}>
          {checking ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="refresh-outline" size={18} color="#FFFFFF" />
              <Text style={styles.refreshBtnText}>Check Approval Status</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutBtnText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    width: '100%',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  bold: {
    fontWeight: '700',
    color: COLORS.text,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    padding: 14,
    borderRadius: 12,
    gap: 10,
    marginBottom: 24,
  },
  infoText: {
    fontSize: 12,
    color: COLORS.primaryDark,
    flex: 1,
    lineHeight: 18,
  },
  refreshBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    gap: 8,
  },
  refreshBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  logoutBtn: {
    marginTop: 16,
    padding: 8,
  },
  logoutBtnText: {
    color: COLORS.danger,
    fontWeight: '600',
    fontSize: 14,
  },
});

