import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { ExpenseProvider, useExpenses } from './src/context/ExpenseContext';

import { HomeScreen } from './src/screens/HomeScreen';
import { ExpensesScreen } from './src/screens/ExpensesScreen';
import { PriceCheckScreen } from './src/screens/PriceCheckScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { ScanScreen } from './src/screens/ScanScreen';

export type TabType = 'Home' | 'Expenses' | 'Scan' | 'PriceCheck' | 'Settings';

const TAB_LABELS: Record<TabType, string> = {
  Home: 'Home',
  Expenses: 'Expenses',
  Scan: 'Scan',
  PriceCheck: 'Compare',
  Settings: 'Settings',
};

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabType>('Home');
  const { currentTheme } = useExpenses();

  const navigation = {
    navigate: (screenName: TabType) => {
      setActiveTab(screenName);
    },
  };

  const renderScreen = () => {
    switch (activeTab) {
      case 'Home':
        return <HomeScreen navigation={navigation} />;
      case 'Expenses':
        return <ExpensesScreen navigation={navigation} />;
      case 'Scan':
        return <ScanScreen navigation={navigation} />;
      case 'PriceCheck':
        return <PriceCheckScreen navigation={navigation} />;
      case 'Settings':
        return <SettingsScreen navigation={navigation} />;
      default:
        return <HomeScreen navigation={navigation} />;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.bg }]}>
      <StatusBar barStyle="dark-content" backgroundColor={currentTheme.bg} />

      <View style={styles.content}>{renderScreen()}</View>

      <View style={[styles.tabBar, { backgroundColor: '#ffffff' }]}> 
        {(['Home', 'Expenses', 'Scan', 'PriceCheck', 'Settings'] as TabType[]).map((tab) => {
          const isActive = activeTab === tab;

          return (
            <TouchableOpacity
              key={tab}
              activeOpacity={0.8}
              style={[
                styles.tabItem,
                isActive && {
                  backgroundColor: `${currentTheme.primary}18`,
                },
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  isActive && {
                    color: currentTheme.primary,
                    fontWeight: '700',
                  },
                ]}
              >
                {TAB_LABELS[tab]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <ExpenseProvider>
      <AppContent />
    </ExpenseProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    minHeight: 74,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#e7e7e7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 8,
  },
  tabText: {
    fontSize: 11,
    color: '#7a7a7a',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});