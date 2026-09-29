import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useExpenses } from '../context/ExpenseContext';

interface HomeScreenProps {
  navigation?: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = () => {
  const { transactions, user1Name, user2Name, exchangeRate, currentTheme } = useExpenses();

  const totalNzd = transactions.reduce((sum, tx) => sum + (tx.totalNzd ?? tx.totalAmount ?? 0), 0);
  const totalJpy = Math.round(totalNzd * exchangeRate);

  const user1Total = transactions
    .filter((tx) => (tx.paidBy ?? tx.paidByUserId) === 'user_01')
    .reduce((sum, tx) => sum + (tx.totalNzd ?? tx.totalAmount ?? 0), 0);

  const user2Total = transactions
    .filter((tx) => (tx.paidBy ?? tx.paidByUserId) === 'user_02')
    .reduce((sum, tx) => sum + (tx.totalNzd ?? tx.totalAmount ?? 0), 0);

  return (
    <ScrollView style={[styles.container, { backgroundColor: currentTheme.bg }]}>
      <Text style={styles.title}>Home Summary</Text>

      <View style={[styles.card, { borderColor: currentTheme.primary }]}>
        <Text style={styles.cardLabel}>Total Expenses (This Month)</Text>
        <Text style={[styles.totalAmount, { color: currentTheme.primary }]}>
          ${totalNzd.toFixed(2)} NZD
        </Text>
        <Text style={styles.jpySub}>≈ ¥{totalJpy.toLocaleString()} JPY</Text>
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

      <View style={styles.recentSection}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {transactions.length === 0 ? (
          <Text style={styles.emptyText}>まだ取引がありません。</Text>
        ) : (
          transactions.slice(0, 5).map((tx) => {
            const amount = tx.totalNzd ?? tx.totalAmount ?? 0;
            const payer = (tx.paidBy ?? tx.paidByUserId) === 'user_01' ? user1Name : user2Name;
            return (
              <View key={tx.id} style={styles.txRow}>
                <View>
                  <Text style={styles.txStore}>{tx.storeName}</Text>
                  <Text style={styles.txDate}>
                    {tx.purchaseDate} • {payer}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
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
  title: { fontSize: 24, fontWeight: '700', marginBottom: 16, color: '#111' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
  },
  cardLabel: { fontSize: 13, color: '#666', textTransform: 'uppercase', fontWeight: '600' },
  totalAmount: { fontSize: 32, fontWeight: '800', marginTop: 4 },
  jpySub: { fontSize: 14, color: '#888', marginTop: 2 },
  splitSection: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  splitCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#eee',
  },
  splitName: { fontSize: 13, fontWeight: '600', color: '#555' },
  splitAmount: { fontSize: 18, fontWeight: '700', color: '#111', marginTop: 4 },
  splitJpy: { fontSize: 12, color: '#888', marginTop: 2 },
  recentSection: { marginBottom: 30 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#222', marginBottom: 10 },
  emptyText: { color: '#888', fontStyle: 'italic' },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  txStore: { fontSize: 15, fontWeight: '600', color: '#111' },
  txDate: { fontSize: 12, color: '#777', marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '700', color: '#111' },
  txJpy: { fontSize: 11, color: '#888' },
});