import type { Category, Household, MonthlySummary, QuickTag, Transaction, UserProfile } from '../types';
import { getCurrentMonthKey, getTodayISO } from '../utils/currency';

export const INITIAL_USER: UserProfile = {
  uid: 'uid_chong',
  email: 'chong.toamnho@gmail.com',
  displayName: 'Chồng',
  photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop',
  householdIds: ['household_to_am_nho'],
  activeHouseholdId: 'household_to_am_nho'
};

export const INITIAL_HOUSEHOLD: Household = {
  id: 'household_to_am_nho',
  name: 'Tổ Ấm Nhỏ',
  ownerUid: 'uid_chong',
  members: ['uid_chong', 'uid_vo'],
  memberNames: {
    'uid_chong': 'Chồng',
    'uid_vo': 'Vợ'
  },
  memberEmails: {
    'uid_chong': 'chong.toamnho@gmail.com',
    'uid_vo': 'vo.toamnho@gmail.com'
  },
  currency: 'VND',
  monthlyBudget: 40000000,
  savingsTargetPercent: 40
};

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'cat_essential',
    name: 'Tổ ấm & Con cái',
    type: 'EXPENSE',
    categoryKey: 'ESSENTIAL',
    icon: 'Home',
    color: '#0F3D39',
    order: 1,
    isDefault: true,
    monthlyLimit: 22000000
  },
  {
    id: 'cat_living',
    name: 'Sinh hoạt & Hẹn hò',
    type: 'EXPENSE',
    categoryKey: 'LIVING',
    icon: 'Coffee',
    color: '#4A6B68',
    order: 2,
    isDefault: true,
    monthlyLimit: 8000000
  },
  {
    id: 'cat_unexpected',
    name: 'Sức khỏe & Đột xuất',
    type: 'EXPENSE',
    categoryKey: 'UNEXPECTED',
    icon: 'HeartPulse',
    color: '#92400E',
    order: 3,
    isDefault: true,
    monthlyLimit: 5000000
  },
  {
    id: 'cat_saving',
    name: 'Tích lũy & Tương lai',
    type: 'EXPENSE',
    categoryKey: 'SAVING',
    icon: 'PiggyBank',
    color: '#10B981',
    order: 4,
    isDefault: true,
    monthlyLimit: 15000000
  }
];

export const DEFAULT_QUICK_TAGS: QuickTag[] = [
  { id: 'tag_1', label: 'Chợ & Siêu thị', categoryKey: 'cat_essential', icon: 'ShoppingCart' },
  { id: 'tag_2', label: 'Bỉm & Sữa', categoryKey: 'cat_essential', icon: 'Baby' },
  { id: 'tag_3', label: 'Điện nước & Wifi', categoryKey: 'cat_essential', icon: 'Zap' },
  { id: 'tag_4', label: 'Cà phê & Ăn ngoài', categoryKey: 'cat_living', icon: 'Coffee' },
  { id: 'tag_5', label: 'Xăng xe & Đi lại', categoryKey: 'cat_living', icon: 'Fuel' },
  { id: 'tag_6', label: 'Khám & Thuốc', categoryKey: 'cat_unexpected', icon: 'Pill' },
  { id: 'tag_7', label: 'Đồ gia dụng', categoryKey: 'cat_unexpected', icon: 'Armchair' },
  { id: 'tag_8', label: 'Gửi heo đất chung', categoryKey: 'cat_saving', icon: 'Coins' }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx_1',
    amount: 15000000,
    type: 'EXPENSE',
    categoryId: 'cat_saving',
    categoryName: 'Tích lũy & Tương lai',
    categoryKey: 'SAVING',
    paidBy: 'Chồng',
    paidByUid: 'uid_chong',
    note: 'Gửi sổ tiết kiệm online kỳ hạn 6 tháng',
    date: getTodayISO(),
    timestamp: Date.now() - 1000 * 60 * 30
  },
  {
    id: 'tx_2',
    amount: 350000,
    type: 'EXPENSE',
    categoryId: 'cat_essential',
    categoryName: 'Tổ ấm & Con cái',
    categoryKey: 'ESSENTIAL',
    paidBy: 'Vợ',
    paidByUid: 'uid_vo',
    note: 'Chợ & Siêu thị (thực phẩm cuối tuần)',
    date: getTodayISO(),
    timestamp: Date.now() - 1000 * 60 * 120
  },
  {
    id: 'tx_3',
    amount: 850000,
    type: 'EXPENSE',
    categoryId: 'cat_essential',
    categoryName: 'Tổ ấm & Con cái',
    categoryKey: 'ESSENTIAL',
    paidBy: 'Vợ',
    paidByUid: 'uid_vo',
    note: 'Bỉm & Sữa cho bé',
    date: getTodayISO(),
    timestamp: Date.now() - 1000 * 60 * 240
  },
  {
    id: 'tx_4',
    amount: 120000,
    type: 'EXPENSE',
    categoryId: 'cat_living',
    categoryName: 'Sinh hoạt & Hẹn hò',
    categoryKey: 'LIVING',
    paidBy: 'Chồng',
    paidByUid: 'uid_chong',
    note: 'Cà phê sáng làm việc',
    date: getTodayISO(),
    timestamp: Date.now() - 1000 * 60 * 360
  },
  {
    id: 'tx_5',
    amount: 1650000,
    type: 'EXPENSE',
    categoryId: 'cat_unexpected',
    categoryName: 'Sức khỏe & Đột xuất',
    categoryKey: 'UNEXPECTED',
    paidBy: 'Chồng',
    paidByUid: 'uid_chong',
    note: 'Bảo dưỡng xe máy định kỳ',
    date: getTodayISO(),
    timestamp: Date.now() - 1000 * 60 * 480
  },
  {
    id: 'tx_6',
    amount: 63000000,
    type: 'INCOME',
    categoryId: 'cat_income',
    categoryName: 'Thu nhập gia đình',
    categoryKey: 'INCOME',
    paidBy: 'Chồng',
    paidByUid: 'uid_chong',
    note: 'Lương tháng hai vợ chồng nhận đầu tháng',
    date: getTodayISO(),
    timestamp: Date.now() - 1000 * 60 * 600
  }
];

export const INITIAL_SUMMARY: MonthlySummary = {
  yearMonth: getCurrentMonthKey(),
  totalIncome: 63000000,
  totalExpense: 33840000,
  netSavings: 29160000,
  savingsPercent: 46,
  byCategory: {
    'cat_essential': 16850000,
    'cat_living': 340000,
    'cat_unexpected': 1650000,
    'cat_saving': 15000000
  },
  byMember: {
    'Chồng': 27340000,
    'Vợ': 6500000
  },
  transactionCount: 42,
  updatedAt: Date.now()
};
