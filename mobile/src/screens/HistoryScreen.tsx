import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HistoryItem, COLORS, getRiskColor, getRiskIcon, inferRiskLevel } from '../types';
import { getHistory, getUniquePeptides, deleteHistoryItem } from '../services/api';

interface HistoryScreenProps {
  onSelectItem: (item: HistoryItem) => void;
  onCompare: (items: HistoryItem[], peptideName: string) => void;
}

export default function HistoryScreen({ onSelectItem, onCompare }: HistoryScreenProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<HistoryItem[]>([]);
  const [peptides, setPeptides] = useState<string[]>([]);
  const [selectedPeptide, setSelectedPeptide] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const loadHistory = useCallback(async () => {
    try {
      const [historyData, peptideData] = await Promise.all([
        getHistory(),
        getUniquePeptides(),
      ]);
      setHistory(historyData);
      setPeptides(peptideData);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Filter history based on search and peptide filter
  useEffect(() => {
    let filtered = history;

    // Apply peptide filter
    if (selectedPeptide) {
      filtered = filtered.filter(
        item => item.peptide_name.toLowerCase() === selectedPeptide.toLowerCase()
      );
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        item =>
          item.brand_name?.toLowerCase().includes(query) ||
          item.peptide_name?.toLowerCase().includes(query) ||
          item.domain.toLowerCase().includes(query)
      );
    }

    setFilteredHistory(filtered);
  }, [history, selectedPeptide, searchQuery]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadHistory();
  }, [loadHistory]);

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const handleCompare = () => {
    const items = filteredHistory.filter(item => selectedItems.has(item.id));
    if (items.length < 2) {
      Alert.alert('Select More', 'Please select at least 2 items to compare.');
      return;
    }

    // Check if all selected items are the same peptide
    const peptides = new Set(items.map(item => item.peptide_name.toLowerCase()));
    if (peptides.size > 1) {
      Alert.alert(
        'Different Peptides',
        'For a meaningful comparison, please select vendors selling the same peptide. Use the peptide filter to narrow your selection.',
        [{ text: 'OK' }]
      );
      return;
    }

    const peptideName = items[0].peptide_name;
    setSelectionMode(false);
    setSelectedItems(new Set());
    onCompare(items, peptideName);
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Delete Analysis',
      'Are you sure you want to delete this analysis?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteHistoryItem(id);
            loadHistory();
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Group items by date
  const groupedHistory = filteredHistory.reduce((groups, item) => {
    const date = formatDate(item.analysed_at);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(item);
    return groups;
  }, {} as Record<string, HistoryItem[]>);

  const sections = Object.entries(groupedHistory);

  const renderItem = ({ item }: { item: HistoryItem }) => {
    const isSelected = selectedItems.has(item.id);
    // Handle legacy data that might not have risk_level
    const riskLevel = item.risk_level || inferRiskLevel(item.trust_score);
    const riskColor = getRiskColor(riskLevel);

    return (
      <TouchableOpacity
        style={[styles.historyItem, isSelected && styles.historyItemSelected]}
        onPress={() => {
          if (selectionMode) {
            toggleSelection(item.id);
          } else {
            onSelectItem(item);
          }
        }}
        onLongPress={() => {
          if (!selectionMode) {
            setSelectionMode(true);
            toggleSelection(item.id);
          }
        }}
        activeOpacity={0.7}
      >
        {selectionMode && (
          <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
            {isSelected && <Text style={styles.checkmark}>✓</Text>}
          </View>
        )}
        
        <View style={styles.itemContent}>
          <View style={styles.itemHeader}>
            <Text style={styles.brandName}>{item.brand_name || item.domain}</Text>
            <View style={styles.scoreContainer}>
              <Text style={[styles.score, { color: riskColor }]}>{item.trust_score}</Text>
              <Text style={styles.pts}>pts</Text>
            </View>
          </View>
          
          <Text style={styles.peptideName}>{item.peptide_name}</Text>
          
          <View style={styles.itemFooter}>
            <View style={styles.riskBadge}>
              <Text style={styles.riskText}>
                {getRiskIcon(riskLevel)} {riskLevel} Risk
              </Text>
            </View>
            <Text style={styles.time}>{formatTime(item.analysed_at)}</Text>
          </View>
        </View>
        
        {!selectionMode && <Text style={styles.chevron}>›</Text>}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (history.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No History Yet</Text>
          <Text style={styles.emptySubtitle}>
            Your analysed vendors will appear here
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search brands or peptides..."
          placeholderTextColor={COLORS.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Peptide Filter */}
      {peptides.length > 0 && (
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterPill, !selectedPeptide && styles.filterPillActive]}
            onPress={() => setSelectedPeptide(null)}
          >
            <Text style={[styles.filterText, !selectedPeptide && styles.filterTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          {peptides.map(peptide => (
            <TouchableOpacity
              key={peptide}
              style={[styles.filterPill, selectedPeptide === peptide && styles.filterPillActive]}
              onPress={() => setSelectedPeptide(selectedPeptide === peptide ? null : peptide)}
            >
              <Text style={[styles.filterText, selectedPeptide === peptide && styles.filterTextActive]}>
                {peptide}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Selection Mode Header */}
      {selectionMode && (
        <View style={styles.selectionHeader}>
          <TouchableOpacity onPress={() => {
            setSelectionMode(false);
            setSelectedItems(new Set());
          }}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.selectedCount}>
            {selectedItems.size} selected
          </Text>
          <TouchableOpacity
            style={[styles.compareButton, selectedItems.size < 2 && styles.compareButtonDisabled]}
            onPress={handleCompare}
            disabled={selectedItems.size < 2}
          >
            <Text style={styles.compareButtonText}>Compare</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* History List */}
      <FlatList
        data={filteredHistory}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.accent}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Results</Text>
            <Text style={styles.emptySubtitle}>
              Try adjusting your filters
            </Text>
          </View>
        }
      />

      {/* Compare Button (when not in selection mode) */}
      {!selectionMode && filteredHistory.length >= 2 && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.startCompareButton}
            onPress={() => setSelectionMode(true)}
          >
            <Text style={styles.startCompareText}>
              Select to Compare
            </Text>
            <Text style={styles.startCompareHint}>
              Long-press any item or tap here
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchInput: {
    backgroundColor: COLORS.bgTertiary,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.surface,
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
  filterPill: {
    backgroundColor: COLORS.bgSecondary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.surface,
  },
  filterPillActive: {
    backgroundColor: COLORS.accent + '20',
    borderColor: COLORS.accent,
  },
  filterText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  filterTextActive: {
    color: COLORS.accent,
  },
  selectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },
  cancelText: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  selectedCount: {
    fontSize: 15,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  compareButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  compareButtonDisabled: {
    opacity: 0.5,
  },
  compareButtonText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  historyItem: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyItemSelected: {
    backgroundColor: COLORS.accent + '15',
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.surface,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  checkmark: {
    color: COLORS.textPrimary,
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
    marginBottom: 4,
  },
  brandName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: 12,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  score: {
    fontSize: 20,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  pts: {
    fontSize: 11,
    color: COLORS.textTertiary,
  },
  peptideName: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  riskText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  time: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  chevron: {
    fontSize: 24,
    color: COLORS.textTertiary,
    marginLeft: 8,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.bgSecondary,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.surface,
  },
  startCompareButton: {
    backgroundColor: COLORS.bgTertiary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surface,
    borderStyle: 'dashed',
  },
  startCompareText: {
    fontSize: 15,
    color: COLORS.textPrimary,
    fontWeight: '600',
    marginBottom: 4,
  },
  startCompareHint: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
