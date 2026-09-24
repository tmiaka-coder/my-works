import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, SPACING } from '../constants/theme';

export const SettingsScreen = () => {
  const [rate, setRate] = useState('90');

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.headerTitle}>Settings</Text>

      {/* 為替設定 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Currency Rate</Text>
        <View style={styles.row}>
          <Text style={styles.settingLabel}>1 NZD =</Text>
          <TextInput
            style={styles.rateInput}
            keyboardType="numeric"
            value={rate}
            onChangeText={setRate}
          />
          <Text style={styles.settingLabel}>JPY</Text>
        </View>
      </View>

      {/* ユーザー設定 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>User Profiles</Text>
        <View style={styles.userRow}>
          <View style={[styles.badge, { backgroundColor: COLORS.user1 }]} />
          <Text style={styles.userName}>User 1 (Miaka)</Text>
        </View>
        <View style={styles.userRow}>
          <View style={[styles.badge, { backgroundColor: COLORS.user2 }]} />
          <Text style={styles.userName}>User 2 (Megan)</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.saveButton} activeOpacity={0.8}>
        <Text style={styles.saveButtonText}>Save Settings</Text>
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
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  settingLabel: {
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  rateInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    fontSize: 14,
    width: 60,
    textAlign: 'center',
    backgroundColor: COLORS.white,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  badge: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  userName: {
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  saveButton: {
    backgroundColor: COLORS.black,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
});