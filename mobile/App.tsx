import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import AnalyseScreen from './src/screens/AnalyseScreen';
import ResultsScreen from './src/screens/ResultsScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import { AnalysisResult, HistoryItem } from './src/types';

const Tab = createBottomTabNavigator();

export default function App() {
  const [currentResult, setCurrentResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<'analyse' | 'results' | 'history'>('analyse');

  const handleAnalysisComplete = (result: AnalysisResult) => {
    setCurrentResult(result);
    setActiveTab('results');
  };

  const handleCheckAnother = () => {
    setCurrentResult(null);
    setActiveTab('analyse');
  };

  const handleHistorySelect = (item: HistoryItem) => {
    // For history items, we create a partial result for display
    // In a real app, you'd store the full result
    setCurrentResult({
      url: item.url,
      trust_score: item.trust_score,
      tier: item.tier,
      tier_colour: '',
      signals: { positive: [], negative: [] },
      raw_score_breakdown: {
        positive_total: 0,
        negative_total: 0,
        final_score: item.trust_score,
      },
      disclaimer: '',
    });
    setActiveTab('results');
  };

  // Show Results screen when we have a result
  if (activeTab === 'results' && currentResult) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <ResultsScreen 
          result={currentResult} 
          onCheckAnother={handleCheckAnother}
        />
      </SafeAreaProvider>
    );
  }

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
            {() => <HistoryScreen onSelectItem={handleHistorySelect} />}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
