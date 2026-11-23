import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { api } from '../../services/api';
import { COLORS } from '../../constants/config';
import { Ionicons } from '@expo/vector-icons';

export const ManagerFeedbackScreen: React.FC = () => {
  const [summary, setSummary] = useState<{
    average_rating: number;
    total_reviews: number;
    tag_breakdown: Record<string, number>;
    recent_reviews: any[];
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    loadFeedback();
  }, []);

  const loadFeedback = async () => {
    try {
      const data = await api.getFeedbackSummary();
      setSummary(data);
    } catch (e: any) {
      console.warn('Error loading feedback:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadFeedback();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Anonymous Student Feedback</Text>
        <Text style={styles.headerSub}>
          Aggregated scores & food quality ratings (Module 04 Specification)
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : summary ? (
        <>
          {/* Rating Summary Card */}
          <View style={styles.ratingCard}>
            <View style={styles.ratingScoreCol}>
              <Text style={styles.bigScore}>{summary.average_rating.toFixed(1)}</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={star <= Math.round(summary.average_rating) ? 'star' : 'star-outline'}
                    size={18}
                    color="#F59E0B"
                  />
                ))}
              </View>
              <Text style={styles.totalReviewsText}>{summary.total_reviews} Total Reviews</Text>
            </View>

            <View style={styles.anonymousBadge}>
              <Ionicons name="eye-off-outline" size={16} color={COLORS.primary} />
              <Text style={styles.anonymousBadgeText}>
                Student identities are anonymized to encourage candid reviews.
              </Text>
            </View>
          </View>

          {/* Issue Tag Breakdown */}
          <Text style={styles.sectionTitle}>Frequently Tagged Observations</Text>
          <View style={styles.tagsContainer}>
            {Object.keys(summary.tag_breakdown).length === 0 ? (
              <Text style={styles.emptyText}>No tags recorded yet.</Text>
            ) : (
              Object.entries(summary.tag_breakdown).map(([tag, count]) => (
                <View key={tag} style={styles.tagBadge}>
                  <Text style={styles.tagBadgeText}>{tag}</Text>
                  <View style={styles.tagCountCircle}>
                    <Text style={styles.tagCountText}>{count}</Text>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Recent Comments */}
          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Recent Comments</Text>
          {summary.recent_reviews.length === 0 ? (
            <Text style={styles.emptyText}>No comments recorded.</Text>
          ) : (
            summary.recent_reviews.map((rev) => (
              <View key={rev.id} style={styles.reviewCard}>
                <View style={styles.reviewTopRow}>
                  <View style={styles.starSmallRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name={star <= rev.rating ? 'star' : 'star-outline'}
                        size={14}
                        color="#F59E0B"
                      />
                    ))}
                  </View>
                  <Text style={styles.reviewDate}>{rev.created_at?.slice(0, 10)}</Text>
                </View>
                {rev.tags ? <Text style={styles.reviewTags}>Tags: {rev.tags}</Text> : null}
                {rev.comment ? <Text style={styles.reviewComment}>{rev.comment}</Text> : null}
              </View>
            ))
          )}
        </>
      ) : null}
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
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
  headerSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  ratingCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    marginBottom: 20,
  },
  ratingScoreCol: {
    alignItems: 'center',
  },
  bigScore: {
    fontSize: 48,
    fontWeight: '900',
    color: COLORS.text,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 4,
    marginVertical: 4,
  },
  totalReviewsText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  anonymousBadge: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 10,
    gap: 8,
    marginTop: 14,
    alignItems: 'center',
  },
  anonymousBadgeText: {
    fontSize: 11,
    color: COLORS.primaryDark,
    flex: 1,
    lineHeight: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 10,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  tagBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  tagCountCircle: {
    backgroundColor: '#E0E7FF',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontStyle: 'italic',
  },
  reviewCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  reviewTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  starSmallRow: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewDate: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  reviewTags: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 4,
  },
  reviewComment: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 18,
  },
});

