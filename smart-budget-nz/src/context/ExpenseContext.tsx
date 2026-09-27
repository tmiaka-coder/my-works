// src/context/ExpenseContext.tsx
import React, { createContext, useContext, useState } from 'react';
import { Transaction } from '../../types';
import { mockTransactions } from '../mocks/mockTransactions';

interface ExpenseContextType {
  transactions: Transaction[];
  addTransaction: (newTx: Omit<Transaction, 'id'>) => void;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export const ExpenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions || []);

  const addTransaction = (newTx: Omit<Transaction, 'id'>) => {
    const created: Transaction = {
      ...newTx,
      id: `tx_${Date.now()}`,
    };
    setTransactions((prev) => [created, ...(prev || [])]);
  };

  return (
    <ExpenseContext.Provider value={{ transactions: transactions || [], addTransaction }}>
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