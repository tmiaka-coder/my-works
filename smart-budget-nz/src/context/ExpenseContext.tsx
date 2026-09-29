import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction } from '../types';

export interface ThemeOption {
  id: string;
  name: string;
  primary: string;
  bg: string;
}

export const NZ_THEMES: ThemeOption[] = [
  { id: 'monochrome', name: 'NZ Black & White', primary: '#000000', bg: '#f9f9f9' },
  { id: 'fern_green', name: 'Fern Green', primary: '#2D5A27', bg: '#F4F7F4' },
  { id: 'lake_blue', name: 'Tekapo Blue', primary: '#1A5F7A', bg: '#F0F6F9' },
  { id: 'warm_gold', name: 'Autumn Gold', primary: '#C87D55', bg: '#FAF6F0' },
];

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

export const ExpenseProvider = ({ children }: { children: ReactNode }) => {
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [user1Name, setUser1NameState] = useState<string>('User 1');
  const [user2Name, setUser2NameState] = useState<string>('User 2');
  const [exchangeRate, setExchangeRateState] = useState<number>(90.0);
  const [themeId, setThemeId] = useState<string>('monochrome');

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
    const payer = tx.paidBy ?? tx.paidByUserId ?? 'user_01';

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
    saveData({ transactions: updated, user1Name, user2Name, exchangeRate, themeId });
  };

  const setUser1Name = (name: string) => {
    setUser1NameState(name);
    saveData({ transactions, user1Name: name, user2Name, exchangeRate, themeId });
  };

  const setUser2Name = (name: string) => {
    setUser2NameState(name);
    saveData({ transactions, user1Name, user2Name: name, exchangeRate, themeId });
  };

  const setExchangeRate = (rate: number) => {
    setExchangeRateState(rate);
    saveData({ transactions, user1Name, user2Name, exchangeRate: rate, themeId });
  };

  const setCurrentThemeId = (id: string) => {
    setThemeId(id);
    saveData({ transactions, user1Name, user2Name, exchangeRate, themeId: id });
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