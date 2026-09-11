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

export type PaymentMethod = 'CASH' | 'TRANSFER' | 'CREDIT_CARD';

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
  goalId?: string; // ID mục tiêu tài chính liên kết (nếu có)
  goalName?: string;
  // Các trường bổ sung cho phương thức thanh toán & Thẻ tín dụng
  paymentMethod?: PaymentMethod;
  cardId?: string; // ID thẻ tín dụng liên kết nếu thanh toán qua thẻ
  cardName?: string; // Tên thẻ (VD: "HSBC Cash Back", "MSB Visa Online", "BIDV JCB")
  isSettled?: boolean; // Đối với giao dịch quẹt thẻ tín dụng: true = đã thanh toán sao kê, false = đang chờ quyết toán
  settledAt?: string; // Ngày thanh toán sao kê ("YYYY-MM-DD")
  settledBy?: 'Chồng' | 'Vợ'; // Ai là người chi tiền thanh toán sao kê thẻ
}

export type GoalType = 'DEBT_PAYOFF' | 'SAVINGS';

export interface FinancialGoal {
  id: string;
  householdId: string;
  title: string; // Tên khoản nợ hoặc mục tiêu tích lũy (ví dụ: "Vay ngân hàng mua nhà")
  type: GoalType; // 'DEBT_PAYOFF' (Trả nợ) hoặc 'SAVINGS' (Tích lũy)
  initialAmount: number; // Số tiền gốc ban đầu (VD: 1.5 tỷ) hoặc vốn ban đầu
  currentAmount: number; // Dư nợ hiện tại (VD: 700 triệu) hoặc số tiền hiện đã tích lũy
  targetAmount: number; // Đích đến: 0đ đối với trả nợ, hoặc số tiền mong muốn đạt được
  monthlyTarget?: number; // Số tiền dự kiến trả gốc/tích lũy mỗi tháng (VD: 15 triệu)
  categoryKey?: CategoryKey;
  categoryId?: string;
  color: string;
  icon: string;
  note?: string;
  deadline?: string; // Hạn chót dự kiến nếu có ("YYYY-MM")
  status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  createdAt: string;
  updatedAt: number;
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
  categoryKey?: CategoryKey;
  categoryId: string;
  categoryName: string;
  type?: 'EXPENSE' | 'INCOME';
  defaultAmount?: number;
  order?: number;
  createdAt?: string;
}

export type CreditCardDueType = 'FIXED_DAY' | 'GRACE_PERIOD';

export interface CreditCard {
  id: string;
  householdId: string;
  name: string; // Tên thẻ hoặc ngân hàng (VD: "HSBC", "MSB", "BIDV JCB")
  last4Digits: string; // 4 số cuối (VD: "8828", "6512", "9366")
  color: string; // Mã màu hex đại diện thương hiệu
  statementDay: number; // Ngày chốt sao kê hàng tháng (VD: 20 hoặc 25)
  dueType?: CreditCardDueType; // 'FIXED_DAY' (mặc định) hoặc 'GRACE_PERIOD' (HSBC, Citi...)
  paymentDueDay: number; // Ngày đến hạn thanh toán hàng tháng (VD: 05) - dùng khi dueType === 'FIXED_DAY'
  daysAfterStatement?: number; // Số ngày thanh toán sau ngày sao kê (VD: 25 với thẻ 55 ngày của HSBC, 15 với thẻ 45 ngày)
  gracePeriodDays?: number; // Tổng số ngày miễn lãi tối đa (VD: 55 hoặc 45 để hiển thị UI)
  creditLimit?: number; // Hạn mức tín dụng (tùy chọn)
  isActive: boolean;
  createdAt: string;
  updatedAt: number;
}

export interface UnsettledCardGroup {
  card: CreditCard;
  statementTxs: Transaction[];
  statementAmount: number;
  nextCycleTxs: Transaction[];
  nextCycleAmount: number;
  transactions: Transaction[]; // Toàn bộ giao dịch quẹt thẻ chưa tất toán
  totalAmount: number; // Tổng dư nợ thẻ (statementAmount + nextCycleAmount)
  currentDueDate: string; // Hạn sao kê kỳ này
  nextDueDate: string; // Hạn sao kê kỳ kế tiếp
}

export interface PendingExpense {
  id: string;
  householdId: string;
  amount: number;
  type: 'EXPENSE';
  categoryId: string;
  categoryName: string;
  categoryKey: CategoryKey;
  assignedTo: 'Chồng' | 'Vợ' | 'Cả hai';
  createdByUid: string;
  createdByName: string;
  note: string;
  dueDate: string; // "YYYY-MM-DD"
  goalId?: string;
  goalName?: string;
  status: 'PENDING' | 'PAID' | 'CANCELLED';
  paidAt?: string; // "YYYY-MM-DD"
  paidBy?: string; // "Chồng" | "Vợ"
  paidByUid?: string;
  transactionId?: string;
  // Các trường phân loại khoản chờ
  paymentType?: 'DIRECT' | 'CREDIT_CARD'; // 'DIRECT' = Hóa đơn trực tiếp, 'CREDIT_CARD' = Quẹt thẻ
  cardId?: string;
  cardName?: string;
  createdAt: string;
  updatedAt: number;
}
