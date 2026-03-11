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
  onCompare: (items: HistoryItem[]) => void;
}

export default function HistoryScreen({ onSelectItem, onCompare }: HistoryScreenProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

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

  const toggleSelectionMode = () => {
    if (selectionMode) {
      // Exiting selection mode
      setSelectedItems(new Set());
    }
    setSelectionMode(!selectionMode);
  };

  const toggleItemSelection = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else if (newSelected.size < 3) {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleCompareNow = () => {
    const itemsToCompare = history.filter(item => selectedItems.has(item.id));
    if (itemsToCompare.length >= 2) {
      onCompare(itemsToCompare);
      // Reset selection state
      setSelectionMode(false);
      setSelectedItems(new Set());
    }
  };

  const handleItemPress = (item: HistoryItem) => {
    if (selectionMode) {
      toggleItemSelection(item.id);
    } else {
      onSelectItem(item);
    }
  };

  const renderItem = ({ item }: { item: HistoryItem }) => {
    const tierColor = TIER_COLORS[item.tier as TierType] || '#64748b';
    const isSelected = selectedItems.has(item.id);
    
    return (
      <TouchableOpacity 
        style={[
          styles.historyItem,
          selectionMode && styles.historyItemSelectable,
          isSelected && styles.historyItemSelected,
        ]}
        onPress={() => handleItemPress(item)}
      >
        {selectionMode && (
          <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
            {isSelected && <Text style={styles.checkmark}>✓</Text>}
          </View>
        )}
        <View style={styles.itemContent}>
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
      {/* Compare Mode Header */}
      <View style={styles.modeHeader}>
        <TouchableOpacity 
          style={[styles.compareToggle, selectionMode && styles.compareToggleActive]}
          onPress={toggleSelectionMode}
        >
          <Text style={[styles.compareToggleText, selectionMode && styles.compareToggleTextActive]}>
            {selectionMode ? 'Cancel' : '⚖️ Compare'}
          </Text>
        </TouchableOpacity>
        {selectionMode && (
          <Text style={styles.selectionHint}>
            Select 2-3 vendors ({selectedItems.size} selected)
          </Text>
        )}
      </View>

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

      {/* Compare Now Button */}
      {selectionMode && selectedItems.size >= 2 && (
        <View style={styles.compareButtonContainer}>
          <TouchableOpacity 
            style={styles.compareButton}
            onPress={handleCompareNow}
          >
            <Text style={styles.compareButtonText}>
              Compare Now ({selectedItems.size})
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  modeHeader: {
    padding: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compareToggle: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  compareToggleActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  compareToggleText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  compareToggleTextActive: {
    color: '#ffffff',
  },
  selectionHint: {
    color: '#64748b',
    fontSize: 12,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  historyItem: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyItemSelectable: {
    borderWidth: 2,
    borderColor: 'transparent',
  },
  historyItemSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#1e3a5f',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#64748b',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemContent: {
    flex: 1,
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
  compareButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  compareButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  compareButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});
