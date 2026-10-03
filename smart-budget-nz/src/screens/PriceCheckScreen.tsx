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

  const allPurchasedItems = useMemo(() => {
    const list: Array<{
      id: string;
      itemName: string;
      price: number;
      quantity: number;
      storeName: string;
      purchaseDate: string;
      unitPrice: number;
    }> = [];

    transactions.forEach((tx) => {
      if (tx.items && tx.items.length > 0) {
        tx.items.forEach((item, idx) => {
          const quantity = item.quantity || 1;
          list.push({
            id: `${tx.id}-${idx}`,
            itemName: item.name,
            price: item.price,
            quantity,
            storeName: tx.storeName || 'Unknown store',
            purchaseDate: tx.purchaseDate || '',
            unitPrice: item.price / quantity,
          });
        });
      }
    });

    return list;
  }, [transactions]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().replace(/[^a-z0-9\s]/g, '');
    return allPurchasedItems.filter((item) => {
      const itemName = item.itemName.toLowerCase().replace(/[^a-z0-9\s]/g, '');
      const storeName = item.storeName.toLowerCase();
      return itemName.includes(q) || storeName.includes(q);
    });
  }, [searchQuery, allPurchasedItems]);

  const priceSummary = useMemo(() => {
    if (filteredItems.length === 0) return null;

    const prices = filteredItems.map((i) => i.price);
    const unitPrices = filteredItems.map((i) => i.unitPrice);
    const minPrice = Math.min(...prices);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const bestValue = filteredItems.reduce((best, item) =>
      item.unitPrice < best.unitPrice ? item : best,
      filteredItems[0]
    );

    return {
      minPrice,
      avgPrice,
      bestValue,
      lowestUnit: Math.min(...unitPrices),
    };
  }, [filteredItems]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: currentTheme.bg }]}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>Price compare</Text>
        <Text style={styles.subtitle}>Review past purchases to spot the best value across stores.</Text>

        <View style={styles.searchBarContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by item name or store"
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
                  <Text style={styles.summaryTitle}>Price stats</Text>
                  <View style={styles.summaryGrid}>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Lowest</Text>
                      <Text style={[styles.summaryValue, { color: currentTheme.primary }]}>
                        ${priceSummary.minPrice.toFixed(2)}
                      </Text>
                      <Text style={styles.summarySub}>Best store: {filteredItems.find((item) => item.price === priceSummary.minPrice)?.storeName ?? '—'}</Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Average</Text>
                      <Text style={styles.summaryValue}>${priceSummary.avgPrice.toFixed(2)}</Text>
                      <Text style={styles.summarySub}>≈ ¥{Math.round(priceSummary.avgPrice * exchangeRate)}</Text>
                    </View>
                  </View>

                  <View style={styles.summaryGridSecondary}>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Best value</Text>
                      <Text style={styles.summaryValue}>{priceSummary.bestValue.itemName}</Text>
                      <Text style={styles.summarySub}>Unit: ${priceSummary.bestValue.unitPrice.toFixed(2)}</Text>
                    </View>
                  </View>
                </View>
              )}

              <Text style={styles.sectionTitle}>History ({filteredItems.length})</Text>
              {filteredItems.length === 0 ? (
                <Text style={styles.emptyText}>No matching products found.</Text>
              ) : (
                filteredItems.map((item) => (
                  <View key={item.id} style={styles.itemCard}>
                    <View style={styles.itemMain}>
                      <Text style={styles.itemName}>{item.itemName}</Text>
                      <Text style={styles.itemSub}>{item.storeName} • {item.purchaseDate}</Text>
                      <Text style={styles.itemSub}>Unit: ${item.unitPrice.toFixed(2)}</Text>
                    </View>
                    <View style={styles.itemPriceArea}>
                      <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
                      <Text style={styles.itemJpy}>¥{Math.round(item.price * exchangeRate)}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          ) : (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick examples</Text>
              <Text style={styles.hintText}>
                Try searching for items like “Milk”, “Bread”, or a supermarket name to compare prices and units instantly.
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
  title: { fontSize: 28, fontWeight: '800', color: '#111', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#666', marginBottom: 16 },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
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
    borderRadius: 14,
    borderWidth: 2,
    marginBottom: 16,
  },
  summaryTitle: { fontSize: 13, fontWeight: '700', color: '#555', textTransform: 'uppercase', marginBottom: 10 },
  summaryGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryGridSecondary: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  summaryItem: { flex: 1 },
  summaryLabel: { fontSize: 12, color: '#666' },
  summaryValue: { fontSize: 18, fontWeight: '700', marginTop: 2 },
  summarySub: { fontSize: 11, color: '#888', marginTop: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#333', marginBottom: 12 },
  emptyText: { color: '#888', fontStyle: 'italic', paddingVertical: 12 },
  hintText: { fontSize: 13, color: '#666', lineHeight: 20 },
  itemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
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