import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { MonthlyBillSummary, BillItem } from '../../types';
import { COLORS } from '../../constants/config';
import { Ionicons } from '@expo/vector-icons';

export const StudentBillingScreen: React.FC = () => {
  const { user } = useAuth();
  const [billSummary, setBillSummary] = useState<MonthlyBillSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    loadBill();
  }, []);

  const loadBill = async () => {
    try {
      const data = await api.getMyBill(undefined, user?.id);
      setBillSummary(data);
    } catch (e: any) {
      console.warn('Error loading bill:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadBill();
  };

  const renderBillItem = ({ item }: { item: BillItem }) => (
    <View style={styles.billItemCard}>
      <View style={styles.billItemLeft}>
        <View style={styles.mealIconCircle}>
          <Ionicons name="fast-food-outline" size={18} color={COLORS.primary} />
        </View>
        <View>
          <Text style={styles.itemMealType}>{item.meal_type || 'Meal Collection'}</Text>
          <Text style={styles.itemDate}>{item.meal_date || item.created_at?.slice(0, 10)}</Text>
        </View>
      </View>
      <View style={styles.billItemRight}>
        <Text style={styles.itemPrice}>₹{(item.price_paise / 100).toFixed(2)}</Text>
        <Text style={styles.itemPaise}>({item.price_paise} paise)</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Top Banner */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mess Billing Statement</Text>
        <Text style={styles.headerSubtitle}>
          Itemized charges from recorded check-ins with frozen price snapshots.
        </Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Generating itemized bill...</Text>
        </View>
      ) : (
        <FlatList
          data={billSummary?.items || []}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderBillItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListHeaderComponent={
            <View style={styles.summaryCard}>
              <View style={styles.summaryTopRow}>
                <Text style={styles.periodLabel}>BILLING PERIOD: {billSummary?.period}</Text>
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
                  <Text style={styles.verifiedText}>Verified Collections</Text>
                </View>
              </View>

              <View style={styles.amountContainer}>
                <Text style={styles.currencySymbol}>₹</Text>
                <Text style={styles.totalAmount}>
                  {billSummary?.total_amount_rupees?.toFixed(2) || '0.00'}
                </Text>
              </View>
              <Text style={styles.paiseSubtext}>
                Total: {billSummary?.total_amount_paise || 0} paise (Stored as exact integer paise)
              </Text>

              <View style={styles.summaryMetricsRow}>
                <View style={styles.metricCol}>
                  <Text style={styles.metricVal}>{billSummary?.total_meals || 0}</Text>
                  <Text style={styles.metricLbl}>Meals Served</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.metricCol}>
                  <Text style={styles.metricVal}>
                    ₹
                    {billSummary && billSummary.total_meals > 0
                      ? (billSummary.total_amount_rupees / billSummary.total_meals).toFixed(1)
                      : '0'}
                  </Text>
                  <Text style={styles.metricLbl}>Avg / Meal</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.metricCol}>
                  <Text style={styles.metricVal}>Active</Text>
                  <Text style={styles.metricLbl}>Status</Text>
                </View>
              </View>

              <View style={styles.auditFreezeNotice}>
                <Ionicons name="lock-closed-outline" size={14} color={COLORS.textMuted} />
                <Text style={styles.auditNoticeText}>
                  Section 7 Rule: Each bill item records the frozen price at check-in time. Subsequent price changes will not alter past statements.
                </Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={44} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No meal collections recorded this period.</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  listContent: {
    padding: 16,
    gap: 10,
  },
  summaryCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  periodLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#BFDBFE',
    letterSpacing: 0.5,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  verifiedText: {
    color: '#A7F3D0',
    fontSize: 10,
    fontWeight: '700',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 4,
  },
  totalAmount: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  paiseSubtext: {
    fontSize: 12,
    color: '#BFDBFE',
    marginBottom: 16,
  },
  summaryMetricsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    paddingVertical: 12,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  metricCol: {
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  metricLbl: {
    fontSize: 11,
    color: '#BFDBFE',
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  auditFreezeNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 10,
    borderRadius: 10,
    gap: 6,
    marginTop: 14,
  },
  auditNoticeText: {
    fontSize: 10,
    color: '#E2E8F0',
    flex: 1,
    lineHeight: 14,
  },
  billItemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  billItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mealIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemMealType: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  itemDate: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  billItemRight: {
    alignItems: 'flex-end',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  itemPaise: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.textMuted,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
});

