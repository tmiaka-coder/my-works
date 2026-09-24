import {
  Transaction,
  MAIN_CATEGORIES,
  SUB_CATEGORIES,
} from '../../types';

export const MOCK_TRANSACTIONS: Transaction[] = [
  // 1. PAK'nSAVE Kapiti
  {
    id: 'tx_001',
    storeName: "PAK'nSAVE",
    purchaseDate: '2026-08-30',
    totalAmount: 8.18,
    paidByUserId: 'user_01', // User 1 (e.g., Miaka)
    createdAt: '2026-08-30T14:03:00Z',
    updatedAt: '2026-08-30T14:03:00Z',
    items: [
      {
        id: 'item_001',
        name: 'AVALANCHE CAFE STYLE CARAMEL LATTE 10S',
        price: 3.79,
        quantity: 1,
        mainCategoryId: MAIN_CATEGORIES.FOOD_GROCERIES.id,
        subCategoryId: SUB_CATEGORIES.SNACK_BEVERAGES.id,
      },
      {
        id: 'item_002',
        name: 'DORITOS THAI SWEET CHILLI 170G',
        price: 2.59,
        quantity: 1,
        mainCategoryId: MAIN_CATEGORIES.FOOD_GROCERIES.id,
        subCategoryId: SUB_CATEGORIES.SNACK_BEVERAGES.id,
      },
      {
        id: 'item_003',
        name: 'ANCHOR FRSH WHT MLK BLU 300ML BOT',
        price: 1.80,
        quantity: 1,
        mainCategoryId: MAIN_CATEGORIES.FOOD_GROCERIES.id,
        subCategoryId: SUB_CATEGORIES.DAIRY_BAKERY.id,
      },
    ],
  },

  // 2. PAK'nSAVE Riccarton
  {
    id: 'tx_002',
    storeName: "PAK'nSAVE",
    purchaseDate: '2026-09-02',
    totalAmount: 44.03,
    paidByUserId: 'user_02', // User 2 (Partner)
    createdAt: '2026-09-02T18:17:00Z',
    updatedAt: '2026-09-02T18:17:00Z',
    items: [
      {
        id: 'item_004',
        name: 'PAMS FROZEN POTATO WE',
        price: 4.55,
        quantity: 1,
        mainCategoryId: MAIN_CATEGORIES.FOOD_GROCERIES.id,
        subCategoryId: SUB_CATEGORIES.PANTRY_FROZEN.id,
      },
      {
        id: 'item_005',
        name: 'GOLDEN CRUMPETS ROUND',
        price: 2.79,
        quantity: 1,
        mainCategoryId: MAIN_CATEGORIES.FOOD_GROCERIES.id,
        subCategoryId: SUB_CATEGORIES.DAIRY_BAKERY.id,
      },
      {
        id: 'item_006',
        name: 'SURF LAUNDRY LIQUID S',
        price: 7.79,
        quantity: 1,
        mainCategoryId: MAIN_CATEGORIES.HOUSEHOLD.id,
        subCategoryId: SUB_CATEGORIES.CLEANING_LAUNDRY.id,
      },
      {
        id: 'item_007',
        name: 'BANANAS SNACK PACK EA',
        price: 2.89,
        quantity: 1,
        mainCategoryId: MAIN_CATEGORIES.FOOD_GROCERIES.id,
        subCategoryId: SUB_CATEGORIES.PRODUCE.id,
      },
    ],
  },

  // 3. New World Rolleston
  {
    id: 'tx_003',
    storeName: 'New World',
    purchaseDate: '2026-09-05',
    totalAmount: 31.57,
    paidByUserId: 'user_01',
    createdAt: '2026-09-05T15:56:00Z',
    updatedAt: '2026-09-05T15:56:00Z',
    items: [
      {
        id: 'item_008',
        name: 'BROCCOLI EA NZ',
        price: 1.79,
        quantity: 1,
        mainCategoryId: MAIN_CATEGORIES.FOOD_GROCERIES.id,
        subCategoryId: SUB_CATEGORIES.PRODUCE.id,
      },
      {
        id: 'item_009',
        name: 'GOLDEN CRUMPETS ROUND',
        price: 3.99,
        quantity: 1,
        mainCategoryId: MAIN_CATEGORIES.FOOD_GROCERIES.id,
        subCategoryId: SUB_CATEGORIES.DAIRY_BAKERY.id,
      },
      {
        id: 'item_010',
        name: 'SANITARIUM MARMITE 250G',
        price: 5.39,
        quantity: 1,
        mainCategoryId: MAIN_CATEGORIES.FOOD_GROCERIES.id,
        subCategoryId: SUB_CATEGORIES.PANTRY_FROZEN.id,
      },
    ],
  },
];