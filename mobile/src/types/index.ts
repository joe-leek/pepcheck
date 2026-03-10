// PepCheck Types

export interface Signal {
  label: string;
  points: number;
}

export interface SignalBreakdown {
  positive: Signal[];
  negative: Signal[];
}

export interface RawScoreBreakdown {
  positive_total: number;
  negative_total: number;
  final_score: number;
}

export interface AnalysisResult {
  url: string;
  trust_score: number;
  tier: string;
  tier_colour: string;
  signals: SignalBreakdown;
  raw_score_breakdown: RawScoreBreakdown;
  disclaimer: string;
}

export interface HistoryItem {
  id: string;
  url: string;
  domain: string;
  trust_score: number;
  tier: string;
  analysed_at: string;
}

export type TierType = 'Verified' | 'Credible' | 'Caution' | 'Unverified' | 'High Risk';

export const TIER_COLORS: Record<TierType, string> = {
  'Verified': '#22c55e',
  'Credible': '#3b82f6',
  'Caution': '#f59e0b',
  'Unverified': '#f97316',
  'High Risk': '#ef4444',
};

export const DISCLAIMER = "Pep Check is an information tool only. It does not constitute medical advice and should not be used to make decisions about human consumption of any substance.";
