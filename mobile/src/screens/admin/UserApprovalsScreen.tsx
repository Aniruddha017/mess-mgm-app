import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { api } from '../../services/api';
import { UserProfile } from '../../types';
import { COLORS } from '../../constants/config';
import { Ionicons } from '@expo/vector-icons';

export const UserApprovalsScreen: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (e: any) {
      console.warn('Error loading users:', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (userId: string, newStatus: string) => {
    setActionLoadingId(userId);
    try {
      await api.updateUserStatus(userId, newStatus);
      Alert.alert('Status Updated', `User account status set to ${newStatus}.`);
      await loadUsers();
    } catch (err: any) {
      Alert.alert('Update Failed', err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const renderUserItem = ({ item }: { item: UserProfile }) => {
    const isPending = item.status === 'pending_approval';
    const isActive = item.status === 'active';

    return (
      <View style={styles.userCard}>
        <View style={styles.userTopRow}>
          <View>
            <Text style={styles.userName}>{item.name}</Text>
            <Text style={styles.userEmail}>{item.email}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: isActive ? '#DCFCE7' : isPending ? '#FEF3C7' : '#FEE2E2',
              },
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                { color: isActive ? '#15803D' : isPending ? '#B45309' : COLORS.danger },
              ]}
            >
              {item.status.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>Role: {item.role.replace('_', ' ').toUpperCase()}</Text>
          <Text style={styles.metaText}>Diet: {item.dietary_pref?.toUpperCase()}</Text>
          <Text style={styles.metaText}>ID: {item.id}</Text>
        </View>

        <View style={styles.actionRow}>
          {isPending ? (
            <TouchableOpacity
              style={[styles.approveBtn, actionLoadingId === item.id && styles.btnDisabled]}
              onPress={() => handleUpdateStatus(item.id, 'active')}
              disabled={actionLoadingId === item.id}
            >
              <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" />
              <Text style={styles.approveBtnText}>Approve Account</Text>
            </TouchableOpacity>
          ) : isActive ? (
            <TouchableOpacity
              style={styles.suspendBtn}
              onPress={() => handleUpdateStatus(item.id, 'suspended')}
              disabled={actionLoadingId === item.id}
            >
              <Text style={styles.suspendBtnText}>Suspend</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.reApproveBtn}
              onPress={() => handleUpdateStatus(item.id, 'active')}
              disabled={actionLoadingId === item.id}
            >
              <Text style={styles.reApproveBtnText}>Re-activate</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>User Account Approvals</Text>
        <Text style={styles.headerSub}>Verify student registrations and mess manager privileges</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderUserItem}
          contentContainerStyle={styles.listContent}
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
  userCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  userTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  userEmail: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 12,
  },
  metaText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  actionRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  approveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  approveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  suspendBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  suspendBtnText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: '600',
  },
  reApproveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  reApproveBtnText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },
});

