import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useExpenses } from '../context/ExpenseContext';
import { MAIN_CATEGORIES } from '../../types';
import { COLORS, SPACING } from '../constants/theme';

const CATEGORY_COLORS: Record<string, string> = {
  cat_food: COLORS.categoryFood,
  cat_housing: COLORS.categoryHousing,
  cat_transport: COLORS.categoryTransport,
  cat_daily: COLORS.categoryDaily,
  cat_other: COLORS.categoryOther,
};

export const ExpensesScreen = () => {
  const { transactions } = useExpenses();
  const [selectedMonth, setSelectedMonth] = useState('2026-09');

  const changeMonth = (delta: number) => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + delta, 1);
    const newY = date.getFullYear();
    const newM = String(date.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${newY}-${newM}`);
  };

  const filteredTransactions = transactions.filter((tx) =>
    tx.purchaseDate.startsWith(selectedMonth)
  );

  const totalNZD = filteredTransactions.reduce((sum, tx) => sum + tx.totalAmount, 0);

  // カテゴリ別の集計
  const categoryTotals: Record<string, number> = {};
  filteredTransactions.forEach((tx) => {
    tx.items.forEach((item) => {
      const catId = item.mainCategoryId;
      categoryTotals[catId] = (categoryTotals[catId] || 0) + item.price * item.quantity;
    });
  });

  return (
    <ScrollView style={styles.container}>
      {/* Month Selector */}
      <View style={styles.monthSelector}>
        <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthNavBtn}>
          <Text style={styles.monthNavText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{selectedMonth}</Text>
        <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthNavBtn}>
          <Text style={styles.monthNavText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* 1. Overall Category Breakdown Bar */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Monthly Breakdown ({selectedMonth})</Text>
        <View style={styles.multiProgressBar}>
          {Object.values(MAIN_CATEGORIES).map((cat) => {
            const amount = categoryTotals[cat.id] || 0;
            const percentage = totalNZD > 0 ? (amount / totalNZD) * 100 : 0;
            if (percentage === 0) return null;

            return (
              <View
                key={cat.id}
                style={[
                  styles.progressSegment,
                  {
                    width: `${percentage}%`,
                    backgroundColor: CATEGORY_COLORS[cat.id] || COLORS.categoryOther,
                  },
                ]}
              />
            );
          })}
        </View>

        <View style={styles.legendGrid}>
          {Object.values(MAIN_CATEGORIES).map((cat) => {
            const amount = categoryTotals[cat.id] || 0;
            const percentage = totalNZD > 0 ? Math.round((amount / totalNZD) * 100) : 0;
            const color = CATEGORY_COLORS[cat.id] || COLORS.categoryOther;

            return (
              <View key={cat.id} style={styles.legendItem}>
                <View style={[styles.colorDot, { backgroundColor: color }]} />
                <Text style={styles.legendLabel}>
                  {cat.label}: {percentage}%
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* 2. Itemized Category List (All Categories included) */}
      <View style={[styles.card, { marginTop: SPACING.md }]}>
        <Text style={styles.cardTitle}>Category Details</Text>

        {Object.values(MAIN_CATEGORIES).map((cat) => {
          const amount = categoryTotals[cat.id] || 0;
          const percentage = totalNZD > 0 ? Math.round((amount / totalNZD) * 100) : 0;
          const color = CATEGORY_COLORS[cat.id] || COLORS.categoryOther;

          return (
            <View key={cat.id} style={styles.categoryRow}>
              <View style={styles.categoryInfo}>
                <View style={styles.labelWithDot}>
                  <View style={[styles.colorDot, { backgroundColor: color }]} />
                  <Text style={styles.categoryLabel}>{cat.label}</Text>
                </View>
                <Text style={styles.categoryAmount}>${amount.toFixed(2)}</Text>
              </View>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${percentage}%`,
                      backgroundColor: color,
                    },
                  ]}
                />
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
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  monthNavBtn: {
    padding: SPACING.xs,
  },
  monthNavText: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  multiProgressBar: {
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.border,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  progressSegment: {
    height: '100%',
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '45%',
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  categoryRow: {
    marginBottom: SPACING.md,
  },
  categoryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  labelWithDot: {
    flexDirection: 'row',
    alignItems: 'center',
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
  },
});