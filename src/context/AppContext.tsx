import React, { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  signOut, 
  type User as FirebaseUser 
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../services/firebase';
import { 
  getOrCreateUserProfile, 
  createHousehold, 
  getHousehold,
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
  isAuthenticating: boolean;
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
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
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

  // Xử lý kết quả chuyển hướng đăng nhập (dành cho Mobile Safari/PWA khi popup bị chặn)
  useEffect(() => {
    if (!isFirebaseActive || !auth) return;

    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          console.log('Đăng nhập thành công qua chuyển hướng redirect:', result.user.email);
        }
      })
      .catch((error: any) => {
        console.error('Lỗi khi xử lý redirect đăng nhập:', error);
        handleAuthError(error);
      });
  }, [isFirebaseActive]);

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

          // 1. Kiểm tra xem người dùng có mã mời đang chờ xử lý hay không (click từ link mời gửi qua tin nhắn)
          const pendingInviteCode = localStorage.getItem('pending_invite_code');
          let joinedFromInvite = false;

          if (pendingInviteCode) {
            try {
              const joinedHouseholdId = await acceptInvitation(pendingInviteCode, profile);
              localStorage.removeItem('pending_invite_code');
              profile.activeHouseholdId = joinedHouseholdId;
              if (!profile.householdIds.includes(joinedHouseholdId)) {
                profile.householdIds.push(joinedHouseholdId);
              }
              joinedFromInvite = true;
            } catch (invErr: any) {
              console.error('Lỗi tự động gia nhập từ mã mời pending:', invErr);
              localStorage.removeItem('pending_invite_code');
              let errorMsg = invErr?.message || 'Không thể gia nhập tổ ấm từ mã mời.';
              if (errorMsg.includes('permission-denied') || errorMsg.includes('Missing or insufficient permissions')) {
                errorMsg = 'Tổ ấm này đã đủ 2 thành viên đồng hành (Vợ & Chồng) hoặc mã mời không còn hiệu lực.';
              }
              alert(`⚠️ ${errorMsg}`);
            }
          }

          // 2. Tải tổ ấm hiện tại của người dùng hoặc khởi tạo mới nếu chưa có
          const targetHouseholdId = profile.activeHouseholdId || (profile.householdIds.length > 0 ? profile.householdIds[0] : null);
          let loadedHousehold: Household | null = null;

          if (targetHouseholdId) {
            try {
              loadedHousehold = await getHousehold(targetHouseholdId);
            } catch (hhErr) {
              console.warn('Không thể tải tổ ấm từ Firestore:', hhErr);
            }
          }

          // Nếu người dùng chưa có tổ ấm hoặc tổ ấm cũ không còn tồn tại, khởi tạo mặc định
          if (!loadedHousehold) {
            loadedHousehold = await createHousehold('Tổ Ấm Nhỏ', 30000000, profile);
          }

          setActiveHousehold(loadedHousehold);

          if (joinedFromInvite && loadedHousehold) {
            alert(`🎉 Chúc mừng! Bạn đã kết nối thành công vào tổ ấm "${loadedHousehold.name}".`);
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
    if (!firebaseUser || !currentUser) {
      throw new Error('AUTH_REQUIRED');
    }
    if (isFirebaseActive && activeHousehold) {
      return await createInvitation(activeHousehold.id, activeHousehold.name, currentUser);
    }
    return `TOAM-${Math.floor(1000 + Math.random() * 9000)}`;
  };

  // CHẤP NHẬN MÃ MỜI
  const joinWithInviteCode = async (code: string) => {
    if (!firebaseUser || !currentUser) {
      throw new Error('AUTH_REQUIRED');
    }
    if (isFirebaseActive) {
      const newHouseholdId = await acceptInvitation(code, currentUser);
      // Nạp và chuyển sang tổ ấm mới ngay lập tức
      const newHousehold = await getHousehold(newHouseholdId);
      if (newHousehold) {
        setActiveHousehold(newHousehold);
        setCurrentUser((prev) => prev ? {
          ...prev,
          activeHouseholdId: newHouseholdId,
          householdIds: Array.from(new Set([...(prev.householdIds || []), newHouseholdId]))
        } : null);
      }
    }
  };

  // XỬ LÝ LỖI XÁC THỰC GOOGLE
  const handleAuthError = (error: any) => {
    const errorCode = error?.code || '';
    console.error('Chi tiết lỗi Firebase Auth:', errorCode, error);

    switch (errorCode) {
      case 'auth/configuration-not-found':
      case 'auth/operation-not-allowed':
        alert(
          '⚠️ Chưa kích hoạt Google Sign-In trong Firebase Console!\n\n' +
          'Vui lòng thực hiện:\n' +
          '1. Vào Firebase Console > Build > Authentication > Sign-in method.\n' +
          '2. Bật (Enable) "Google" và chọn Project support email.\n' +
          '3. Lưu lại và thử đăng nhập lại.'
        );
        break;
      case 'auth/unauthorized-domain':
        alert(
          '⚠️ Tên miền hiện tại chưa được cấp phép (Authorized Domains) trong Firebase!\n\n' +
          `Vui lòng thêm "${window.location.hostname}" vào: Firebase Console > Authentication > Settings > Authorized domains.`
        );
        break;
      case 'auth/popup-blocked':
        alert('Trình duyệt đã chặn cửa sổ Popup. Hệ thống sẽ chuyển hướng trang để đăng nhập Google.');
        if (auth) {
          signInWithRedirect(auth, googleProvider).catch((e) => {
            console.error('Lỗi khi redirect:', e);
          });
        }
        break;
      case 'auth/popup-closed-by-user':
      case 'auth/cancelled-popup-request':
        // Người dùng chủ động tắt popup hoặc bấm nhiều lần
        console.warn('Cửa sổ đăng nhập đã được đóng bởi người dùng.');
        break;
      case 'auth/network-request-failed':
        alert('Lỗi kết nối mạng khi xác thực với Google. Vui lòng kiểm tra lại đường truyền Internet.');
        break;
      default:
        alert(`Không thể đăng nhập Google: ${error?.message || 'Lỗi không xác định'} (Mã lỗi: ${errorCode || 'UNKNOWN'})`);
        break;
    }
  };

  // ĐĂNG NHẬP GOOGLE
  const loginWithGoogle = async () => {
    if (!isFirebaseActive || !auth) {
      alert('Chưa cấu hình Firebase hoặc thiếu biến môi trường. Đang chạy chế độ Demo.');
      return;
    }

    if (isAuthenticating) return;

    setIsAuthenticating(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      handleAuthError(error);
    } finally {
      setIsAuthenticating(false);
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
        isAuthenticating,
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
