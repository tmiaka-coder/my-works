import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useExpenses, NZ_THEMES } from '../context/ExpenseContext';

interface SettingsScreenProps {
  navigation?: any;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = () => {
  const {
    user1Name,
    setUser1Name,
    user2Name,
    setUser2Name,
    exchangeRate,
    setExchangeRate,
    currentTheme,
    setCurrentThemeId,
  } = useExpenses();

  const handleSaveSettings = () => {
    Alert.alert('Saved', '設定を保存しました。');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: currentTheme.bg }]}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>User Names</Text>
        <View style={styles.card}>
          <Text style={styles.label}>User 1 Name</Text>
          <TextInput
            style={styles.textInput}
            value={user1Name}
            onChangeText={setUser1Name}
            placeholder="User 1"
          />
          <Text style={[styles.label, { marginTop: 12 }]}>User 2 Name</Text>
          <TextInput
            style={styles.textInput}
            value={user2Name}
            onChangeText={setUser2Name}
            placeholder="User 2"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Theme (NZ Inspired)</Text>
        <View style={styles.themeGrid}>
          {NZ_THEMES.map((theme) => {
            const isSelected = currentTheme.id === theme.id;
            return (
              <TouchableOpacity
                key={theme.id}
                style={[
                  styles.themeCard,
                  isSelected && { borderColor: theme.primary, borderWidth: 2 },
                ]}
                onPress={() => setCurrentThemeId(theme.id)}
              >
                <View style={[styles.colorPreview, { backgroundColor: theme.primary }]} />
                <Text style={styles.themeName}>{theme.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Currency & Rate</Text>
        <View style={styles.card}>
          <Text style={styles.label}>NZD / JPY Exchange Rate</Text>
          <View style={styles.inputRow}>
            <Text style={styles.prefix}>1 NZD = ¥</Text>
            <TextInput
              style={styles.rateInput}
              value={exchangeRate.toString()}
              onChangeText={(val) => setExchangeRate(parseFloat(val) || 0)}
              keyboardType="decimal-pad"
            />
          </View>
        </View>
      </View>

      <View style={styles.aboutSection}>
        <Text style={styles.aboutTitle}>About App</Text>
        <View style={styles.aboutRow}>
          <Text style={styles.aboutLabel}>App Name:</Text>
          <Text style={styles.aboutValue}>Smart Budget NZ</Text>
        </View>
        <View style={styles.aboutRow}>
          <Text style={styles.aboutLabel}>Version:</Text>
          <Text style={styles.aboutValue}>1.0.0</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: currentTheme.primary }]}
        onPress={handleSaveSettings}
      >
        <Text style={styles.saveButtonText}>Save Settings</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 20, color: '#111' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 8 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  label: { fontSize: 12, color: '#666', fontWeight: '600', marginBottom: 6 },
  textInput: {
    backgroundColor: '#f4f4f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4f4f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  prefix: { fontSize: 15, fontWeight: '600', color: '#555', marginRight: 4 },
  rateInput: { flex: 1, fontSize: 16, fontWeight: '700', color: '#111' },
  themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  themeCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  colorPreview: { width: 20, height: 20, borderRadius: 10 },
  themeName: { fontSize: 12, fontWeight: '600', color: '#222' },
  aboutSection: { marginTop: 8, marginBottom: 28, paddingHorizontal: 4 },
  aboutTitle: { fontSize: 14, fontWeight: '600', color: '#777', marginBottom: 8 },
  aboutRow: { flexDirection: 'row', paddingVertical: 3 },
  aboutLabel: { fontSize: 13, color: '#888', width: 90 },
  aboutValue: { fontSize: 13, color: '#333', fontWeight: '500' },
  saveButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 40,
  },
  saveButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});