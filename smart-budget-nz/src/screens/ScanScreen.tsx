import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { useExpenses } from '../context/ExpenseContext';
import { ExpenseItem } from '../types';

interface ScanScreenProps {
  navigation?: any;
}

export const ScanScreen: React.FC<ScanScreenProps> = ({ navigation }) => {
  const { addTransaction, currentTheme, user1Name, user2Name } = useExpenses();

  const [storeName, setStoreName] = useState<string>('');
  const [purchaseDate, setPurchaseDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [paidByUserId, setPaidByUserId] = useState<'user_01' | 'user_02'>('user_01');
  const [items, setItems] = useState<ExpenseItem[]>([
    { name: '', price: 0, quantity: 1, mainCategoryId: 'food_groceries' },
  ]);

  const handleAddItem = () => {
    setItems([
      ...items,
      { name: '', price: 0, quantity: 1, mainCategoryId: 'food_groceries' },
    ]);
  };

  const handleUpdateItem = (
    index: number,
    field: keyof ExpenseItem,
    value: any
  ) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const calculatedTotal = items.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
    0
  );

  const handleSave = () => {
    if (!storeName.trim()) {
      Alert.alert('入力エラー', '店舗名を入力してください。');
      return;
    }

    const validItems = items.filter((item) => item.name.trim().length > 0);

    addTransaction({
      storeName,
      purchaseDate,
      paidBy: paidByUserId,
      paidByUserId,
      totalNzd: calculatedTotal,
      totalAmount: calculatedTotal,
      items: validItems.length > 0 ? validItems : items,
    });

    Alert.alert('保存完了', 'レシートデータを保存しました。', [
      {
        text: 'OK',
        onPress: () => {
          if (navigation?.navigate) {
            navigation.navigate('Home');
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: currentTheme.bg }]}>
      <Text style={styles.title}>Scan & Input Receipt</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Store Name (店舗名)</Text>
        <TextInput
          style={styles.input}
          placeholder="例: PAK'nSAVE, Woolworths..."
          value={storeName}
          onChangeText={setStoreName}
        />

        <Text style={styles.label}>Date (購入日)</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          value={purchaseDate}
          onChangeText={setPurchaseDate}
        />

        <Text style={styles.label}>Paid By (支払者)</Text>
        <View style={styles.payerRow}>
          <TouchableOpacity
            style={[
              styles.payerBtn,
              paidByUserId === 'user_01' && { backgroundColor: currentTheme.primary },
            ]}
            onPress={() => setPaidByUserId('user_01')}
          >
            <Text
              style={[
                styles.payerText,
                paidByUserId === 'user_01' && { color: '#fff', fontWeight: '700' },
              ]}
            >
              {user1Name}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.payerBtn,
              paidByUserId === 'user_02' && { backgroundColor: currentTheme.primary },
            ]}
            onPress={() => setPaidByUserId('user_02')}
          >
            <Text
              style={[
                styles.payerText,
                paidByUserId === 'user_02' && { color: '#fff', fontWeight: '700' },
              ]}
            >
              {user2Name}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Items (購入品目)</Text>
        <TouchableOpacity onPress={handleAddItem}>
          <Text style={[styles.addBtnText, { color: currentTheme.primary }]}>+ 行を追加</Text>
        </TouchableOpacity>
      </View>

      {items.map((item, index) => (
        <View key={index} style={styles.itemCard}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemIndex}>Item #{index + 1}</Text>
            {items.length > 1 && (
              <TouchableOpacity onPress={() => handleRemoveItem(index)}>
                <Text style={styles.removeText}>削除</Text>
              </TouchableOpacity>
            )}
          </View>

          <TextInput
            style={styles.input}
            placeholder="商品名 (例: Milk 2L)"
            value={item.name}
            onChangeText={(val) => handleUpdateItem(index, 'name', val)}
          />

          <View style={styles.priceRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.subLabel}>単価 ($ NZD)</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={item.price ? item.price.toString() : ''}
                onChangeText={(val) =>
                  handleUpdateItem(index, 'price', parseFloat(val) || 0)
                }
              />
            </View>

            <View style={{ width: 80 }}>
              <Text style={styles.subLabel}>数量</Text>
              <TextInput
                style={styles.input}
                placeholder="1"
                keyboardType="number-pad"
                value={item.quantity ? item.quantity.toString() : '1'}
                onChangeText={(val) =>
                  handleUpdateItem(index, 'quantity', parseInt(val, 10) || 1)
                }
              />
            </View>
          </View>
        </View>
      ))}

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Amount (合計):</Text>
        <Text style={[styles.totalValue, { color: currentTheme.primary }]}>
          ${calculatedTotal.toFixed(2)} NZD
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.saveBtn, { backgroundColor: currentTheme.primary }]}
        onPress={handleSave}
      >
        <Text style={styles.saveBtnText}>Save Transaction</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 16, color: '#111' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#eee',
  },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6 },
  subLabel: { fontSize: 11, color: '#777', marginBottom: 4 },
  input: {
    backgroundColor: '#f4f4f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111',
    marginBottom: 12,
  },
  payerRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  payerBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  payerText: { fontSize: 14, color: '#444' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#333' },
  addBtnText: { fontSize: 14, fontWeight: '700' },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemIndex: { fontSize: 12, fontWeight: '700', color: '#888' },
  removeText: { fontSize: 12, color: '#e53e3e', fontWeight: '600' },
  priceRow: { flexDirection: 'row', alignItems: 'center' },
  totalCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#333' },
  totalValue: { fontSize: 22, fontWeight: '800' },
  saveBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 40,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});