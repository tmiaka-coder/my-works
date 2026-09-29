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

      <View style={styles.tabBar}>
        {(['Home', 'Expenses', 'Scan', 'PriceCheck', 'Settings'] as TabType[]).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={styles.tabItem}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  isActive && { color: currentTheme.primary, fontWeight: '700' },
                ]}
              >
                {tab === 'PriceCheck' ? 'Price Check' : tab}
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
    height: 60,
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
    backgroundColor: '#ffffff',
  },
  tabItem: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 8 },
  tabText: { fontSize: 11, color: '#888888', fontWeight: '500' },
});