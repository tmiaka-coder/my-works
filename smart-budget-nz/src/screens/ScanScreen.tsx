import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { COLORS, SPACING } from '../constants/theme';

export const ScanScreen = () => {
  const [storeName, setStoreName] = useState('');
  const [amount, setAmount] = useState('');

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.headerTitle}>Scan / Manual Entry</Text>

      {/* OCR/カメラ読み取り枠（モック） */}
      <TouchableOpacity style={styles.scanBox} activeOpacity={0.7}>
        <Text style={styles.scanIcon}>📷</Text>
        <Text style={styles.scanText}>Tap to Scan Receipt</Text>
        <Text style={styles.scanSubText}>Auto-detect store, date, and items</Text>
      </TouchableOpacity>

      <Text style={styles.dividerText}>― OR MANUAL ENTRY ―</Text>

      {/* 手入力フォーム */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Store Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. PAK'nSAVE"
          placeholderTextColor={COLORS.textSecondary}
          value={storeName}
          onChangeText={setStoreName}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Total Amount ($ NZD)</Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          placeholderTextColor={COLORS.textSecondary}
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
        />
      </View>

      <TouchableOpacity style={styles.submitButton} activeOpacity={0.8}>
        <Text style={styles.submitButtonText}>Save Expense</Text>
      </TouchableOpacity>
    </ScrollView>
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
  scanBox: {
    borderWidth: 2,
    borderColor: COLORS.black,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  scanIcon: {
    fontSize: 32,
    marginBottom: SPACING.xs,
  },
  scanText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  scanSubText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  dividerText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    marginVertical: SPACING.lg,
    fontSize: 12,
    fontWeight: '600',
  },
  formGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: SPACING.sm,
    fontSize: 15,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.surface,
  },
  submitButton: {
    backgroundColor: COLORS.black,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
});