import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { AnalysisResult, Signal, TIER_COLORS, TierType, DISCLAIMER } from '../types';

interface ResultsScreenProps {
  result: AnalysisResult;
  onCheckAnother: () => void;
}

export default function ResultsScreen({ result, onCheckAnother }: ResultsScreenProps) {
  const tierColor = TIER_COLORS[result.tier as TierType] || '#64748b';

  const renderSignal = (signal: Signal, isPositive: boolean) => (
    <View 
      key={signal.label} 
      style={[
        styles.signalRow,
        { backgroundColor: isPositive ? '#f0fdf4' : '#fef2f2' }
      ]}
    >
      <Text style={[
        styles.signalPoints,
        { color: isPositive ? '#16a34a' : '#dc2626' }
      ]}>
        {isPositive ? '+' : ''}{signal.points}
      </Text>
      <Text style={styles.signalLabel}>{signal.label}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Trust Score */}
      <View style={styles.scoreSection}>
        <Text style={[styles.trustScore, { color: tierColor }]}>
          {result.trust_score}
        </Text>
        <View style={[styles.tierBadge, { backgroundColor: tierColor }]}>
          <Text style={styles.tierText}>{result.tier}</Text>
        </View>
      </View>

      {/* Signals */}
      <View style={styles.signalsSection}>
        <Text style={styles.sectionHeader}>What we found</Text>
        
        {result.signals.positive.length > 0 && (
          <View style={styles.signalGroup}>
            <Text style={styles.signalGroupTitle}>✓ Positive Signals</Text>
            {result.signals.positive.map(s => renderSignal(s, true))}
          </View>
        )}
        
        {result.signals.negative.length > 0 && (
          <View style={styles.signalGroup}>
            <Text style={styles.signalGroupTitle}>✗ Negative Signals</Text>
            {result.signals.negative.map(s => renderSignal(s, false))}
          </View>
        )}

        {result.signals.positive.length === 0 && result.signals.negative.length === 0 && (
          <Text style={styles.noSignals}>No specific signals detected</Text>
        )}
      </View>

      {/* Score Breakdown */}
      <View style={styles.breakdownSection}>
        <Text style={styles.breakdownText}>
          Positive: <Text style={styles.positiveText}>+{result.raw_score_breakdown.positive_total}</Text>
          {' / '}
          Negative: <Text style={styles.negativeText}>{result.raw_score_breakdown.negative_total}</Text>
          {' / '}
          Final: <Text style={styles.finalText}>{result.raw_score_breakdown.final_score}</Text>
        </Text>
      </View>

      {/* Check Another Button */}
      <TouchableOpacity style={styles.button} onPress={onCheckAnother}>
        <Text style={styles.buttonText}>Check Another</Text>
      </TouchableOpacity>

      {/* Disclaimer */}
      <Text style={styles.disclaimer}>{DISCLAIMER}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 20,
  },
  scoreSection: {
    alignItems: 'center',
    marginVertical: 30,
  },
  trustScore: {
    fontSize: 72,
    fontWeight: 'bold',
  },
  tierBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
  },
  tierText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  signalsSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 16,
  },
  signalGroup: {
    marginBottom: 16,
  },
  signalGroupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 8,
  },
  signalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 6,
  },
  signalPoints: {
    fontSize: 16,
    fontWeight: '700',
    width: 50,
  },
  signalLabel: {
    flex: 1,
    fontSize: 14,
    color: '#1e293b',
  },
  noSignals: {
    color: '#64748b',
    textAlign: 'center',
    padding: 20,
  },
  breakdownSection: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  breakdownText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  positiveText: {
    color: '#22c55e',
    fontWeight: '600',
  },
  negativeText: {
    color: '#ef4444',
    fontWeight: '600',
  },
  finalText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  button: {
    backgroundColor: '#3b82f6',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 40,
  },
});
