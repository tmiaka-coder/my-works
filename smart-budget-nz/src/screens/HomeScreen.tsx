import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useExpenses } from '../context/ExpenseContext';
import { MAIN_CATEGORIES } from '../types';

interface HomeScreenProps {
  navigation?: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = () => {
  const {
    transactions,
    user1Name,
    user2Name,
    exchangeRate,
    currentTheme,
    monthlyBudget,
    categoryBudgets,
    getPayerName,
  } = useExpenses();

  const totalNzd = useMemo(
    () => transactions.reduce((sum, tx) => sum + (tx.totalNzd ?? tx.totalAmount ?? 0), 0),
    [transactions]
  );

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    Object.values(MAIN_CATEGORIES).forEach((cat) => {
      totals[cat.id] = 0;
    });

    transactions.forEach((tx) => {
      if (tx.items && tx.items.length > 0) {
        tx.items.forEach((item) => {
          const catId = item.mainCategoryId || 'other';
          const amount = (item.price || 0) * (item.quantity || 1);
          totals[catId] = (totals[catId] || 0) + amount;
        });
      } else {
        const amount = tx.totalNzd ?? tx.totalAmount ?? 0;
        totals.other = (totals.other || 0) + amount;
      }
    });

    return totals;
  }, [transactions]);

  const monthTrend = useMemo(() => {
    const rolling: Array<{ label: string; spent: number; budget: number }> = [];
    for (let i = 5; i >= 0; i -= 1) {
      const monthDate = new Date();
      monthDate.setDate(1);
      monthDate.setMonth(monthDate.getMonth() - i);

      const label = monthDate.toLocaleString('en-US', { month: 'short' });
      const key = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;

      const spent = transactions.reduce((sum, tx) => {
        if (!tx.purchaseDate) return sum;
        const txDate = new Date(tx.purchaseDate);
        const txKey = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;
        if (txKey !== key) return sum;
        return sum + (tx.totalNzd ?? tx.totalAmount ?? 0);
      }, 0);

      rolling.push({ label, spent, budget: monthlyBudget });
    }
    return rolling;
  }, [transactions, monthlyBudget]);

  const monthlyMax = Math.max(...monthTrend.map((month) => Math.max(month.spent, month.budget, 1)), 1);
  const totalJpy = Math.round(totalNzd * exchangeRate);
  const remainingBudget = monthlyBudget > 0 ? monthlyBudget - totalNzd : 0;
  const budgetPercent = monthlyBudget > 0 ? Math.min((totalNzd / monthlyBudget) * 100, 100) : 0;
  const avgDailySpend = totalNzd > 0 ? totalNzd / Math.max(new Date().getDate(), 1) : 0;

  const user1Total = transactions
    .filter((tx) => (tx.paidBy ?? tx.paidByUserId) === 'user_01')
    .reduce((sum, tx) => sum + (tx.totalNzd ?? tx.totalAmount ?? 0), 0);

  const user2Total = transactions
    .filter((tx) => (tx.paidBy ?? tx.paidByUserId) === 'user_02')
    .reduce((sum, tx) => sum + (tx.totalNzd ?? tx.totalAmount ?? 0), 0);

  const categorySummary = Object.values(MAIN_CATEGORIES)
    .map((cat) => ({
      ...cat,
      spent: categoryTotals[cat.id] || 0,
      budget: categoryBudgets[cat.id] || 0,
    }))
    .filter((cat) => cat.spent > 0 || cat.budget > 0)
    .sort((a, b) => b.spent - a.spent);

  const topCategory = categorySummary[0];

  const monthCompareKeys = useMemo(() => {
    const keys: Array<{ key: string; label: string }> = [];
    for (let i = 2; i >= 0; i -= 1) {
      const monthDate = new Date();
      monthDate.setDate(1);
      monthDate.setMonth(monthDate.getMonth() - i);
      keys.push({
        key: `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`,
        label: monthDate.toLocaleString('en-US', { month: 'short' }),
      });
    }
    return keys;
  }, []);

  const categoryMonthComparison = useMemo(() => {
    return Object.values(MAIN_CATEGORIES)
      .map((category) => {
        const months = monthCompareKeys.map(({ key, label }) => {
          const spent = transactions.reduce((sum, tx) => {
            if (!tx.purchaseDate) return sum;
            const txDate = new Date(tx.purchaseDate);
            const txKey = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;
            if (txKey !== key) return sum;
            if (!tx.items || tx.items.length === 0) return sum + (tx.totalNzd ?? tx.totalAmount ?? 0);
            return sum + tx.items
              .filter((item) => item.mainCategoryId === category.id)
              .reduce((itemSum, item) => itemSum + (item.price || 0) * (item.quantity || 1), 0);
          }, 0);

          return { label, spent };
        });

        const max = Math.max(...months.map((month) => month.spent), 1);

        return {
          id: category.id,
          label: category.label,
          months,
          max,
        };
      })
      .filter((category) => category.months.some((month) => month.spent > 0));
  }, [monthCompareKeys, transactions]);

  return (
    <ScrollView style={[styles.container, { backgroundColor: currentTheme.bg }]} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Overview</Text>

      <View style={[styles.heroCard, { borderColor: currentTheme.primary }]}>
        <View style={styles.heroHeader}>
          <Text style={styles.cardLabel}>This month</Text>
          <Text style={styles.pill}>${monthlyBudget.toFixed(0)} budget</Text>
        </View>
        <Text style={[styles.totalAmount, { color: currentTheme.primary }]}>${totalNzd.toFixed(2)} NZD</Text>
        <Text style={styles.jpySub}>≈ ¥{totalJpy.toLocaleString()} JPY</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaBox}>
            <Text style={styles.metaLabel}>Remaining</Text>
            <Text style={styles.metaValue}>{remainingBudget >= 0 ? `$${remainingBudget.toFixed(2)}` : `-$${Math.abs(remainingBudget).toFixed(2)}`}</Text>
          </View>
          <View style={styles.metaBox}>
            <Text style={styles.metaLabel}>Daily spend</Text>
            <Text style={styles.metaValue}>${avgDailySpend.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.budgetBox}>
          <View style={styles.budgetRow}>
            <Text style={styles.budgetLabel}>Budget used</Text>
            <Text style={styles.budgetValue}>{budgetPercent.toFixed(0)}%</Text>
          </View>
          <View style={styles.budgetBar}>
            <View style={[styles.budgetBarFill, { width: `${budgetPercent}%`, backgroundColor: currentTheme.primary }]} />
          </View>
        </View>
      </View>

      <View style={styles.splitSection}>
        <View style={styles.splitCard}>
          <Text style={styles.splitName}>{user1Name}</Text>
          <Text style={styles.splitAmount}>${user1Total.toFixed(2)}</Text>
          <Text style={styles.splitJpy}>¥{Math.round(user1Total * exchangeRate).toLocaleString()}</Text>
        </View>

        <View style={styles.splitCard}>
          <Text style={styles.splitName}>{user2Name}</Text>
          <Text style={styles.splitAmount}>${user2Total.toFixed(2)}</Text>
          <Text style={styles.splitJpy}>¥{Math.round(user2Total * exchangeRate).toLocaleString()}</Text>
        </View>
      </View>

      {topCategory && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Top category</Text>
          <Text style={styles.topCategoryText}>{topCategory.label}: ${topCategory.spent.toFixed(2)}</Text>
        </View>
      )}

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Monthly trend</Text>
        <View style={styles.chartWrap}>
          {monthTrend.map((month) => {
            const spentHeight = Math.max(18, (month.spent / monthlyMax) * 110);
            const budgetHeight = Math.max(12, (month.budget / monthlyMax) * 110);

            return (
              <View key={`${month.label}-${month.budget}`} style={styles.barColumn}>
                <View style={styles.barStack}>
                  <View style={[styles.budgetBarMini, { height: budgetHeight }]} />
                  <View style={[styles.spentBarMini, { height: spentHeight, backgroundColor: currentTheme.primary }]} />
                </View>
                <Text style={styles.monthLabel}>{month.label}</Text>
                <Text style={styles.monthValue}>${month.spent.toFixed(0)}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Category by month</Text>
        <Text style={styles.chartSubtitle}>Compare spending across the last 3 months</Text>
        {categoryMonthComparison.slice(0, 6).map((category) => (
          <View key={category.id} style={styles.categoryTrendRow}>
            <Text style={styles.categoryTrendLabel}>{category.label}</Text>
            <View style={styles.trendBars}>
              {category.months.map((month) => (
                <View key={`${category.id}-${month.label}`} style={styles.trendBarWrap}>
                  <View style={styles.trendBarTrack}>
                    <View
                      style={[
                        styles.trendBarFill,
                        {
                          height: Math.max(10, (month.spent / category.max) * 100),
                          backgroundColor: currentTheme.primary,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.trendMonthLabel}>{month.label}</Text>
                  <Text style={styles.trendMonthValue}>${month.spent.toFixed(0)}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Category focus</Text>
        {categorySummary.map((cat) => (
          <View key={cat.id} style={styles.categoryRow}>
            <View style={styles.categoryMeta}>
              <Text style={styles.categoryName}>{cat.label}</Text>
              <Text style={styles.categoryBudgetText}>Spent: ${cat.spent.toFixed(2)}</Text>
            </View>
            <Text style={styles.categoryBudgetText}>
              {cat.budget > 0 ? `Budget $${cat.budget.toFixed(2)}` : 'No cap set'}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.recentSection}>
        <Text style={styles.sectionTitle}>Recent transactions</Text>
        {transactions.length === 0 ? (
          <Text style={styles.emptyText}>No transactions yet.</Text>
        ) : (
          transactions.slice(0, 5).map((tx) => {
            const amount = tx.totalNzd ?? tx.totalAmount ?? 0;
            const payer = getPayerName(tx.paidBy ?? tx.paidByUserId);
            return (
              <View key={tx.id} style={styles.txRow}>
                <View style={styles.txInfo}>
                  <Text style={styles.txStore}>{tx.storeName}</Text>
                  <Text style={styles.txDate}>{tx.purchaseDate} • {payer}</Text>
                </View>
                <View style={styles.txAmountBox}>
                  <Text style={styles.txAmount}>${amount.toFixed(2)}</Text>
                  <Text style={styles.txJpy}>¥{Math.round(amount * exchangeRate).toLocaleString()}</Text>
                </View>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  contentContainer: { paddingBottom: 32 },
  title: { fontSize: 30, fontWeight: '800', marginBottom: 16, color: '#101828' },
  heroCard: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 20,
    marginBottom: 18,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 5,
  },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardLabel: { fontSize: 12, color: '#667085', textTransform: 'uppercase', fontWeight: '700', letterSpacing: 0.8 },
  pill: { fontSize: 11, color: '#475467', backgroundColor: '#F3F4F6', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, fontWeight: '700' },
  totalAmount: { fontSize: 36, fontWeight: '800', marginTop: 4, letterSpacing: -0.6 },
  jpySub: { fontSize: 14, color: '#7a7a7a', marginTop: 3 },
  metaRow: { flexDirection: 'row', marginTop: 18, marginBottom: 12 },
  metaBox: { flex: 1, backgroundColor: '#F7F9FC', borderRadius: 12, padding: 12, marginRight: 8 },
  metaLabel: { fontSize: 11, color: '#667085', fontWeight: '600' },
  metaValue: { fontSize: 16, color: '#111827', fontWeight: '700', marginTop: 4 },
  budgetBox: { marginTop: 8 },
  budgetRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  budgetLabel: { fontSize: 12, color: '#475467', fontWeight: '600' },
  budgetValue: { fontSize: 12, color: '#111827', fontWeight: '700' },
  budgetBar: { height: 12, backgroundColor: '#EEF1F4', borderRadius: 999, overflow: 'hidden' },
  budgetBarFill: { height: '100%', borderRadius: 999 },
  splitSection: { flexDirection: 'row', gap: 12, marginBottom: 18 },
  splitCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e7ebf0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  splitName: { fontSize: 13, fontWeight: '600', color: '#4b5563' },
  splitAmount: { fontSize: 18, fontWeight: '700', color: '#111827', marginTop: 4 },
  splitJpy: { fontSize: 12, color: '#7a7a7a', marginTop: 2 },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#edf0f4',
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1f2937', marginBottom: 10 },
  chartSubtitle: { fontSize: 11, color: '#667085', marginBottom: 12 },
  topCategoryText: { fontSize: 14, color: '#1f2937', fontWeight: '700' },
  chartWrap: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', minHeight: 160, paddingTop: 8 },
  barColumn: { flex: 1, alignItems: 'center', marginHorizontal: 2 },
  barStack: { height: 110, width: 22, justifyContent: 'flex-end', alignItems: 'center', position: 'relative' },
  budgetBarMini: { width: 16, borderRadius: 8, backgroundColor: '#E5E7EB', position: 'absolute', bottom: 0 },
  spentBarMini: { width: 16, borderRadius: 8, marginBottom: 0 },
  monthLabel: { fontSize: 11, color: '#666', fontWeight: '600', marginTop: 8 },
  monthValue: { fontSize: 10, color: '#111827', fontWeight: '700', marginTop: 2 },
  categoryTrendRow: { marginBottom: 14 },
  categoryTrendLabel: { fontSize: 12, color: '#374151', fontWeight: '600', marginBottom: 8 },
  trendBars: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 },
  trendBarWrap: { flex: 1, alignItems: 'center' },
  trendBarTrack: {
    width: 18,
    height: 56,
    backgroundColor: '#EEF1F4',
    borderRadius: 10,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  trendBarFill: { width: '100%', borderRadius: 10 },
  trendMonthLabel: { fontSize: 10, color: '#667085', marginTop: 6 },
  trendMonthValue: { fontSize: 9, color: '#111827', fontWeight: '700', marginTop: 2 },
  categoryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  categoryMeta: { flex: 1 },
  categoryName: { fontSize: 13, color: '#1f2937', fontWeight: '600' },
  categoryBudgetText: { fontSize: 11, color: '#667085' },
  recentSection: { marginBottom: 30 },
  emptyText: { color: '#7a7a7a', fontStyle: 'italic' },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#edf2f7',
  },
  txInfo: { flex: 1, marginRight: 8 },
  txStore: { fontSize: 15, fontWeight: '600', color: '#111827' },
  txDate: { fontSize: 12, color: '#7a7a7a', marginTop: 2 },
  txAmountBox: { alignItems: 'flex-end' },
  txAmount: { fontSize: 15, fontWeight: '700', color: '#111827' },
  txJpy: { fontSize: 11, color: '#7a7a7a' },
});