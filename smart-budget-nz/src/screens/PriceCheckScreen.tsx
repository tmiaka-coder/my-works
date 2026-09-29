// src/screens/PriceCheckScreen.tsx
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useExpenses } from '../context/ExpenseContext';

export const PriceCheckScreen = ({ navigation }: any) => {
  const { transactions } = useExpenses();
  const [searchQuery, setSearchQuery] = useState<string>('');

  const safeTransactions = transactions || [];

  // 全取引から商品（Item）単位の平坦なリストを作成してメモ化（高速化）
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

  // 検索クエリによるリアルタイムフィルタリング
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allPurchasedItems.filter((item) =>
      item.itemName.toLowerCase().includes(q)
    );
  }, [searchQuery, allPurchasedItems]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>Price Compare</Text>
        <Text style={styles.subtitle}>過去の購入履歴から同じ商品の価格を比較・検索できます。</Text>

        {/* 検索バー */}
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
          {/* 検索結果エリア */}
          {searchQuery.trim().length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Search Results ({filteredItems.length})
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
                      {item.quantity > 1 && (
                        <Text style={styles.itemQty}>x{item.quantity}</Text>
                      )}
                    </View>
                  </View>
                ))
              )}
            </View>
          ) : (
            /* 検索未入力時のデフォルト表示（クイックヒント） */
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Comparison Examples</Text>
              <Text style={styles.hintText}>
                上の検索バーに「Milk」や「Bread」などのキーワードを入力すると、購入した店舗ごとの最安値や価格推移を即座に確認できます。
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
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
  itemQty: { fontSize: 11, color: '#888', marginTop: 1 },
});