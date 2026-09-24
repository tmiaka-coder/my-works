import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MOCK_TRANSACTIONS } from '../mocks/mockTransactions';
import { MAIN_CATEGORIES } from '../../types';
import { COLORS, SPACING } from '../constants/theme';

export const ExpensesScreen = () => {
  const totalNZD = MOCK_TRANSACTIONS.reduce((sum, tx) => sum + tx.totalAmount, 0);

  // カテゴリごとの集計
  const categoryTotals: Record<string, number> = {};
  MOCK_TRANSACTIONS.forEach((tx) => {
    tx.items.forEach((item) => {
      const catId = item.mainCategoryId;
      categoryTotals[catId] = (categoryTotals[catId] || 0) + item.price * item.quantity;
    });
  });

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.headerTitle}>Expense Analytics</Text>

      {/* カテゴリ別 breakdown */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>By Category</Text>
        {Object.entries(MAIN_CATEGORIES).map(([key, cat]) => {
          const amount = categoryTotals[cat.id] || 0;
          if (amount === 0) return null;
          const percentage = totalNZD > 0 ? Math.round((amount / totalNZD) * 100) : 0;

          return (
            <View key={cat.id} style={styles.categoryRow}>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryLabel}>{cat.label}</Text>
                <Text style={styles.categoryAmount}>${amount.toFixed(2)}</Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${percentage}%` }]} />
              </View>
            </View>
          );
        })}
      </View>
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
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  categoryRow: {
    marginBottom: SPACING.md,
  },
  categoryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  categoryLabel: {
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.border,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: COLORS.black,
  },
});