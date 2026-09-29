// src/screens/HomeScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useExpenses } from '../context/ExpenseContext';

export const HomeScreen = ({ navigation }: any) => {
  const { transactions } = useExpenses();
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);

  // 日付状態（2026年9月を初期値）
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 8, 1)); // 8は9月
  const nzdToJpyRate = 90.0; // 適用レート

  // 月切り替えハンドラー
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

  // 当月のデータのみフィルタリング
  const monthlyTransactions = safeTransactions.filter((tx) =>
    tx.purchaseDate ? tx.purchaseDate.startsWith(currentMonthStr) : false
  );

  // 合計金額の計算
  const totalExpense = monthlyTransactions.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
  const totalJpy = totalExpense * nzdToJpyRate;

  // ユーザー別内訳の計算
  const user1Total = monthlyTransactions
    .filter((tx) => tx.paidByUserId === 'user_01')
    .reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);

  const user2Total = monthlyTransactions
    .filter((tx) => tx.paidByUserId === 'user_02')
    .reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);

  const toggleTxExpand = (id: string) => {
    setExpandedTxId((prev) => (prev === id ? null : id));
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>

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

      {/* 総額カード（タップでアコーディオン開閉） */}
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Total Expenses</Text>
          <Text style={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>
        </View>
        <Text style={styles.cardAmount}>${totalExpense.toFixed(2)} NZD</Text>
        <Text style={styles.cardJpy}>
          ≈ ¥{Math.round(totalJpy).toLocaleString()} JPY{' '}
          <Text style={styles.rateBadge}>({`@ ¥${nzdToJpyRate.toFixed(2)} / NZD`})</Text>
        </Text>
        <Text style={styles.cardSubtext}>Tap to {isExpanded ? 'hide' : 'view'} breakdown</Text>

        {/* アコーディオン開閉エリア */}
        {isExpanded && (
          <View style={styles.accordionContent}>
            <View style={styles.divider} />
            <Text style={styles.breakdownTitle}>Paid Breakdown</Text>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>User 1:</Text>
              <Text style={styles.breakdownValue}>${user1Total.toFixed(2)}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>User 2:</Text>
              <Text style={styles.breakdownValue}>${user2Total.toFixed(2)}</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>

      {/* 直近の取引リスト */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {monthlyTransactions.length === 0 ? (
          <Text style={styles.emptyText}>No transactions registered for this month.</Text>
        ) : (
          monthlyTransactions.slice(0, 5).map((item) => {
            const isItemExpanded = expandedTxId === item.id;
            return (
              <View key={item.id} style={styles.txCardContainer}>
                <TouchableOpacity
                  style={styles.txRow}
                  activeOpacity={0.7}
                  onPress={() => toggleTxExpand(item.id)}
                >
                  <View style={styles.txMainInfo}>
                    <Text style={styles.storeName}>{item.storeName}</Text>
                    <Text style={styles.txDate}>
                      {item.purchaseDate} • Paid by {item.paidByUserId}
                    </Text>
                  </View>
                  <View style={styles.txRightInfo}>
                    <Text style={styles.txAmount}>${item.totalAmount.toFixed(2)}</Text>
                    <Text style={styles.arrowSub}>{isItemExpanded ? '▲' : '▼'}</Text>
                  </View>
                </TouchableOpacity>

                {/* 商品詳細ドロップダウン */}
                {isItemExpanded && (
                  <View style={styles.itemDetailBox}>
                    <View style={styles.itemHeader}>
                      <Text style={styles.itemHeaderText}>Item</Text>
                      <Text style={styles.itemHeaderText}>Qty</Text>
                      <Text style={styles.itemHeaderText}>Price</Text>
                    </View>
                    {item.items && item.items.length > 0 ? (
                      item.items.map((subItem, idx) => (
                        <View key={idx} style={styles.itemRow}>
                          <Text style={[styles.itemText, styles.flex2]} numberOfLines={1}>
                            {subItem.name}
                          </Text>
                          <Text style={[styles.itemText, styles.flex1, styles.textCenter]}>
                            x{subItem.quantity}
                          </Text>
                          <Text style={[styles.itemText, styles.flex1, styles.textRight]}>
                            ${(subItem.price * subItem.quantity).toFixed(2)}
                          </Text>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.noItemText}>No item details available</Text>
                    )}
                  </View>
                )}
              </View>
            );
          })
        )}
      </View>

      <TouchableOpacity style={styles.button} onPress={() => navigation?.navigate('Scan')}>
        <Text style={styles.buttonText}>+ Add New Expense</Text>
      </TouchableOpacity>
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
  card: { backgroundColor: '#000', padding: 20, borderRadius: 12, marginBottom: 20 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { color: '#888', fontSize: 13, textTransform: 'uppercase', fontWeight: '600' },
  expandIcon: { color: '#888', fontSize: 12 },
  cardAmount: { color: '#fff', fontSize: 28, fontWeight: '700', marginTop: 4 },
  cardJpy: { color: '#aaa', fontSize: 13, marginTop: 2, fontWeight: '500' },
  rateBadge: { color: '#888', fontSize: 12 },
  cardSubtext: { color: '#666', fontSize: 11, marginTop: 6 },
  accordionContent: { marginTop: 12 },
  divider: { height: 1, backgroundColor: '#333', marginVertical: 12 },
  breakdownTitle: { color: '#aaa', fontSize: 12, fontWeight: '600', marginBottom: 8 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  breakdownLabel: { color: '#ddd', fontSize: 13 },
  breakdownValue: { color: '#fff', fontSize: 13, fontWeight: '600' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12, color: '#333' },
  emptyText: { color: '#888', fontStyle: 'italic', paddingVertical: 10 },
  txCardContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
    overflow: 'hidden',
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  txMainInfo: { flex: 1 },
  storeName: { fontSize: 15, fontWeight: '600', color: '#222' },
  txDate: { fontSize: 12, color: '#888', marginTop: 2 },
  txRightInfo: { alignItems: 'flex-end', gap: 2 },
  txAmount: { fontSize: 15, fontWeight: '700', color: '#000' },
  arrowSub: { fontSize: 10, color: '#999' },
  itemDetailBox: {
    backgroundColor: '#f4f4f5',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e4e4e7',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#d4d4d8',
    paddingBottom: 4,
  },
  itemHeaderText: { fontSize: 11, color: '#71717a', fontWeight: '700' },
  itemRow: { flexDirection: 'row', paddingVertical: 3, alignItems: 'center' },
  itemText: { fontSize: 12, color: '#3f3f46' },
  flex2: { flex: 2 },
  flex1: { flex: 1 },
  textCenter: { textAlign: 'center' },
  textRight: { textAlign: 'right' },
  noItemText: { fontSize: 12, color: '#a1a1aa', fontStyle: 'italic' },
  button: {
    backgroundColor: '#000',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 40,
  },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});