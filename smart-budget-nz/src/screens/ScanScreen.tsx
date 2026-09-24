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
import { MAIN_CATEGORIES, MainCategoryId } from '../../types'; // ← ../../types に変更
import { COLORS, SPACING } from '../constants/theme';

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

    // フォームリセット
    setStoreName('');
    setAmount('');
    Alert.alert('保存完了', '支出を追加しました！', [
      {
        text: 'OK',
        onPress: () => navigation.navigate('Home'),
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.headerTitle}>Scan / Add Expense</Text>

      {/* カメラ読み取り枠（モックUI） */}
      <TouchableOpacity style={styles.scanBox} activeOpacity={0.7}>
        <Text style={styles.scanIcon}>📷</Text>
        <Text style={styles.scanText}>Tap to Scan Receipt</Text>
        <Text style={styles.scanSubText}>Auto-detect store and items (Coming soon)</Text>
      </TouchableOpacity>

      <Text style={styles.dividerText}>― MANUAL ENTRY ―</Text>

      {/* 1. 店舗名 */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Store Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. PAK'nSAVE, New World"
          placeholderTextColor={COLORS.textSecondary}
          value={storeName}
          onChangeText={setStoreName}
        />
      </View>

      {/* 2. 金額 */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Total Amount ($ NZD)</Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          placeholderTextColor={COLORS.textSecondary}
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
        />
      </View>

      {/* 3. 支払者選択 */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Paid By</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              paidBy === 'user_01' && { backgroundColor: COLORS.user1 },
            ]}
            onPress={() => setPaidBy('user_01')}
          >
            <Text style={[styles.toggleText, paidBy === 'user_01' && styles.toggleTextActive]}>
              User 1 (User1)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleBtn,
              paidBy === 'user_02' && { backgroundColor: COLORS.user2 },
            ]}
            onPress={() => setPaidBy('user_02')}
          >
            <Text style={[styles.toggleText, paidBy === 'user_02' && styles.toggleTextActive]}>
              User 2 (User2)
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 4. カテゴリー選択 */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
          {Object.values(MAIN_CATEGORIES).map((cat) => {
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

      {/* 保存ボタン */}
      <TouchableOpacity style={styles.submitButton} onPress={handleSave} activeOpacity={0.8}>
        <Text style={styles.submitButtonText}>Save Expense</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.md,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  scanBox: {
    borderWidth: 2,
    borderColor: COLORS.black,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  scanIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  scanText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  scanSubText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  dividerText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    marginVertical: SPACING.md,
    fontSize: 11,
    fontWeight: '600',
  },
  formGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: SPACING.sm,
    fontSize: 15,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.surface,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  toggleTextActive: {
    color: COLORS.white,
  },
  catScroll: {
    flexDirection: 'row',
  },
  catChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    marginRight: SPACING.xs,
  },
  catChipSelected: {
    backgroundColor: COLORS.black,
    borderColor: COLORS.black,
  },
  catChipText: {
    fontSize: 12,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  catChipTextSelected: {
    color: COLORS.white,
  },
  submitButton: {
    backgroundColor: COLORS.black,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
});