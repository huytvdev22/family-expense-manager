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
  updateTransactionWithSummary,
  subscribeTransactions, 
  subscribeCategories, 
  subscribeMonthlySummary,
  createInvitation,
  acceptInvitation,
  setMemberRole,
  syncMemberPhoto,
  updateMemberEmail as firestoreUpdateMemberEmail,
  updateHouseholdName as firestoreUpdateHouseholdName,
  saveCategory,
  updateCategory,
  archiveCategory,
  unarchiveCategory,
  deleteCategoryPermanently,
  seedMissingCategories,
  restoreDefaultCategories as firestoreRestoreDefaultCategories,
  subscribeFinancialGoals,
  saveFinancialGoal,
  deleteFinancialGoal,
  updateGoalProgress,
  subscribeQuickTags,
  createQuickTag as firestoreCreateQuickTag,
  updateQuickTag as firestoreUpdateQuickTag,
  deleteQuickTag as firestoreDeleteQuickTag,
  seedMissingQuickTags
} from '../services/firestoreService';
import { 
  DEFAULT_CATEGORIES,
  DEFAULT_QUICK_TAGS,
  DEFAULT_INCOME_QUICK_TAGS,
  MOCK_USER, 
  MOCK_HOUSEHOLD, 
  MOCK_CATEGORIES, 
  MOCK_TRANSACTIONS, 
  MOCK_SUMMARY,
  MOCK_GOALS
} from '../services/mockData';
import type { Household, Category, Transaction, MonthlySummary, UserProfile, FinancialGoal, QuickTagItem } from '../types';
import { getCurrentYearMonth } from '../utils/currency';
import { isSoundEnabled, setSoundEnabled, playSuccessChime, playActionClick } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';
import { useToast } from '../components/Toast';
import { sortFinancialGoals } from '../utils/goalSorting';

interface AppContextType {
  // Trạng thái người dùng & hệ thống
  isFirebaseActive: boolean;
  currentUser: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  userRole: 'Chồng' | 'Vợ';
  updateUserRole: (role: 'Chồng' | 'Vợ') => Promise<void>;
  updateMemberEmail: (uid: string, email: string) => Promise<void>;
  
  // Tổ ấm hiện tại
  activeHousehold: Household | null;
  categories: Category[];
  createCategory: (catData: Omit<Category, 'id' | 'createdAt' | 'isArchived' | 'order'>) => Promise<void>;
  editCategory: (categoryId: string, updates: Partial<Category>) => Promise<void>;
  removeCategory: (category: Category) => Promise<void>;
  restoreCategory: (categoryId: string) => Promise<void>;
  restoreDefaultCategories: (type?: 'EXPENSE' | 'INCOME') => Promise<void>;
  
  // Gợi ý 1-chạm (Quick Tags)
  quickTags: QuickTagItem[];
  createQuickTag: (tagData: Omit<QuickTagItem, 'id' | 'createdAt'>) => Promise<void>;
  editQuickTag: (tagId: string, updates: Partial<QuickTagItem>) => Promise<void>;
  removeQuickTag: (tagId: string) => Promise<void>;
  
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
  husbandIncome: number;
  wifeIncome: number;
  husbandIncomeRatio: number;
  wifeIncomeRatio: number;
  
  // Âm thanh xúc giác
  soundEnabled: boolean;
  toggleSound: () => void;
  
  // Hành động tài chính & tổ ấm
  logTransaction: (tx: Omit<Transaction, 'id' | 'createdAt' | 'timestamp'>) => Promise<void>;
  editTransaction: (oldTx: Transaction, updatedTx: Transaction) => Promise<void>;
  removeTransaction: (tx: Transaction) => Promise<void>;
  updateBudget: (newBudget: number) => Promise<void>;
  updateHouseholdName: (name: string) => Promise<void>;
  createNewHousehold: (name: string, budget: number) => Promise<void>;
  generateInviteCode: () => Promise<string>;
  joinWithInviteCode: (code: string) => Promise<void>;
  
  // Quản lý tổ ấm
  userHouseholds: Household[];
  switchHousehold: (householdId: string) => Promise<void>;

