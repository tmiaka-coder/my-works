import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MAIN_CATEGORIES, Transaction } from '../types';

export interface ThemeOption {
  id: string;
  name: string;
  primary: string;
  bg: string;
}

export const NZ_THEMES: ThemeOption[] = [
  { id: 'monochrome', name: 'Kauri Black', primary: '#111111', bg: '#f8f8f7' },
  { id: 'fern_green', name: 'Kahikatea Green', primary: '#2D5A27', bg: '#F3F7F2' },
  { id: 'lake_blue', name: 'Lake Tekapo', primary: '#1A5F7A', bg: '#EEF7FB' },
  { id: 'warm_gold', name: 'Sunset Clay', primary: '#C87D55', bg: '#FBF5F0' },
];

const DEFAULT_CATEGORY_BUDGETS = Object.values(MAIN_CATEGORIES).reduce(
  (acc, category) => {
    acc[category.id] = 0;
    return acc;
  },
  {} as Record<string, number>
);

export interface ExpenseContextType {
  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  user1Name: string;
  setUser1Name: (name: string) => void;
  user2Name: string;
  setUser2Name: (name: string) => void;
  exchangeRate: number;
  setExchangeRate: (rate: number) => void;
  currentTheme: ThemeOption;
  setCurrentThemeId: (id: string) => void;
  monthlyBudget: number;
  setMonthlyBudget: (budget: number) => void;
  categoryBudgets: Record<string, number>;
  setCategoryBudget: (categoryId: string, budget: number) => void;
  getPayerName: (payerId?: string) => string;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

const STORAGE_KEY = '@smart_budget_nz_data_v2';

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    storeName: "PAK'nSAVE",
    purchaseDate: '2026-09-28',
    paidBy: 'user_01',
    paidByUserId: 'user_01',
    totalNzd: 12.5,
    totalAmount: 12.5,
    items: [
      { name: 'Milk 2L', price: 4.5, quantity: 1, mainCategoryId: 'food_groceries' },
      { name: 'Bread', price: 3.5, quantity: 1, mainCategoryId: 'food_groceries' },
      { name: 'Eggs 12pk', price: 4.5, quantity: 1, mainCategoryId: 'food_groceries' },
    ],
  },
  {
    id: '2',
    storeName: 'Woolworths',
    purchaseDate: '2026-09-29',
    paidBy: 'user_02',
    paidByUserId: 'user_02',
    totalNzd: 5.2,
    totalAmount: 5.2,
    items: [
      { name: 'Milk 2L', price: 5.2, quantity: 1, mainCategoryId: 'food_groceries' },
    ],
  },
];

const normalizePayerId = (payer?: string) => {
  if (payer === 'user_01' || payer === 'user_02') return payer;
  if (payer === 'user_1') return 'user_01';
  if (payer === 'user_2') return 'user_02';
  return 'user_01';
};

export const ExpenseProvider = ({ children }: { children: ReactNode }) => {
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [user1Name, setUser1NameState] = useState<string>('User 1');
  const [user2Name, setUser2NameState] = useState<string>('User 2');
  const [exchangeRate, setExchangeRateState] = useState<number>(90.0);
  const [themeId, setThemeId] = useState<string>('lake_blue');
  const [monthlyBudget, setMonthlyBudgetState] = useState<number>(2500);
  const [categoryBudgets, setCategoryBudgetsState] = useState<Record<string, number>>(
    DEFAULT_CATEGORY_BUDGETS
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
        if (jsonValue != null) {
          const data = JSON.parse(jsonValue);
          if (data.transactions && data.transactions.length > 0) setTransactions(data.transactions);
          if (data.user1Name) setUser1NameState(data.user1Name);
          if (data.user2Name) setUser2NameState(data.user2Name);
          if (data.exchangeRate) setExchangeRateState(data.exchangeRate);
          if (data.themeId) setThemeId(data.themeId);
          if (data.monthlyBudget != null) setMonthlyBudgetState(Number(data.monthlyBudget) || 0);
          if (data.categoryBudgets) {
            setCategoryBudgetsState({ ...DEFAULT_CATEGORY_BUDGETS, ...data.categoryBudgets });
          }
        }
      } catch (e) {
        console.error('Failed to load data', e);
      }
    };
    loadData();
  }, []);

  const saveData = async (updatedData: any) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
    } catch (e) {
      console.error('Failed to save data', e);
    }
  };

  const addTransaction = (tx: Omit<Transaction, 'id'>) => {
    const total = tx.totalNzd ?? tx.totalAmount ?? 0;
    const payer = normalizePayerId(tx.paidBy ?? tx.paidByUserId ?? 'user_01');

    const newTx: Transaction = {
      ...tx,
      id: Date.now().toString(),
      totalNzd: total,
      totalAmount: total,
      paidBy: payer,
      paidByUserId: payer,
    };
    const updated = [newTx, ...transactions];
    setTransactions(updated);
    saveData({
      transactions: updated,
      user1Name,
      user2Name,
      exchangeRate,
      themeId,
      monthlyBudget,
      categoryBudgets,
    });
  };

  const setUser1Name = (name: string) => {
    setUser1NameState(name);
    saveData({ transactions, user1Name: name, user2Name, exchangeRate, themeId, monthlyBudget, categoryBudgets });
  };

  const setUser2Name = (name: string) => {
    setUser2NameState(name);
    saveData({ transactions, user1Name, user2Name: name, exchangeRate, themeId, monthlyBudget, categoryBudgets });
  };

  const setExchangeRate = (rate: number) => {
    setExchangeRateState(rate);
    saveData({ transactions, user1Name, user2Name, exchangeRate: rate, themeId, monthlyBudget, categoryBudgets });
  };

  const setCurrentThemeId = (id: string) => {
    setThemeId(id);
    saveData({ transactions, user1Name, user2Name, exchangeRate, themeId: id, monthlyBudget, categoryBudgets });
  };

  const setMonthlyBudget = (budget: number) => {
    const safeBudget = Math.max(0, Number(budget) || 0);
    setMonthlyBudgetState(safeBudget);
    saveData({ transactions, user1Name, user2Name, exchangeRate, themeId, monthlyBudget: safeBudget, categoryBudgets });
  };

  const setCategoryBudget = (categoryId: string, budget: number) => {
    const safeBudget = Math.max(0, Number(budget) || 0);
    const nextBudgets = { ...categoryBudgets, [categoryId]: safeBudget };
    setCategoryBudgetsState(nextBudgets);
    saveData({ transactions, user1Name, user2Name, exchangeRate, themeId, monthlyBudget, categoryBudgets: nextBudgets });
  };

  const getPayerName = (payerId?: string) => {
    const normalized = normalizePayerId(payerId ?? 'user_01');
    return normalized === 'user_01' ? user1Name : user2Name;
  };

  const currentTheme = NZ_THEMES.find((t) => t.id === themeId) || NZ_THEMES[0];

  return (
    <ExpenseContext.Provider
      value={{
        transactions,
        addTransaction,
        user1Name,
        setUser1Name,
        user2Name,
        setUser2Name,
        exchangeRate,
        setExchangeRate,
        currentTheme,
        setCurrentThemeId,
        monthlyBudget,
        setMonthlyBudget,
        categoryBudgets,
        setCategoryBudget,
        getPayerName,
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpenses = () => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpenses must be used within an ExpenseProvider');
  }
  return context;
};