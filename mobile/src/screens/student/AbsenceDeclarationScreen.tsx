import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { AbsenceRequest } from '../../types';
import { COLORS } from '../../constants/config';
import { Ionicons } from '@expo/vector-icons';

export const AbsenceDeclarationScreen: React.FC = () => {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [meals, setMeals] = useState<string>('all');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [absences, setAbsences] = useState<AbsenceRequest[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Initialize with tomorrow's date format
  useEffect(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(today.getDate() + 3);

    setStartDate(tomorrow.toISOString().slice(0, 10));
    setEndDate(dayAfter.toISOString().slice(0, 10));

    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const list = await api.getMyAbsences(user?.id);
      setAbsences(list);
    } catch (e: any) {
      console.warn('Error loading absences:', e.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleDeclareAbsence = async () => {
    if (!startDate.trim() || !endDate.trim() || !reason.trim()) {
      Alert.alert('Incomplete Form', 'Please provide start date, end date, and reason.');
      return;
    }
    if (startDate > endDate) {
      Alert.alert('Invalid Date Range', 'Start date cannot be after end date.');
      return;
    }

    Alert.alert(
      'Confirm Absence Declaration',
      `Declare absence from ${startDate} to ${endDate}?\n\nNOTE: Any existing bookings in this date range will be automatically cancelled.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Cancel Bookings',
          style: 'destructive',
          onPress: async () => {
            setSubmitting(true);
            try {
              await api.declareAbsence({
                start_date: startDate.trim(),
                end_date: endDate.trim(),
                meals,
                reason: reason.trim(),
              });
              Alert.alert(
                'Absence Declared',
                'Your absence has been registered and associated meal slots have been cancelled in the manager demand view.'
              );
              setReason('');
              await loadHistory();
            } catch (err: any) {
              Alert.alert('Error', err.message);
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Absence Management</Text>
      <Text style={styles.subtitle}>
        Going home or attending an event? Declare your absence so the mess does not prepare excess food.
      </Text>

      {/* Declaration Form Card */}
      <View style={styles.formCard}>
        <Text style={styles.cardHeader}>Declare New Absence</Text>

        <View style={styles.dateRow}>
          <View style={styles.dateCol}>
            <Text style={styles.inputLabel}>Start Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.textInput}
              value={startDate}
              onChangeText={setStartDate}
              placeholder="2026-11-25"
            />
          </View>
          <View style={styles.dateCol}>
            <Text style={styles.inputLabel}>End Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.textInput}
              value={endDate}
              onChangeText={setEndDate}
              placeholder="2026-11-28"
            />
          </View>
        </View>

        {/* Meal Selection */}
        <Text style={styles.inputLabel}>Applicable Meals</Text>
        <View style={styles.mealOptionsRow}>
          {[
            { key: 'all', label: 'All Meals' },
            { key: 'breakfast,dinner', label: 'Breakfast & Dinner' },
            { key: 'lunch', label: 'Lunch Only' },
          ].map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.mealOptPill, meals === opt.key && styles.mealOptPillActive]}
              onPress={() => setMeals(opt.key)}
            >
              <Text style={[styles.mealOptText, meals === opt.key && styles.mealOptTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Reason */}
        <Text style={[styles.inputLabel, { marginTop: 12 }]}>Reason for Absence</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          placeholder="e.g. Attending college fest at IIT Kanpur / Weekend leave"
          placeholderTextColor="#94A3B8"
          value={reason}
          onChangeText={setReason}
          multiline
          numberOfLines={3}
        />

        <View style={styles.autoCancelNotice}>
          <Ionicons name="information-circle-outline" size={18} color={COLORS.primary} />
          <Text style={styles.noticeText}>
            Module 03 Rule: Bookings in this date range will be automatically cancelled and subtracted from the manager's preparation demand.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.btnDisabled]}
          onPress={handleDeclareAbsence}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="calendar-outline" size={18} color="#FFFFFF" />
              <Text style={styles.submitBtnText}>Submit Absence Request</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Past Absences */}
      <Text style={styles.historyTitle}>Your Declared Absences</Text>
      {loadingHistory ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />
      ) : absences.length === 0 ? (
        <Text style={styles.emptyText}>No absence requests declared.</Text>
      ) : (
        absences.map((item, idx) => (
          <View key={item.id || idx} style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <View style={styles.historyDateRange}>
                <Ionicons name="calendar" size={16} color={COLORS.primary} />
                <Text style={styles.historyDateText}>
                  {item.start_date} → {item.end_date}
                </Text>
              </View>
              <View style={styles.mealsBadge}>
                <Text style={styles.mealsBadgeText}>{item.meals.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.historyReason}>{item.reason}</Text>
          </View>
        ))
      )}
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
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
    marginBottom: 20,
    lineHeight: 18,
  },
  formCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 28,
  },
  cardHeader: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  dateCol: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    color: COLORS.text,
  },
  textArea: {
    height: 72,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  mealOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mealOptPill: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  mealOptPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  mealOptText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  mealOptTextActive: {
    color: '#FFFFFF',
  },
  autoCancelNotice: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: 10,
    gap: 8,
    marginTop: 14,
    marginBottom: 16,
  },
  noticeText: {
    fontSize: 11,
    color: COLORS.primaryDark,
    flex: 1,
    lineHeight: 16,
  },
  submitBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontStyle: 'italic',
  },
  historyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  historyDateRange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historyDateText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  mealsBadge: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  mealsBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
  historyReason: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
});

