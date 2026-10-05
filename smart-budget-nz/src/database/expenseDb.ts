import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';

import { MAIN_CATEGORIES, Transaction } from '../types';

const DB_NAME = 'smart_budget_nz.db';
const LEGACY_STORAGE_KEY = '@smart_budget_nz_data_v2';
const DB_INITIALIZED_KEY = '@smart_budget_nz_db_initialized';

export interface ExpenseStorePayload {
  transactions: Transaction[];
  user1Name: string;
  user2Name: string;
  exchangeRate: number;
  themeId: string;
  monthlyBudget: number;
  categoryBudgets: Record<string, number>;
}

export const getDefaultCategoryBudgets = (): Record<string, number> =>
  Object.values(MAIN_CATEGORIES).reduce(
    (acc, category) => {
      acc[category.id] = 0;
      return acc;
    },
    {} as Record<string, number>
  );

const db = SQLite.openDatabaseSync(DB_NAME);

const ensureSchema = () => {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY NOT NULL,
      store_name TEXT NOT NULL,
      purchase_date TEXT NOT NULL,
      paid_by TEXT,
      paid_by_user_id TEXT,
      total_nzd REAL,
      total_amount REAL
    );

    CREATE TABLE IF NOT EXISTS transaction_items (
      id TEXT PRIMARY KEY NOT NULL,
      transaction_id TEXT NOT NULL,
      name TEXT NOT NULL,
      price REAL NOT NULL DEFAULT 0,
      quantity REAL NOT NULL DEFAULT 1,
      main_category_id TEXT,
      sub_category_id TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction_id
      ON transaction_items(transaction_id);
  `);
};

const writeSetting = (key: string, value: unknown) => {
  db.runSync('INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', [
    key,
    JSON.stringify(value),
  ]);
};

const readSetting = <T>(key: string, fallback: T): T => {
  const row = db.getFirstSync('SELECT value FROM app_settings WHERE key = ?', [key]) as { value?: string } | null;
  if (!row?.value) return fallback;

  try {
    return JSON.parse(row.value) as T;
  } catch {
    return fallback;
  }
};

const deserializeTransaction = (row: {
  id: string;
  store_name: string;
  purchase_date: string;
  paid_by?: string | null;
  paid_by_user_id?: string | null;
  total_nzd?: number | null;
  total_amount?: number | null;
}): Transaction => {
  const items = db.getAllSync(
    'SELECT id, name, price, quantity, main_category_id, sub_category_id FROM transaction_items WHERE transaction_id = ? ORDER BY rowid ASC',
    [row.id]
  ) as Array<{
    id?: string;
    name: string;
    price: number;
    quantity: number;
    main_category_id?: string | null;
    sub_category_id?: string | null;
  }>;

  const paidBy = row.paid_by ?? row.paid_by_user_id ?? 'user_01';
  const paidByUserId = row.paid_by_user_id ?? row.paid_by ?? 'user_01';

  return {
    id: row.id,
    storeName: row.store_name,
    purchaseDate: row.purchase_date,
    paidBy,
    paidByUserId,
    totalNzd: row.total_nzd ?? row.total_amount ?? 0,
    totalAmount: row.total_amount ?? row.total_nzd ?? 0,
    items: items.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      mainCategoryId: item.main_category_id ?? undefined,
      subCategoryId: item.sub_category_id ?? undefined,
    })),
  };
};

const getTransactionsFromDb = (): Transaction[] => {
  const rows = db.getAllSync(
    'SELECT id, store_name, purchase_date, paid_by, paid_by_user_id, total_nzd, total_amount FROM transactions ORDER BY rowid DESC'
  ) as Array<{
    id: string;
    store_name: string;
    purchase_date: string;
    paid_by?: string | null;
    paid_by_user_id?: string | null;
    total_nzd?: number | null;
    total_amount?: number | null;
  }>;

  return rows.map(deserializeTransaction);
};

export const loadExpenseData = (): ExpenseStorePayload => {
  ensureSchema();

  const defaultCategoryBudgets = getDefaultCategoryBudgets();
  const settingsCategoryBudgets = readSetting<Record<string, number>>('categoryBudgets', defaultCategoryBudgets);

  return {
    transactions: getTransactionsFromDb(),
    user1Name: readSetting<string>('user1Name', 'User 1'),
    user2Name: readSetting<string>('user2Name', 'User 2'),
    exchangeRate: readSetting<number>('exchangeRate', 90),
    themeId: readSetting<string>('themeId', 'lake_blue'),
    monthlyBudget: readSetting<number>('monthlyBudget', 2500),
    categoryBudgets: { ...defaultCategoryBudgets, ...settingsCategoryBudgets },
  };
};

export const saveExpenseData = async (payload: ExpenseStorePayload) => {
  ensureSchema();

  db.withTransactionSync(() => {
    db.runSync('DELETE FROM transaction_items');
    db.runSync('DELETE FROM transactions');
    db.runSync('DELETE FROM app_settings');

    payload.transactions.forEach((tx) => {
      const paidBy = tx.paidBy ?? tx.paidByUserId ?? 'user_01';
      const paidByUserId = tx.paidByUserId ?? tx.paidBy ?? 'user_01';

      db.runSync(
        'INSERT INTO transactions (id, store_name, purchase_date, paid_by, paid_by_user_id, total_nzd, total_amount) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          tx.id,
          tx.storeName,
          tx.purchaseDate,
          paidBy,
          paidByUserId,
          tx.totalNzd ?? tx.totalAmount ?? 0,
          tx.totalAmount ?? tx.totalNzd ?? 0,
        ]
      );

      tx.items.forEach((item, index) => {
        db.runSync(
          'INSERT INTO transaction_items (id, transaction_id, name, price, quantity, main_category_id, sub_category_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [
            item.id ?? `${tx.id}-item-${index}`,
            tx.id,
            item.name,
            item.price,
            item.quantity,
            item.mainCategoryId ?? null,
            item.subCategoryId ?? null,
          ]
        );
      });
    });

    writeSetting('user1Name', payload.user1Name);
    writeSetting('user2Name', payload.user2Name);
    writeSetting('exchangeRate', payload.exchangeRate);
    writeSetting('themeId', payload.themeId);
    writeSetting('monthlyBudget', payload.monthlyBudget);
    writeSetting('categoryBudgets', payload.categoryBudgets);
  });
};

export const initializeExpenseDatabase = async () => {
  ensureSchema();

  const isInitialized = await AsyncStorage.getItem(DB_INITIALIZED_KEY);
  if (isInitialized === 'true') {
    return;
  }

  try {
    const legacyData = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyData) {
      const parsed = JSON.parse(legacyData);
      if (parsed && typeof parsed === 'object') {
        await saveExpenseData({
          transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
          user1Name: typeof parsed.user1Name === 'string' ? parsed.user1Name : 'User 1',
          user2Name: typeof parsed.user2Name === 'string' ? parsed.user2Name : 'User 2',
          exchangeRate: Number(parsed.exchangeRate ?? 90),
          themeId: typeof parsed.themeId === 'string' ? parsed.themeId : 'lake_blue',
          monthlyBudget: Number(parsed.monthlyBudget ?? 2500),
          categoryBudgets: { ...getDefaultCategoryBudgets(), ...(parsed.categoryBudgets ?? {}) },
        });
      }
    }
  } catch (error) {
    console.error('Failed to migrate legacy expense data', error);
  }

  await AsyncStorage.setItem(DB_INITIALIZED_KEY, 'true');
};
