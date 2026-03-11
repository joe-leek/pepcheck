import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { AnalysisResult, Signal, TIER_COLORS, TierType, DISCLAIMER } from '../types';

interface ScoreDetailScreenProps {
  result: AnalysisResult;
  vendorName: string;
  onBack: () => void;
}

export default function ScoreDetailScreen({ result, vendorName, onBack }: ScoreDetailScreenProps) {
  const tierColor = TIER_COLORS[result.tier as TierType] || result.tier_colour || '#64748b';

  const renderSignal = (signal: Signal, isPositive: boolean) => (
    <View 
      key={signal.label} 
      style={styles.signalCard}
    >
      <View style={styles.signalHeader}>
        <View style={[
          styles.pointsBadge,
          { backgroundColor: isPositive ? '#166534' : '#991b1b' }
        ]}>
          <Text style={styles.pointsText}>
            {isPositive ? '+' : ''}{signal.points}
          </Text>
        </View>
        <Text style={styles.signalLabel}>{signal.label}</Text>
      </View>
      {signal.evidence && signal.evidence.trim() !== '' && (
        <View style={styles.evidenceContainer}>
          <Text style={styles.evidenceLabel}>Evidence:</Text>
          <Text style={styles.evidenceText}>"{signal.evidence}"</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Vendor Name and Score */}
        <View style={styles.scoreHeader}>
          <Text style={styles.vendorName} numberOfLines={2}>{vendorName}</Text>
          <View style={styles.scoreRow}>
            <Text style={[styles.trustScore, { color: tierColor }]}>
              {result.trust_score}
            </Text>
            <Text style={styles.scoreMax}> / 100</Text>
          </View>
          <View style={[styles.tierBadge, { backgroundColor: tierColor }]}>
            <Text style={styles.tierText}>{result.tier}</Text>
          </View>
          {result.tier_description && (
            <Text style={styles.tierDescription}>{result.tier_description}</Text>
          )}
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Positive Signals */}
        {result.signals.positive.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✓ POSITIVE SIGNALS</Text>
            {result.signals.positive.map(s => renderSignal(s, true))}
          </View>
        )}

        {/* Negative Signals */}
        {result.signals.negative.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✗ NEGATIVE SIGNALS</Text>
            {result.signals.negative.map(s => renderSignal(s, false))}
          </View>
        )}

        {/* No Signals */}
        {result.signals.positive.length === 0 && result.signals.negative.length === 0 && (
          <View style={styles.noSignalsContainer}>
            <Text style={styles.noSignalsText}>No specific signals detected</Text>
          </View>
        )}

        {/* Score Breakdown */}
        <View style={styles.breakdownSection}>
          <Text style={styles.breakdownTitle}>Score Breakdown</Text>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Positive signals:</Text>
            <Text style={[styles.breakdownValue, styles.positiveValue]}>
              +{result.raw_score_breakdown.positive_total}
            </Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Negative signals:</Text>
            <Text style={[styles.breakdownValue, styles.negativeValue]}>
              {result.raw_score_breakdown.negative_total}
            </Text>
          </View>
          <View style={[styles.breakdownRow, styles.finalRow]}>
            <Text style={styles.breakdownLabel}>Final score:</Text>
            <Text style={[styles.breakdownValue, styles.finalValue]}>
              {result.raw_score_breakdown.final_score}
            </Text>
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
    paddingBottom: 10,
    backgroundColor: '#0f172a',
  },
  backButton: {
    paddingVertical: 8,
  },
  backText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 0,
  },
  scoreHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  vendorName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#e2e8f0',
    textAlign: 'center',
    marginBottom: 16,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  trustScore: {
    fontSize: 64,
    fontWeight: 'bold',
  },
  scoreMax: {
    fontSize: 24,
    color: '#64748b',
    fontWeight: '500',
  },
  tierBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
  },
  tierText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  tierDescription: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 1,
    marginBottom: 16,
  },
  signalCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  signalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  pointsText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  signalLabel: {
    flex: 1,
    fontSize: 15,
    color: '#e2e8f0',
    fontWeight: '500',
  },
  evidenceContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  evidenceLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  evidenceText: {
    fontSize: 14,
    color: '#94a3b8',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  noSignalsContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noSignalsText: {
    color: '#64748b',
    fontSize: 16,
  },
  breakdownSection: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 16,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#94a3b8',
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  positiveValue: {
    color: '#22c55e',
  },
  negativeValue: {
    color: '#ef4444',
  },
  finalRow: {
    borderTopWidth: 1,
    borderTopColor: '#334155',
    marginTop: 8,
    paddingTop: 16,
  },
  finalValue: {
    color: '#ffffff',
    fontSize: 18,
  },
  disclaimer: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 40,
  },
});
