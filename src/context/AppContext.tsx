import React, { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User as FirebaseUser } from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../services/firebase';
import { 
  getOrCreateUserProfile, 
  createHousehold, 
  addTransactionWithSummary, 
  deleteTransactionWithSummary,
  subscribeTransactions, 
  subscribeCategories, 
  subscribeMonthlySummary,
  createInvitation,
  acceptInvitation
} from '../services/firestoreService';
import { 
  MOCK_USER, 
  MOCK_HOUSEHOLD, 
  MOCK_CATEGORIES, 
  MOCK_TRANSACTIONS, 
  MOCK_SUMMARY 
} from '../services/mockData';
import type { Household, Category, Transaction, MonthlySummary, UserProfile } from '../types';
import { getCurrentYearMonth } from '../utils/currency';
import { isSoundEnabled, setSoundEnabled, playSuccessChime } from '../utils/audio';

interface AppContextType {
  // Trạng thái người dùng & hệ thống
  isFirebaseActive: boolean;
  currentUser: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  
  // Tổ ấm hiện tại
  activeHousehold: Household | null;
  categories: Category[];
  
  // Thời gian xem sổ cái
  currentYearMonth: string;
  setCurrentYearMonth: (ym: string) => void;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  
  // Dữ liệu tài chính
  transactions: Transaction[];
  monthlySummary: MonthlySummary | null;
  
  // Chỉ số tính toán phái sinh (Computed Metrics)
  totalExpense: number;
  totalIncome: number;
  netSavings: number;
  savingsRatio: number;
  budgetProgress: number;
  husbandExpense: number;
  wifeExpense: number;
  husbandRatio: number;
  wifeRatio: number;
  
  // Âm thanh xúc giác
  soundEnabled: boolean;
  toggleSound: () => void;
  
  // Hành động tài chính & tổ ấm
  logTransaction: (tx: Omit<Transaction, 'id' | 'createdAt' | 'timestamp'>) => Promise<void>;
  removeTransaction: (tx: Transaction) => Promise<void>;
  updateBudget: (newBudget: number) => Promise<void>;
  createNewHousehold: (name: string, budget: number) => Promise<void>;
  generateInviteCode: () => Promise<string>;
  joinWithInviteCode: (code: string) => Promise<void>;
  
