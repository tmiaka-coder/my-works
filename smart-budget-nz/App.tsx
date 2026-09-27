// App.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ExpenseProvider } from './src/context/ExpenseContext';

import { HomeScreen } from './src/screens/HomeScreen';
import { ExpensesScreen } from './src/screens/ExpensesScreen';
import { ScanScreen } from './src/screens/ScanScreen';
import { PriceCheckScreen } from './src/screens/PriceCheckScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

type TabType = 'Home' | 'Expenses' | 'Scan' | 'PriceCheck' | 'Settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('Home');

  const navigation = {
    navigate: (screenName: TabType) => setActiveTab(screenName),
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
    <SafeAreaProvider>
      <ExpenseProvider>
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>{renderScreen()}</View>

          <View style={styles.tabBar}>
            <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('Home')}>
              <Text style={[styles.tabText, activeTab === 'Home' && styles.activeTabText]}>
                🏠 Home
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('Expenses')}>
              <Text style={[styles.tabText, activeTab === 'Expenses' && styles.activeTabText]}>
                📊 Expenses
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('Scan')}>
              <Text style={[styles.tabText, activeTab === 'Scan' && styles.activeTabText]}>
                📷 Scan
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('PriceCheck')}>
              <Text style={[styles.tabText, activeTab === 'PriceCheck' && styles.activeTabText]}>
                🏷️ Price
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('Settings')}>
              <Text style={[styles.tabText, activeTab === 'Settings' && styles.activeTabText]}>
                ⚙️ Settings
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ExpenseProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    height: 60,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabText: { fontSize: 11, color: '#888', fontWeight: '500' },
  activeTabText: { color: '#000', fontWeight: '700' },
});