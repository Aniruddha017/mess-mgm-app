import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { api } from '../../services/api';
import { MealFeedback } from '../../types';
import { COLORS } from '../../constants/config';
import { Ionicons } from '@expo/vector-icons';

export const HygieneAlertsScreen: React.FC = () => {
  const [alerts, setAlerts] = useState<MealFeedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const data = await api.getHygieneAlerts();
      setAlerts(data);
    } catch (e: any) {
      console.warn('Error loading alerts:', e.message);
    } finally {
      setLoading(false);
    }
  };

  const renderAlertCard = ({ item }: { item: MealFeedback }) => (
    <View style={styles.alertCard}>
      <View style={styles.alertHeader}>
        <View style={styles.flagBadge}>
          <Ionicons name="warning" size={14} color="#FFFFFF" />
          <Text style={styles.flagBadgeText}>HYGIENE CONCERN</Text>
        </View>
        <Text style={styles.alertDate}>{item.created_at?.slice(0, 10)}</Text>
      </View>

      <Text style={styles.ratingText}>
        Student Rating: {item.rating} / 5 Stars
      </Text>

      <View style={styles.tagsContainer}>
        {item.tags?.split(',').map((t, i) => (
          <View key={i} style={styles.tagPill}>
            <Text style={styles.tagPillText}>{t.trim()}</Text>
          </View>
        ))}
      </View>

      {item.comment ? (
        <View style={styles.commentBox}>
          <Text style={styles.commentText}>"{item.comment}"</Text>
        </View>
      ) : null}

      <Text style={styles.bookingRef}>Checkin ID Ref: #{item.checkin_id}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Flagged Hygiene Reports</Text>
        <Text style={styles.headerSub}>
          Module 04: Food quality and sanitary tags auto-forwarded to College Admin
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          renderItem={renderAlertCard}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="checkmark-done-circle-outline" size={48} color={COLORS.success} />
              <Text style={styles.emptyTitle}>No Active Hygiene Concerns</Text>
              <Text style={styles.emptySub}>All mess food quality and cleanliness standards are satisfied.</Text>
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
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  headerSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  alertCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.danger,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  flagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.danger,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  flagBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  alertDate: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  tagPill: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagPillText: {
    fontSize: 11,
    color: COLORS.danger,
    fontWeight: '600',
  },
  commentBox: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 8,
    padding: 10,
    marginVertical: 4,
  },
  commentText: {
    fontSize: 13,
    color: COLORS.text,
    fontStyle: 'italic',
  },
  bookingRef: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 6,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 50,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  emptySub: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});

