// src/mocks/mockTransactions.ts
import { Transaction, SNACK_BEVERAGES } from '../types';

export const mockTransactions: Transaction[] = [
  {
    id: 'tx_1',
    storeName: "PAK'nSAVE",
    purchaseDate: '2026-09-25',
    paidByUserId: 'user_01',
    totalAmount: 15.5,
    items: [
      {
        id: 'item_1',
        name: 'Milk & Bread',
        price: 15.5,
        quantity: 1,
        mainCategoryId: 'food_groceries',
        subCategoryId: SNACK_BEVERAGES,
      },
    ],
  },
  {
    id: 'tx_2',
    storeName: 'New World',
    purchaseDate: '2026-09-24',
    paidByUserId: 'user_02',
    totalAmount: 24.8,
    items: [
      {
        id: 'item_2',
        name: 'Coffee & Snacks',
        price: 24.8,
        quantity: 1,
        mainCategoryId: 'dining_out',
        subCategoryId: SNACK_BEVERAGES,
      },
    ],
  },
];