// PepCheck API Service

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AnalysisResult, HistoryItem } from '../types';

const API_BASE_URL = 'https://pepcheck-api.pepcheck.app';

export async function analyseVendor(url: string): Promise<AnalysisResult> {
  const response = await fetch(`${API_BASE_URL}/analyse`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Analysis failed');
  }

  const result: AnalysisResult = await response.json();

  // Save to history
  try {
    const historyItem: HistoryItem = {
      id: Date.now().toString(),
      url,
      domain: new URL(url).hostname,
      trust_score: result.trust_score,
      tier: result.tier,
      tier_description: result.tier_description,
      analysed_at: new Date().toISOString(),
      fullResult: result,
    };
    
    const existing = JSON.parse(await AsyncStorage.getItem('pepcheck_history') || '[]');
    await AsyncStorage.setItem(
      'pepcheck_history', 
      JSON.stringify([historyItem, ...existing].slice(0, 50))
    );
  } catch (historyError) {
    console.warn('Failed to save to history:', historyError);
  }

  return result;
}

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/`);
    return response.ok;
  } catch {
    return false;
  }
}

export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem('pepcheck_history');
}
