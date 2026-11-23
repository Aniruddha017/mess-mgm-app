import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../constants/config';
import { Ionicons } from '@expo/vector-icons';

export const AdminDashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [financial, setFinancial] = useState<any>(null);
  const [hygieneCount, setHygieneCount] = useState<number>(0);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      const [fin, hygiene, users] = await Promise.all([
        api.getFinancialReport(),
        api.getHygieneAlerts(),
        api.getUsers(undefined, 'pending_approval'),
      ]);
      setFinancial(fin);
      setHygieneCount(hygiene.length);
      setPendingCount(users.length);
    } catch (e: any) {
      console.warn('Error loading admin dashboard:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAdminData();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.roleTitle}>COLLEGE ADMINISTRATION</Text>
          <Text style={styles.greetingText}>{user?.name}</Text>
          <Text style={styles.headerSub}>Hostel & Mess Operations Supervision</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
        </TouchableOpacity>
      </View>

      {/* Hygiene Alert Banner if any flagged */}
      {hygieneCount > 0 && (
        <TouchableOpacity
          style={styles.alertBanner}
          onPress={() => navigation.navigate('HygieneAlerts')}
        >
          <Ionicons name="warning" size={24} color="#FFFFFF" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.alertTitle}>{hygieneCount} Hygiene Concerns Flagged</Text>
            <Text style={styles.alertSub}>Immediate inspection recommended. Tap to view reports.</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* Financial Overview Card */}
      <View style={styles.financeCard}>
        <Text style={styles.financeCardTitle}>MESS COLLECTIONS & REVENUE</Text>
        <Text style={styles.financeAmount}>
          ₹{financial?.total_revenue_rupees?.toFixed(2) || '0.00'}
        </Text>
        <Text style={styles.financePaise}>
          {financial?.total_revenue_paise || 0} paise recorded across {financial?.total_meals_served || 0} meals served
        </Text>
      </View>

      {/* Management Grid */}
      <Text style={styles.sectionTitle}>Administrative Modules</Text>
      <View style={styles.gridContainer}>
        <TouchableOpacity
          style={styles.gridItem}
          onPress={() => navigation.navigate('UserApprovals')}
        >
          <View style={[styles.iconBg, { backgroundColor: '#EFF6FF' }]}>
            <Ionicons name="people-outline" size={26} color={COLORS.primary} />
          </View>
          <Text style={styles.gridItemTitle}>User Approvals</Text>
          <Text style={styles.gridItemSub}>
            {pendingCount > 0 ? `${pendingCount} Pending` : 'All Approved'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.gridItem}
          onPress={() => navigation.navigate('HygieneAlerts')}
        >
          <View style={[styles.iconBg, { backgroundColor: '#FEE2E2' }]}>
            <Ionicons name="shield-outline" size={26} color={COLORS.danger} />
          </View>
          <Text style={styles.gridItemTitle}>Hygiene Alerts</Text>
          <Text style={[styles.gridItemSub, hygieneCount > 0 && { color: COLORS.danger, fontWeight: '700' }]}>
            {hygieneCount} Flagged
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.gridItem}
          onPress={() => navigation.navigate('AuditLogs')}
        >
          <View style={[styles.iconBg, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="document-text-outline" size={26} color={COLORS.warning} />
          </View>
          <Text style={styles.gridItemTitle}>Audit Trail</Text>
          <Text style={styles.gridItemSub}>Price changes & overrides</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.gridItem}
          onPress={() => onRefresh()}
        >
          <View style={[styles.iconBg, { backgroundColor: '#DCFCE7' }]}>
            <Ionicons name="cloud-done-outline" size={26} color={COLORS.success} />
          </View>
          <Text style={styles.gridItemTitle}>Cloud Sync</Text>
          <Text style={styles.gridItemSub}>SQLite & Backend</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  roleTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.8,
  },
  greetingText: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 2,
  },
  headerSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  logoutBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.danger,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
  },
  alertTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  alertSub: {
    color: '#FEE2E2',
    fontSize: 12,
    marginTop: 2,
  },
  financeCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 22,
    marginBottom: 24,
    elevation: 4,
  },
  financeCardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  financeAmount: {
    fontSize: 36,
    fontWeight: '900',
    color: '#38BDF8',
    marginVertical: 4,
  },
  financePaise: {
    fontSize: 12,
    color: '#CBD5E1',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: '48%',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  gridItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  gridItemSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});

