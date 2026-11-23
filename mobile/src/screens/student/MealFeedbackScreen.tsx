import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { MealBooking } from '../../types';
import { COLORS } from '../../constants/config';
import { Ionicons } from '@expo/vector-icons';

const ISSUE_TAGS = [
  'Cold Food',
  'Too Salty',
  'Hygiene Concern',
  'Late Service',
  'Under-cooked',
  'Great Taste',
  'Fresh & Hot',
  'Clean Dining',
];

export const MealFeedbackScreen: React.FC = () => {
  const { user } = useAuth();
  const [collectedBookings, setCollectedBookings] = useState<MealBooking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<MealBooking | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    loadCollectedMeals();
  }, []);

  const loadCollectedMeals = async () => {
    try {
      const all = await api.getMyBookings(user?.id);
      // Module 04: Only students with recorded collection can rate
      const collected = all.filter((b) => b.status === 'collected');
      setCollectedBookings(collected);
      if (collected.length > 0) {
        setSelectedBooking(collected[0]);
      }
    } catch (e: any) {
      console.warn('Load collected meals error:', e.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!selectedBooking) {
      Alert.alert('No Meal Selected', 'Please select a collected meal to rate.');
      return;
    }

    setSubmitting(true);
    try {
      const tagsString = selectedTags.join(', ');
      await api.submitFeedback({
        checkin_id: selectedBooking.id,
        rating,
        tags: tagsString,
        comment: comment.trim() || undefined,
      });

      const isHygiene = tagsString.toLowerCase().includes('hygiene') || comment.toLowerCase().includes('hygiene');

      Alert.alert(
        'Feedback Submitted',
        isHygiene
          ? 'Thank you! Your rating has been recorded anonymously for the Mess Manager. Because you flagged a Hygiene Concern, this issue was also immediately forwarded to the College Administrator.'
          : 'Thank you! Your feedback has been recorded anonymously to help improve mess food quality.'
      );

      // Reset
      setSelectedTags([]);
      setComment('');
      setRating(5);
    } catch (err: any) {
      Alert.alert('Feedback Error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Food Quality Feedback</Text>
      <Text style={styles.subtitle}>
        Rate your collected meals. Managers only see anonymous aggregate scores. Hygiene issues are flagged to College Admin.
      </Text>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : collectedBookings.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="restaurant-outline" size={48} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>No Collected Meals Yet</Text>
          <Text style={styles.emptyText}>
            According to Module 04 specifications, only meals with a verified counter QR check-in can be rated. Book and collect your meal to unlock feedback.
          </Text>
        </View>
      ) : (
        <View style={styles.feedbackCard}>
          {/* Select Collected Meal */}
          <Text style={styles.sectionLabel}>Select Collected Meal</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mealScroll}>
            {collectedBookings.map((b) => (
              <TouchableOpacity
                key={b.id}
                style={[styles.mealCard, selectedBooking?.id === b.id && styles.mealCardActive]}
                onPress={() => setSelectedBooking(b)}
              >
                <Text style={[styles.mealCardType, selectedBooking?.id === b.id && styles.whiteText]}>
                  {b.slot?.meal_type?.toUpperCase() || `Meal #${b.id}`}
                </Text>
                <Text style={[styles.mealCardDate, selectedBooking?.id === b.id && styles.whiteText]}>
                  {b.slot?.date || 'Past meal'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Star Rating */}
          <Text style={[styles.sectionLabel, { marginTop: 18 }]}>Your Rating (1 to 5 Stars)</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star)}>
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={36}
                  color={star <= rating ? '#F59E0B' : '#CBD5E1'}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Issue Tags */}
          <Text style={[styles.sectionLabel, { marginTop: 18 }]}>Select Tags (Optional)</Text>
          <View style={styles.tagsContainer}>
            {ISSUE_TAGS.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              const isHygiene = tag === 'Hygiene Concern';
              return (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.tagPill,
                    isSelected && (isHygiene ? styles.tagHygieneActive : styles.tagPillActive),
                  ]}
                  onPress={() => toggleTag(tag)}
                >
                  {isHygiene && <Ionicons name="warning-outline" size={12} color={isSelected ? '#FFFFFF' : COLORS.danger} />}
                  <Text
                    style={[
                      styles.tagText,
                      isSelected && styles.whiteText,
                      isHygiene && !isSelected && { color: COLORS.danger },
                    ]}
                  >
                    {tag}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Comments */}
          <Text style={[styles.sectionLabel, { marginTop: 18 }]}>Comment / Detailed Observation</Text>
          <TextInput
            style={styles.commentInput}
            placeholder="e.g. Rice was slightly cold, sabzi had great spices..."
            placeholderTextColor="#94A3B8"
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.btnDisabled]}
            onPress={handleSubmitFeedback}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="send-outline" size={18} color="#FFFFFF" />
                <Text style={styles.submitBtnText}>Submit Anonymous Rating</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
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
  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 12,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 6,
  },
  feedbackCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  mealScroll: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  mealCard: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    padding: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 110,
  },
  mealCardActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  mealCardType: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
  },
  mealCardDate: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  whiteText: {
    color: '#FFFFFF',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  },
  tagPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tagHygieneActive: {
    backgroundColor: COLORS.danger,
    borderColor: COLORS.danger,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  commentInput: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    height: 72,
    textAlignVertical: 'top',
    paddingTop: 10,
    fontSize: 14,
    color: COLORS.text,
  },
  submitBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
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
});

