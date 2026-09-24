// types.ts

export type MainCategoryId =
  | 'food_groceries'
  | 'dining_out'
  | 'household'
  | 'transportation'
  | 'health_medical'
  | 'social_gifts'
  | 'fixed_expense'
  | 'other';

export interface ExpenseItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  mainCategoryId: MainCategoryId;
  subCategoryId?: string;
}

export interface Transaction {
  id: string;
  storeName: string;
  purchaseDate: string; // YYYY-MM-DD
  paidByUserId: 'user_01' | 'user_02';
  totalAmount: number;
  items: ExpenseItem[];
}

export const MAIN_CATEGORIES = {
  FOOD_GROCERIES: { id: 'food_groceries', label: 'Food & Groceries' },
  SNACK_BEVERAGES: { id: 'food_groceries', label: 'Snacks & Drinks' }, // エラー防止用に追加
  DINING_OUT: { id: 'dining_out', label: 'Dining Out' },
  HOUSEHOLD: { id: 'household', label: 'Household & Daily' },
  TRANSPORTATION: { id: 'transportation', label: 'Transportation' },
  HEALTH_MEDICAL: { id: 'health_medical', label: 'Health & Medical' },
  SOCIAL_GIFTS: { id: 'social_gifts', label: 'Social & Gifts' },
  FIXED_EXPENSE: { id: 'fixed_expense', label: 'Fixed Expense' },
  OTHER: { id: 'other', label: 'Other' },
} as const;