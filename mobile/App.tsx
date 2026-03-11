import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';

import AnalyseScreen from './src/screens/AnalyseScreen';
import ResultsScreen from './src/screens/ResultsScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import BrandScoresScreen from './src/screens/BrandScoresScreen';
import ScoreDetailScreen from './src/screens/ScoreDetailScreen';
import ComparisonScreen from './src/screens/ComparisonScreen';
import { AnalysisResult, HistoryItem, COLORS, inferRiskLevel } from './src/types';
import { runMigrationV3 } from './src/services/migration';

const Tab = createBottomTabNavigator();

type ScreenState = 
  | { type: 'tabs' }
  | { type: 'results'; result: AnalysisResult }
  | { type: 'detail'; result: AnalysisResult; vendorName: string }
  | { type: 'comparison'; items: { vendorName: string; result: AnalysisResult }[]; peptideName: string };

export default function App() {
  const [screenState, setScreenState] = useState<ScreenState>({ type: 'tabs' });

  // Run v3 migration on app startup
  useEffect(() => {
    runMigrationV3();
  }, []);

  const handleAnalysisComplete = (result: AnalysisResult) => {
    setScreenState({ type: 'results', result });
  };

  const handleCheckAnother = () => {
    setScreenState({ type: 'tabs' });
  };

  const handleHistorySelect = (item: HistoryItem) => {
    // Handle legacy data - ensure risk_level exists
    const riskLevel = item.risk_level || inferRiskLevel(item.trust_score);
    const brandName = item.brand_name || item.domain;
    const peptideName = item.peptide_name || 'Unknown';
    
    if (item.fullResult) {
      // Ensure fullResult has required fields (may be missing in legacy data)
      const safeResult: AnalysisResult = {
        ...item.fullResult,
        risk_level: item.fullResult.risk_level || riskLevel,
        brand_name: item.fullResult.brand_name || brandName,
        peptide_name: item.fullResult.peptide_name || peptideName,
        signals: item.fullResult.signals || { positive: [], negative: [] },
        raw_score_breakdown: item.fullResult.raw_score_breakdown || {
          positive_total: item.trust_score,
          negative_count: 0,
        },
      };
      setScreenState({
        type: 'detail',
        result: safeResult,
        vendorName: brandName,
      });
    } else {
      // Fallback for old history items without full result
      const partialResult: AnalysisResult = {
        url: item.url,
        trust_score: item.trust_score,
        risk_level: riskLevel,
        brand_name: brandName,
        peptide_name: peptideName,
        signals: { positive: [], negative: [] },
        raw_score_breakdown: {
          positive_total: item.trust_score,
          negative_count: 0,
        },
        disclaimer: '',
      };
      setScreenState({
        type: 'detail',
        result: partialResult,
        vendorName: brandName,
      });
    }
  };

  const handleCompare = (items: HistoryItem[], peptideName: string) => {
    const comparisonItems = items
      .filter(item => item.fullResult)
      .map(item => ({
        vendorName: item.brand_name || item.domain,
        result: item.fullResult!,
      }));
    
    if (comparisonItems.length >= 2) {
      setScreenState({ type: 'comparison', items: comparisonItems, peptideName });
    }
  };

  const handleBack = () => {
    setScreenState({ type: 'tabs' });
  };

  // Show Results screen when we have a new analysis result
  if (screenState.type === 'results') {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <ResultsScreen 
          result={screenState.result} 
          onCheckAnother={handleCheckAnother}
        />
      </SafeAreaProvider>
    );
  }

  // Show Score Detail screen for history item deep dive
  if (screenState.type === 'detail') {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <ScoreDetailScreen
          result={screenState.result}
          vendorName={screenState.vendorName}
          onBack={handleBack}
        />
      </SafeAreaProvider>
    );
  }

  // Show Comparison screen
  if (screenState.type === 'comparison') {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <ComparisonScreen
          results={screenState.items}
          peptideName={screenState.peptideName}
          onBack={handleBack}
        />
      </SafeAreaProvider>
    );
  }

  // Default: Show tabs
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Tab.Navigator
          screenOptions={{
            tabBarStyle: {
              backgroundColor: COLORS.bgSecondary,
              borderTopColor: COLORS.surface,
              borderTopWidth: 1,
              paddingBottom: 8,
              paddingTop: 8,
              height: 60,
            },
            tabBarActiveTintColor: COLORS.accent,
            tabBarInactiveTintColor: COLORS.textTertiary,
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '500',
            },
            headerStyle: {
              backgroundColor: COLORS.bgPrimary,
              borderBottomWidth: 0,
              elevation: 0,
              shadowOpacity: 0,
            },
            headerTintColor: COLORS.textPrimary,
            headerTitleStyle: {
              fontWeight: '600',
            },
          }}
        >
          <Tab.Screen 
            name="Analyse" 
            options={{
              tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 22 }}>🔍</Text>,
              headerShown: false,
            }}
          >
            {() => <AnalyseScreen onAnalysisComplete={handleAnalysisComplete} />}
          </Tab.Screen>
          <Tab.Screen 
            name="Brands"
            options={{
              tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 22 }}>📊</Text>,
              title: 'Brand Scores',
            }}
          >
            {() => <BrandScoresScreen onSelectBrand={(brandName) => {}} />}
          </Tab.Screen>
          <Tab.Screen 
            name="History"
            options={{
              tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 22 }}>📋</Text>,
            }}
          >
            {() => (
              <HistoryScreen 
                onSelectItem={handleHistorySelect}
                onCompare={handleCompare}
              />
            )}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
