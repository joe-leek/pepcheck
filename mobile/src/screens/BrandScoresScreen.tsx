import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, getTrustColor } from '../types';
import { getBrandScores, BrandScore } from '../services/api';

interface BrandScoresScreenProps {
  onSelectBrand: (brandName: string) => void;
}

export default function BrandScoresScreen({ onSelectBrand }: BrandScoresScreenProps) {
  const [brands, setBrands] = useState<BrandScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadBrands = useCallback(async () => {
    try {
      const data = await getBrandScores();
      setBrands(data);
    } catch (error) {
      console.error('Failed to load brand scores:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadBrands();
  }, [loadBrands]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadBrands();
  }, [loadBrands]);

  const totalAnalyses = brands.reduce((sum, b) => sum + b.analysis_count, 0);
  const maxScore = 80; // Max possible trust score

  if (loading && brands.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyTitle}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (brands.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyTitle}>No Brand Data Yet</Text>
          <Text style={styles.emptySubtitle}>
            Analyse some vendors to see brand rankings appear here
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.accent}
          />
        }
      >
        {/* Summary */}
        <Text style={styles.summary}>
          Based on {totalAnalyses} {totalAnalyses === 1 ? 'analysis' : 'analyses'} across {brands.length} {brands.length === 1 ? 'brand' : 'brands'}
        </Text>

        {/* Brand List */}
        {brands.map((brand, index) => {
          const barWidth = (brand.average_score / maxScore) * 100;
          const trustColor = getTrustColor(brand.average_score);
          const isLowConfidence = brand.analysis_count === 1;

          return (
            <TouchableOpacity
              key={brand.brand_name}
              style={[styles.brandCard, isLowConfidence && styles.brandCardLowConfidence]}
              onPress={() => onSelectBrand(brand.brand_name)}
              activeOpacity={0.7}
            >
              <View style={styles.brandHeader}>
                <View style={styles.brandRank}>
                  <Text style={styles.rankNumber}>#{index + 1}</Text>
                </View>
                <View style={styles.brandInfo}>
                  <Text style={styles.brandName}>{brand.brand_name}</Text>
                  <Text style={styles.brandMeta}>
                    {brand.analysis_count} {brand.analysis_count === 1 ? 'analysis' : 'analyses'} • {brand.peptides.slice(0, 3).join(', ')}{brand.peptides.length > 3 ? '...' : ''}
                  </Text>
                </View>
                <View style={styles.brandScore}>
                  <Text style={[styles.scoreValue, { color: trustColor }]}>
                    {brand.average_score}
                  </Text>
                  <Text style={styles.scoreLabel}>avg</Text>
                </View>
              </View>

              {/* Bar Chart */}
              <View style={styles.barContainer}>
                <View style={styles.barBackground}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${barWidth}%`,
                        backgroundColor: trustColor,
                        opacity: isLowConfidence ? 0.5 : 1,
                      },
                    ]}
                  />
                </View>
                {isLowConfidence && (
                  <Text style={styles.lowConfidenceLabel}>Limited data</Text>
                )}
              </View>

              {/* Risk Distribution */}
              <View style={styles.riskDistribution}>
                {brand.risk_distribution.low > 0 && (
                  <View style={styles.riskPill}>
                    <Text style={[styles.riskPillText, { color: COLORS.trustHigh }]}>
                      🟢 {brand.risk_distribution.low} Low
                    </Text>
                  </View>
                )}
                {brand.risk_distribution.moderate > 0 && (
                  <View style={styles.riskPill}>
                    <Text style={[styles.riskPillText, { color: COLORS.trustMedium }]}>
                      🟡 {brand.risk_distribution.moderate} Moderate
                    </Text>
                  </View>
                )}
                {brand.risk_distribution.high > 0 && (
                  <View style={styles.riskPill}>
                    <Text style={[styles.riskPillText, { color: COLORS.trustLow }]}>
                      🔴 {brand.risk_distribution.high} High
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Tip */}
        <View style={styles.tipContainer}>
          <Text style={styles.tipIcon}>💡</Text>
          <Text style={styles.tipText}>
            Analyse more vendors to improve your comparison data. Brands with more analyses provide more reliable averages.
          </Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  summary: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  brandCard: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  brandCardLowConfidence: {
    borderWidth: 1,
    borderColor: COLORS.surface,
    borderStyle: 'dashed',
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  brandRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.bgTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  brandInfo: {
    flex: 1,
  },
  brandName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  brandMeta: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  brandScore: {
    alignItems: 'flex-end',
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  scoreLabel: {
    fontSize: 10,
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
  },
  barContainer: {
    marginBottom: 12,
  },
  barBackground: {
    height: 8,
    backgroundColor: COLORS.bgTertiary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  lowConfidenceLabel: {
    fontSize: 10,
    color: COLORS.textTertiary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  riskDistribution: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  riskPill: {
    backgroundColor: COLORS.bgTertiary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  riskPillText: {
    fontSize: 11,
    fontWeight: '500',
  },
  tipContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgSecondary,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    gap: 12,
  },
  tipIcon: {
    fontSize: 20,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
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
    lineHeight: 20,
  },
});
