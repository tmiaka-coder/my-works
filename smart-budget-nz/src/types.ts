// 商品（明細）の型
export interface TransactionItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  mainCategoryId?: string;
}

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

// カテゴリやテーマなどその他の型定義が必要な場合は下に続けて記載してください