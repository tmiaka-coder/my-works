import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Transaction } from '../../types';
import { MOCK_TRANSACTIONS } from '../mocks/mockTransactions';

interface ExpenseContextType {
  transactions: Transaction[];
  exchangeRate: number;
  setExchangeRate: (rate: number) => void;
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export const ExpenseProvider = ({ children }: { children: ReactNode }) => {
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [exchangeRate, setExchangeRate] = useState<number>(90);

  const addTransaction = (newTxData: Omit<Transaction, 'id'>) => {
    const newTx: Transaction = {
      ...newTxData,
      id: `tx_${Date.now()}`,
    };
    setTransactions((prev) => [newTx, ...prev]);
  };

  return (
    <ExpenseContext.Provider
      value={{
        transactions,
        exchangeRate,
        setExchangeRate,
        addTransaction,
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