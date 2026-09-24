import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal } from 'react-native';
import { MOCK_TRANSACTIONS } from '../mocks/mockTransactions';
import { COLORS, SPACING } from '../constants/theme';
import { Transaction } from '../../types';

const DEFAULT_NZD_TO_JPY = 90;

export const HomeScreen = () => {
  const [selectedMonth, setSelectedMonth] = useState('2026-09');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // 月変更処理
  const changeMonth = (delta: number) => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + delta, 1);
    const newY = date.getFullYear();
    const newM = String(date.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${newY}-${newM}`);
  };

  // 選択月のデータ抽出
  const filteredTransactions = MOCK_TRANSACTIONS.filter((tx) =>
    tx.purchaseDate.startsWith(selectedMonth)
  );

  const totalNZD = filteredTransactions.reduce((sum, tx) => sum + tx.totalAmount, 0);
  const totalJPY = Math.round(totalNZD * DEFAULT_NZD_TO_JPY);

  const user1Total = filteredTransactions
    .filter((tx) => tx.paidByUserId === 'user_01')
    .reduce((sum, tx) => sum + tx.totalAmount, 0);
  const user1Ratio = totalNZD > 0 ? Math.round((user1Total / totalNZD) * 100) : 0;
  const user2Ratio = totalNZD > 0 ? 100 - user1Ratio : 0;

  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    const isUser1 = item.paidByUserId === 'user_01';

    return (
      <TouchableOpacity
        style={styles.txCard}
        onPress={() => setSelectedTx(item)}
        activeOpacity={0.7}
      >
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
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
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

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total Expenses ({selectedMonth})</Text>
        <Text style={styles.summaryNZD}>${totalNZD.toFixed(2)}</Text>
        <View style={styles.jpyRow}>
          <Text style={styles.summaryJPY}>≈ ¥{totalJPY.toLocaleString()}</Text>
          <Text style={styles.rateTag}>@ ¥{DEFAULT_NZD_TO_JPY} / NZD</Text>
        </View>

        {/* Payer Ratio Bar */}
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

      {/* Recent Transactions List */}
      <Text style={styles.sectionTitle}>Recent Transactions</Text>
      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id}
        renderItem={renderTransactionItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No expenses recorded for this month.</Text>
        }
      />

      {/* Detail Modal */}
      <Modal visible={selectedTx !== null} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedTx?.storeName}</Text>
            <Text style={styles.modalSubTitle}>{selectedTx?.purchaseDate}</Text>

            <View style={styles.detailList}>
              {selectedTx?.items.map((item) => (
                <View key={item.id} style={styles.detailRow}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {item.name} x{item.quantity}
                  </Text>
                  <Text style={styles.itemPrice}>
                    ${(item.price * item.quantity).toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.modalFooter}>
              <Text style={styles.modalTotalLabel}>Total:</Text>
              <Text style={styles.modalTotalValue}>
                ${selectedTx?.totalAmount.toFixed(2)}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedTx(null)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  jpyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  summaryJPY: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  rateTag: {
    fontSize: 11,
    color: COLORS.textSecondary,
    backgroundColor: COLORS.border,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
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
  emptyText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    marginTop: SPACING.lg,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  modalContent: {
    width: '100%',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: SPACING.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  modalSubTitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  detailList: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  itemName: {
    fontSize: 13,
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: SPACING.sm,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTotalLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  modalTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  closeButton: {
    backgroundColor: COLORS.black,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: COLORS.white,
    fontWeight: '600',
  },
});