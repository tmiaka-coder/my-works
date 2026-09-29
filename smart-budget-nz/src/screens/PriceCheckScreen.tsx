import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useExpenses } from '../context/ExpenseContext';

interface PriceCheckScreenProps {
  navigation?: any;
}

export const PriceCheckScreen: React.FC<PriceCheckScreenProps> = () => {
  const { transactions, currentTheme, exchangeRate } = useExpenses();
  const [searchQuery, setSearchQuery] = useState<string>('');

  const safeTransactions = transactions || [];

  const allPurchasedItems = useMemo(() => {
    const list: Array<{
      id: string;
      itemName: string;
      price: number;
      quantity: number;
      storeName: string;
      purchaseDate: string;
    }> = [];

    safeTransactions.forEach((tx) => {
      if (tx.items && tx.items.length > 0) {
        tx.items.forEach((item, idx) => {
          list.push({
            id: `${tx.id}-${idx}`,
            itemName: item.name,
            price: item.price,
            quantity: item.quantity,
            storeName: tx.storeName || 'Unknown Store',
            purchaseDate: tx.purchaseDate || '',
          });
        });
      }
    });
    return list;
  }, [safeTransactions]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allPurchasedItems.filter((item) =>
      item.itemName.toLowerCase().includes(q)
    );
  }, [searchQuery, allPurchasedItems]);

  const priceSummary = useMemo(() => {
    if (filteredItems.length === 0) return null;

    const prices = filteredItems.map((i) => i.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

    const lowestItem = filteredItems.find((i) => i.price === minPrice);

    return {
      minPrice,
      maxPrice,
      avgPrice,
      bestStore: lowestItem ? lowestItem.storeName : '-',
    };
  }, [filteredItems]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: currentTheme.bg }]}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>Price Compare</Text>
        <Text style={styles.subtitle}>過去の購入履歴から同じ商品の価格差を比較できます。</Text>

        <View style={styles.searchBarContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="商品名で検索 (例: Milk, Bread...)"
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>

        <ScrollView style={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          {searchQuery.trim().length > 0 ? (
            <View style={styles.section}>
              {priceSummary && (
                <View style={[styles.summaryCard, { borderColor: currentTheme.primary }]}>
                  <Text style={styles.summaryTitle}>Price Statistics</Text>
                  <View style={styles.summaryGrid}>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Lowest (最安値)</Text>
                      <Text style={[styles.summaryValue, { color: currentTheme.primary }]}>
                        ${priceSummary.minPrice.toFixed(2)}
                      </Text>
                      <Text style={styles.summarySub}>({priceSummary.bestStore})</Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Average (平均)</Text>
                      <Text style={styles.summaryValue}>
                        ${priceSummary.avgPrice.toFixed(2)}
                      </Text>
                      <Text style={styles.summarySub}>
                        (¥{Math.round(priceSummary.avgPrice * exchangeRate)})
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              <Text style={styles.sectionTitle}>
                History ({filteredItems.length})
              </Text>
              {filteredItems.length === 0 ? (
                <Text style={styles.emptyText}>該当する商品が見つかりませんでした。</Text>
              ) : (
                filteredItems.map((item) => (
                  <View key={item.id} style={styles.itemCard}>
                    <View style={styles.itemMain}>
                      <Text style={styles.itemName}>{item.itemName}</Text>
                      <Text style={styles.itemSub}>
                        {item.storeName} • {item.purchaseDate}
                      </Text>
                    </View>
                    <View style={styles.itemPriceArea}>
                      <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
                      <Text style={styles.itemJpy}>
                        ¥{Math.round(item.price * exchangeRate)}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          ) : (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Comparison Examples</Text>
              <Text style={styles.hintText}>
                上の検索バーに「Milk」や「Bread」などのキーワードを入力すると、店舗ごとの最安値や平均価格が自動集計されます。
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#111', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#666', marginBottom: 16 },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#111' },
  scrollContainer: { flex: 1 },
  section: { marginBottom: 20 },
  summaryCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 16,
  },
  summaryTitle: { fontSize: 13, fontWeight: '700', color: '#555', textTransform: 'uppercase', marginBottom: 10 },
  summaryGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryItem: { flex: 1 },
  summaryLabel: { fontSize: 12, color: '#666' },
  summaryValue: { fontSize: 20, fontWeight: '700', marginTop: 2 },
  summarySub: { fontSize: 11, color: '#888', marginTop: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 12 },
  emptyText: { color: '#888', fontStyle: 'italic', paddingVertical: 12 },
  hintText: { fontSize: 13, color: '#666', lineHeight: 20 },
  itemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  itemMain: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', color: '#111' },
  itemSub: { fontSize: 12, color: '#777', marginTop: 2 },
  itemPriceArea: { alignItems: 'flex-end' },
  itemPrice: { fontSize: 16, fontWeight: '700', color: '#000' },
  itemJpy: { fontSize: 11, color: '#888', marginTop: 1 },
});