import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList } from 'react-native';
import { COLORS, SPACING } from '../constants/theme';

interface PriceCompareItem {
  id: string;
  name: string;
  paknsavePrice: number;
  newworldPrice: number;
}

const MOCK_COMPARE_DATA: PriceCompareItem[] = [
  { id: '1', name: 'GOLDEN CRUMPETS ROUND', paknsavePrice: 2.79, newworldPrice: 3.99 },
  { id: '2', name: 'BROCCOLI EA NZ', paknsavePrice: 1.49, newworldPrice: 1.79 },
  { id: '3', name: 'SANITARIUM MARMITE 250G', paknsavePrice: 4.99, newworldPrice: 5.39 },
];

export const PriceCheckScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredData = MOCK_COMPARE_DATA.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Price Checker</Text>

      <TextInput
        style={styles.searchInput}
        placeholder="Search item (e.g. Crumpets)..."
        placeholderTextColor={COLORS.textSecondary}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.compareCard}>
            <Text style={styles.itemName}>{item.name}</Text>
            <View style={styles.priceRow}>
              <View style={styles.priceBox}>
                <Text style={styles.storeLabel}>PAK'nSAVE</Text>
                <Text style={styles.priceText}>${item.paknsavePrice.toFixed(2)}</Text>
              </View>
              <View style={styles.vsBox}>
                <Text style={styles.vsText}>VS</Text>
              </View>
              <View style={styles.priceBox}>
                <Text style={styles.storeLabel}>New World</Text>
                <Text style={styles.priceText}>${item.newworldPrice.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.md,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: SPACING.sm,
    fontSize: 14,
    backgroundColor: COLORS.surface,
    marginBottom: SPACING.md,
  },
  compareCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceBox: {
    flex: 1,
    alignItems: 'center',
  },
  storeLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  vsBox: {
    paddingHorizontal: SPACING.xs,
  },
  vsText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
});