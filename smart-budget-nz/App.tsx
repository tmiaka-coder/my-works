// App.tsx
import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { ExpenseProvider } from './src/context/ExpenseContext';

import { HomeScreen } from './src/screens/HomeScreen';
import { ExpensesScreen } from './src/screens/ExpensesScreen';
import { PriceCheckScreen } from './src/screens/PriceCheckScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { ScanScreen } from './src/screens/ScanScreen';

export type TabType = 'Home' | 'Expenses' | 'Scan' | 'PriceCheck' | 'Settings';

export interface NavigationProps {
  navigation: {
    navigate: (screenName: TabType) => void;
  };
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('Home');

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
    <ExpenseProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        
        <View style={styles.content}>{renderScreen()}</View>

        <View style={styles.tabBar}>
          {(['Home', 'Expenses', 'Scan', 'PriceCheck', 'Settings'] as TabType[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={styles.tabItem}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={activeTab === tab ? styles.activeTabText : styles.tabText}>
                {tab === 'PriceCheck' ? 'Price Check' : tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>
    </ExpenseProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
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
  activeTabText: { fontSize: 11, color: '#000000', fontWeight: '700' },
});