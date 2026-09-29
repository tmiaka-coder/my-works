import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useExpenses } from '../context/ExpenseContext';
import { MAIN_CATEGORIES } from '../types';

interface ExpensesScreenProps {
  navigation?: any;
}

export const ExpensesScreen: React.FC<ExpensesScreenProps> = () => {
  const { transactions, user1Name, user2Name, currentTheme } = useExpenses();

  const categoryTotals: Record<string, number> = {};
  Object.keys(MAIN_CATEGORIES).forEach((key) => {
    categoryTotals[MAIN_CATEGORIES[key].id] = 0;
  });

  transactions.forEach((tx) => {
    if (tx.items && tx.items.length > 0) {
      tx.items.forEach((item) => {
        const catId = item.mainCategoryId || 'other';
        const itemTotal = item.price * item.quantity;
        categoryTotals[catId] = (categoryTotals[catId] || 0) + itemTotal;
      });
    } else {
      const amount = tx.totalNzd ?? tx.totalAmount ?? 0;
      categoryTotals['other'] = (categoryTotals['other'] || 0) + amount;
    }
  });

  return (
    <ScrollView style={[styles.container, { backgroundColor: currentTheme.bg }]}>
      <Text style={styles.title}>All Expenses</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Category Summary</Text>
        <View style={styles.categoryCard}>
          {Object.keys(MAIN_CATEGORIES).map((key) => {
            const cat = MAIN_CATEGORIES[key];
            const amount = categoryTotals[cat.id] || 0;
            if (amount === 0) return null;
            return (
              <View key={cat.id} style={styles.catRow}>
                <Text style={styles.catLabel}>{cat.label}</Text>
                <Text style={styles.catAmount}>${amount.toFixed(2)}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Transaction List ({transactions.length})</Text>
        {transactions.map((tx) => {
          const amount = tx.totalNzd ?? tx.totalAmount ?? 0;
          const payer = (tx.paidBy ?? tx.paidByUserId) === 'user_01' ? user1Name : user2Name;
          return (
            <View key={tx.id} style={styles.txCard}>
              <View style={styles.txHeader}>
                <View>
                  <Text style={styles.storeName}>{tx.storeName}</Text>
                  <Text style={styles.txDate}>{tx.purchaseDate}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.txTotal}>${amount.toFixed(2)}</Text>
                  <Text style={styles.paidByTag}>Paid by: {payer}</Text>
                </View>
              </View>

              {tx.items && tx.items.length > 0 && (
                <View style={styles.itemsContainer}>
                  {tx.items.map((item, idx) => (
                    <View key={idx} style={styles.itemRow}>
                      <Text style={styles.itemName}>
                        • {item.name} {item.quantity > 1 ? `x${item.quantity}` : ''}
                      </Text>
                      <Text style={styles.itemPrice}>
                        ${(item.price * item.quantity).toFixed(2)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 16, color: '#111' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#444', marginBottom: 10 },
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#eee',
  },
  catRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  catLabel: { fontSize: 14, color: '#333' },
  catAmount: { fontSize: 14, fontWeight: '700', color: '#111' },
  txCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  txHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  storeName: { fontSize: 16, fontWeight: '700', color: '#111' },
  txDate: { fontSize: 12, color: '#777', marginTop: 2 },
  txTotal: { fontSize: 16, fontWeight: '700', color: '#111' },
  paidByTag: { fontSize: 11, color: '#666', marginTop: 2 },
  itemsContainer: { marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  itemName: { fontSize: 13, color: '#555' },
  itemPrice: { fontSize: 13, color: '#333' },
});