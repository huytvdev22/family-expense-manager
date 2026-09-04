import type { Household, Category, Transaction, MonthlySummary, QuickTagItem, UserProfile } from '../types';

/**
 * 4 Danh mục chuẩn của hệ thống Tổ Ấm Nhỏ theo DESIGN.md & DATABASE_DESIGN.md
 */
export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'cat_essential',
    name: 'Tổ ấm & Con cái',
    type: 'EXPENSE',
    categoryKey: 'ESSENTIAL',
    icon: 'home',
    color: '#0F3D39', // Pine Emerald
    order: 1,
    isDefault: true,
    monthlyLimit: 20000000,
    isArchived: false,
    createdAt: '2026-09-01T00:00:00Z'
  },
  {
    id: 'cat_living',
    name: 'Sinh hoạt & Hẹn hò',
    type: 'EXPENSE',
    categoryKey: 'LIVING',
    icon: 'coffee',
    color: '#4A6B68', // Muted Sage
    order: 2,
    isDefault: true,
    monthlyLimit: 8000000,
    isArchived: false,
    createdAt: '2026-09-01T00:00:00Z'
  },
  {
    id: 'cat_unexpected',
    name: 'Sức khỏe & Đột xuất',
    type: 'EXPENSE',
    categoryKey: 'UNEXPECTED',
    icon: 'heart-pulse',
    color: '#92400E', // Warm Amber
    order: 3,
    isDefault: true,
    monthlyLimit: 5000000,
    isArchived: false,
    createdAt: '2026-09-01T00:00:00Z'
  },
  {
    id: 'cat_saving',
    name: 'Tích lũy & Tương lai',
    type: 'EXPENSE',
    categoryKey: 'SAVING',
    icon: 'piggy-bank',
    color: '#10B981', // Emerald Green
    order: 4,
    isDefault: true,
    monthlyLimit: 15000000,
    isArchived: false,
    createdAt: '2026-09-01T00:00:00Z'
  }
];

export const MOCK_CATEGORIES = DEFAULT_CATEGORIES;

/**
 * Danh sách Quick Tags 1-chạm (Dải vuốt ngang)
 */
export const DEFAULT_QUICK_TAGS: QuickTagItem[] = [
  {
    id: 'tag_market',
    label: 'Chợ & Siêu thị',
    emoji: '🛒',
    categoryKey: 'ESSENTIAL',
    categoryId: 'cat_essential',
    categoryName: 'Tổ ấm & Con cái',
    defaultAmount: 350000
  },
  {
    id: 'tag_milk',
    label: 'Bỉm & Sữa con',
    emoji: '🍼',
    categoryKey: 'ESSENTIAL',
    categoryId: 'cat_essential',
    categoryName: 'Tổ ấm & Con cái',
    defaultAmount: 480000
  },
  {
    id: 'tag_utilities',
    label: 'Điện nước Wifi',
    emoji: '💡',
    categoryKey: 'ESSENTIAL',
    categoryId: 'cat_essential',
    categoryName: 'Tổ ấm & Con cái',
    defaultAmount: 1250000
  },
  {
    id: 'tag_coffee',
    label: 'Cà phê & Ăn ngoài',
    emoji: '☕',
    categoryKey: 'LIVING',
    categoryId: 'cat_living',
    categoryName: 'Sinh hoạt & Hẹn hò',
    defaultAmount: 120000
  },
  {
    id: 'tag_gas',
    label: 'Xăng xe & Đi lại',
    emoji: '⛽',
    categoryKey: 'LIVING',
    categoryId: 'cat_living',
    categoryName: 'Sinh hoạt & Hẹn hò',
    defaultAmount: 90000
  },
  {
    id: 'tag_med',
    label: 'Khám & Thuốc men',
    emoji: '💊',
    categoryKey: 'UNEXPECTED',
    categoryId: 'cat_unexpected',
    categoryName: 'Sức khỏe & Đột xuất',
    defaultAmount: 250000
  },
  {
    id: 'tag_furniture',
    label: 'Đồ gia dụng',
    emoji: '🛋️',
    categoryKey: 'UNEXPECTED',
    categoryId: 'cat_unexpected',
    categoryName: 'Sức khỏe & Đột xuất',
    defaultAmount: 650000
  },
  {
    id: 'tag_saving',
    label: 'Gửi heo đất chung',
    emoji: '🐷',
    categoryKey: 'SAVING',
    categoryId: 'cat_saving',
    categoryName: 'Tích lũy & Tương lai',
    defaultAmount: 5000000
  }
];

