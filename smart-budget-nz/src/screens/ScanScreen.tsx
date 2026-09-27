// src/screens/ScanScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { useExpenses } from '../context/ExpenseContext';
import { MAIN_CATEGORIES, MainCategoryId } from '../../types';

export const ScanScreen = ({ navigation }: any) => {
  const { addTransaction } = useExpenses();

  const [storeName, setStoreName] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState<'user_01' | 'user_02'>('user_01');
  const [selectedCategory, setSelectedCategory] = useState<MainCategoryId>('food_groceries');

  const handleSave = () => {
    if (!storeName.trim() || !amount.trim()) {
      Alert.alert('入力エラー', '店舗名と金額を入力してください。');
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('入力エラー', '正しい金額を入力してください。');
      return;
    }

    const today = new Date().toISOString().split('T')[0];

    addTransaction({
      storeName: storeName.trim(),
      purchaseDate: today,
      paidByUserId: paidBy,
      totalAmount: numericAmount,
      items: [
        {
          id: `item_${Date.now()}`,
          name: `${storeName.trim()} Item`,
          price: numericAmount,
          quantity: 1,
          mainCategoryId: selectedCategory,
        },
      ],
    });

    setStoreName('');
    setAmount('');
    Alert.alert('保存完了', '支出を追加しました！', [
      {
        text: 'OK',
        onPress: () => navigation?.navigate('Home'),
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.headerTitle}>Scan / Add Expense</Text>

      <TouchableOpacity style={styles.scanBox} activeOpacity={0.7}>
        <Text style={styles.scanIcon}>📷</Text>
        <Text style={styles.scanText}>Tap to Scan Receipt</Text>
        <Text style={styles.scanSubText}>Auto-detect store and items (Coming soon)</Text>
      </TouchableOpacity>

      <Text style={styles.dividerText}>― MANUAL ENTRY ―</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Store Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. PAK'nSAVE, New World"
          placeholderTextColor="#888"
          value={storeName}
          onChangeText={setStoreName}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Total Amount ($ NZD)</Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          placeholderTextColor="#888"
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Paid By</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, paidBy === 'user_01' && styles.toggleActive]}
            onPress={() => setPaidBy('user_01')}
          >
            <Text style={[styles.toggleText, paidBy === 'user_01' && styles.toggleTextActive]}>
              User 1
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleBtn, paidBy === 'user_02' && styles.toggleActive]}
            onPress={() => setPaidBy('user_02')}
          >
            <Text style={[styles.toggleText, paidBy === 'user_02' && styles.toggleTextActive]}>
              User 2
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {Object.values(MAIN_CATEGORIES || {}).map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.catChip, isSelected && styles.catChipSelected]}
                onPress={() => setSelectedCategory(cat.id as MainCategoryId)}
              >
                <Text style={[styles.catChipText, isSelected && styles.catChipTextSelected]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <TouchableOpacity style={styles.submitButton} onPress={handleSave} activeOpacity={0.8}>
        <Text style={styles.submitButtonText}>Save Expense</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#111', marginBottom: 16 },
  scanBox: {
    borderWidth: 2,
    borderColor: '#000',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  scanIcon: { fontSize: 28, marginBottom: 4 },
  scanText: { fontSize: 15, fontWeight: '600', color: '#111' },
  scanSubText: { fontSize: 11, color: '#888', marginTop: 2 },
  dividerText: { textAlign: 'center', color: '#888', marginVertical: 16, fontSize: 11, fontWeight: '600' },
  formGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#111', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#111',
    backgroundColor: '#fff',
  },
  toggleRow: { flexDirection: 'row', gap: 8 },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  toggleActive: { backgroundColor: '#000', borderColor: '#000' },
  toggleText: { fontSize: 13, fontWeight: '600', color: '#111' },
  toggleTextActive: { color: '#fff' },
  catChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    marginRight: 8,
  },
  catChipSelected: { backgroundColor: '#000', borderColor: '#000' },
  catChipText: { fontSize: 12, color: '#111', fontWeight: '500' },
  catChipTextSelected: { color: '#fff' },
  submitButton: {
    backgroundColor: '#000',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 40,
  },
  submitButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});