import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HistoryItem, TIER_COLORS, TierType, DISCLAIMER } from '../types';

interface HistoryScreenProps {
  onSelectItem: (item: HistoryItem) => void;
}

export default function HistoryScreen({ onSelectItem }: HistoryScreenProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem('pepcheck_history');
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderItem = ({ item }: { item: HistoryItem }) => {
    const tierColor = TIER_COLORS[item.tier as TierType] || '#64748b';
    
    return (
      <TouchableOpacity 
        style={styles.historyItem}
        onPress={() => onSelectItem(item)}
      >
        <View style={styles.itemHeader}>
          <Text style={styles.domain} numberOfLines={1}>{item.domain}</Text>
          <View style={[styles.tierBadge, { backgroundColor: tierColor }]}>
            <Text style={styles.tierText}>{item.tier}</Text>
          </View>
        </View>
        <View style={styles.itemFooter}>
          <Text style={[styles.score, { color: tierColor }]}>
            Score: {item.trust_score}
          </Text>
          <Text style={styles.date}>{formatDate(item.analysed_at)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (history.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📋</Text>
        <Text style={styles.emptyTitle}>No analyses yet</Text>
        <Text style={styles.emptyText}>
          Paste a vendor URL to get started.
        </Text>
        <Text style={styles.disclaimer}>{DISCLAIMER}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={history}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#94a3b8"
          />
        }
        ListFooterComponent={
          <Text style={styles.disclaimer}>{DISCLAIMER}</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  listContent: {
    padding: 16,
  },
  historyItem: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  domain: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e2e8f0',
    flex: 1,
    marginRight: 12,
  },
  tierBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tierText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  score: {
    fontSize: 14,
    fontWeight: '600',
  },
  date: {
    fontSize: 12,
    color: '#64748b',
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 40,
  },
  disclaimer: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 16,
    paddingVertical: 20,
  },
});