  // Mục tiêu Tự do Tài chính (Khoản nợ & Tích lũy)
  financialGoals: FinancialGoal[];
  createGoal: (goalData: Omit<FinancialGoal, 'id' | 'createdAt' | 'updatedAt' | 'householdId'>) => Promise<void>;
  editGoal: (goalId: string, updates: Partial<FinancialGoal>) => Promise<void>;
  removeGoal: (goalId: string) => Promise<void>;
  updateGoalAmount: (goalId: string, newAmount: number) => Promise<void>;
  
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
  const [financialGoals, setFinancialGoals] = useState<FinancialGoal[]>(() => sortFinancialGoals(MOCK_GOALS));
  const [quickTags, setQuickTags] = useState<QuickTagItem[]>(() => [
    ...DEFAULT_QUICK_TAGS,
    ...DEFAULT_INCOME_QUICK_TAGS
  ]);
  const [currentYearMonth, setCurrentYearMonth] = useState<string>(getCurrentYearMonth());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [soundEnabled, setSoundState] = useState<boolean>(isSoundEnabled());
  const [userRole, setUserRole] = useState<'Chồng' | 'Vợ'>(() => {
    return (localStorage.getItem('user_role') as 'Chồng' | 'Vợ') || 'Chồng';
  });

  const isFirebaseActive = Boolean(isFirebaseConfigured && auth);

  // Đồng bộ vai trò và avatar
  useEffect(() => {
    if (activeHousehold && currentUser) {
      const roleFromHh = activeHousehold.memberRoles?.[currentUser.uid];
      const roleFromUser = currentUser.role;
      const savedRole = localStorage.getItem('user_role') as 'Chồng' | 'Vợ' | null;
      const resolvedRole = roleFromHh || roleFromUser || savedRole || 'Chồng';
      setUserRole(resolvedRole);
      localStorage.setItem('user_role', resolvedRole);

      // Đồng bộ avatar Google nếu có
      if (currentUser.photoURL && activeHousehold.id) {
        const currentPhoto = activeHousehold.memberPhotos?.[currentUser.uid];
        if (!currentPhoto || currentPhoto !== currentUser.photoURL) {
          syncMemberPhoto(activeHousehold.id, currentUser.uid, currentUser.photoURL);
        }
      }

      // Tự động đồng bộ email người dùng vào tổ ấm nếu chưa có hoặc thay đổi
      if (currentUser.email && activeHousehold.id) {
        const currentEmail = activeHousehold.memberEmails?.[currentUser.uid];
        if (!currentEmail || currentEmail !== currentUser.email) {
          firestoreUpdateMemberEmail(activeHousehold.id, currentUser.uid, currentUser.email);
          setActiveHousehold((prev) => prev ? {
            ...prev,
            memberEmails: {
              ...(prev.memberEmails || {}),
              [currentUser.uid]: currentUser.email
            }
          } : null);
        }
      }
    }
  }, [activeHousehold?.id, currentUser?.uid, currentUser?.photoURL, currentUser?.email]);

  // CẬP NHẬT EMAIL CỦA THÀNH VIÊN TRONG TỔ ẤM (CHO PHÉP VỢ/CHỒNG CẬP NHẬT HỘ NHAU)
  const updateMemberEmail = async (uid: string, email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      showToast('Vui lòng nhập địa chỉ email hợp lệ!', 'warning');
      return;
    }

