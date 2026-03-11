import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AnalysisResult, HistoryItem, COLORS, getRiskColor, getRiskIcon } from '../types';
import { analyseVendor, saveToHistory } from '../services/api';

interface AnalyseScreenProps {
  onAnalysisComplete: (result: AnalysisResult) => void;
}

export default function AnalyseScreen({ onAnalysisComplete }: AnalyseScreenProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [recentItems, setRecentItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    loadRecentItems();
  }, []);

  const loadRecentItems = async () => {
    try {
      const stored = await AsyncStorage.getItem('pepcheck_history');
      if (stored) {
        const items: HistoryItem[] = JSON.parse(stored);
        setRecentItems(items.slice(0, 3));
      }
    } catch (error) {
      console.error('Failed to load recent items:', error);
    }
  };

  const handleAnalyse = async () => {
    if (!url.trim()) {
      Alert.alert('URL Required', 'Please enter a vendor product URL to analyse.');
      return;
    }

    // Basic URL validation
    let processedUrl = url.trim();
    if (!processedUrl.startsWith('http://') && !processedUrl.startsWith('https://')) {
      processedUrl = 'https://' + processedUrl;
    }

    Keyboard.dismiss();
    setLoading(true);

    try {
      const result = await analyseVendor(processedUrl);
      await saveToHistory(result);
      setUrl('');
      onAnalysisComplete(result);
    } catch (error: any) {
      Alert.alert(
        'Analysis Failed',
        error.message || 'Could not analyse this URL. Please check the URL and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRecentTap = (item: HistoryItem) => {
    if (item.fullResult) {
      onAnalysisComplete(item.fullResult);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>PepCheck</Text>
          <Text style={styles.version}>v3.0</Text>
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroIcon}>🔬</Text>
          <Text style={styles.heroTitle}>Verify Your Research Source</Text>
          <Text style={styles.heroSubtitle}>
            Paste a peptide vendor URL to get a detailed trust analysis
          </Text>
        </View>

        {/* URL Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Paste vendor product URL..."
            placeholderTextColor={COLORS.textTertiary}
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="go"
            onSubmitEditing={handleAnalyse}
          />
        </View>

        {/* Analyse Button */}
        <TouchableOpacity
          style={[styles.analyseButton, loading && styles.analyseButtonDisabled]}
          onPress={handleAnalyse}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={COLORS.textPrimary} size="small" />
              <Text style={styles.loadingText}>Analysing...</Text>
            </View>
          ) : (
            <Text style={styles.analyseButtonText}>Analyse Vendor</Text>
          )}
        </TouchableOpacity>

        {/* Recent Analyses */}
        {recentItems.length > 0 && (
          <View style={styles.recentSection}>
            <View style={styles.divider} />
            <Text style={styles.recentTitle}>Recent Analyses</Text>
            
            {recentItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.recentItem}
                onPress={() => handleRecentTap(item)}
                activeOpacity={0.7}
              >
                <View style={styles.recentLeft}>
                  <Text style={styles.recentBrand}>{item.brand_name || item.domain}</Text>
                  <Text style={styles.recentPeptide}>{item.peptide_name || 'Unknown peptide'}</Text>
                  <View style={styles.recentMeta}>
                    <Text style={styles.recentRisk}>
                      {getRiskIcon(item.risk_level)} {item.risk_level} Risk
                    </Text>
                    <Text style={styles.recentDate}>
                      {formatRelativeDate(item.analysed_at)}
                    </Text>
                  </View>
                </View>
                <View style={styles.recentRight}>
                  <Text style={[styles.recentScore, { color: getRiskColor(item.risk_level) }]}>
                    {item.trust_score}
                  </Text>
                  <Text style={styles.recentPts}>pts</Text>
                  <Text style={styles.chevron}>›</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return diffMins <= 1 ? 'Just now' : `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString();
  }
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  version: {
    fontSize: 14,
    color: COLORS.textTertiary,
    fontWeight: '500',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  heroIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: COLORS.bgTertiary,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.surface,
  },
  analyseButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  analyseButtonDisabled: {
    opacity: 0.7,
  },
  analyseButtonText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  recentSection: {
    marginTop: 32,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.surface,
    marginBottom: 24,
  },
  recentTitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  recentItem: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recentLeft: {
    flex: 1,
  },
  recentBrand: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  recentPeptide: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  recentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recentRisk: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  recentDate: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  recentRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recentScore: {
    fontSize: 24,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  recentPts: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginRight: 8,
  },
  chevron: {
    fontSize: 24,
    color: COLORS.textTertiary,
  },
});
