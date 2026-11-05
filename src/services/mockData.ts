import type { Category, QuickTagItem, CreditCard } from '../types';

/**
 * Các Danh mục chuẩn mặc định của hệ thống Tổ Ấm Nhỏ theo DESIGN.md & DATABASE_DESIGN.md
 * Chỉ dùng để khởi tạo (seed) danh mục mặc định cho hộ gia đình mới trên Firestore
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
  },
  {
    id: 'cat_debt',
    name: 'Trả nợ ngân hàng',
    type: 'EXPENSE',
    categoryKey: 'ESSENTIAL',
    icon: 'landmark',
    color: '#B45309', // Terracotta
    order: 5,
    isDefault: true,
    monthlyLimit: 20000000,
    isArchived: false,
    createdAt: '2026-09-01T00:00:00Z'
  },
  {
    id: 'cat_income_salary',
    name: 'Tiền lương',
    type: 'INCOME',
    categoryKey: 'INCOME',
    icon: 'briefcase',
    color: '#0F3D39',
    order: 6,
    isDefault: true,
    isArchived: false,
    createdAt: '2026-09-01T00:00:00Z'
  },
  {
    id: 'cat_income_bonus',
    name: 'Tiền thưởng',
    type: 'INCOME',
    categoryKey: 'INCOME',
    icon: 'gift',
    color: '#B45309',
    order: 7,
    isDefault: true,
    isArchived: false,
    createdAt: '2026-09-01T00:00:00Z'
  },
  {
    id: 'cat_income_side',
    name: 'Thu nhập phụ',
    type: 'INCOME',
    categoryKey: 'INCOME',
    icon: 'zap',
    color: '#D97706',
    order: 8,
    isDefault: true,
    isArchived: false,
    createdAt: '2026-09-01T00:00:00Z'
  },
  {
    id: 'cat_income_invest',
    name: 'Lãi & Đầu tư',
    type: 'INCOME',
    categoryKey: 'INCOME',
    icon: 'piggy-bank',
    color: '#10B981',
    order: 9,
    isDefault: true,
    isArchived: false,
    createdAt: '2026-09-01T00:00:00Z'
  },
  {
    id: 'cat_income_cashback',
    name: 'Hoàn tiền & Ưu đãi thẻ',
    type: 'INCOME',
    categoryKey: 'INCOME',
    icon: 'gift',
    color: '#059669',
    order: 10,
    isDefault: true,
    isArchived: false,
    createdAt: '2026-09-01T00:00:00Z'
  },
  {
    id: 'cat_income_other',
    name: 'Thu nhập khác',
    type: 'INCOME',
    categoryKey: 'INCOME',
    icon: 'sparkles',
    color: '#4A6B68',
    order: 11,
    isDefault: true,
    isArchived: false,
    createdAt: '2026-09-01T00:00:00Z'
  }
];

/**
 * Danh sách 3 Thẻ tín dụng mặc định dùng để seed khi yêu cầu
 */
export const DEFAULT_CREDIT_CARDS: CreditCard[] = [
  {
    id: 'card_hsbc',
    householdId: '',
    name: 'HSBC',
    last4Digits: '8828',
    color: '#DC2626',
    statementDay: 25,
    dueType: 'GRACE_PERIOD',
    paymentDueDay: 20,
    daysAfterStatement: 25,
    gracePeriodDays: 55,
    creditLimit: 60000000,
    isActive: true,
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: Date.now()
  },
  {
    id: 'card_msb',
    householdId: '',
    name: 'MSB',
    last4Digits: '6512',
    color: '#EA580C',
    statementDay: 15,
    paymentDueDay: 1,
    creditLimit: 50000000,
    isActive: true,
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: Date.now()
  },
  {
    id: 'card_bidv_jcb',
    householdId: '',
    name: 'BIDV JCB',
    last4Digits: '9366',
    color: '#0F766E',
    statementDay: 25,
    paymentDueDay: 10,
    creditLimit: 80000000,
    isActive: true,
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: Date.now()
  }
];

/**
 * Danh sách Quick Tags 1-chạm mặc định (Dải vuốt ngang)
 */
