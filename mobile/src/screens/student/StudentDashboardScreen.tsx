import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { MealSlot, MealBooking } from '../../types';
import { COLORS } from '../../constants/config';
import { Ionicons } from '@expo/vector-icons';

export const StudentDashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, isOnline, syncWithCloud, logout } = useAuth();
  const [slots, setSlots] = useState<MealSlot[]>([]);
  const [bookings, setBookings] = useState<MealBooking[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [fetchedSlots, fetchedBookings] = await Promise.all([
        api.getSlots(),
        api.getMyBookings(user?.id),
      ]);
      setSlots(fetchedSlots);
      setBookings(fetchedBookings);
    } catch (e: any) {
      console.warn('Load data error:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await syncWithCloud();
    await loadData();
  };

  const handleBookSlot = async (slotId: number) => {
    setActionLoadingId(slotId);
    try {
      await api.createBooking(slotId);
      Alert.alert('Booking Confirmed', 'Your meal has been booked! You can show your rotating QR at the counter.');
      await loadData();
    } catch (err: any) {
      Alert.alert('Booking Failed', err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    Alert.alert(
      'Cancel Meal',
      'Are you sure you want to cancel this booking? This must be before the cutoff.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setActionLoadingId(bookingId);
            try {
              await api.cancelBooking(bookingId);
              Alert.alert('Cancelled', 'Your meal booking was successfully cancelled.');
              await loadData();
            } catch (err: any) {
              Alert.alert('Cancellation Error', err.message);
            } finally {
              setActionLoadingId(null);
            }
          },
        },
      ]
    );
  };

  // Find active booking to show quick QR pass button
  const activeBooking = bookings.find((b) => b.status === 'booked');

  const formatCutoff = (cutoffStr: string) => {
    try {
      const d = new Date(cutoffStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return cutoffStr;
    }
  };

  const renderSlotCard = ({ item }: { item: MealSlot }) => {
    const isBooked = item.booked_by_user && item.booking_status === 'booked';
    const isCollected = item.booking_status === 'collected';
    const isPast = item.is_cutoff_passed;

    return (
      <View style={[styles.slotCard, isBooked && styles.slotCardBooked]}>
        <View style={styles.slotHeader}>
          <View style={styles.mealTypeContainer}>
            <Ionicons
              name={
                item.meal_type === 'breakfast'
                  ? 'sunny-outline'
                  : item.meal_type === 'lunch'
                  ? 'restaurant-outline'
                  : item.meal_type === 'snacks'
                  ? 'cafe-outline'
                  : 'moon-outline'
              }
              size={20}
              color={COLORS.primary}
            />
            <Text style={styles.mealTypeText}>{item.meal_type.toUpperCase()}</Text>
          </View>
          <Text style={styles.slotDate}>{item.date}</Text>
        </View>

        <Text style={styles.menuText}>{item.menu}</Text>

        <View style={styles.tagsRow}>
          <View style={styles.priceBadge}>
            <Text style={styles.priceText}>₹{(item.price_paise / 100).toFixed(2)}</Text>
          </View>
          {item.dietary_tags ? (
            <View style={styles.dietaryBadge}>
              <Text style={styles.dietaryText}>{item.dietary_tags}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.cutoffRow}>
          <Ionicons name="time-outline" size={14} color={isPast ? COLORS.danger : COLORS.textMuted} />
          <Text style={[styles.cutoffText, isPast && { color: COLORS.danger }]}>
            {isPast ? 'Booking Cutoff Passed' : `Cutoff: ${formatCutoff(item.cutoff_time)}`}
          </Text>
        </View>

        {/* Action Button */}
        <View style={styles.cardActions}>
          {isCollected ? (
            <View style={styles.collectedBadge}>
              <Ionicons name="checkmark-done-circle" size={18} color={COLORS.success} />
              <Text style={styles.collectedText}>Collected & Billed</Text>
            </View>
          ) : isBooked ? (
            <View style={styles.bookedActionRow}>
              <TouchableOpacity
                style={styles.qrPassBtn}
                onPress={() => navigation.navigate('QRPass', { bookingId: item.booking_id, slot: item })}
              >
                <Ionicons name="qr-code-outline" size={18} color="#FFFFFF" />
                <Text style={styles.qrPassBtnText}>Show QR Pass</Text>
              </TouchableOpacity>

              {!isPast && (
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => handleCancelBooking(item.booking_id!)}
                  disabled={actionLoadingId === item.booking_id}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.bookBtn, isPast && styles.btnDisabled]}
              onPress={() => handleBookSlot(item.id)}
              disabled={isPast || actionLoadingId === item.id}
            >
              {actionLoadingId === item.id ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.bookBtnText}>{isPast ? 'Cutoff Closed' : 'Book This Meal'}</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Banner */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greetingText}>Hello, {user?.name}</Text>
          <View style={styles.statusRow}>
            <View style={[styles.onlineDot, { backgroundColor: isOnline ? COLORS.success : COLORS.warning }]} />
            <Text style={styles.rollText}>
              Roll: {user?.id} • {user?.dietary_pref?.toUpperCase()} • {isOnline ? 'Online (Synced)' : 'Offline (SQLite)'}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutIconBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={22} color={COLORS.danger} />
        </TouchableOpacity>
      </View>

      {/* Quick QR Bar if active booking exists */}
      {activeBooking && (
        <TouchableOpacity
          style={styles.activePassBanner}
          onPress={() => navigation.navigate('QRPass', { bookingId: activeBooking.id, slot: activeBooking.slot })}
        >
          <Ionicons name="qr-code" size={28} color="#FFFFFF" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.bannerTitle}>Active Meal Pass Ready</Text>
            <Text style={styles.bannerSubtitle}>Tap to show counter check-in QR code</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* Main List */}
      <View style={styles.listHeader}>
        <Text style={styles.sectionTitle}>Mess Meal Schedule</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.syncBtn}>
          <Ionicons name="sync-outline" size={16} color={COLORS.primary} />
          <Text style={styles.syncBtnText}>Sync</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading meal schedule...</Text>
        </View>
      ) : (
        <FlatList
          data={slots}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderSlotCard}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="fast-food-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No meal slots published yet.</Text>
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  greetingText: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  rollText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  logoutIconBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
  },
  activePassBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    margin: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 16,
    elevation: 3,
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  bannerSubtitle: {
    color: '#BFDBFE',
    fontSize: 12,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  syncBtnText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
    gap: 12,
  },
  slotCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  slotCardBooked: {
    borderColor: COLORS.primary,
    borderWidth: 1.5,
    backgroundColor: '#F8FAFF',
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mealTypeText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  slotDate: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  menuText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
    fontWeight: '500',
    marginBottom: 10,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  priceBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  priceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  dietaryBadge: {
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dietaryText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  cutoffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  cutoffText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  cardActions: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  bookBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  btnDisabled: {
    backgroundColor: '#94A3B8',
  },
  bookBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  bookedActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  qrPassBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.vegBadge,
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  qrPassBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.danger,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: COLORS.danger,
    fontWeight: '600',
    fontSize: 13,
  },
  collectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    paddingVertical: 6,
  },
  collectedText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.success,
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
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
});

