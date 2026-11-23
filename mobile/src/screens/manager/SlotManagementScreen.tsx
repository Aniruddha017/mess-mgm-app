import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { api } from '../../services/api';
import { MealSlot, MealType } from '../../types';
import { COLORS } from '../../constants/config';
import { Ionicons } from '@expo/vector-icons';

export const SlotManagementScreen: React.FC = () => {
  const [slots, setSlots] = useState<MealSlot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [createModalVisible, setCreateModalVisible] = useState<boolean>(false);

  // Form state
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [menu, setMenu] = useState<string>('');
  const [dietaryTags, setDietaryTags] = useState<string>('Veg, High-Protein');
  const [priceRupees, setPriceRupees] = useState<string>('50');
  const [cutoffHours, setCutoffHours] = useState<string>('4');
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    loadSlots();
  }, []);

  const loadSlots = async () => {
    try {
      const data = await api.getSlots();
      setSlots(data);
    } catch (e: any) {
      console.warn('Error loading slots:', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSlot = async () => {
    if (!menu.trim() || !priceRupees.trim()) {
      Alert.alert('Incomplete Form', 'Please provide menu items and price.');
      return;
    }

    const pricePaise = Math.round(parseFloat(priceRupees) * 100);
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() + parseInt(cutoffHours || '4', 10));

    setSubmitting(true);
    try {
      await api.createSlot({
        date,
        meal_type: mealType,
        menu: menu.trim(),
        dietary_tags: dietaryTags.trim(),
        price_paise: pricePaise,
        cutoff_time: cutoffDate.toISOString(),
      });
      Alert.alert('Slot Published', `Successfully published ${mealType} for ${date} at ₹${priceRupees}.`);
      setCreateModalVisible(false);
      setMenu('');
      await loadSlots();
    } catch (err: any) {
      Alert.alert('Publish Error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Menu Planner & Slot Publisher</Text>
          <Text style={styles.headerSub}>Manage meal availability, prices, and cutoff times</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setCreateModalVisible(true)}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />
        ) : (
          slots.map((s) => (
            <View key={s.id} style={styles.slotCard}>
              <View style={styles.slotTopRow}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{s.meal_type.toUpperCase()}</Text>
                </View>
                <Text style={styles.slotDate}>{s.date}</Text>
                <Text style={styles.slotPrice}>₹{(s.price_paise / 100).toFixed(2)}</Text>
              </View>

              <Text style={styles.menuDesc}>{s.menu}</Text>

              <View style={styles.slotMetaRow}>
                <Text style={styles.metaTag}>{s.dietary_tags}</Text>
                <Text style={styles.metaCutoff}>
                  Cutoff: {new Date(s.cutoff_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Create Modal */}
      <Modal visible={createModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>Publish New Meal Slot</Text>
            <Text style={styles.modalSub}>
              Students will be able to book this slot until the cutoff deadline.
            </Text>

            <Text style={styles.inputLabel}>Date (YYYY-MM-DD)</Text>
            <TextInput style={styles.textInput} value={date} onChangeText={setDate} />

            <Text style={[styles.inputLabel, { marginTop: 12 }]}>Meal Type</Text>
            <View style={styles.pillsRow}>
              {(['breakfast', 'lunch', 'snacks', 'dinner'] as MealType[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.pill, mealType === t && styles.pillActive]}
                  onPress={() => setMealType(t)}
                >
                  <Text style={[styles.pillText, mealType === t && styles.pillTextActive]}>
                    {t.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.inputLabel, { marginTop: 12 }]}>Menu Description</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="e.g. Paneer Butter Masala, Dal Makhani, Rice, Chapati"
              placeholderTextColor="#94A3B8"
              value={menu}
              onChangeText={setMenu}
              multiline
            />

            <View style={styles.rowInputs}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Price in Rupees (₹)</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={priceRupees}
                  onChangeText={setPriceRupees}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Cutoff Hours from now</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={cutoffHours}
                  onChangeText={setCutoffHours}
                />
              </View>
            </View>

            <Text style={[styles.inputLabel, { marginTop: 12 }]}>Dietary Tags</Text>
            <TextInput
              style={styles.textInput}
              value={dietaryTags}
              onChangeText={setDietaryTags}
            />

            <View style={styles.auditWarningBox}>
              <Ionicons name="information-circle-outline" size={16} color={COLORS.primary} />
              <Text style={styles.auditWarningText}>
                Price changes and slot creations are permanently recorded in the audit_events table.
              </Text>
            </View>

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setCreateModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.publishBtn}
                onPress={handleCreateSlot}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.publishBtnText}>Publish Slot</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  headerSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
    gap: 12,
  },
  slotCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  slotTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
  slotDate: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  slotPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  menuDesc: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  slotMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaTag: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  metaCutoff: {
    fontSize: 11,
    color: COLORS.warning,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  modalSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 14,
    color: COLORS.text,
  },
  textArea: {
    height: 64,
    textAlignVertical: 'top',
    paddingTop: 8,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  auditWarningBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: 10,
    gap: 8,
    marginTop: 14,
  },
  auditWarningText: {
    fontSize: 11,
    color: COLORS.primaryDark,
    flex: 1,
    lineHeight: 15,
  },
  modalBtns: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  publishBtn: {
    flex: 1,
    height: 44,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  publishBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