export const DEFAULT_QUICK_TAGS: QuickTagItem[] = [
  {
    id: 'tag_debt',
    label: 'Trả nợ ngân hàng',
    emoji: '🏦',
    type: 'EXPENSE',
    categoryKey: 'ESSENTIAL',
    categoryId: 'cat_debt',
    categoryName: 'Trả nợ ngân hàng',
    defaultAmount: 15000000,
    order: 1
  },
  {
    id: 'tag_market',
    label: 'Chợ & Siêu thị',
    emoji: '🛒',
    type: 'EXPENSE',
    categoryKey: 'ESSENTIAL',
    categoryId: 'cat_essential',
    categoryName: 'Tổ ấm & Con cái',
    defaultAmount: 350000,
    order: 2
  },
  {
    id: 'tag_milk',
    label: 'Bỉm & Sữa con',
    emoji: '🍼',
    type: 'EXPENSE',
    categoryKey: 'ESSENTIAL',
    categoryId: 'cat_essential',
    categoryName: 'Tổ ấm & Con cái',
    defaultAmount: 480000,
    order: 3
  },
  {
    id: 'tag_utilities',
    label: 'Điện nước Wifi',
    emoji: '💡',
    type: 'EXPENSE',
    categoryKey: 'ESSENTIAL',
    categoryId: 'cat_essential',
    categoryName: 'Tổ ấm & Con cái',
    defaultAmount: 1250000,
    order: 4
  },
  {
    id: 'tag_coffee',
    label: 'Cà phê & Ăn ngoài',
    emoji: '☕',
    type: 'EXPENSE',
    categoryKey: 'LIVING',
    categoryId: 'cat_living',
    categoryName: 'Sinh hoạt & Hẹn hò',
    defaultAmount: 120000,
    order: 5
  },
  {
    id: 'tag_gas',
    label: 'Xăng xe & Đi lại',
    emoji: '⛽',
    type: 'EXPENSE',
    categoryKey: 'LIVING',
    categoryId: 'cat_living',
    categoryName: 'Sinh hoạt & Hẹn hò',
    defaultAmount: 90000,
    order: 6
  },
  {
    id: 'tag_med',
    label: 'Khám & Thuốc men',
    emoji: '💊',
    type: 'EXPENSE',
    categoryKey: 'UNEXPECTED',
    categoryId: 'cat_unexpected',
    categoryName: 'Sức khỏe & Đột xuất',
    defaultAmount: 250000,
    order: 7
  },
  {
    id: 'tag_furniture',
    label: 'Đồ gia dụng',
    emoji: '🛋️',
    type: 'EXPENSE',
    categoryKey: 'UNEXPECTED',
    categoryId: 'cat_unexpected',
    categoryName: 'Sức khỏe & Đột xuất',
    defaultAmount: 650000,
    order: 8
  },
  {
    id: 'tag_saving',
    label: 'Gửi heo đất chung',
    emoji: '🐷',
    type: 'EXPENSE',
    categoryKey: 'SAVING',
    categoryId: 'cat_saving',
    categoryName: 'Tích lũy & Tương lai',
    defaultAmount: 5000000,
    order: 9
  }
];

export const DEFAULT_INCOME_QUICK_TAGS: QuickTagItem[] = [
  {
    id: 'tag_inc_salary',
    label: 'Lương tháng',
    emoji: '💼',
    type: 'INCOME',
    categoryKey: 'INCOME',
    categoryId: 'cat_income_salary',
    categoryName: 'Tiền lương',
    defaultAmount: 25000000,
    order: 1
  },
  {
    id: 'tag_inc_bonus',
    label: 'Thưởng hiệu quả',
    emoji: '🎉',
    type: 'INCOME',
    categoryKey: 'INCOME',
    categoryId: 'cat_income_bonus',
    categoryName: 'Tiền thưởng',
    defaultAmount: 5000000,
    order: 2
  },
  {
    id: 'tag_inc_cashback',
    label: 'Hoàn tiền thẻ',
    emoji: '💳',
    type: 'INCOME',
    categoryKey: 'INCOME',
    categoryId: 'cat_income_cashback',
    categoryName: 'Hoàn tiền & Ưu đãi thẻ',
    defaultAmount: 300000,
    order: 3
  },
  {
    id: 'tag_inc_freelance',
    label: 'Làm thêm / Dự án',
    emoji: '💻',
    type: 'INCOME',
    categoryKey: 'INCOME',
    categoryId: 'cat_income_side',
    categoryName: 'Thu nhập phụ',
    defaultAmount: 3000000,
    order: 4
  },
  {
    id: 'tag_inc_interest',
    label: 'Lãi tiết kiệm',
    emoji: '📈',
    type: 'INCOME',
    categoryKey: 'INCOME',
    categoryId: 'cat_income_invest',
    categoryName: 'Lãi & Đầu tư',
    defaultAmount: 1200000,
    order: 5
  },
  {
    id: 'tag_inc_gift',
    label: 'Được tặng / Biếu',
    emoji: '🎁',
    type: 'INCOME',
    categoryKey: 'INCOME',
    categoryId: 'cat_income_other',
    categoryName: 'Thu nhập khác',
    defaultAmount: 1000000,
    order: 6
  }
];
