import React, { useState } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { HomeScreen } from './src/screens/HomeScreen';
import { ExpensesScreen } from './src/screens/ExpensesScreen';
import { ScanScreen } from './src/screens/ScanScreen';
import { PriceCheckScreen } from './src/screens/PriceCheckScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { COLORS, SPACING } from './src/constants/theme';

type TabType = 'Home' | 'Expenses' | 'Scan' | 'PriceCheck' | 'Settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('Home');

  const renderScreen = () => {
    switch (activeTab) {
      case 'Home':
        return <HomeScreen />;
      case 'Expenses':
        return <ExpensesScreen />;
      case 'Scan':
        return <ScanScreen />;
      case 'PriceCheck':
        return <PriceCheckScreen />;
      case 'Settings':
        return <SettingsScreen />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>{renderScreen()}</View>

      {/* Bottom Navigation Bar */}
      <View style={styles.tabBar}>
        {(['Home', 'Expenses', 'Scan', 'PriceCheck', 'Settings'] as TabType[]).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={styles.tabItem}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    height: 60,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  activeTabLabel: {
    color: COLORS.black,
    fontWeight: '700',
  },
});