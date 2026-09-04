// Định nghĩa các kiểu dữ liệu cốt lõi cho ứng dụng Quản Lý Chi Tiêu Gia Đình

export type TransactionType = 'EXPENSE' | 'INCOME';

export type CategoryKey = 'ESSENTIAL' | 'LIVING' | 'UNEXPECTED' | 'SAVING' | string;

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  categoryKey: CategoryKey;
  icon: string; // Tên icon từ Lucide
  color: string;
  order: number;
  isDefault: boolean;
  monthlyLimit?: number;
  isArchived?: boolean;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  categoryName: string;
  categoryKey: CategoryKey;
  paidBy: string; // "Chồng" | "Vợ" hoặc tên tùy biến
  paidByUid: string;
  note: string;
  date: string; // YYYY-MM-DD
  timestamp: number;
}

export interface MonthlySummary {
  yearMonth: string; // "YYYY-MM"
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  savingsPercent: number;
  byCategory: Record<string, number>;
  byMember: Record<string, number>;
  transactionCount: number;
  updatedAt: number;
}

export interface Household {
  id: string;
  name: string;
  ownerUid: string;
  members: string[];
  memberNames: Record<string, string>; // uid -> display name
  memberEmails: Record<string, string>; // uid -> email
  currency: string;
  monthlyBudget: number;
  savingsTargetPercent?: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  householdIds: string[];
  activeHouseholdId: string;
}

export interface Invitation {
  inviteCode: string;
  householdId: string;
  householdName: string;
  createdBy: string;
  createdByName: string;
  role: 'MEMBER' | 'ADMIN';
  expiresAt: number;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED';
}

export interface QuickTag {
  id: string;
  label: string;
  categoryKey: CategoryKey;
  icon: string;
}
