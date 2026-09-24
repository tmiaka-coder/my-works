// --- Store Definitions ---
export const MAJOR_STORES = [
  'PAKnSAVE',
  'NewWorld',
  'Woolworths',
  'Kmart',
  'TheWarehouse',
] as const;

export type MajorStore = (typeof MAJOR_STORES)[number] | (string & {});

// --- Category System (Id & Label pattern for i18n & scalability) ---
export const MAIN_CATEGORIES = {
  FOOD_GROCERIES: { id: 'food_groceries', label: 'Food & Groceries' },
  DINING_OUT: { id: 'dining_out', label: 'Dining Out & Cafe' },
  HOUSEHOLD: { id: 'household', label: 'Household Supplies' },
  TRANSPORTATION: { id: 'transportation', label: 'Transportation' },
  HEALTH_MEDICAL: { id: 'health_medical', label: 'Health & Medical' },
  SOCIAL_GIFTS: { id: 'social_gifts', label: 'Social & Gifts' },
  FIXED_EXPENSES: { id: 'fixed_expenses', label: 'Fixed Expenses' },
  SHOPPING_APPAREL: { id: 'shopping_apparel', label: 'Shopping & Apparel' },
  ENTERTAINMENT: { id: 'entertainment', label: 'Entertainment & Leisure' },
  OTHER: { id: 'other', label: 'Other / Miscellaneous' },
} as const;

export type MainCategoryId =
  (typeof MAIN_CATEGORIES)[keyof typeof MAIN_CATEGORIES]['id'];

export const SUB_CATEGORIES = {
  // Food & Groceries
  PRODUCE: { id: 'produce', label: 'Produce', mainCategoryId: 'food_groceries' },
  MEAT_SEAFOOD: { id: 'meat_seafood', label: 'Meat & Seafood', mainCategoryId: 'food_groceries' },
  DAIRY_BAKERY: { id: 'dairy_bakery', label: 'Dairy & Bakery', mainCategoryId: 'food_groceries' },
  PANTRY_FROZEN: { id: 'pantry_frozen', label: 'Pantry & Frozen', mainCategoryId: 'food_groceries' },
  SNACK_BEVERAGES: { id: 'snack_beverages', label: 'Snack & Beverages', mainCategoryId: 'food_groceries' },

  // Household
  CLEANING_LAUNDRY: { id: 'cleaning_laundry', label: 'Cleaning & Laundry', mainCategoryId: 'household' },
  PERSONAL_CARE: { id: 'personal_care', label: 'Personal Care & Hygiene', mainCategoryId: 'household' },

  // Fixed
  RENT: { id: 'rent', label: 'Rent & Accommodation', mainCategoryId: 'fixed_expenses' },
  UTILITIES: { id: 'utilities', label: 'Utilities', mainCategoryId: 'fixed_expenses' },
  MOBILE_SIM: { id: 'mobile_sim', label: 'Mobile & SIM', mainCategoryId: 'fixed_expenses' },

  // General fallback
  GENERAL: { id: 'general', label: 'General', mainCategoryId: 'other' },
} as const;

export type SubCategoryId =
  (typeof SUB_CATEGORIES)[keyof typeof SUB_CATEGORIES]['id'];

// --- Domain Models ---
export interface ExpenseItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  mainCategoryId: MainCategoryId;
  subCategoryId: SubCategoryId;
}

export interface Transaction {
  id: string;
  storeName: MajorStore;
  purchaseDate: string; // ISO 8601 (YYYY-MM-DD)
  totalAmount: number;
  paidByUserId: string;
  receiptImageUrl?: string;
  items: ExpenseItem[];
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  displayName: string;
  colorBadgeHex: string; // e.g., '#2C2C2C', '#6B7280'
}

export interface AppSettings {
  nzdToJpyRate: number;
  activeUserIds: string[];
}