    // Cập nhật state cục bộ ngay lập tức để giao diện phản hồi tức thì
    setActiveHousehold((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        memberEmails: {
          ...(prev.memberEmails || {}),
          [uid]: cleanEmail
        }
      };
    });

    // Cập nhật lên Firestore nếu đang kích hoạt Firebase
    if (isFirebaseActive && firebaseUser && activeHousehold) {
      try {
        await firestoreUpdateMemberEmail(activeHousehold.id, uid, cleanEmail);
      } catch (err) {
        console.error('Lỗi khi lưu email thành viên:', err);
      }
    }

    showToast('Đã lưu địa chỉ email thành công!', 'success');
  };

  // CẬP NHẬT VAI TRÒ CỦA BẢN THÂN TRONG TỔ ẤM
  const updateUserRole = async (role: 'Chồng' | 'Vợ') => {
    setUserRole(role);
    localStorage.setItem('user_role', role);
    triggerHaptic(10);
    playActionClick();

    if (currentUser) {
      setCurrentUser((prev) => prev ? { ...prev, role } : null);
    }

    if (activeHousehold && currentUser) {
      setActiveHousehold((prev) => prev ? {
        ...prev,
        memberRoles: {
          ...(prev.memberRoles || {}),
          [currentUser.uid]: role
        }
      } : null);

      if (isFirebaseActive && firebaseUser) {
        try {
          await setMemberRole(activeHousehold.id, currentUser.uid, role);
        } catch (err) {
          console.error('Lỗi khi lưu vai trò:', err);
        }
      }
    }

    showToast(`Đã lưu vai trò của bạn là "${role}"`, 'success');
  };

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
        setFinancialGoals(sortFinancialGoals(MOCK_GOALS));
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
      if (cats.length > 0) {
        // Kiểm tra xem tổ ấm có thiếu danh mục thu nhập hay danh mục mặc định nào không
        const hasIncome = cats.some((c) => (c.type || 'EXPENSE') === 'INCOME');
        const existingIds = new Set(cats.map((c) => c.id));
        const missingDefaults = DEFAULT_CATEGORIES.filter((def) => !existingIds.has(def.id));

        if (!hasIncome || missingDefaults.length > 0) {
          // Bù vào Firestore trong nền để lưu vĩnh viễn
          seedMissingCategories(activeHousehold.id, cats).catch((err) => {
            console.warn('Lỗi tự động bù danh mục tổ ấm:', err);
          });
          // Gộp ngay lập tức vào state cục bộ để giao diện có ngay lập tức
          setCategories([...cats, ...missingDefaults]);
        } else {
          setCategories(cats);
        }
      } else {
        // Tổ ấm hoàn toàn chưa có danh mục nào (mới tạo hoặc rỗng)
        seedMissingCategories(activeHousehold.id, []).catch((err) => {
          console.warn('Lỗi tự động bù danh mục tổ ấm rỗng:', err);
        });
        setCategories(DEFAULT_CATEGORIES);
      }
    });

    const unsubTx = subscribeTransactions(activeHousehold.id, currentYearMonth, (txs) => {
      setTransactions(txs);
    });

    const unsubSum = subscribeMonthlySummary(activeHousehold.id, currentYearMonth, (sum) => {
      setMonthlySummary(sum);
    });

    const unsubGoals = subscribeFinancialGoals(activeHousehold.id, (goals) => {
      setFinancialGoals(sortFinancialGoals(goals));
    });

    const unsubQuickTags = subscribeQuickTags(activeHousehold.id, (tags) => {
      if (tags.length > 0) {
        setQuickTags(tags);
      } else {
        seedMissingQuickTags(activeHousehold.id, []).catch((err) => {
          console.warn('Lỗi tự động seed quick tags:', err);
        });
        setQuickTags([
          ...DEFAULT_QUICK_TAGS,
          ...DEFAULT_INCOME_QUICK_TAGS
        ]);
      }
    });

    return () => {
      unsubCat();
      unsubTx();
      unsubSum();
      unsubGoals();
      unsubQuickTags();
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
    wifeRatio,
    husbandIncome,
    wifeIncome,
    husbandIncomeRatio,
    wifeIncomeRatio
  } = useMemo(() => {
    let exp = 0;
    let inc = 0;
    let hExp = 0;
    let wExp = 0;
    let hInc = 0;
    let wInc = 0;

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
        if (tx.paidBy === 'Chồng') {
          hInc += tx.amount;
        } else {
          wInc += tx.amount;
        }
      }
    });

    // Nếu có summary từ Firestore và chưa có transactions nạp xong
    if (exp === 0 && inc === 0 && monthlySummary) {
      exp = monthlySummary.totalExpense;
      inc = monthlySummary.totalIncome;
      hExp = monthlySummary.byMember?.['Chồng'] || 0;
      wExp = monthlySummary.byMember?.['Vợ'] || 0;
    }

    const net = inc - exp;
    const savRatio = inc > 0 ? Math.round((Math.max(0, net) / inc) * 100) : 0;
    
    const budget = activeHousehold?.monthlyBudget || 30000000;
    const bProg = Math.min(100, Math.round((exp / budget) * 100));

    const totalCoupleExp = hExp + wExp;
    const hRatio = totalCoupleExp > 0 ? Math.round((hExp / totalCoupleExp) * 100) : 50;
    const wRatio = totalCoupleExp > 0 ? 100 - hRatio : 50;

    const totalCoupleInc = hInc + wInc;
    const hIncRatio = totalCoupleInc > 0 ? Math.round((hInc / totalCoupleInc) * 100) : 50;
    const wIncRatio = totalCoupleInc > 0 ? 100 - hIncRatio : 50;

    return {
      totalExpense: exp,
      totalIncome: inc,
      netSavings: net,
      savingsRatio: savRatio,
      budgetProgress: bProg,
      husbandExpense: hExp,
      wifeExpense: wExp,
      husbandRatio: hRatio,
      wifeRatio: wRatio,
      husbandIncome: hInc,
      wifeIncome: wInc,
      husbandIncomeRatio: hIncRatio,
      wifeIncomeRatio: wIncRatio
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

    // Nếu giao dịch gắn liền với một Mục tiêu Tự do Tài chính (Khoản nợ hoặc Tích lũy)
    if (txData.goalId) {
      adjustGoalBalance(txData.goalId, txData.amount);
      const targetGoal = financialGoals.find((g) => g.id === txData.goalId);
      if (targetGoal) {
        if (targetGoal.type === 'DEBT_PAYOFF') {
          showToast(`Đã giảm dư nợ mục tiêu "${targetGoal.title}"!`, 'success');
        } else {
          showToast(`Đã cộng vào quỹ tích lũy "${targetGoal.title}"!`, 'success');
        }
      }
    }
  };

  // HÀM BÙ TRỪ TIẾN ĐỘ MỤC TIÊU TỰ DO TÀI CHÍNH
  const adjustGoalBalance = (goalId: string | undefined, amountDelta: number) => {
    if (!goalId || amountDelta === 0) return;
    const targetGoal = financialGoals.find((g) => g.id === goalId);
    if (!targetGoal) return;

    let nextAmount = targetGoal.currentAmount;
    let nextStatus = targetGoal.status;

    if (targetGoal.type === 'DEBT_PAYOFF') {
      nextAmount = Math.max(0, targetGoal.currentAmount - amountDelta);
      if (nextAmount === 0) {
        nextStatus = 'COMPLETED';
      } else if (nextStatus === 'COMPLETED') {
        nextStatus = 'ACTIVE';
      }
    } else {
      nextAmount = Math.max(0, targetGoal.currentAmount + amountDelta);
      if (targetGoal.targetAmount > 0 && nextAmount >= targetGoal.targetAmount) {
        nextStatus = 'COMPLETED';
      } else if (nextStatus === 'COMPLETED') {
        nextStatus = 'ACTIVE';
      }
    }

    setFinancialGoals((prev) =>
      prev.map((g) =>
        g.id === targetGoal.id
          ? { ...g, currentAmount: nextAmount, status: nextStatus, updatedAt: Date.now() }
          : g
      )
    );

    if (isFirebaseActive && activeHousehold && firebaseUser) {
      updateGoalProgress(activeHousehold.id, targetGoal.id, amountDelta, targetGoal.type);
    }
  };

  // HÀNH ĐỘNG CẬP NHẬT GIAO DỊCH
  const editTransaction = async (oldTx: Transaction, updatedTx: Transaction) => {
    playSuccessChime();

    // Đồng bộ điều chỉnh số dư mục tiêu Tự do Tài chính
    if (oldTx.goalId === updatedTx.goalId) {
      if (oldTx.goalId) {
        const delta = updatedTx.amount - oldTx.amount;
        if (delta !== 0) {
          adjustGoalBalance(oldTx.goalId, delta);
        }
      }
    } else {
      // Đổi mục tiêu hoặc gỡ/gắn mới
      if (oldTx.goalId) {
        adjustGoalBalance(oldTx.goalId, -oldTx.amount);
      }
      if (updatedTx.goalId) {
        adjustGoalBalance(updatedTx.goalId, updatedTx.amount);
      }
    }

    if (isFirebaseActive && activeHousehold && firebaseUser) {
      await updateTransactionWithSummary(activeHousehold.id, oldTx, updatedTx);
    } else {
      // Cập nhật Mock Data cục bộ
      setTransactions((prev) =>
        prev.map((item) => (item.id === oldTx.id ? updatedTx : item))
      );
    }
  };

  // HÀNH ĐỘNG XÓA GIAO DỊCH
  const removeTransaction = async (tx: Transaction) => {
    // Hoàn tác số tiền đã trừ/cộng vào mục tiêu Tự do Tài chính nếu có
    if (tx.goalId) {
      adjustGoalBalance(tx.goalId, -tx.amount);
      showToast('Đã hoàn lại số dư cho mục tiêu tài chính', 'info');
    }

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

  // CẬP NHẬT TÊN TỔ ẤM
  const updateHouseholdName = async (name: string) => {
    const trimmed = name.trim();
    if (!activeHousehold || !trimmed) return;

    playSuccessChime();
    triggerHaptic(10);

    setActiveHousehold((prev) => prev ? { ...prev, name: trimmed, updatedAt: Date.now() } : null);
    setUserHouseholds((prev) =>
      prev.map((hh) => (hh.id === activeHousehold.id ? { ...hh, name: trimmed, updatedAt: Date.now() } : hh))
    );

    if (isFirebaseActive && firebaseUser) {
      try {
        await firestoreUpdateHouseholdName(activeHousehold.id, trimmed);
      } catch (err) {
        console.error('Lỗi cập nhật tên tổ ấm lên Firestore:', err);
      }
    }

    showToast(`Đã đổi tên tổ ấm thành "${trimmed}"`, 'success');
  };

  // THÊM DANH MỤC MỚI
  const createCategory = async (catData: Omit<Category, 'id' | 'createdAt' | 'isArchived' | 'order'>) => {
    const newCat: Category = {
      ...catData,
      id: `cat_${Date.now()}`,
      order: categories.length + 1,
      isArchived: false,
      createdAt: new Date().toISOString()
    };
    playSuccessChime();
    triggerHaptic(10);
    setCategories((prev) => [...prev, newCat]);

    if (isFirebaseActive && activeHousehold && firebaseUser) {
      await saveCategory(activeHousehold.id, newCat);
    }
    showToast(`Đã tạo nhóm "${newCat.name}"`, 'success');
  };

  // CHỈNH SỬA DANH MỤC
  const editCategory = async (categoryId: string, updates: Partial<Category>) => {
    playActionClick();
    triggerHaptic(10);
    setCategories((prev) =>
      prev.map((c) => (c.id === categoryId ? { ...c, ...updates } : c))
    );

    if (isFirebaseActive && activeHousehold && firebaseUser) {
      await updateCategory(activeHousehold.id, categoryId, updates);
    }
    showToast('Đã lưu thay đổi danh mục', 'success');
  };

  // XÓA HOẶC ẨN DANH MỤC AN TOÀN
  const removeCategory = async (category: Category) => {
    playActionClick();
    triggerHaptic(15);

    // Kiểm tra xem danh mục đã phát sinh giao dịch nào chưa
    const isUsed = transactions.some((t) => t.categoryId === category.id);

    if (isUsed) {
      // Đã có giao dịch: Ẩn danh mục (Soft Delete) để không làm mất lịch sử
      setCategories((prev) =>
        prev.map((c) => (c.id === category.id ? { ...c, isArchived: true } : c))
      );

      if (isFirebaseActive && activeHousehold && firebaseUser) {
        await archiveCategory(activeHousehold.id, category.id);
      }
      showToast(`Đã ẩn danh mục "${category.name}" để bảo vệ lịch sử thu chi`, 'info');
    } else {
      // Chưa có giao dịch: Xóa vĩnh viễn
      setCategories((prev) => prev.filter((c) => c.id !== category.id));

      if (isFirebaseActive && activeHousehold && firebaseUser) {
        await deleteCategoryPermanently(activeHousehold.id, category.id);
      }
      showToast(`Đã xóa danh mục "${category.name}"`, 'info');
    }
  };

  // KHÔI PHỤC DANH MỤC ĐÃ ẨN
  const restoreCategory = async (categoryId: string) => {
    playSuccessChime();
    triggerHaptic(10);
    setCategories((prev) =>
      prev.map((c) => (c.id === categoryId ? { ...c, isArchived: false } : c))
    );

    if (isFirebaseActive && activeHousehold && firebaseUser) {
      await unarchiveCategory(activeHousehold.id, categoryId);
    }
    showToast('Đã khôi phục danh mục thành công!', 'success');
  };

  // KHÔI PHỤC TOÀN BỘ DANH MỤC MẪU (CHO THU NHẬP HOẶC CHI TIÊU)
  const restoreDefaultCategories = async (type?: 'EXPENSE' | 'INCOME') => {
    playSuccessChime();
    triggerHaptic(15);
    const targets = type
      ? DEFAULT_CATEGORIES.filter((c) => (c.type || 'EXPENSE') === type)
      : DEFAULT_CATEGORIES;

    setCategories((prev) => {
      const remaining = prev.filter((c) => !targets.some((t) => t.id === c.id));
      return [...remaining, ...targets];
    });

    if (isFirebaseActive && activeHousehold && firebaseUser) {
      try {
        await firestoreRestoreDefaultCategories(activeHousehold.id, type);
      } catch (err) {
        console.error('Lỗi lưu danh mục mẫu lên Firestore:', err);
      }
    }
    showToast(
      type === 'INCOME'
        ? 'Đã khôi phục danh mục Thu Nhập mẫu thành công!'
        : 'Đã khôi phục danh mục mẫu thành công!',
      'success'
    );
  };

  // TẠO QUICK TAG (GỢI Ý 1-CHẠM) MỚI
  const createQuickTag = async (tagData: Omit<QuickTagItem, 'id' | 'createdAt'>) => {
    playSuccessChime();
    triggerHaptic(10);
    const tempId = 'tag_' + Date.now();
    const newTag: QuickTagItem = {
      ...tagData,
      id: tempId,
      createdAt: new Date().toISOString()
    };
    setQuickTags((prev) => [...prev, newTag]);

    if (isFirebaseActive && activeHousehold && firebaseUser) {
      try {
        const created = await firestoreCreateQuickTag(activeHousehold.id, tagData);
        setQuickTags((prev) => prev.map((t) => (t.id === tempId ? created : t)));
      } catch (err) {
        console.error('Lỗi tạo Quick Tag trên Firestore:', err);
        showToast('Lỗi lưu Quick Tag lên đám mây', 'warning');
      }
    }
    showToast('Đã thêm phím tắt gợi ý 1-chạm!', 'success');
  };

  // CHỈNH SỬA QUICK TAG
  const editQuickTag = async (tagId: string, updates: Partial<QuickTagItem>) => {
    playActionClick();
    triggerHaptic(10);
    setQuickTags((prev) => prev.map((t) => (t.id === tagId ? { ...t, ...updates } : t)));

    if (isFirebaseActive && activeHousehold && firebaseUser) {
      try {
        await firestoreUpdateQuickTag(activeHousehold.id, tagId, updates);
      } catch (err) {
        console.error('Lỗi cập nhật Quick Tag trên Firestore:', err);
        showToast('Lỗi cập nhật Quick Tag', 'warning');
      }
    }
    showToast('Đã cập nhật phím tắt!', 'success');
  };

  // XÓA QUICK TAG
  const removeQuickTag = async (tagId: string) => {
    playActionClick();
    triggerHaptic(10);
    setQuickTags((prev) => prev.filter((t) => t.id !== tagId));

    if (isFirebaseActive && activeHousehold && firebaseUser) {
      try {
        await firestoreDeleteQuickTag(activeHousehold.id, tagId);
      } catch (err) {
        console.error('Lỗi xóa Quick Tag trên Firestore:', err);
        showToast('Lỗi xóa Quick Tag trên đám mây', 'warning');
      }
    }
    showToast('Đã xóa phím tắt!', 'info');
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

  // =========================================================================
  // CÁC HÀNH ĐỘNG QUẢN LÝ MỤC TIÊU TỰ DO TÀI CHÍNH (GOALS)
  // =========================================================================

  // TẠO MỤC TIÊU MỚI (TRẢ NỢ HOẶC TÍCH LŨY)
  const createGoal = async (goalData: Omit<FinancialGoal, 'id' | 'createdAt' | 'updatedAt' | 'householdId'>) => {
    if (!activeHousehold) return;
    const newGoal: FinancialGoal = {
      ...goalData,
      id: `goal_${Date.now()}`,
      householdId: activeHousehold.id,
      createdAt: new Date().toISOString(),
      updatedAt: Date.now()
    };
    playSuccessChime();
    triggerHaptic(15);
    setFinancialGoals((prev) => sortFinancialGoals([newGoal, ...prev]));

    if (isFirebaseActive && firebaseUser) {
      try {
        await saveFinancialGoal(activeHousehold.id, newGoal);
      } catch (err) {
        console.error('Lỗi lưu mục tiêu lên Firestore:', err);
      }
    }
    showToast(`Đã tạo mục tiêu "${newGoal.title}"`, 'success');
  };

  // CHỈNH SỬA THÔNG TIN MỤC TIÊU
  const editGoal = async (goalId: string, updates: Partial<FinancialGoal>) => {
    playActionClick();
    triggerHaptic(10);
    setFinancialGoals((prev) =>
      sortFinancialGoals(prev.map((g) => (g.id === goalId ? { ...g, ...updates, updatedAt: Date.now() } : g)))
    );

    if (isFirebaseActive && activeHousehold && firebaseUser) {
      const existing = financialGoals.find((g) => g.id === goalId);
      if (existing) {
        try {
          await saveFinancialGoal(activeHousehold.id, { ...existing, ...updates, updatedAt: Date.now() });
        } catch (err) {
          console.error('Lỗi cập nhật mục tiêu lên Firestore:', err);
        }
      }
    }
    showToast('Đã lưu thay đổi mục tiêu', 'success');
  };

  // XÓA MỤC TIÊU
  const removeGoal = async (goalId: string) => {
    playActionClick();
    triggerHaptic(15);
    const target = financialGoals.find((g) => g.id === goalId);
    setFinancialGoals((prev) => prev.filter((g) => g.id !== goalId));

    if (isFirebaseActive && activeHousehold && firebaseUser) {
      try {
        await deleteFinancialGoal(activeHousehold.id, goalId);
      } catch (err) {
        console.error('Lỗi xóa mục tiêu trên Firestore:', err);
      }
    }
    showToast(`Đã xóa mục tiêu "${target?.title || ''}"`, 'info');
  };

  // CẬP NHẬT TRỰC TIẾP DƯ NỢ / SỐ TIỀN CỦA MỤC TIÊU
  const updateGoalAmount = async (goalId: string, newAmount: number) => {
    playSuccessChime();
    triggerHaptic(10);
    setFinancialGoals((prev) =>
      sortFinancialGoals(
        prev.map((g) => {
          if (g.id !== goalId) return g;
          const nextStatus = g.type === 'DEBT_PAYOFF'
            ? (newAmount === 0 ? 'COMPLETED' : 'ACTIVE')
            : (g.targetAmount > 0 && newAmount >= g.targetAmount ? 'COMPLETED' : 'ACTIVE');
          return { ...g, currentAmount: newAmount, status: nextStatus, updatedAt: Date.now() };
        })
      )
    );

    if (isFirebaseActive && activeHousehold && firebaseUser) {
      const existing = financialGoals.find((g) => g.id === goalId);
      if (existing) {
        const nextStatus = existing.type === 'DEBT_PAYOFF'
          ? (newAmount === 0 ? 'COMPLETED' : 'ACTIVE')
          : (existing.targetAmount > 0 && newAmount >= existing.targetAmount ? 'COMPLETED' : 'ACTIVE');
        try {
          await saveFinancialGoal(activeHousehold.id, {
            ...existing,
            currentAmount: newAmount,
            status: nextStatus,
            updatedAt: Date.now()
          });
        } catch (err) {
          console.error('Lỗi cập nhật số tiền mục tiêu:', err);
        }
      }
    }
    showToast('Đã cập nhật số tiền mục tiêu thành công!', 'success');
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
        userRole,
        updateUserRole,
        updateMemberEmail,
        activeHousehold,
        categories,
        createCategory,
        editCategory,
        removeCategory,
        restoreCategory,
        restoreDefaultCategories,
        quickTags,
        createQuickTag,
        editQuickTag,
        removeQuickTag,
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
        husbandIncome,
        wifeIncome,
        husbandIncomeRatio,
        wifeIncomeRatio,
        soundEnabled,
        toggleSound,
        logTransaction,
        editTransaction,
        removeTransaction,
        updateBudget,
        updateHouseholdName,
        createNewHousehold,
        generateInviteCode,
        joinWithInviteCode,
        userHouseholds,
        switchHousehold,
        financialGoals,
        createGoal,
        editGoal,
        removeGoal,
        updateGoalAmount,
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
