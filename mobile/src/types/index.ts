// PepCheck Types v3.0

export interface Signal {
  key: string;
  label: string;
  points: number;
  evidence?: string;
  rationale?: string;
}

export interface SignalBreakdown {
  positive: Signal[];
  negative: Signal[];
}

export interface RawScoreBreakdown {
  positive_total: number;
  negative_count: number;
}

export type RiskLevel = 'Low' | 'Moderate' | 'High';

export interface AnalysisResult {
  url: string;
  trust_score: number;
  risk_level: RiskLevel;
  brand_name: string;
  peptide_name: string;
  signals: SignalBreakdown;
  raw_score_breakdown: RawScoreBreakdown;
  disclaimer: string;
}

export interface HistoryItem {
  id: string;
  url: string;
  domain: string;
  trust_score: number;
  risk_level: RiskLevel;
  brand_name: string;
  peptide_name: string;
  analysed_at: string;
  fullResult?: AnalysisResult;
}

// Colour system v3.0
export const COLORS = {
  // Backgrounds
  bgPrimary: '#0A0A0B',
  bgSecondary: '#141416',
  bgTertiary: '#1C1C1F',
  surface: '#2A2A2E',
  
  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textTertiary: '#71717A',
  
  // Semantic - Trust Levels
  trustHigh: '#10B981',    // Emerald - Low Risk / High Score
  trustMedium: '#F59E0B',  // Amber - Moderate Risk
  trustLow: '#EF4444',     // Red - High Risk / Low Score
  
  // Accent
  accent: '#6366F1',       // Indigo
  accentSecondary: '#8B5CF6', // Purple
};

// Get color based on trust score
export const getTrustColor = (score: number): string => {
  if (score >= 50) return COLORS.trustHigh;
  if (score >= 25) return COLORS.trustMedium;
  return COLORS.trustLow;
};

// Get color based on risk level (with null safety)
export const getRiskColor = (risk: RiskLevel | undefined | null): string => {
  switch (risk) {
    case 'Low': return COLORS.trustHigh;
    case 'Moderate': return COLORS.trustMedium;
    case 'High': return COLORS.trustLow;
    default: return COLORS.textSecondary; // Fallback for undefined
  }
};

// Get risk icon (with null safety)
export const getRiskIcon = (risk: RiskLevel | undefined | null): string => {
  switch (risk) {
    case 'Low': return '🟢';
    case 'Moderate': return '🟡';
    case 'High': return '🔴';
    default: return '⚪'; // Fallback for undefined
  }
};

// Infer risk level from score (for legacy data migration)
export const inferRiskLevel = (score: number, negativeCount?: number): RiskLevel => {
  if (negativeCount !== undefined) {
    if (negativeCount >= 3) return 'High';
    if (negativeCount >= 1) return 'Moderate';
    return 'Low';
  }
  // Fallback: infer from score
  if (score >= 50) return 'Low';
  if (score >= 25) return 'Moderate';
  return 'High';
};

export const DISCLAIMER = "Pep Check is an information tool only. It does not constitute medical advice and should not be used to make decisions about human consumption of any substance.";
