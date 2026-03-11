import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnalysisResult, COLORS, getTrustColor, getRiskColor, getRiskIcon, RiskLevel } from '../types';

interface ComparisonScreenProps {
  results: { vendorName: string; result: AnalysisResult }[];
  peptideName: string;
  onBack: () => void;
}

// All possible signals for comparison
const POSITIVE_SIGNAL_KEYS = [
  'coa_batch_specific',
  'coa_hplc',
  'coa_ms',
  'coa_third_party_accredited',
  'purity_99_verified',
  'cas_number',
  'molecular_info',
  'storage_instructions',
  'physical_address',
  'returns_policy',
];

const NEGATIVE_SIGNAL_KEYS = [
  'claims_therapeutic',
  'sells_accessories',
  'no_ruo_disclaimer',
  'no_coa_or_generic',
  'coa_in_house',
  'purity_unverified',
  'no_contact_address',
  'price_unrealistic',
];

const SIGNAL_LABELS: Record<string, string> = {
  coa_batch_specific: 'Batch COA',
  coa_hplc: 'HPLC Data',
  coa_ms: 'Mass Spec',
  coa_third_party_accredited: '3rd Party Lab',
  purity_99_verified: 'Purity 99%+',
  cas_number: 'CAS Number',
  molecular_info: 'Molecular Info',
  storage_instructions: 'Storage Info',
  physical_address: 'Physical Address',
  returns_policy: 'Returns Policy',
  claims_therapeutic: 'Therapeutic Claims',
  sells_accessories: 'Sells Accessories',
  no_ruo_disclaimer: 'No RUO Disclaimer',
  no_coa_or_generic: 'No/Generic COA',
  coa_in_house: 'In-house COA Only',
  purity_unverified: 'Unverified Purity',
  no_contact_address: 'No Contact Info',
  price_unrealistic: 'Unrealistic Price',
};

// Risk level ranking for tie-breaking
const RISK_RANK: Record<RiskLevel, number> = {
  'Low': 1,
  'Moderate': 2,
  'High': 3,
};

