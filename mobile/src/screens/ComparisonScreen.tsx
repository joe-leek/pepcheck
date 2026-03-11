import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { AnalysisResult, TIER_COLORS, TierType, DISCLAIMER } from '../types';

interface ComparisonScreenProps {
  results: { vendorName: string; result: AnalysisResult }[];
  onBack: () => void;
}

// Define all signal keys we want to compare
const SIGNAL_KEYS = {
  positive: [
    { key: 'coa_batch_specific', label: 'Batch-Specific COA' },
    { key: 'coa_hplc', label: 'HPLC Data' },
    { key: 'coa_ms', label: 'Mass Spec Data' },
    { key: 'coa_third_party_accredited', label: 'Third-Party Lab' },
    { key: 'purity_99_verified', label: 'Purity ≥99% Verified' },
    { key: 'cas_number', label: 'CAS Number' },
    { key: 'molecular_info', label: 'Molecular Info' },
    { key: 'storage_instructions', label: 'Storage Instructions' },
    { key: 'physical_address', label: 'Physical Address' },
    { key: 'returns_policy', label: 'Returns Policy' },
  ],
  negative: [
    { key: 'claims_therapeutic', label: 'Therapeutic Claims' },
    { key: 'sells_accessories', label: 'Sells Accessories' },
    { key: 'no_ruo_disclaimer', label: 'No RUO Disclaimer' },
    { key: 'no_coa_or_generic', label: 'No Batch COA' },
    { key: 'coa_in_house', label: 'In-House Lab Only' },
    { key: 'purity_unverified', label: 'Purity Unverified' },
    { key: 'no_contact_address', label: 'No Contact Info' },
    { key: 'price_unrealistic', label: 'Unrealistic Price' },
  ],
};

export default function ComparisonScreen({ results, onBack }: ComparisonScreenProps) {
  // Helper to check if a vendor has a specific signal
  const hasSignal = (result: AnalysisResult, signalLabel: string, isNegative: boolean): boolean | null => {
    const signals = isNegative ? result.signals.negative : result.signals.positive;
    // Check if any signal label contains the key phrase
    const found = signals.some(s => 
      s.label.toLowerCase().includes(signalLabel.toLowerCase().split(' ')[0])
    );
    return found;
  };

  // Get signal status for display
  const getSignalDisplay = (result: AnalysisResult, signalKey: { key: string; label: string }, isNegative: boolean) => {
    const signals = isNegative ? result.signals.negative : result.signals.positive;
    const found = signals.some(s => 
      s.label.toLowerCase().includes(signalKey.label.toLowerCase().split(' ')[0]) ||
      s.label.toLowerCase().includes(signalKey.label.toLowerCase().split('-')[0])
    );
    
    if (isNegative) {
      // For negative signals: ✗ means they HAVE the bad thing, ✓ means they don't
      return found ? { icon: '✗', color: '#ef4444' } : { icon: '✓', color: '#22c55e' };
    } else {
      // For positive signals: ✓ means they have it, ✗ means they don't
      return found ? { icon: '✓', color: '#22c55e' } : { icon: '✗', color: '#ef4444' };
    }
  };

  const columnWidth = results.length === 2 ? 120 : 100;

  return (
    <View style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Compare Vendors</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View style={styles.table}>
            {/* Vendor Names Row */}
            <View style={styles.tableRow}>
              <View style={styles.labelCell}>
                <Text style={styles.labelText}>Vendor</Text>
              </View>
              {results.map((item, idx) => (
                <View key={idx} style={[styles.valueCell, { width: columnWidth }]}>
                  <Text style={styles.vendorName} numberOfLines={2}>
                    {item.vendorName}
                  </Text>
                </View>
              ))}
            </View>

            {/* Trust Score Row */}
            <View style={styles.tableRow}>
              <View style={styles.labelCell}>
                <Text style={styles.labelText}>Trust Score</Text>
              </View>
              {results.map((item, idx) => {
                const tierColor = TIER_COLORS[item.result.tier as TierType] || '#64748b';
                return (
                  <View key={idx} style={[styles.valueCell, { width: columnWidth }]}>
                    <Text style={[styles.scoreText, { color: tierColor }]}>
                      {item.result.trust_score}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Tier Row */}
            <View style={styles.tableRow}>
              <View style={styles.labelCell}>
                <Text style={styles.labelText}>Tier</Text>
              </View>
              {results.map((item, idx) => {
                const tierColor = TIER_COLORS[item.result.tier as TierType] || '#64748b';
                return (
                  <View key={idx} style={[styles.valueCell, { width: columnWidth }]}>
                    <View style={[styles.tierBadgeSmall, { backgroundColor: tierColor }]}>
                      <Text style={styles.tierTextSmall}>{item.result.tier}</Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Section: Positive Signals */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>POSITIVE SIGNALS</Text>
            </View>

            {SIGNAL_KEYS.positive.map((signalKey) => (
              <View key={signalKey.key} style={styles.tableRow}>
                <View style={styles.labelCell}>
                  <Text style={styles.labelText}>{signalKey.label}</Text>
                </View>
                {results.map((item, idx) => {
                  const display = getSignalDisplay(item.result, signalKey, false);
                  return (
                    <View key={idx} style={[styles.valueCell, { width: columnWidth }]}>
                      <Text style={[styles.signalIcon, { color: display.color }]}>
                        {display.icon}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ))}

            {/* Section: Negative Signals */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>RED FLAGS</Text>
            </View>

            {SIGNAL_KEYS.negative.map((signalKey) => (
              <View key={signalKey.key} style={styles.tableRow}>
                <View style={styles.labelCell}>
                  <Text style={styles.labelText}>{signalKey.label}</Text>
                </View>
                {results.map((item, idx) => {
                  const display = getSignalDisplay(item.result, signalKey, true);
                  return (
                    <View key={idx} style={[styles.valueCell, { width: columnWidth }]}>
                      <Text style={[styles.signalIcon, { color: display.color }]}>
                        {display.icon}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Legend */}
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Legend:</Text>
          <View style={styles.legendRow}>
            <Text style={[styles.legendIcon, { color: '#22c55e' }]}>✓</Text>
            <Text style={styles.legendText}>Good (has positive / no red flag)</Text>
          </View>
          <View style={styles.legendRow}>
            <Text style={[styles.legendIcon, { color: '#ef4444' }]}>✗</Text>
            <Text style={styles.legendText}>Bad (missing positive / has red flag)</Text>
          </View>
        </View>

        {/* Disclaimer */}
        <Text style={styles.disclaimer}>{DISCLAIMER}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#0f172a',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    paddingVertical: 8,
    paddingRight: 16,
  },
  backText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  scrollView: {
    flex: 1,
  },
  table: {
    padding: 16,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  labelCell: {
    width: 140,
    paddingVertical: 12,
    paddingRight: 8,
    justifyContent: 'center',
  },
  labelText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  },
  valueCell: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vendorName: {
    fontSize: 12,
    color: '#e2e8f0',
    fontWeight: '600',
    textAlign: 'center',
  },
  scoreText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  tierBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tierTextSmall: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  signalIcon: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  sectionHeader: {
    paddingVertical: 16,
    paddingTop: 24,
    borderBottomWidth: 2,
    borderBottomColor: '#475569',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 1,
  },
  legend: {
    padding: 16,
    backgroundColor: '#1e293b',
    margin: 16,
    borderRadius: 12,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 12,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendIcon: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 12,
    width: 20,
  },
  legendText: {
    fontSize: 13,
    color: '#94a3b8',
  },
  disclaimer: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 16,
    padding: 16,
    marginBottom: 40,
  },
});
