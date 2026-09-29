// src/screens/ExpensesScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useExpenses } from '../context/ExpenseContext';
import { MAIN_CATEGORIES, MainCategoryId } from '../../types';

// シックなトーンのシックカラーパレット
const CATEGORY_COLORS: Record<MainCategoryId, string> = {
  food_groceries: '#4A5568', // スレートグレー
  snack_beverages: '#718096', // ミディアムグレー
  dining_out: '#2B6CB0', // シックブルー
  household: '#2C7A7B', // シックティール
  transportation: '#4C51BF', // インディゴ
  health_medical: '#9B2C2C', // 落ち着いたレッド
  social_gifts: '#B83280', // 落ち着いたマゼンタ
  fixed_expense: '#2D3748', // ダークグレー
  other: '#A0AEC0', // ライトスレート
};

export const ExpensesScreen = ({ navigation }: any) => {
  const { transactions } = useExpenses();
  const [filterUser, setFilterUser] = useState<'ALL' | 'user_01' | 'user_02'>('ALL');

  // 日付状態（2026年9月を初期値）
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 8, 1));

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const currentMonthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

  const safeTransactions = transactions || [];

  // 月とユーザーフィルターを適用
  const filteredList = safeTransactions.filter((tx) => {
    const isMonthMatch = tx.purchaseDate ? tx.purchaseDate.startsWith(currentMonthStr) : false;
    const isUserMatch = filterUser === 'ALL' || tx.paidByUserId === filterUser;
    return isMonthMatch && isUserMatch;
  });

  // カテゴリーごとの集計
  const categoryTotals: Record<MainCategoryId, number> = {
    food_groceries: 0,
    snack_beverages: 0,
    dining_out: 0,
    household: 0,
    transportation: 0,
    health_medical: 0,
    social_gifts: 0,
    fixed_expense: 0,
    other: 0,
  };

  let grandTotal = 0;

  filteredList.forEach((tx) => {
    if (tx.items && tx.items.length > 0) {
      tx.items.forEach((item) => {
        const cat = item.mainCategoryId || 'other';
        const cost = item.price * item.quantity;
        categoryTotals[cat] = (categoryTotals[cat] || 0) + cost;
        grandTotal += cost;
      });
    } else {
      categoryTotals['other'] += tx.totalAmount || 0;
      grandTotal += tx.totalAmount || 0;
    }
  });

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Expenses Breakdown</Text>

      {/* 月切り替えヘッダー */}
      <View style={styles.monthSelector}>
        <TouchableOpacity onPress={handlePrevMonth} style={styles.monthBtn}>
          <Text style={styles.monthBtnText}>＜</Text>
        </TouchableOpacity>
        <Text style={styles.monthText}>{`${currentYear}年${currentMonth}月`}</Text>
        <TouchableOpacity onPress={handleNextMonth} style={styles.monthBtn}>
          <Text style={styles.monthBtnText}>＞</Text>
        </TouchableOpacity>
      </View>

      {/* ユーザーフィルターボタン */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterBtn, filterUser === 'ALL' && styles.filterBtnActive]}
          onPress={() => setFilterUser('ALL')}
        >
          <Text style={[styles.filterText, filterUser === 'ALL' && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, filterUser === 'user_01' && styles.filterBtnActive]}
          onPress={() => setFilterUser('user_01')}
        >
          <Text style={[styles.filterText, filterUser === 'user_01' && styles.filterTextActive]}>
            User 1
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, filterUser === 'user_02' && styles.filterBtnActive]}
          onPress={() => setFilterUser('user_02')}
        >
          <Text style={[styles.filterText, filterUser === 'user_02' && styles.filterTextActive]}>
            User 2
          </Text>
        </TouchableOpacity>
      </View>

      {/* マルチカラープログレスバー */}
      <View style={styles.progressBarCard}>
        <Text style={styles.progressTitle}>Monthly Category Ratio</Text>
        <View style={styles.progressBarTrack}>
          {Object.entries(MAIN_CATEGORIES).map(([key, catInfo]) => {
            const amount = categoryTotals[catInfo.id] || 0;
            const percentage = grandTotal > 0 ? (amount / grandTotal) * 100 : 0;
            if (percentage === 0) return null;
            return (
              <View
                key={catInfo.id}
                style={{
                  width: `${percentage}%`,
                  backgroundColor: CATEGORY_COLORS[catInfo.id],
                  height: '100%',
                }}
              />
            );
          })}
        </View>
        <Text style={styles.progressTotalText}>Total: ${grandTotal.toFixed(2)} NZD</Text>
      </View>

      {/* 全カテゴリー固定一覧（$0も含む） */}
      <View style={styles.categoryListSection}>
        <Text style={styles.sectionTitle}>Categories</Text>
        {Object.entries(MAIN_CATEGORIES).map(([key, catInfo]) => {
          const amount = categoryTotals[catInfo.id] || 0;
          const percentage = grandTotal > 0 ? (amount / grandTotal) * 100 : 0;
          const color = CATEGORY_COLORS[catInfo.id];

          return (
            <View key={catInfo.id} style={styles.catRow}>
              <View style={styles.catLeft}>
                <View style={[styles.colorDot, { backgroundColor: color }]} />
                <Text style={styles.catName}>{catInfo.label}</Text>
              </View>
              <View style={styles.catRight}>
                <Text style={styles.catAmount}>${amount.toFixed(2)}</Text>
                <Text style={styles.catPercent}>{percentage.toFixed(1)}%</Text>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f9f9f9' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 12, color: '#111' },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    gap: 20,
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  monthBtn: { paddingHorizontal: 12 },
  monthBtnText: { fontSize: 16, fontWeight: '700', color: '#333' },
  monthText: { fontSize: 15, fontWeight: '700', color: '#111' },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#eee',
  },
  filterBtnActive: { backgroundColor: '#000' },
  filterText: { fontSize: 13, color: '#555', fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  progressBarCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#eee',
  },
  progressTitle: { fontSize: 13, fontWeight: '600', color: '#666', marginBottom: 10 },
  progressBarTrack: {
    height: 14,
    backgroundColor: '#edf2f7',
    borderRadius: 7,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressTotalText: { fontSize: 13, fontWeight: '700', color: '#111', textAlign: 'right' },
  categoryListSection: { marginBottom: 30 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12, color: '#333' },
  catRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  catLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  colorDot: { width: 12, height: 12, borderRadius: 6 },
  catName: { fontSize: 14, fontWeight: '600', color: '#222' },
  catRight: { alignItems: 'flex-end' },
  catAmount: { fontSize: 14, fontWeight: '700', color: '#000' },
  catPercent: { fontSize: 11, color: '#888', marginTop: 1 },
});