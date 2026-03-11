import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import AnalyseScreen from './src/screens/AnalyseScreen';
import ResultsScreen from './src/screens/ResultsScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import ScoreDetailScreen from './src/screens/ScoreDetailScreen';
import ComparisonScreen from './src/screens/ComparisonScreen';
import { AnalysisResult, HistoryItem } from './src/types';

const Tab = createBottomTabNavigator();

type ScreenState = 
  | { type: 'tabs' }
  | { type: 'results'; result: AnalysisResult }
  | { type: 'detail'; result: AnalysisResult; vendorName: string }
  | { type: 'comparison'; items: { vendorName: string; result: AnalysisResult }[] };

export default function App() {
  const [screenState, setScreenState] = useState<ScreenState>({ type: 'tabs' });

  const handleAnalysisComplete = (result: AnalysisResult) => {
    setScreenState({ type: 'results', result });
  };

  const handleCheckAnother = () => {
    setScreenState({ type: 'tabs' });
  };

  const handleHistorySelect = (item: HistoryItem) => {
    // If we have the full result, show the detail screen
    if (item.fullResult) {
      setScreenState({
        type: 'detail',
        result: item.fullResult,
        vendorName: item.domain,
      });
    } else {
      // Fallback for old history items without full result
      const partialResult: AnalysisResult = {
        url: item.url,
        trust_score: item.trust_score,
        tier: item.tier,
        tier_colour: '',
        tier_description: item.tier_description,
        signals: { positive: [], negative: [] },
        raw_score_breakdown: {
          positive_total: 0,
          negative_total: 0,
          final_score: item.trust_score,
        },
        disclaimer: '',
      };
      setScreenState({
        type: 'detail',
        result: partialResult,
        vendorName: item.domain,
      });
    }
  };

  const handleCompare = (items: HistoryItem[]) => {
    const comparisonItems = items
      .filter(item => item.fullResult)
      .map(item => ({
        vendorName: item.domain,
        result: item.fullResult!,
      }));
    
    if (comparisonItems.length >= 2) {
      setScreenState({ type: 'comparison', items: comparisonItems });
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
              backgroundColor: '#1e293b',
              borderTopColor: '#334155',
            },
            tabBarActiveTintColor: '#3b82f6',
            tabBarInactiveTintColor: '#64748b',
            headerStyle: {
              backgroundColor: '#0f172a',
            },
            headerTintColor: '#ffffff',
          }}
        >
          <Tab.Screen 
            name="Analyse" 
            options={{
              tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🔍</Text>,
              headerShown: false,
            }}
          >
            {() => <AnalyseScreen onAnalysisComplete={handleAnalysisComplete} />}
          </Tab.Screen>
          <Tab.Screen 
            name="History"
            options={{
              tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📋</Text>,
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
