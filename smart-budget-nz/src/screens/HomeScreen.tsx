import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { MOCK_TRANSACTIONS } from '../mocks/mockTransactions';
import { COLORS, SPACING } from '../constants/theme';
import { Transaction } from '../../types';
// 為替レート（仮定: 1 NZD = 90 JPY）
const DEFAULT_NZD_TO_JPY = 90;

export const HomeScreen = () => {
  // 今月の総支出額の計算
  const totalNZD = MOCK_TRANSACTIONS.reduce((sum, tx) => sum + tx.totalAmount, 0);
  const totalJPY = Math.round(totalNZD * DEFAULT_NZD_TO_JPY);

  // ユーザーごとの支出計算
  const user1Total = MOCK_TRANSACTIONS.filter((tx) => tx.paidByUserId === 'user_01').reduce(
    (sum, tx) => sum + tx.totalAmount,
    0
  );
  const user1Ratio = totalNZD > 0 ? Math.round((user1Total / totalNZD) * 100) : 0;
  const user2Ratio = 100 - user1Ratio;

  // 取引履歴の1件分のレンダー
  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    const isUser1 = item.paidByUserId === 'user_01';

    return (
      <View style={styles.txCard}>
        <View style={styles.txMainInfo}>
          <View style={styles.storeHeader}>
            <Text style={styles.storeName}>{item.storeName}</Text>
            <View
              style={[
                styles.userBadge,
                { backgroundColor: isUser1 ? COLORS.user1 : COLORS.user2 },
              ]}
            >
              <Text style={styles.userBadgeText}>{isUser1 ? 'User 1' : 'User 2'}</Text>
            </View>
          </View>
          <Text style={styles.txDate}>{item.purchaseDate}</Text>
        </View>

        <View style={styles.txAmountInfo}>
          <Text style={styles.txAmountNZD}>${item.totalAmount.toFixed(2)}</Text>
          <Text style={styles.txAmountJPY}>
            ≈ ¥{Math.round(item.totalAmount * DEFAULT_NZD_TO_JPY).toLocaleString()}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 1. Monthly Summary Card */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total Expenses (This Month)</Text>
        <Text style={styles.summaryNZD}>${totalNZD.toFixed(2)}</Text>
        <Text style={styles.summaryJPY}>≈ ¥{totalJPY.toLocaleString()}</Text>

        {/* 2. Payer Ratio Bar */}
        <View style={styles.ratioContainer}>
          <Text style={styles.ratioLabel}>Paid By Breakdown</Text>
          <View style={styles.barTrack}>
            <View style={[styles.barUser1, { width: `${user1Ratio}%` }]} />
            <View style={[styles.barUser2, { width: `${user2Ratio}%` }]} />
          </View>
          <View style={styles.ratioLegend}>
            <Text style={styles.legendText}>User 1: {user1Ratio}%</Text>
            <Text style={styles.legendText}>User 2: {user2Ratio}%</Text>
          </View>
        </View>
      </View>

      {/* 3. Recent Transactions Section */}
      <Text style={styles.sectionTitle}>Recent Transactions</Text>

      <FlatList
        data={MOCK_TRANSACTIONS}
        keyExtractor={(item) => item.id}
        renderItem={renderTransactionItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  summaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  summaryNZD: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: SPACING.xs,
  },
  summaryJPY: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  ratioContainer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
  },
  ratioLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  barTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  barUser1: {
    height: '100%',
    backgroundColor: COLORS.user1,
  },
  barUser2: {
    height: '100%',
    backgroundColor: COLORS.user2,
  },
  ratioLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
  },
  legendText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  listContainer: {
    paddingBottom: SPACING.xl,
  },
  txCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  txMainInfo: {
    flex: 1,
  },
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  storeName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  userBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  userBadgeText: {
    fontSize: 10,
    color: COLORS.white,
    fontWeight: '600',
  },
  txDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  txAmountInfo: {
    alignItems: 'flex-end',
  },
  txAmountNZD: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  txAmountJPY: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
});