export default function ComparisonScreen({ results, peptideName, onBack }: ComparisonScreenProps) {
  // Determine the safer choice
  const getSaferChoice = (): { vendorName: string; reason: string } | null => {
    if (results.length < 2) return null;

    // Sort by trust_score descending, then by risk_level ascending
    const sorted = [...results].sort((a, b) => {
      if (a.result.trust_score !== b.result.trust_score) {
        return b.result.trust_score - a.result.trust_score; // Higher score first
      }
      // Tie-breaker: lower risk level wins
      return RISK_RANK[a.result.risk_level] - RISK_RANK[b.result.risk_level];
    });

    const winner = sorted[0];
    const runnerUp = sorted[1];

    // Check if there's a clear winner
    if (winner.result.trust_score === runnerUp.result.trust_score &&
        winner.result.risk_level === runnerUp.result.risk_level) {
      return null; // Tie
    }

    let reason = '';
    if (winner.result.trust_score > runnerUp.result.trust_score) {
      reason = `Higher trust score (${winner.result.trust_score} vs ${runnerUp.result.trust_score})`;
    } else {
      reason = `Lower risk level with same score`;
    }

    return { vendorName: winner.vendorName, reason };
  };

  const saferChoice = getSaferChoice();

  // Get signal status for a result
  const getSignalStatus = (result: AnalysisResult, key: string, isPositive: boolean) => {
    const signals = isPositive ? result.signals.positive : result.signals.negative;
    const signal = signals.find(s => s.key === key);
    
    if (isPositive) {
      return signal && signal.points > 0;
    } else {
      return signal && signal.points < 0;
    }
  };

  // Get signal points for a result
  const getSignalPoints = (result: AnalysisResult, key: string, isPositive: boolean) => {
    const signals = isPositive ? result.signals.positive : result.signals.negative;
    const signal = signals.find(s => s.key === key);
    return signal?.points || 0;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Comparing {peptideName}</Text>
          <Text style={styles.headerSubtitle}>{results.length} vendors</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Score Summary Cards */}
        <View style={styles.summaryRow}>
          {results.map(({ vendorName, result }) => {
            const trustColor = getTrustColor(result.trust_score);
            const riskColor = getRiskColor(result.risk_level);
            const isWinner = saferChoice?.vendorName === vendorName;

            return (
              <View 
                key={vendorName} 
                style={[styles.summaryCard, isWinner && styles.summaryCardWinner]}
              >
                {isWinner && (
                  <View style={styles.winnerBadge}>
                    <Text style={styles.winnerText}>SAFER</Text>
                  </View>
                )}
                <Text style={styles.vendorName} numberOfLines={1}>{vendorName}</Text>
                <Text style={[styles.summaryScore, { color: trustColor }]}>
                  {result.trust_score}
                </Text>
                <View style={[styles.riskPill, { backgroundColor: riskColor + '20' }]}>
                  <Text style={[styles.riskPillText, { color: riskColor }]}>
                    {getRiskIcon(result.risk_level)} {result.risk_level}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Safer Choice Recommendation */}
        {saferChoice && (
          <View style={styles.recommendationBox}>
            <Text style={styles.recommendationIcon}>✅</Text>
            <View style={styles.recommendationContent}>
              <Text style={styles.recommendationTitle}>
                {saferChoice.vendorName} is the safer choice
              </Text>
              <Text style={styles.recommendationReason}>
                {saferChoice.reason}
              </Text>
            </View>
          </View>
        )}

        {/* Signal Comparison Table */}
        <View style={styles.tableSection}>
          <Text style={styles.tableSectionTitle}>POSITIVE SIGNALS</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderLabel}>Signal</Text>
              {results.map(({ vendorName }) => (
                <Text key={vendorName} style={styles.tableHeaderVendor} numberOfLines={1}>
                  {vendorName}
                </Text>
              ))}
            </View>
            {POSITIVE_SIGNAL_KEYS.map(key => {
              const hasAny = results.some(r => getSignalStatus(r.result, key, true));
              if (!hasAny) return null;

              return (
                <View key={key} style={styles.tableRow}>
                  <Text style={styles.tableLabel}>{SIGNAL_LABELS[key]}</Text>
                  {results.map(({ vendorName, result }) => {
                    const hasSignal = getSignalStatus(result, key, true);
                    const points = getSignalPoints(result, key, true);
                    return (
                      <View key={vendorName} style={styles.tableCell}>
                        {hasSignal ? (
                          <View style={styles.cellContent}>
                            <Text style={styles.cellCheck}>✓</Text>
                            <Text style={styles.cellPoints}>+{points}</Text>
                          </View>
                        ) : (
                          <Text style={styles.cellMissing}>—</Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.tableSection}>
          <Text style={[styles.tableSectionTitle, { color: COLORS.trustLow }]}>RED FLAGS</Text>
          <View style={styles.table}>
            {NEGATIVE_SIGNAL_KEYS.map(key => {
              const hasAny = results.some(r => getSignalStatus(r.result, key, false));
              if (!hasAny) return null;

              return (
                <View key={key} style={styles.tableRow}>
                  <Text style={styles.tableLabel}>{SIGNAL_LABELS[key]}</Text>
                  {results.map(({ vendorName, result }) => {
                    const hasSignal = getSignalStatus(result, key, false);
                    const points = getSignalPoints(result, key, false);
                    return (
                      <View key={vendorName} style={styles.tableCell}>
                        {hasSignal ? (
                          <View style={styles.cellContent}>
                            <Text style={styles.cellWarning}>⚠</Text>
                            <Text style={[styles.cellPoints, { color: COLORS.trustLow }]}>
                              {points}
                            </Text>
                          </View>
                        ) : (
                          <Text style={styles.cellGood}>✓</Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  backText: {
    fontSize: 24,
    color: COLORS.textPrimary,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.bgSecondary,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    position: 'relative',
  },
  summaryCardWinner: {
    borderWidth: 2,
    borderColor: COLORS.trustHigh,
  },
  winnerBadge: {
    position: 'absolute',
    top: -10,
    backgroundColor: COLORS.trustHigh,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  winnerText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.bgPrimary,
    letterSpacing: 1,
  },
  vendorName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
    marginTop: 4,
  },
  summaryScore: {
    fontSize: 36,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
    marginBottom: 8,
  },
  riskPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  riskPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  recommendationBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.trustHigh + '15',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.trustHigh + '30',
  },
  recommendationIcon: {
    fontSize: 24,
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.trustHigh,
    marginBottom: 4,
  },
  recommendationReason: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  tableSection: {
    marginBottom: 24,
  },
  tableSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    letterSpacing: 1,
    marginBottom: 12,
  },
  table: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: 12,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgTertiary,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  tableHeaderLabel: {
    flex: 1.5,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tableHeaderVendor: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.surface,
    alignItems: 'center',
  },
  tableLabel: {
    flex: 1.5,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  tableCell: {
    flex: 1,
    alignItems: 'center',
  },
  cellContent: {
    alignItems: 'center',
  },
  cellCheck: {
    fontSize: 16,
    color: COLORS.trustHigh,
    marginBottom: 2,
  },
  cellWarning: {
    fontSize: 14,
    color: COLORS.trustLow,
    marginBottom: 2,
  },
  cellPoints: {
    fontSize: 10,
    color: COLORS.trustHigh,
    fontWeight: '600',
  },
  cellMissing: {
    fontSize: 14,
    color: COLORS.textTertiary,
  },
  cellGood: {
    fontSize: 14,
    color: COLORS.trustHigh,
  },
});