  // Xác thực Google
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(MOCK_USER);
  const [activeHousehold, setActiveHousehold] = useState<Household | null>(MOCK_HOUSEHOLD);
  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES);
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary | null>(MOCK_SUMMARY);
  const [currentYearMonth, setCurrentYearMonth] = useState<string>(getCurrentYearMonth());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [soundEnabled, setSoundState] = useState<boolean>(isSoundEnabled());

  const isFirebaseActive = Boolean(isFirebaseConfigured && auth);

  // Chuyển đổi bật/tắt âm thanh
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundState(next);
    setSoundEnabled(next);
  };

  // Điều hướng tháng
  const goToPreviousMonth = () => {
    const [year, month] = currentYearMonth.split('-').map(Number);
    const date = new Date(year, month - 2, 1);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    setCurrentYearMonth(`${y}-${m}`);
  };

  const goToNextMonth = () => {
    const [year, month] = currentYearMonth.split('-').map(Number);
    const date = new Date(year, month, 1);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    setCurrentYearMonth(`${y}-${m}`);
  };

  // Lắng nghe trạng thái đăng nhập Firebase
  useEffect(() => {
    if (!isFirebaseActive || !auth) {
      // Chế độ Mock Data
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          const profile = await getOrCreateUserProfile({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL
          });
          setCurrentUser(profile);

          // Nếu người dùng chưa có tổ ấm, khởi tạo tổ ấm mặc định đầu tiên
          if (profile.householdIds.length === 0) {
            const newH = await createHousehold('Tổ Ấm Nhỏ', 30000000, profile);
            setActiveHousehold(newH);
          }
        } catch (err) {
          console.error('Lỗi khởi tạo hồ sơ người dùng:', err);
        }
      } else {
        // Sử dụng Mock Data khi chưa đăng nhập
        setCurrentUser(MOCK_USER);
        setActiveHousehold(MOCK_HOUSEHOLD);
        setCategories(MOCK_CATEGORIES);
        setTransactions(MOCK_TRANSACTIONS);
        setMonthlySummary(MOCK_SUMMARY);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [isFirebaseActive]);

  // Lắng nghe realtime từ Firestore khi đã chọn activeHousehold
  useEffect(() => {
    if (!isFirebaseActive || !activeHousehold || !firebaseUser) {
      return;
    }

    const unsubCat = subscribeCategories(activeHousehold.id, (cats) => {
      if (cats.length > 0) setCategories(cats);
    });

    const unsubTx = subscribeTransactions(activeHousehold.id, currentYearMonth, (txs) => {
      setTransactions(txs);
    });

    const unsubSum = subscribeMonthlySummary(activeHousehold.id, currentYearMonth, (sum) => {
      setMonthlySummary(sum);
    });

    return () => {
      unsubCat();
      unsubTx();
      unsubSum();
    };
  }, [isFirebaseActive, activeHousehold?.id, currentYearMonth, firebaseUser]);

  // TÍNH TOÁN CÁC CHỈ SỐ TÀI CHÍNH TẬP TRUNG (Derived Metrics with useMemo)
  const {
    totalExpense,
    totalIncome,
    netSavings,
    savingsRatio,
    budgetProgress,
    husbandExpense,
    wifeExpense,
    husbandRatio,
    wifeRatio
  } = useMemo(() => {
    let exp = 0;
    let inc = 0;
    let hExp = 0;
    let wExp = 0;

    // Ưu tiên tính trực tiếp từ danh sách transactions thực tế của tháng hiện tại
    transactions.forEach((tx) => {
      if (tx.type === 'EXPENSE') {
        exp += tx.amount;
        if (tx.paidBy === 'Chồng') {
          hExp += tx.amount;
        } else {
          wExp += tx.amount;
        }
      } else {
        inc += tx.amount;
      }
    });

    // Nếu có summary từ Firestore và chưa có transactions nạp xong
    if (exp === 0 && monthlySummary) {
      exp = monthlySummary.totalExpense;
      inc = monthlySummary.totalIncome;
      hExp = monthlySummary.byMember?.['Chồng'] || 0;
      wExp = monthlySummary.byMember?.['Vợ'] || 0;
    }

    const net = inc > 0 ? inc - exp : 0;
    const savRatio = inc > 0 ? Math.round((net / inc) * 100) : 0;
    
    const budget = activeHousehold?.monthlyBudget || 30000000;
    const bProg = Math.min(100, Math.round((exp / budget) * 100));

    const totalCouple = hExp + wExp;
    const hRatio = totalCouple > 0 ? Math.round((hExp / totalCouple) * 100) : 50;
    const wRatio = totalCouple > 0 ? 100 - hRatio : 50;

    return {
      totalExpense: exp,
      totalIncome: inc,
      netSavings: net,
      savingsRatio: savRatio,
      budgetProgress: bProg,
      husbandExpense: hExp,
      wifeExpense: wExp,
      husbandRatio: hRatio,
      wifeRatio: wRatio
    };
  }, [transactions, monthlySummary, activeHousehold?.monthlyBudget]);

  // HÀNH ĐỘNG GHI SỔ GIAO DỊCH
  const logTransaction = async (txData: Omit<Transaction, 'id' | 'createdAt' | 'timestamp'>) => {
    playSuccessChime();

    if (isFirebaseActive && activeHousehold && firebaseUser) {
      await addTransactionWithSummary(activeHousehold.id, txData);
    } else {
      // Cập nhật Mock Data cục bộ
      const newTx: Transaction = {
        ...txData,
        id: `tx_${Date.now()}`,
        timestamp: Date.now(),
        createdAt: new Date().toISOString()
      };
      setTransactions((prev) => [newTx, ...prev]);
    }
  };

  // HÀNH ĐỘNG XÓA GIAO DỊCH
  const removeTransaction = async (tx: Transaction) => {
    if (isFirebaseActive && activeHousehold && firebaseUser) {
      await deleteTransactionWithSummary(activeHousehold.id, tx);
    } else {
      setTransactions((prev) => prev.filter((item) => item.id !== tx.id));
    }
  };

  // CẬP NHẬT NGÂN SÁCH THÁNG
  const updateBudget = async (newBudget: number) => {
    if (!activeHousehold) return;
    setActiveHousehold((prev) => prev ? { ...prev, monthlyBudget: newBudget } : null);
  };

  // TẠO TỔ ẤM MỚI
  const createNewHousehold = async (name: string, budget: number) => {
    if (isFirebaseActive && currentUser) {
      const h = await createHousehold(name, budget, currentUser);
      setActiveHousehold(h);
    } else {
      const mockH: Household = {
        id: `mock_h_${Date.now()}`,
        name,
        ownerUid: 'mock_user_chong_01',
        members: ['mock_user_chong_01'],
        memberNames: { 'mock_user_chong_01': 'Chồng' },
        memberEmails: { 'mock_user_chong_01': 'chong@example.com' },
        currency: 'VND',
        monthlyBudget: budget,
        createdAt: new Date().toISOString(),
        updatedAt: Date.now()
      };
      setActiveHousehold(mockH);
    }
  };

  // TẠO MÃ MỜI 48H
  const generateInviteCode = async (): Promise<string> => {
    if (isFirebaseActive && activeHousehold && currentUser) {
      return await createInvitation(activeHousehold.id, activeHousehold.name, currentUser);
    }
    return `TOAM-${Math.floor(1000 + Math.random() * 9000)}`;
  };

  // CHẤP NHẬN MÃ MỜI
  const joinWithInviteCode = async (code: string) => {
    if (isFirebaseActive && currentUser) {
      await acceptInvitation(code, currentUser);
    } else {
      alert(`Đã tham gia tổ ấm với mã ${code} (Chế độ mô phỏng)`);
    }
  };

  // ĐĂNG NHẬP GOOGLE
  const loginWithGoogle = async () => {
    if (!isFirebaseActive || !auth) {
      alert('Chưa cấu hình Firebase hoặc thiếu biến môi trường. Đang chạy chế độ Demo.');
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Đăng nhập Google thất bại:', error);
    }
  };

  // ĐĂNG XUẤT
  const logout = async () => {
    if (isFirebaseActive && auth) {
      await signOut(auth);
    }
    setCurrentUser(MOCK_USER);
    setActiveHousehold(MOCK_HOUSEHOLD);
    setTransactions(MOCK_TRANSACTIONS);
  };

  return (
    <AppContext.Provider
      value={{
        isFirebaseActive,
        currentUser,
        firebaseUser,
        isLoading,
        activeHousehold,
        categories,
        currentYearMonth,
        setCurrentYearMonth,
        goToPreviousMonth,
        goToNextMonth,
        transactions,
        monthlySummary,
        totalExpense,
        totalIncome,
        netSavings,
        savingsRatio,
        budgetProgress,
        husbandExpense,
        wifeExpense,
        husbandRatio,
        wifeRatio,
        soundEnabled,
        toggleSound,
        logTransaction,
        removeTransaction,
        updateBudget,
        createNewHousehold,
        generateInviteCode,
        joinWithInviteCode,
        loginWithGoogle,
        logout
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp phải được sử dụng bên trong AppProvider');
  }
  return context;
};
