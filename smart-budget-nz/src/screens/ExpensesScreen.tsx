// src/screens/ExpensesScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useExpenses } from '../context/ExpenseContext';

export const ExpensesScreen = ({ navigation }: any) => {
  const { transactions } = useExpenses();
  const [filterUser, setFilterUser] = useState<'ALL' | 'user_01' | 'user_02'>('ALL');

  const safeTransactions = transactions || [];
  const filteredList = safeTransactions.filter((tx) => {
    if (filterUser === 'ALL') return true;
    return tx.paidByUserId === filterUser;
  });

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Expenses History</Text>

      {/* フィルターボタン */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterBtn, filterUser === 'ALL' && styles.filterBtnActive]}
          onPress={() => setFilterUser('ALL')}
        >
          <Text style={[styles.filterText, filterUser === 'ALL' && styles.filterTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, filterUser === 'user_01' && styles.filterBtnActive]}
          onPress={() => setFilterUser('user_01')}
        >
          <Text style={[styles.filterText, filterUser === 'user_01' && styles.filterTextActive]}>User 1</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, filterUser === 'user_02' && styles.filterBtnActive]}
          onPress={() => setFilterUser('user_02')}
        >
          <Text style={[styles.filterText, filterUser === 'user_02' && styles.filterTextActive]}>User 2</Text>
        </TouchableOpacity>
      </View>

      {/* リスト表示 */}
      {filteredList.length === 0 ? (
        <Text style={styles.emptyText}>No expenses match the filter.</Text>
      ) : (
        filteredList.map((item) => (
          <View key={item.id} style={styles.txRow}>
            <View>
              <Text style={styles.storeName}>{item.storeName}</Text>
              <Text style={styles.subDetail}>
                {item.purchaseDate} • Paid by {item.paidByUserId}
              </Text>
            </View>
            <Text style={styles.txAmount}>${item.totalAmount.toFixed(2)}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f9f9f9' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 16, color: '#111' },
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
  emptyText: { color: '#888', fontStyle: 'italic', marginTop: 12 },
  txRow: {
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
  storeName: { fontSize: 15, fontWeight: '600', color: '#222' },
  subDetail: { fontSize: 12, color: '#888', marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '700', color: '#000' },
});