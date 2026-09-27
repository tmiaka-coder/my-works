// src/screens/HomeScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useExpenses } from '../context/ExpenseContext';

export const HomeScreen = ({ navigation }: any) => {
  const { transactions } = useExpenses();

  // transactions が undefined の場合も安全に空配列として扱う
  const safeTransactions = transactions || [];
  const totalExpense = safeTransactions.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Home Dashboard</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Total Expenses</Text>
        <Text style={styles.cardAmount}>${totalExpense.toFixed(2)} NZD</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {safeTransactions.length === 0 ? (
          <Text style={styles.emptyText}>No transactions registered.</Text>
        ) : (
          safeTransactions.slice(0, 5).map((item) => (
            <View key={item.id} style={styles.txRow}>
              <View>
                <Text style={styles.storeName}>{item.storeName}</Text>
                <Text style={styles.txDate}>{item.purchaseDate}</Text>
              </View>
              <Text style={styles.txAmount}>${item.totalAmount.toFixed(2)}</Text>
            </View>
          ))
        )}
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation?.navigate('Scan')}
      >
        <Text style={styles.buttonText}>+ Add New Expense</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f9f9f9' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 16, color: '#111' },
  card: { backgroundColor: '#000', padding: 20, borderRadius: 12, marginBottom: 20 },
  cardTitle: { color: '#888', fontSize: 13, textTransform: 'uppercase' },
  cardAmount: { color: '#fff', fontSize: 28, fontWeight: '700', marginTop: 4 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12, color: '#333' },
  emptyText: { color: '#888', fontStyle: 'italic' },
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
  txDate: { fontSize: 12, color: '#888', marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '700', color: '#000' },
  button: {
    backgroundColor: '#000',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 40,
  },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});