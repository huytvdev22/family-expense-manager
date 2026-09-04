import React, { createContext, useContext, useState, useEffect } from 'react';
import type { 
  Category, 
  Household, 
  MonthlySummary, 
  QuickTag, 
  Transaction, 
  UserProfile 
} from '../types';
import { 
  DEFAULT_CATEGORIES, 
  DEFAULT_QUICK_TAGS, 
  INITIAL_HOUSEHOLD, 
  INITIAL_TRANSACTIONS, 
  INITIAL_USER 
} from '../services/mockData';
import { getCurrentMonthKey } from '../utils/currency';
import { soundEngine, triggerHaptic } from '../utils/audio';

interface AppContextType {
  user: UserProfile;
  household: Household;
  categories: Category[];
  transactions: Transaction[];
  monthlySummary: MonthlySummary;
  quickTags: QuickTag[];
  currentMember: string; // "Chồng" | "Vợ"
  setCurrentMember: (member: string) => void;
  addTransaction: (tx: {
    amount: number;
    type: 'EXPENSE' | 'INCOME';
    categoryId: string;
    note: string;
    date: string;
  }) => void;
  deleteTransaction: (id: string) => void;
  addCategory: (cat: Omit<Category, 'id'>) => void;
  updateBudget: (budget: number) => void;
  createInviteCode: () => string;
  isNumpadOpen: boolean;
  setIsNumpadOpen: (open: boolean) => void;
  selectedQuickTag: QuickTag | null;
  setSelectedQuickTag: (tag: QuickTag | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  TRANSACTIONS: 'toam_transactions',
  CATEGORIES: 'toam_categories',
  HOUSEHOLD: 'toam_household',
  CURRENT_MEMBER: 'toam_current_member'
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user] = useState<UserProfile>(INITIAL_USER);
  const [currentMember, setCurrentMemberState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_MEMBER) || 'Chồng';
  });

  const [household, setHousehold] = useState<Household>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.HOUSEHOLD);
    return saved ? JSON.parse(saved) : INITIAL_HOUSEHOLD;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [quickTags] = useState<QuickTag[]>(DEFAULT_QUICK_TAGS);
  const [isNumpadOpen, setIsNumpadOpen] = useState(false);
  const [selectedQuickTag, setSelectedQuickTag] = useState<QuickTag | null>(null);

  // Lưu trạng thái vào localStorage khi có thay đổi
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HOUSEHOLD, JSON.stringify(household));
  }, [household]);

  const setCurrentMember = (member: string) => {
    setCurrentMemberState(member);
    localStorage.setItem(STORAGE_KEYS.CURRENT_MEMBER, member);
    triggerHaptic(8);
  };

  // Tính toán số liệu tổng hợp tháng hiện tại
  const currentMonth = getCurrentMonthKey();
  const monthTransactions = transactions.filter(t => t.date.startsWith(currentMonth));

  let totalIncome = 0;
  let totalExpense = 0;
  const byCategory: Record<string, number> = {};
  const byMember: Record<string, number> = { 'Chồng': 0, 'Vợ': 0 };

  for (const t of monthTransactions) {
    if (t.type === 'INCOME') {
      totalIncome += t.amount;
    } else {
      totalExpense += t.amount;
      byCategory[t.categoryId] = (byCategory[t.categoryId] || 0) + t.amount;
      byMember[t.paidBy] = (byMember[t.paidBy] || 0) + t.amount;
    }
  }

  const netSavings = Math.max(0, totalIncome - totalExpense);
  const savingsPercent = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  const monthlySummary: MonthlySummary = {
    yearMonth: currentMonth,
    totalIncome,
    totalExpense,
    netSavings,
    savingsPercent,
    byCategory,
    byMember,
    transactionCount: monthTransactions.length,
    updatedAt: Date.now()
  };

  // Hàm thêm giao dịch mới
  const addTransaction = (input: {
    amount: number;
    type: 'EXPENSE' | 'INCOME';
    categoryId: string;
    note: string;
    date: string;
  }) => {
    const matchedCategory = categories.find(c => c.id === input.categoryId);
    const categoryName = matchedCategory ? matchedCategory.name : 'Khác';
    const categoryKey = matchedCategory ? matchedCategory.categoryKey : 'ESSENTIAL';

    const newTx: Transaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      amount: input.amount,
      type: input.type,
      categoryId: input.categoryId,
      categoryName,
      categoryKey,
      paidBy: currentMember,
      paidByUid: currentMember === 'Chồng' ? 'uid_chong' : 'uid_vo',
      note: input.note,
      date: input.date,
      timestamp: Date.now()
    };

    setTransactions(prev => [newTx, ...prev]);
    soundEngine.playSuccessTone();
    triggerHaptic([15, 40, 20]);
  };

  // Hàm xóa giao dịch
  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    triggerHaptic(20);
  };

  // Thêm danh mục mới
  const addCategory = (cat: Omit<Category, 'id'>) => {
    const newCat: Category = {
      ...cat,
      id: `cat_${Date.now()}`
    };
    setCategories(prev => [...prev, newCat]);
    triggerHaptic(10);
  };

  // Cập nhật ngân sách tháng
  const updateBudget = (budget: number) => {
    setHousehold(prev => ({
      ...prev,
      monthlyBudget: budget
    }));
  };

  // Tạo mã mời 48h
  const createInviteCode = () => {
    const code = `TOAM-${Math.floor(1000 + Math.random() * 9000)}`;
    triggerHaptic(10);
    return code;
  };

  return (
    <AppContext.Provider
      value={{
        user,
        household,
        categories,
        transactions,
        monthlySummary,
        quickTags,
        currentMember,
        setCurrentMember,
        addTransaction,
        deleteTransaction,
        addCategory,
        updateBudget,
        createInviteCode,
        isNumpadOpen,
        setIsNumpadOpen,
        selectedQuickTag,
        setSelectedQuickTag
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp phải được sử dụng bên trong AppProvider');
  }
  return context;
};
