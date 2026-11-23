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
import { DemandSummaryItem } from '../../types';
import { COLORS } from '../../constants/config';
import { Ionicons } from '@expo/vector-icons';

export const ManagerDashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, isOnline, logout } = useAuth();
  const [demandSummary, setDemandSummary] = useState<DemandSummaryItem[]>([]);
  const [reportDate, setReportDate] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    loadDemand();
  }, []);

  const loadDemand = async () => {
    try {
      const data = await api.getDemandReport();
      setDemandSummary(data.demand_summary);
      setReportDate(data.date);
    } catch (e: any) {
      console.warn('Error loading demand report:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDemand();
  };

  // Aggregates
  const totalExpected = demandSummary.reduce((acc, curr) => acc + curr.expected_headcount, 0);
  const totalCollected = demandSummary.reduce((acc, curr) => acc + curr.actually_collected, 0);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.roleTitle}>MESS MANAGER DASHBOARD</Text>
          <Text style={styles.greetingText}>Welcome, {user?.name}</Text>
          <Text style={styles.dateSubtext}>Demand & Preparation Planning for {reportDate || 'Today'}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
        </TouchableOpacity>
      </View>

      {/* Primary Action: QR Scanner */}
      <TouchableOpacity
        style={styles.scannerHeroBtn}
        onPress={() => navigation.navigate('QRScanner')}
      >
        <View style={styles.scannerIconBg}>
          <Ionicons name="qr-code-outline" size={32} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.scannerHeroTitle}>Open Counter QR Scanner</Text>
          <Text style={styles.scannerHeroSubtitle}>
            Scan student meal passes or enter manual backup code
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Aggregate Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statVal}>{totalExpected}</Text>
          <Text style={styles.statLbl}>Expected Headcount</Text>
        </View>
        <View style={[styles.statCard, { borderColor: COLORS.success }]}>
          <Text style={[styles.statVal, { color: COLORS.success }]}>{totalCollected}</Text>
          <Text style={styles.statLbl}>Meals Collected</Text>
        </View>
      </View>

      {/* Live Meal Slots Demand Breakdown */}
      <Text style={styles.sectionHeader}>Preparation Demand per Meal Slot</Text>
      <Text style={styles.sectionSub}>
        Calculated from confirmed bookings minus declared absences (Module 01 & 03)
      </Text>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />
      ) : demandSummary.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No meal slots published for today.</Text>
        </View>
      ) : (
        demandSummary.map((slot) => (
          <View key={slot.slot_id} style={styles.demandCard}>
            <View style={styles.slotTopRow}>
              <View style={styles.mealBadge}>
                <Ionicons name="restaurant-outline" size={16} color={COLORS.primary} />
                <Text style={styles.mealBadgeText}>{slot.meal_type}</Text>
              </View>
              <Text style={styles.slotPriceText}>₹{slot.price_rupees.toFixed(2)}</Text>
            </View>

            <Text style={styles.menuText}>{slot.menu}</Text>

            {/* Demand Breakdown Metrics Grid */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <Text style={styles.metricItemVal}>{slot.total_booked}</Text>
                <Text style={styles.metricItemLbl}>Booked</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={[styles.metricItemVal, { color: COLORS.warning }]}>
                  -{slot.absences_declared}
                </Text>
                <Text style={styles.metricItemLbl}>Absences</Text>
              </View>
              <View style={[styles.metricItem, styles.metricHighlight]}>
                <Text style={[styles.metricItemVal, { color: COLORS.primary, fontWeight: '900' }]}>
                  {slot.expected_headcount}
                </Text>
                <Text style={[styles.metricItemLbl, { fontWeight: '700', color: COLORS.primary }]}>
                  To Prepare
                </Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={[styles.metricItemVal, { color: COLORS.success }]}>
                  {slot.actually_collected}
                </Text>
                <Text style={styles.metricItemLbl}>Collected</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={[styles.metricItemVal, { color: COLORS.danger }]}>
                  {slot.no_shows}
                </Text>
                <Text style={styles.metricItemLbl}>No-Shows</Text>
              </View>
            </View>
          </View>
        ))
      )}

      {/* Navigation Shortcuts */}
      <View style={styles.shortcutsRow}>
        <TouchableOpacity
          style={styles.shortcutBtn}
          onPress={() => navigation.navigate('SlotManagement')}
        >
          <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
          <Text style={styles.shortcutBtnText}>Manage Slots & Menus</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.shortcutBtn}
          onPress={() => navigation.navigate('ManagerFeedback')}
        >
          <Ionicons name="star-outline" size={20} color={COLORS.accent} />
          <Text style={styles.shortcutBtnText}>View Student Feedback</Text>
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
  dateSubtext: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  logoutBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
  },
  scannerHeroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 18,
    padding: 18,
    elevation: 4,
    gap: 14,
    marginBottom: 20,
  },
  scannerIconBg: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerHeroTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  scannerHeroSubtitle: {
    color: '#BFDBFE',
    fontSize: 12,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.text,
  },
  statLbl: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
  },
  sectionSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    marginBottom: 14,
  },
  emptyBox: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  demandCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  slotTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  mealBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mealBadgeText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
  },
  slotPriceText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  menuText: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 12,
    lineHeight: 18,
  },
  metricsGrid: {
    flexDirection: 'row',
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    paddingVertical: 10,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricHighlight: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metricItemVal: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  metricItemLbl: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  shortcutsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  shortcutBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  shortcutBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
});

