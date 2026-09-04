import React, { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  signOut, 
  type User as FirebaseUser 
} from 'firebase/auth';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { auth, db, googleProvider, isFirebaseConfigured } from '../services/firebase';
import { 
  getOrCreateUserProfile, 
  createHousehold, 
  getHousehold,
  getUserHouseholds,
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
import { useToast } from '../components/Toast';

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
  
  // Quản lý tổ ấm
  userHouseholds: Household[];
  switchHousehold: (householdId: string) => Promise<void>;
  
  // Xác thực Google
  isAuthenticating: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { showToast } = useToast();
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(MOCK_USER);
  const [activeHousehold, setActiveHousehold] = useState<Household | null>(MOCK_HOUSEHOLD);
  const [userHouseholds, setUserHouseholds] = useState<Household[]>([MOCK_HOUSEHOLD]);
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
              localStorage.setItem('active_household_id', joinedHouseholdId);
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
              showToast(errorMsg, 'error');
            }
          }

          // 2. Lấy danh sách tất cả các tổ ấm của người dùng
          let loadedUserHouseholds = await getUserHouseholds(profile.householdIds);

          // 3. Quyết định tổ ấm hoạt động (ưu tiên thông minh):
          // Ưu tiên 1: Tổ ấm gia đình (đã gắn kết 2 thành viên Vợ & Chồng)
          // Ưu tiên 2: Tổ ấm được lưu trong localStorage (nếu có và hợp lệ)
          // Ưu tiên 3: activeHouseholdId trong hồ sơ Firestore
          // Ưu tiên 4: Tổ ấm gần nhất trong danh sách
          const familyHousehold = loadedUserHouseholds.find(h => (h.members?.length || 0) >= 2);
          const savedHhId = localStorage.getItem('active_household_id');
          const savedHousehold = savedHhId ? loadedUserHouseholds.find(h => h.id === savedHhId) : null;

          let selectedHousehold: Household | null = null;
          if (familyHousehold) {
            // Luôn ưu tiên tổ ấm đã đủ cặp Vợ & Chồng để người dùng không bị kẹt ở tổ ấm rác 1 người
            selectedHousehold = familyHousehold;
          } else if (savedHousehold) {
            selectedHousehold = savedHousehold;
          } else if (profile.activeHouseholdId) {
            selectedHousehold = loadedUserHouseholds.find(h => h.id === profile.activeHouseholdId) || null;
          }

          if (!selectedHousehold && loadedUserHouseholds.length > 0) {
            selectedHousehold = loadedUserHouseholds[loadedUserHouseholds.length - 1];
          }

          // 4. Nếu người dùng hoàn toàn chưa có tổ ấm nào, khởi tạo tổ ấm mặc định
          if (!selectedHousehold) {
            selectedHousehold = await createHousehold('Tổ Ấm Nhỏ', 30000000, profile);
            loadedUserHouseholds = [selectedHousehold];
          }

          // 5. Đồng bộ activeHouseholdId vào Firestore và localStorage
          localStorage.setItem('active_household_id', selectedHousehold.id);
          if (db && profile.activeHouseholdId !== selectedHousehold.id) {
            profile.activeHouseholdId = selectedHousehold.id;
            const userRef = doc(db, 'users', profile.uid);
            await updateDoc(userRef, {
              activeHouseholdId: selectedHousehold.id,
              updatedAt: Date.now()
            }).catch(e => console.warn('Lỗi cập nhật activeHouseholdId:', e));
          }

          setUserHouseholds(loadedUserHouseholds);
          setActiveHousehold(selectedHousehold);

          if (joinedFromInvite && selectedHousehold) {
            showToast(`Đã kết nối thành công vào tổ ấm "${selectedHousehold.name}"!`, 'success');
          }
        } catch (err) {
          console.error('Lỗi khởi tạo hồ sơ người dùng:', err);
        }
      } else {
        // Sử dụng Mock Data khi chưa đăng nhập
        setCurrentUser(MOCK_USER);
        setActiveHousehold(MOCK_HOUSEHOLD);
        setUserHouseholds([MOCK_HOUSEHOLD]);
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
        localStorage.setItem('active_household_id', newHouseholdId);
        setActiveHousehold(newHousehold);

        // Đảm bảo cập nhật chính xác activeHouseholdId vào Firestore user profile
        if (db) {
          const userRef = doc(db, 'users', currentUser.uid);
          await updateDoc(userRef, {
            activeHouseholdId: newHouseholdId,
            householdIds: arrayUnion(newHouseholdId),
            updatedAt: Date.now()
          }).catch((e) => console.warn('Lỗi đồng bộ userRef sau khi join:', e));
        }

        setCurrentUser((prev) => prev ? {
          ...prev,
          activeHouseholdId: newHouseholdId,
          householdIds: Array.from(new Set([...(prev.householdIds || []), newHouseholdId]))
        } : null);

        setUserHouseholds((prev) => {
          const exists = prev.some(h => h.id === newHouseholdId);
          return exists ? prev.map(h => h.id === newHouseholdId ? newHousehold : h) : [...prev, newHousehold];
        });
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
        showToast('Chưa kích hoạt Google Sign-In trong Firebase Console', 'error');
        break;
      case 'auth/unauthorized-domain':
        showToast(`Tên miền "${window.location.hostname}" chưa được cấp phép trong Firebase`, 'error');
        break;
      case 'auth/popup-blocked':
        showToast('Trình duyệt đã chặn Popup, chuyển sang chuyển hướng đăng nhập...', 'info');
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
        showToast('Lỗi kết nối mạng khi xác thực với Google. Vui lòng thử lại.', 'error');
        break;
      default:
        showToast(`Không thể đăng nhập Google: ${error?.message || 'Lỗi không xác định'}`, 'error');
        break;
    }
  };

  // ĐĂNG NHẬP GOOGLE
  const loginWithGoogle = async () => {
    if (!isFirebaseActive || !auth) {
      showToast('Đang chạy chế độ Demo (chưa cấu hình Firebase)', 'info');
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

  // CHUYỂN ĐỔI GIỮA CÁC TỔ ẤM
  const switchHousehold = async (householdId: string) => {
    if (!firebaseUser || !householdId) return;
    try {
      const h = await getHousehold(householdId);
      if (h) {
        localStorage.setItem('active_household_id', householdId);
        setActiveHousehold(h);
        setCurrentUser((prev) => prev ? { ...prev, activeHouseholdId: householdId } : null);
        if (db && currentUser) {
          const userRef = doc(db, 'users', currentUser.uid);
          await updateDoc(userRef, {
            activeHouseholdId: householdId,
            updatedAt: Date.now()
          }).catch(e => console.warn('Lỗi cập nhật activeHouseholdId:', e));
        }
      }
    } catch (err) {
      console.error('Lỗi chuyển tổ ấm:', err);
    }
  };

  // ĐĂNG XUẤT
  const logout = async () => {
    if (isFirebaseActive && auth) {
      await signOut(auth);
    }
    localStorage.removeItem('active_household_id');
    localStorage.removeItem('pending_invite_code');
    setCurrentUser(MOCK_USER);
    setActiveHousehold(MOCK_HOUSEHOLD);
    setUserHouseholds([MOCK_HOUSEHOLD]);
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
        userHouseholds,
        switchHousehold,
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
