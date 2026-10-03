// 商品（明細）の型
export interface TransactionItem {
  id?: string;
  name: string;
  price: number;
  quantity: number;
  mainCategoryId?: string;
  subCategoryId?: string;
}

export type ExpenseItem = TransactionItem;

export const SNACK_BEVERAGES = 'snack_beverages' as const;

// 取引（レシート・支出）データの型
export interface Transaction {
  id: string;
  storeName: string;
  purchaseDate: string;
  paidBy?: string;         // 各画面で使われているプロパティ
  paidByUserId?: string;   // 互換性のためのオプショナル
  totalNzd?: number;       // totalNzd と totalAmount の両方に対応
  totalAmount?: number;
  items: TransactionItem[];
}

export interface CategoryDefinition {
  id: string;
  label: string;
}

export const MAIN_CATEGORIES: Record<string, CategoryDefinition> = {
  foodGroceries: { id: 'food_groceries', label: 'Groceries & Essentials' },
  diningOut: { id: 'dining_out', label: 'Eating Out' },
  transport: { id: 'transport', label: 'Fuel & Transport' },
  utilities: { id: 'utilities', label: 'Bills & Utilities' },
  entertainment: { id: 'entertainment', label: 'Leisure & Fun' },
  shopping: { id: 'shopping', label: 'Shopping' },
  health: { id: 'health', label: 'Health & Pharmacy' },
  other: { id: 'other', label: 'Other' },
};

export interface BudgetSettings {
  monthlyBudget: number;
  categoryBudgets: Record<string, number>;
}

// カテゴリやテーマなどその他の型定義が必要な場合は下に続けて記載してください