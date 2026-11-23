import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { api } from '../../services/api';
import { AuditEvent } from '../../types';
import { COLORS } from '../../constants/config';
import { Ionicons } from '@expo/vector-icons';

export const AuditLogsScreen: React.FC = () => {
  const [logs, setLogs] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const data = await api.getAuditLogs(100);
      setLogs(data);
    } catch (e: any) {
      console.warn('Error loading audit logs:', e.message);
    } finally {
      setLoading(false);
    }
  };

  const renderLogItem = ({ item }: { item: AuditEvent }) => (
    <View style={styles.logCard}>
      <View style={styles.logTopRow}>
        <View style={styles.actionBadge}>
          <Text style={styles.actionText}>{item.action.toUpperCase()}</Text>
        </View>
        <Text style={styles.timeText}>{new Date(item.timestamp).toLocaleString()}</Text>
      </View>

      <Text style={styles.actorText}>
        Actor: <Text style={styles.bold}>{item.actor_name || item.actor_id}</Text> ({item.actor_role})
      </Text>

      {item.details ? <Text style={styles.detailsText}>{item.details}</Text> : null}

      {item.old_value || item.new_value ? (
        <View style={styles.valDiffRow}>
          <Text style={styles.oldVal}>Old: {item.old_value}</Text>
          <Ionicons name="arrow-forward" size={12} color={COLORS.textMuted} />
          <Text style={styles.newVal}>New: {item.new_value}</Text>
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>System Audit Trail</Text>
        <Text style={styles.headerSub}>
          Section 7 & 8: Permanent log of price adjustments, approvals, and duplicate scan attempts
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderLogItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No audit events recorded.</Text>
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
    gap: 10,
  },
  logCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  logTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  actionBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  actionText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
  timeText: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  actorText: {
    fontSize: 12,
    color: COLORS.text,
    marginBottom: 4,
  },
  bold: {
    fontWeight: '700',
  },
  detailsText: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 16,
  },
  valDiffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    backgroundColor: COLORS.inputBg,
    padding: 6,
    borderRadius: 6,
  },
  oldVal: {
    fontSize: 11,
    color: COLORS.danger,
  },
  newVal: {
    fontSize: 11,
    color: COLORS.success,
    fontWeight: '700',
  },
  emptyText: {
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 30,
  },
});

