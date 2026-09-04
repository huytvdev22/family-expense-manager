/**
 * ĐỊNH NGHĨA DỮ LIỆU ĐA GIA ĐÌNH (MULTI-TENANT TYPES)
 * Tuân thủ tuyệt đối đặc tả tại docs/DATABASE_DESIGN.md
 */

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role?: 'Chồng' | 'Vợ';
  householdIds: string[];
  activeHouseholdId: string;
  createdAt: string;
  updatedAt: number;
}

export interface Household {
  id: string;
  name: string;
  ownerUid: string;
  members: string[];
  memberNames: Record<string, string>; // UID -> Biệt danh ("Chồng", "Vợ"...)
  memberEmails: Record<string, string>; // UID -> Email
  memberPhotos?: Record<string, string>; // UID -> photoURL
  memberRoles?: Record<string, 'Chồng' | 'Vợ'>; // UID -> 'Chồng' | 'Vợ'
  currency: string;
  monthlyBudget: number;
  createdAt: string;
  updatedAt: number;
}

export type CategoryKey = 'ESSENTIAL' | 'LIVING' | 'UNEXPECTED' | 'SAVING' | 'INCOME' | 'OTHER';

export interface Category {
  id: string;
  name: string;
  type: 'EXPENSE' | 'INCOME';
  categoryKey: CategoryKey;
  icon: string;
  color: string;
  order: number;
  isDefault: boolean;
  monthlyLimit?: number;
  isArchived: boolean;
  createdAt: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: 'EXPENSE' | 'INCOME';
  categoryId: string;
  categoryName: string;
  categoryKey: CategoryKey;
  paidBy: string; // "Chồng" | "Vợ"
  paidByUid: string;
  note: string;
  date: string; // "YYYY-MM-DD"
  timestamp: number;
  createdAt: string;
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

export interface Invitation {
  inviteCode: string;
  householdId: string;
  householdName: string;
  createdBy: string;
  createdByName: string;
  role: 'MEMBER' | 'ADMIN';
  expiresAt: number;
  usedBy: string | null;
  usedByEmail: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
  createdAt: string;
}

export interface QuickTagItem {
  id: string;
  label: string;
  emoji: string;
  categoryKey: CategoryKey;
  categoryId: string;
  categoryName: string;
  defaultAmount?: number;
}