export const MOCK_USER: UserProfile = {
  uid: 'mock_user_chong_01',
  email: 'chong.nguyen@gmail.com',
  displayName: 'Nguyễn Văn Chồng',
  householdIds: ['mock_household_01'],
  activeHouseholdId: 'mock_household_01',
  createdAt: '2026-09-01T00:00:00Z',
  updatedAt: Date.now()
};

export const MOCK_HOUSEHOLD: Household = {
  id: 'mock_household_01',
  name: 'Tổ Ấm Nhỏ',
  ownerUid: 'mock_user_chong_01',
  members: ['mock_user_chong_01', 'mock_user_vo_02'],
  memberNames: {
    'mock_user_chong_01': 'Chồng',
    'mock_user_vo_02': 'Vợ'
  },
  memberEmails: {
    'mock_user_chong_01': 'chong.nguyen@gmail.com',
    'mock_user_vo_02': 'vo.le@gmail.com'
  },
  currency: 'VND',
  monthlyBudget: 35000000,
  createdAt: '2026-09-01T00:00:00Z',
  updatedAt: Date.now()
};

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx_01',
    amount: 350000,
    type: 'EXPENSE',
    categoryId: 'cat_essential',
    categoryName: 'Tổ ấm & Con cái',
    categoryKey: 'ESSENTIAL',
    paidBy: 'Chồng',
    paidByUid: 'mock_user_chong_01',
    note: 'Chợ & Siêu thị',
    date: '2026-09-04',
    timestamp: Date.now() - 1000 * 60 * 60 * 2,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tx_02',
    amount: 480000,
    type: 'EXPENSE',
    categoryId: 'cat_essential',
    categoryName: 'Tổ ấm & Con cái',
    categoryKey: 'ESSENTIAL',
    paidBy: 'Vợ',
    paidByUid: 'mock_user_vo_02',
    note: 'Bỉm & Sữa con',
    date: '2026-09-04',
    timestamp: Date.now() - 1000 * 60 * 60 * 4,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tx_03',
    amount: 85000,
    type: 'EXPENSE',
    categoryId: 'cat_living',
    categoryName: 'Sinh hoạt & Hẹn hò',
    categoryKey: 'LIVING',
    paidBy: 'Chồng',
    paidByUid: 'mock_user_chong_01',
    note: 'Cà phê sáng',
    date: '2026-09-03',
    timestamp: Date.now() - 1000 * 60 * 60 * 26,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tx_04',
    amount: 1450000,
    type: 'EXPENSE',
    categoryId: 'cat_essential',
    categoryName: 'Tổ ấm & Con cái',
    categoryKey: 'ESSENTIAL',
    paidBy: 'Vợ',
    paidByUid: 'mock_user_vo_02',
    note: 'Tiền điện & Nước sinh hoạt',
    date: '2026-09-02',
    timestamp: Date.now() - 1000 * 60 * 60 * 50,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tx_05',
    amount: 5000000,
    type: 'EXPENSE',
    categoryId: 'cat_saving',
    categoryName: 'Tích lũy & Tương lai',
    categoryKey: 'SAVING',
    paidBy: 'Chồng',
    paidByUid: 'mock_user_chong_01',
    note: 'Gửi heo đất chung đầu tháng',
    date: '2026-09-01',
    timestamp: Date.now() - 1000 * 60 * 60 * 75,
    createdAt: new Date().toISOString()
  }
];

export const MOCK_SUMMARY: MonthlySummary = {
  yearMonth: '2026-09',
  totalIncome: 55000000,
  totalExpense: 7365000,
  netSavings: 47635000,
  savingsPercent: 86,
  byCategory: {
    cat_essential: 2280000,
    cat_living: 85000,
    cat_unexpected: 0,
    cat_saving: 5000000
  },
  byMember: {
    'Chồng': 5435000,
    'Vợ': 1930000
  },
  transactionCount: 5,
  updatedAt: Date.now()
};
