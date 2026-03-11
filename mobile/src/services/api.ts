import AsyncStorage from '@react-native-async-storage/async-storage';
import { AnalysisResult, HistoryItem, RiskLevel } from '../types';

const API_BASE = 'http://192.168.1.100:8000'; // Update to your server IP

export async function analyseVendor(url: string): Promise<AnalysisResult> {
  const response = await fetch(`${API_BASE}/analyse`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Analysis failed (${response.status})`);
  }

  return response.json();
}

export async function saveToHistory(result: AnalysisResult): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem('pepcheck_history');
    const history: HistoryItem[] = stored ? JSON.parse(stored) : [];

    // Extract domain from URL
    const domain = new URL(result.url).hostname.replace('www.', '');

    const newItem: HistoryItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      url: result.url,
      domain,
      trust_score: result.trust_score,
      risk_level: result.risk_level,
      brand_name: result.brand_name,
      peptide_name: result.peptide_name,
      analysed_at: new Date().toISOString(),
      fullResult: result,
    };

    // Add to beginning, limit to 100 items
    const updatedHistory = [newItem, ...history].slice(0, 100);
    await AsyncStorage.setItem('pepcheck_history', JSON.stringify(updatedHistory));
  } catch (error) {
    console.error('Failed to save to history:', error);
  }
}

export async function getHistory(): Promise<HistoryItem[]> {
  try {
    const stored = await AsyncStorage.getItem('pepcheck_history');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load history:', error);
  }
  return [];
}

export async function deleteHistoryItem(id: string): Promise<void> {
  try {
    const history = await getHistory();
    const updated = history.filter(item => item.id !== id);
    await AsyncStorage.setItem('pepcheck_history', JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to delete history item:', error);
  }
}

export async function clearHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem('pepcheck_history');
  } catch (error) {
    console.error('Failed to clear history:', error);
  }
}

// Brand aggregation for Brand Scores tab
export interface BrandScore {
  brand_name: string;
  average_score: number;
  analysis_count: number;
  peptides: string[];
  risk_distribution: {
    low: number;
    moderate: number;
    high: number;
  };
}

export async function getBrandScores(): Promise<BrandScore[]> {
  const history = await getHistory();
  
  // Group by brand_name
  const brandMap = new Map<string, {
    scores: number[];
    peptides: Set<string>;
    risks: RiskLevel[];
  }>();

  for (const item of history) {
    const brand = item.brand_name || item.domain;
    if (!brandMap.has(brand)) {
      brandMap.set(brand, {
        scores: [],
        peptides: new Set(),
        risks: [],
      });
    }
    const data = brandMap.get(brand)!;
    data.scores.push(item.trust_score);
    data.peptides.add(item.peptide_name);
    data.risks.push(item.risk_level);
  }

  // Convert to BrandScore array
  const brands: BrandScore[] = [];
  brandMap.forEach((data, brand_name) => {
    const average_score = Math.round(
      data.scores.reduce((a, b) => a + b, 0) / data.scores.length
    );
    brands.push({
      brand_name,
      average_score,
      analysis_count: data.scores.length,
      peptides: Array.from(data.peptides),
      risk_distribution: {
        low: data.risks.filter(r => r === 'Low').length,
        moderate: data.risks.filter(r => r === 'Moderate').length,
        high: data.risks.filter(r => r === 'High').length,
      },
    });
  });

  // Sort by average score descending
  brands.sort((a, b) => b.average_score - a.average_score);

  return brands;
}

// Get unique peptides for filtering
export async function getUniquePeptides(): Promise<string[]> {
  const history = await getHistory();
  const peptides = new Set<string>();
  
  for (const item of history) {
    if (item.peptide_name && item.peptide_name !== 'Unknown') {
      peptides.add(item.peptide_name);
    }
  }
  
  return Array.from(peptides).sort();
}

// Get history items filtered by peptide
export async function getHistoryByPeptide(peptideName: string): Promise<HistoryItem[]> {
  const history = await getHistory();
  return history.filter(item => 
    item.peptide_name.toLowerCase() === peptideName.toLowerCase()
  );
}
