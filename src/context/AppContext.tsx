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
  updateHouseholdBudget as firestoreUpdateHouseholdBudget,
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
  seedMissingQuickTags,
  subscribePendingExpenses,
  addPendingExpense,
  updatePendingExpense,
  deletePendingExpense,
  convertPendingToTransaction,
  subscribeCreditCards,
  addCreditCard as firestoreAddCreditCard,
  updateCreditCard as firestoreUpdateCreditCard,
  deleteCreditCard as firestoreDeleteCreditCard,
  settleCreditCardTransactions,
  subscribeUnsettledCreditCardTransactions,
  subscribeSettlementBatches,
  subscribeSettledCreditCardTransactions,
  subscribeCardCashbackTransactions,
  undoSettlementBatch,
  undoSingleTransactionSettlement,
  updateTransactionSettlementInfo
} from '../services/firestoreService';
import { 
  DEFAULT_CATEGORIES,
  DEFAULT_QUICK_TAGS,
  DEFAULT_INCOME_QUICK_TAGS
} from '../services/mockData';
import type { Household, Category, Transaction, MonthlySummary, UserProfile, FinancialGoal, QuickTagItem, PendingExpense, CreditCard, UnsettledCardGroup, SettlementBatch } from '../types';
import { getCurrentYearMonth, getLocalDateString, getLocalYearMonthString, formatVND, calculateCardNextDueDate, getCardBillingCycleInfo, classifyCardTransaction, formatTxMonth } from '../utils/currency';
import { isSoundEnabled, setSoundEnabled, playSuccessChime, playActionClick } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';
import { useToast } from '../components/Toast';
import { sortFinancialGoals } from '../utils/goalSorting';
import { sendLocalNotification, checkAndTriggerDailyReminder } from '../services/notificationService';

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
  
  // Âm thanh xúc giác & Cài đặt hiển thị
  soundEnabled: boolean;
  toggleSound: () => void;
  compactCurrency: boolean;
  toggleCompactCurrency: () => void;
  defaultCollapseDays: boolean;
  toggleDefaultCollapseDays: () => void;
  mobileShowBalanceDetails: boolean;
  toggleMobileShowBalanceDetails: () => void;
  
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

  // Khoản chờ thanh toán (Pending Expenses)
  pendingExpenses: PendingExpense[];
  activePendingExpenses: PendingExpense[];
  totalPendingAmount: number;
  logPendingExpense: (data: Omit<PendingExpense, 'id' | 'createdAt' | 'updatedAt' | 'householdId'>) => Promise<string>;
  editPendingExpense: (id: string, updates: Partial<PendingExpense>) => Promise<void>;
  removePendingExpense: (id: string) => Promise<void>;
  confirmPaidPendingExpense: (pendingItem: PendingExpense, paidBy: 'Chồng' | 'Vợ', date?: string) => Promise<void>;
  
  // Quản lý Thẻ tín dụng & Dư nợ thẻ (Phương án 1)
  creditCards: CreditCard[];
  activeCreditCards: CreditCard[];
  unsettledCardExpenses: UnsettledCardGroup[];
  totalUnsettledCardAmount: number;
  totalAllCreditCardDebt: number;
  addCreditCard: (card: Omit<CreditCard, 'id' | 'createdAt' | 'updatedAt' | 'householdId'>) => Promise<string>;
  editCreditCard: (id: string, updates: Partial<CreditCard>) => Promise<void>;
  removeCreditCard: (id: string) => Promise<void>;
  settleCard: (cardId: string, paidBy: 'Chồng' | 'Vợ', mode?: 'STATEMENT_ONLY' | 'ALL', date?: string, cashbackAmount?: number) => Promise<void>;
  
  // Lịch sử quyết toán thẻ tín dụng, Ngày quyết toán & Hoàn tiền (Cashback)
  settlementBatches: SettlementBatch[];
  cashbackTransactions: Transaction[];
  cardCashbackByCardId: Record<string, number>;
  totalCardCashback: number;
  recordCardCashback: (cardId: string, amount: number, receivedBy: 'Chồng' | 'Vợ', date?: string, note?: string) => Promise<void>;
  undoSettlement: (batch: SettlementBatch) => Promise<void>;
  undoSingleSettlement: (txId: string) => Promise<void>;
  updateSettlementInfo: (txId: string, settledAt: string, settledBy: 'Chồng' | 'Vợ') => Promise<void>;

  // Xác thực Google
  isAuthenticating: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { showToast } = useToast();
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activeHousehold, setActiveHousehold] = useState<Household | null>(null);
  const [userHouseholds, setUserHouseholds] = useState<Household[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary | null>(null);
  const [financialGoals, setFinancialGoals] = useState<FinancialGoal[]>([]);
  const [pendingExpenses, setPendingExpenses] = useState<PendingExpense[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [unsettledCardTransactions, setUnsettledCardTransactions] = useState<Transaction[]>([]);
  const [rawSettlementBatches, setRawSettlementBatches] = useState<SettlementBatch[]>([]);
  const [settledCardTransactions, setSettledCardTransactions] = useState<Transaction[]>([]);
  const [cashbackTransactions, setCashbackTransactions] = useState<Transaction[]>([]);
  const [quickTags, setQuickTags] = useState<QuickTagItem[]>(() => [
    ...DEFAULT_QUICK_TAGS,
    ...DEFAULT_INCOME_QUICK_TAGS
  ]);
  const [currentYearMonth, setCurrentYearMonth] = useState<string>(getCurrentYearMonth());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [soundEnabled, setSoundState] = useState<boolean>(isSoundEnabled());
  const [compactCurrency, setCompactCurrency] = useState<boolean>(() => {
    return localStorage.getItem('setting_compact_currency') === 'true';
  });
  const [defaultCollapseDays, setDefaultCollapseDays] = useState<boolean>(() => {
    return localStorage.getItem('setting_default_collapse_days') === 'true';
  });
  const [mobileShowBalanceDetails, setMobileShowBalanceDetails] = useState<boolean>(() => {
    return localStorage.getItem('setting_mobile_balance_details') === 'true';
  });
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

      // Đồng bộ avatar Google nếu có (chỉ khi người dùng thực sự là thành viên của tổ ấm)
      const isMember = activeHousehold.members?.includes(currentUser.uid);
      if (currentUser.photoURL && activeHousehold.id && isMember) {
        const currentPhoto = activeHousehold.memberPhotos?.[currentUser.uid];
        if (!currentPhoto || currentPhoto !== currentUser.photoURL) {
          syncMemberPhoto(activeHousehold.id, currentUser.uid, currentUser.photoURL);
        }
      }

      // Tự động đồng bộ email người dùng vào tổ ấm nếu chưa có hoặc thay đổi
      if (currentUser.email && activeHousehold.id && isMember) {
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
  }, [activeHousehold?.id, activeHousehold?.members, currentUser?.uid, currentUser?.photoURL, currentUser?.email]);

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

  // Chuyển đổi bật/tắt định dạng số tiền rút gọn (vd: 1 tr thay vì 1.000.000 ₫)
  const toggleCompactCurrency = () => {
    const next = !compactCurrency;
    setCompactCurrency(next);
    localStorage.setItem('setting_compact_currency', String(next));
  };

  // Chuyển đổi bật/tắt mặc định thu gọn theo ngày trong sổ cái
  const toggleDefaultCollapseDays = () => {
    const next = !defaultCollapseDays;
    setDefaultCollapseDays(next);
    localStorage.setItem('setting_default_collapse_days', String(next));
  };

  // Chuyển đổi ẩn/hiện tiến độ & cán cân vợ chồng trên di động
  const toggleMobileShowBalanceDetails = () => {
    const next = !mobileShowBalanceDetails;
    setMobileShowBalanceDetails(next);
    localStorage.setItem('setting_mobile_balance_details', String(next));
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
        // Dọn sạch mock data ngay lập tức khi đăng nhập tài khoản thực
        setPendingExpenses([]);
        setTransactions([]);
        setCreditCards([]);
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

          // 2. Lấy danh sách tất cả các tổ ấm của người dùng và lọc các tổ ấm mà người dùng thực sự là thành viên
          let loadedUserHouseholds = await getUserHouseholds(profile.householdIds);
          let validHouseholds = loadedUserHouseholds.filter(h => h.members?.includes(profile.uid));

          // 3. Quyết định tổ ấm hoạt động (ưu tiên thông minh):
          // Ưu tiên 1: Tổ ấm gia đình (đã gắn kết 2 thành viên Vợ & Chồng)
          // Ưu tiên 2: Tổ ấm được lưu trong localStorage (nếu có và hợp lệ)
          // Ưu tiên 3: activeHouseholdId trong hồ sơ Firestore
          // Ưu tiên 4: Tổ ấm gần nhất trong danh sách hợp lệ
          const familyHousehold = validHouseholds.find(h => (h.members?.length || 0) >= 2);
          const savedHhId = localStorage.getItem('active_household_id');
          const savedHousehold = savedHhId ? validHouseholds.find(h => h.id === savedHhId) : null;

          let selectedHousehold: Household | null = null;
          if (familyHousehold) {
            // Luôn ưu tiên tổ ấm đã đủ cặp Vợ & Chồng để người dùng không bị kẹt ở tổ ấm rác 1 người
            selectedHousehold = familyHousehold;
          } else if (savedHousehold) {
            selectedHousehold = savedHousehold;
          } else if (profile.activeHouseholdId) {
            selectedHousehold = validHouseholds.find(h => h.id === profile.activeHouseholdId) || null;
          }

          if (!selectedHousehold && validHouseholds.length > 0) {
            selectedHousehold = validHouseholds[validHouseholds.length - 1];
          }

          // 4. Nếu người dùng hoàn toàn chưa có tổ ấm hợp lệ nào, khởi tạo tổ ấm mặc định
          if (!selectedHousehold) {
            selectedHousehold = await createHousehold('Tổ Ấm Nhỏ', 30000000, profile);
            validHouseholds = [selectedHousehold];
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

          setUserHouseholds(validHouseholds);
          setActiveHousehold(selectedHousehold);

          if (joinedFromInvite && selectedHousehold) {
            showToast(`Đã kết nối thành công vào tổ ấm "${selectedHousehold.name}"!`, 'success');
          }
        } catch (err) {
          console.error('Lỗi khởi tạo hồ sơ người dùng:', err);
        }
      } else {
        // Đặt toàn bộ state về rỗng khi chưa đăng nhập
        setCurrentUser(null);
        setActiveHousehold(null);
        setUserHouseholds([]);
        setCategories(DEFAULT_CATEGORIES);
        setTransactions([]);
        setMonthlySummary(null);
        setFinancialGoals([]);
        setPendingExpenses([]);
        setCreditCards([]);
        setUnsettledCardTransactions([]);
        setRawSettlementBatches([]);
        setSettledCardTransactions([]);
        setCashbackTransactions([]);
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

    // Bảo đảm người dùng hiện tại thực sự là thành viên của tổ ấm trên Firestore trước khi subscribe
    if (!activeHousehold.members || !activeHousehold.members.includes(firebaseUser.uid)) {
      console.warn('Tài khoản hiện tại chưa nằm trong danh sách thành viên của tổ ấm, tạm hoãn subscription.');
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

    const unsubPending = subscribePendingExpenses(activeHousehold.id, (items) => {
      setPendingExpenses(items);
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

    const unsubCreditCards = subscribeCreditCards(activeHousehold.id, (items) => {
      setCreditCards(items);
    });

    const unsubUnsettledCardTx = subscribeUnsettledCreditCardTransactions(activeHousehold.id, (items) => {
      setUnsettledCardTransactions(items);
    });

    const unsubBatches = subscribeSettlementBatches(activeHousehold.id, (items) => {
      setRawSettlementBatches(items);
    });

    const unsubSettledCardTx = subscribeSettledCreditCardTransactions(activeHousehold.id, (items) => {
      setSettledCardTransactions(items);
    });

    const unsubCashbackTx = subscribeCardCashbackTransactions(activeHousehold.id, (items) => {
      setCashbackTransactions(items);
    });

    return () => {
      unsubCat();
      unsubTx();
      unsubSum();
      unsubGoals();
      unsubPending();
      unsubQuickTags();
      unsubCreditCards();
      unsubUnsettledCardTx();
      unsubBatches();
      unsubSettledCardTx();
      unsubCashbackTx();
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

  // TÍNH TOÁN CÁC CHỈ SỐ KHOẢN CHỜ THANH TOÁN (Derived Pending Metrics)
  const activePendingExpenses = useMemo(() => {
    return pendingExpenses
      .filter((item) => item.status === 'PENDING')
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [pendingExpenses]);

  const totalPendingAmount = useMemo(() => {
    return activePendingExpenses.reduce((sum, item) => sum + item.amount, 0);
  }, [activePendingExpenses]);

  // Danh sách thẻ tín dụng đang hoạt động
  const activeCreditCards = useMemo(() => {
    return creditCards.filter((c) => c.isActive);
  }, [creditCards]);

  // Gom nhóm các giao dịch quẹt thẻ tín dụng chưa quyết toán và phân loại chu kỳ sao kê
  const unsettledCardExpenses = useMemo<UnsettledCardGroup[]>(() => {
    const groups = activeCreditCards.map((card) => {
      const cycleInfo = getCardBillingCycleInfo(card);
      const cardTxs = unsettledCardTransactions
        .filter((t) => t.cardId === card.id)
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

      const statementTxs: Transaction[] = [];
      const nextCycleTxs: Transaction[] = [];

      cardTxs.forEach((t) => {
        const cat = classifyCardTransaction(t, cycleInfo);
        if (cat === 'STATEMENT') {
          statementTxs.push(t);
        } else {
          nextCycleTxs.push(t);
        }
      });

      const statementAmount = statementTxs.reduce((sum, t) => sum + t.amount, 0);
      const nextCycleAmount = nextCycleTxs.reduce((sum, t) => sum + t.amount, 0);
      const total = statementAmount + nextCycleAmount;

      return {
        card,
        statementTxs,
        statementAmount,
        nextCycleTxs,
        nextCycleAmount,
        transactions: cardTxs,
        totalAmount: total,
        currentDueDate: cycleInfo.currentDueDate,
        nextDueDate: cycleInfo.nextDueDate
      };
    });

    // Sắp xếp các nhóm thẻ: thẻ có nợ sao kê kỳ này lên trước, rồi đến thẻ có nợ kỳ tới, theo hạn gần nhất
    return groups.sort((a, b) => {
      if (a.statementAmount > 0 && b.statementAmount === 0) return -1;
      if (a.statementAmount === 0 && b.statementAmount > 0) return 1;
      if (a.totalAmount > 0 && b.totalAmount === 0) return -1;
      if (a.totalAmount === 0 && b.totalAmount > 0) return 1;
      return a.currentDueDate.localeCompare(b.currentDueDate);
    });
  }, [unsettledCardTransactions, activeCreditCards]);

  // Tổng nợ sao kê đến hạn cần chuẩn bị trả đợt này
  const totalUnsettledCardAmount = useMemo(() => {
    return unsettledCardExpenses.reduce((sum, g) => sum + g.statementAmount, 0);
  }, [unsettledCardExpenses]);

  // Tổng dư nợ thẻ bao gồm cả kỳ tích lũy tiếp theo
  const totalAllCreditCardDebt = useMemo(() => {
    return unsettledCardExpenses.reduce((sum, g) => sum + g.totalAmount, 0);
  }, [unsettledCardExpenses]);

  // TỔNG HỢP DANH SÁCH LỊCH SỬ QUYẾT TOÁN THẺ (Tự động nhận diện các đợt đã quyết toán)
  const settlementBatches = useMemo<SettlementBatch[]>(() => {
    // Tập hợp ID các giao dịch đã thuộc về một batch chính thức
    const batchedTxIds = new Set<string>();
    rawSettlementBatches.forEach((b) => {
      (b.txIds || []).forEach((id) => batchedTxIds.add(id));
    });

    // Các giao dịch đã tất toán nhưng chưa có batch (legacy hoặc vừa quyết toán trước đó)
    const unbatchedSettled = settledCardTransactions.filter((t) => !batchedTxIds.has(t.id));

    if (unbatchedSettled.length === 0) {
      return rawSettlementBatches;
    }

    // Nhóm các giao dịch chưa có batch theo (cardId, settledAt, settledBy)
    const legacyGroups: Record<string, Transaction[]> = {};
    unbatchedSettled.forEach((t) => {
      const key = `${t.cardId || 'unknown'}_${t.settledAt || t.date || 'unknown'}_${t.settledBy || 'Chồng'}`;
      if (!legacyGroups[key]) {
        legacyGroups[key] = [];
      }
      legacyGroups[key].push(t);
    });

    const synthesizedBatches: SettlementBatch[] = Object.entries(legacyGroups).map(([key, txs]) => {
      const first = txs[0];
      const card = creditCards.find((c) => c.id === first.cardId);
      const settledAtDate = first.settledAt || first.date || getLocalDateString();
      const settledByPerson = (first.settledBy as 'Chồng' | 'Vợ') || 'Chồng';
      const totalAmount = txs.reduce((sum, t) => sum + t.amount, 0);

      return {
        id: `legacy_${key}`,
        householdId: activeHousehold?.id || '',
        cardId: first.cardId || '',
        cardName: card?.name || first.cardName || 'Thẻ tín dụng',
        cardColor: card?.color || '#0F3D39',
        last4Digits: card?.last4Digits || '',
        amount: totalAmount,
        txIds: txs.map((t) => t.id),
        settledAt: settledAtDate,
        settledBy: settledByPerson,
        createdAt: first.timestamp || Date.now(),
        txSnapshots: txs.map((t) => ({
          id: t.id,
          note: t.note || t.categoryName,
          amount: t.amount,
          date: t.date,
          categoryName: t.categoryName,
          paidBy: t.paidBy
        }))
      };
    });

    // Gộp và sắp xếp theo ngày quyết toán giảm dần (rồi đến createdAt)
    const all = [...rawSettlementBatches, ...synthesizedBatches];
    return all.sort((a, b) => {
      const cmpDate = (b.settledAt || '').localeCompare(a.settledAt || '');
      if (cmpDate !== 0) return cmpDate;
      return b.createdAt - a.createdAt;
    });
  }, [rawSettlementBatches, settledCardTransactions, creditCards, activeHousehold?.id]);

  // THỐNG KÊ TỔNG TIỀN HOÀN THẺ (CASHBACK) THEO TỪNG THẺ & TOÀN TỔ ẤM
  const { cardCashbackByCardId, totalCardCashback } = useMemo(() => {
    const byCard: Record<string, number> = {};
    let total = 0;

    // 1. Tập hợp từ các giao dịch thu nhập có isCashback === true
    const countedBatchCashbackTxIds = new Set<string>();
    cashbackTransactions.forEach((tx) => {
      if (tx.amount > 0) {
        const cId = tx.cardId || 'unknown';
        byCard[cId] = (byCard[cId] || 0) + tx.amount;
        total += tx.amount;
        countedBatchCashbackTxIds.add(tx.id);
      }
    });

    // 2. Phòng trường hợp đợt quyết toán có ghi nhận cashbackAmount nhưng chưa có trong cashbackTransactions
    rawSettlementBatches.forEach((batch) => {
      if (
        batch.cashbackAmount &&
        batch.cashbackAmount > 0 &&
        (!batch.cashbackTxId || !countedBatchCashbackTxIds.has(batch.cashbackTxId))
      ) {
        const cId = batch.cardId || 'unknown';
        byCard[cId] = (byCard[cId] || 0) + batch.cashbackAmount;
        total += batch.cashbackAmount;
      }
    });

    return {
      cardCashbackByCardId: byCard,
      totalCardCashback: total
    };
  }, [cashbackTransactions, rawSettlementBatches]);

  // HÀNH ĐỘNG GHI SỔ GIAO DỊCH
  const logTransaction = async (txData: Omit<Transaction, 'id' | 'createdAt' | 'timestamp'>) => {
    if (!isFirebaseActive || !activeHousehold || !firebaseUser) return;
    playSuccessChime();

    await addTransactionWithSummary(activeHousehold.id, txData);

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

    // Cảnh báo hạn mức danh mục nếu vượt ngân sách tháng
    if (txData.type === 'EXPENSE') {
      const cat = categories.find((c) => c.id === txData.categoryId);
      if (cat && cat.monthlyLimit && cat.monthlyLimit > 0) {
        const currentMonthStr = getLocalYearMonthString();
        const currentMonthSpent = transactions
          .filter((t) => t.type === 'EXPENSE' && t.categoryId === cat.id && t.date.startsWith(currentMonthStr))
          .reduce((sum, t) => sum + t.amount, 0) + txData.amount;

        if (currentMonthSpent > cat.monthlyLimit) {
          sendLocalNotification(`⚠️ Cảnh báo ngân sách: ${cat.name}`, {
            body: `Tổng chi tiêu tháng này (${formatVND(currentMonthSpent)}) đã vượt hạn mức quy định (${formatVND(cat.monthlyLimit)})!`,
            tag: `limit-exceeded-${cat.id}`
          });
        }
      }
    }
  };

  // Kiểm tra kích hoạt nhắc nhở ghi chép hàng ngày lúc 20:30 tối
  useEffect(() => {
    const todayStr = getLocalDateString();
    const hasTransactionsToday = transactions.some((t) => t.date === todayStr);
    checkAndTriggerDailyReminder(hasTransactionsToday);
  }, [transactions]);

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
      } else if (newStatusIsCompleted(targetGoal.status)) {
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

  function newStatusIsCompleted(status: string) {
    return status === 'COMPLETED';
  }

  // HÀNH ĐỘNG CẬP NHẬT GIAO DỊCH
  const editTransaction = async (oldTx: Transaction, updatedTx: Transaction) => {
    if (!isFirebaseActive || !activeHousehold || !firebaseUser) return;
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

    try {
      await updateTransactionWithSummary(activeHousehold.id, oldTx, updatedTx);
    } catch (err) {
      console.error('Lỗi khi cập nhật giao dịch lên Firestore:', err);
      // Hoàn tác điều chỉnh số dư mục tiêu
      if (oldTx.goalId === updatedTx.goalId) {
        if (oldTx.goalId) {
          const delta = updatedTx.amount - oldTx.amount;
          if (delta !== 0) adjustGoalBalance(oldTx.goalId, -delta);
        }
      } else {
        if (oldTx.goalId) adjustGoalBalance(oldTx.goalId, oldTx.amount);
        if (updatedTx.goalId) adjustGoalBalance(updatedTx.goalId, -updatedTx.amount);
      }
      showToast('Không thể lưu cập nhật giao dịch. Vui lòng thử lại!', 'error');
      throw err;
    }
  };

  // HÀNH ĐỘNG XÓA GIAO DỊCH
  const removeTransaction = async (tx: Transaction) => {
    if (!isFirebaseActive || !activeHousehold || !firebaseUser) return;

    // Hoàn tác số tiền đã trừ/cộng vào mục tiêu Tự do Tài chính nếu có
    if (tx.goalId) {
      adjustGoalBalance(tx.goalId, -tx.amount);
      showToast('Đã hoàn lại số dư cho mục tiêu tài chính', 'info');
    }

    try {
      await deleteTransactionWithSummary(activeHousehold.id, tx);
    } catch (err) {
      console.error('Lỗi khi xóa giao dịch trên Firestore:', err);
      // Hoàn tác lại số dư nếu xóa thất bại
      if (tx.goalId) {
        adjustGoalBalance(tx.goalId, tx.amount);
      }
      showToast('Không thể xóa giao dịch. Vui lòng kiểm tra kết nối mạng!', 'error');
      throw err;
    }
  };

  // HÀNH ĐỘNG GHI NHẬN KHOẢN CHỜ MỚI
  const logPendingExpense = async (
    data: Omit<PendingExpense, 'id' | 'createdAt' | 'updatedAt' | 'householdId'>
  ): Promise<string> => {
    if (!isFirebaseActive || !activeHousehold || !firebaseUser) {
      throw new Error('AUTH_REQUIRED');
    }
    playActionClick();
    triggerHaptic(10);

    const householdId = activeHousehold.id;

    try {
      const newId = await addPendingExpense(householdId, {
        ...data,
        householdId
      });
      showToast(`Đã lưu khoản chờ: ${data.note || data.categoryName}`, 'success');
      return newId;
    } catch (err) {
      console.error('Lỗi khi lưu khoản chờ lên Firestore:', err);
      showToast('Không thể lưu khoản chờ. Vui lòng thử lại!', 'error');
      throw err;
    }
  };

  // HÀNH ĐỘNG CẬP NHẬT KHOẢN CHỜ
  const editPendingExpense = async (id: string, updates: Partial<PendingExpense>): Promise<void> => {
    if (!isFirebaseActive || !activeHousehold || !firebaseUser) return;
    playActionClick();
    triggerHaptic(10);

    try {
      await updatePendingExpense(activeHousehold.id, id, updates);
      showToast('Đã cập nhật khoản chờ', 'success');
    } catch (err) {
      console.error('Lỗi khi cập nhật khoản chờ lên Firestore:', err);
      showToast('Không thể cập nhật khoản chờ. Vui lòng thử lại!', 'error');
      throw err;
    }
  };

  // HÀNH ĐỘNG XÓA KHOẢN CHỜ
  const removePendingExpense = async (id: string): Promise<void> => {
    if (!isFirebaseActive || !activeHousehold || !firebaseUser) return;
    playActionClick();
    triggerHaptic(15);

    try {
      await deletePendingExpense(activeHousehold.id, id);
      showToast('Đã xóa khoản chờ', 'info');
    } catch (err) {
      console.error('Lỗi khi xóa khoản chờ trên Firestore:', err);
      showToast('Không thể xóa khoản chờ. Vui lòng thử lại!', 'error');
      throw err;
    }
  };

  // HÀNH ĐỘNG XÁC NHẬN ĐÃ CHI (1-TAP CONFIRM PAID)
  const confirmPaidPendingExpense = async (
    pendingItem: PendingExpense,
    paidByPerson: 'Chồng' | 'Vợ',
    date?: string
  ): Promise<void> => {
    if (!isFirebaseActive || !activeHousehold || !firebaseUser) return;
    playSuccessChime();
    triggerHaptic(15);

    const actualDate = date || getLocalDateString();
    const paidByUid = currentUser?.uid || firebaseUser.uid;

    try {
      await convertPendingToTransaction(
        activeHousehold.id,
        pendingItem,
        paidByPerson,
        paidByUid,
        actualDate
      );
      showToast(`Đã xác nhận chi ${formatVND(pendingItem.amount)}!`, 'success');
    } catch (err) {
      console.error('Lỗi khi chuyển khoản chờ sang giao dịch:', err);
      showToast('Không thể xác nhận thanh toán. Vui lòng thử lại!', 'error');
      throw err;
    }
  };

  // ==========================================================================
  // HÀNH ĐỘNG QUẢN LÝ THẺ TÍN DỤNG & QUYẾT TOÁN THẺ (CREDIT CARD ACTIONS)
  // ==========================================================================

  // Thêm thẻ tín dụng mới
  const addCreditCard = async (
    cardData: Omit<CreditCard, 'id' | 'createdAt' | 'updatedAt' | 'householdId'>
  ): Promise<string> => {
    if (!isFirebaseActive || !activeHousehold || !firebaseUser) {
      throw new Error('AUTH_REQUIRED');
    }
    playActionClick();
    triggerHaptic(10);
    const householdId = activeHousehold.id;

    try {
      const newId = await firestoreAddCreditCard(householdId, {
        ...cardData,
        householdId
      });
      showToast(`Đã thêm thẻ ${cardData.name}`, 'success');
      return newId;
    } catch (err) {
      console.error('Lỗi khi thêm thẻ lên Firestore:', err);
      showToast('Không thể thêm thẻ. Vui lòng thử lại!', 'error');
      throw err;
    }
  };

  // Cập nhật thông tin thẻ tín dụng
  const editCreditCard = async (id: string, updates: Partial<CreditCard>): Promise<void> => {
    if (!isFirebaseActive || !activeHousehold || !firebaseUser) return;
    playActionClick();
    triggerHaptic(10);

    try {
      await firestoreUpdateCreditCard(activeHousehold.id, id, updates);
      showToast('Đã cập nhật thông tin thẻ', 'success');
    } catch (err) {
      console.error('Lỗi cập nhật thẻ trên Firestore:', err);
      showToast('Không thể cập nhật thẻ!', 'error');
      throw err;
    }
  };

  // Xóa / Gỡ thẻ tín dụng
  const removeCreditCard = async (id: string): Promise<void> => {
    if (!isFirebaseActive || !activeHousehold || !firebaseUser) return;
    playActionClick();
    triggerHaptic(15);

    try {
      await firestoreDeleteCreditCard(activeHousehold.id, id);
      showToast('Đã gỡ thẻ tín dụng', 'info');
    } catch (err) {
      console.error('Lỗi xóa thẻ trên Firestore:', err);
      showToast('Không thể xóa thẻ!', 'error');
      throw err;
    }
  };

  // QUYẾT TOÁN THẺ TÍN DỤNG 1-CHẠM (1-TAP CARD SETTLEMENT + CASHBACK)
  const settleCard = async (
    cardId: string,
    paidByPerson: 'Chồng' | 'Vợ',
    mode: 'STATEMENT_ONLY' | 'ALL' = 'STATEMENT_ONLY',
    date?: string,
    cashbackAmount?: number
  ): Promise<void> => {
    if (!isFirebaseActive || !activeHousehold || !firebaseUser) return;
    playSuccessChime();
    triggerHaptic(15);

    const actualDate = date || getLocalDateString();
    const card = creditCards.find((c) => c.id === cardId);
    const cardGroup = unsettledCardExpenses.find((g) => g.card.id === cardId);

    const targetTxs = mode === 'ALL'
      ? (cardGroup?.transactions || [])
      : (cardGroup?.statementTxs || []);

    if (targetTxs.length === 0) {
      showToast('Thẻ này hiện không có khoản nợ nào cần quyết toán!', 'info');
      return;
    }

    const txIds = targetTxs.map((t) => t.id);
    const totalAmountToSettle = targetTxs.reduce((sum, t) => sum + t.amount, 0);
    const safeCashback = cashbackAmount && cashbackAmount > 0 ? Math.round(cashbackAmount) : 0;
    const netAmount = Math.max(0, totalAmountToSettle - safeCashback);

    const txSnapshots = targetTxs.map((t) => ({
      id: t.id,
      note: t.note || t.categoryName,
      amount: t.amount,
      date: t.date,
      categoryName: t.categoryName,
      paidBy: t.paidBy
    }));

    try {
      let cashbackTxId: string | undefined;

      // Nếu có tiền hoàn (Cashback), tự động tạo một giao dịch Thu nhập (INCOME) gắn với thẻ
      if (safeCashback > 0) {
        const cashbackCat = categories.find((c) => c.id === 'cat_income_cashback') ||
          categories.find((c) => c.type === 'INCOME');

        cashbackTxId = await addTransactionWithSummary(activeHousehold.id, {
          amount: safeCashback,
          type: 'INCOME',
          categoryId: cashbackCat?.id || 'cat_income_cashback',
          categoryName: cashbackCat?.name || 'Hoàn tiền & Ưu đãi thẻ',
          categoryKey: 'INCOME',
          paidBy: paidByPerson,
          paidByUid: currentUser?.uid || firebaseUser.uid,
          note: `Hoàn tiền (Cashback) sao kê thẻ ${card?.name || 'Tín dụng'}`,
          date: actualDate,
          paymentMethod: 'CREDIT_CARD',
          cardId,
          cardName: card?.name || 'Thẻ tín dụng',
          isCashback: true
        });
      }

      await settleCreditCardTransactions(
        activeHousehold.id,
        cardId,
        txIds,
        paidByPerson,
        actualDate,
        {
          cardName: card?.name || 'Thẻ tín dụng',
          cardColor: card?.color || '#0F3D39',
          last4Digits: card?.last4Digits || '',
          amount: totalAmountToSettle,
          cashbackAmount: safeCashback > 0 ? safeCashback : undefined,
          netAmount: safeCashback > 0 ? netAmount : undefined,
          cashbackTxId,
          txSnapshots
        }
      );

      if (safeCashback > 0) {
        showToast(`Đã quyết toán thẻ ${card?.name || ''} & ghi nhận hoàn tiền +${formatVND(safeCashback)}!`, 'success');
      } else {
        showToast(`Đã quyết toán thẻ ${card?.name || ''}!`, 'success');
      }
    } catch (err) {
      console.error('Lỗi quyết toán thẻ trên Firestore:', err);
      showToast('Không thể quyết toán thẻ. Vui lòng thử lại!', 'error');
      throw err;
    }
  };

  // GHI NHẬN KHOẢN HOÀN TIỀN THẺ TÍN DỤNG ĐỘC LẬP (RECORD STANDALONE CARD CASHBACK)
  const recordCardCashback = async (
    cardId: string,
    amount: number,
    receivedBy: 'Chồng' | 'Vợ',
    date?: string,
    note?: string
  ): Promise<void> => {
    if (!isFirebaseActive || !activeHousehold || !firebaseUser) return;
    if (!amount || amount <= 0) return;

    playSuccessChime();
    triggerHaptic(12);

    const card = creditCards.find((c) => c.id === cardId);
    const actualDate = date || getLocalDateString();
    const cashbackCat = categories.find((c) => c.id === 'cat_income_cashback') ||
      categories.find((c) => c.type === 'INCOME');

    try {
      await addTransactionWithSummary(activeHousehold.id, {
        amount: Math.round(amount),
        type: 'INCOME',
        categoryId: cashbackCat?.id || 'cat_income_cashback',
        categoryName: cashbackCat?.name || 'Hoàn tiền & Ưu đãi thẻ',
        categoryKey: 'INCOME',
        paidBy: receivedBy,
        paidByUid: currentUser?.uid || firebaseUser.uid,
        note: note?.trim() || `Hoàn tiền (Cashback) thẻ ${card?.name || 'Tín dụng'}`,
        date: actualDate,
        paymentMethod: 'CREDIT_CARD',
        cardId,
        cardName: card?.name || 'Thẻ tín dụng',
        isCashback: true
      });
      showToast(`Đã ghi nhận hoàn tiền +${formatVND(amount)} cho thẻ ${card?.name || ''}!`, 'success');
    } catch (err) {
      console.error('Lỗi khi ghi nhận hoàn tiền thẻ:', err);
      showToast('Không thể ghi nhận hoàn tiền thẻ. Vui lòng thử lại!', 'error');
      throw err;
    }
  };

  // HOÀN TÁC ĐỢT QUYẾT TOÁN THẺ (UNDO BATCH)
  const undoSettlement = async (batch: SettlementBatch): Promise<void> => {
    if (!isFirebaseActive || !activeHousehold) return;
    playActionClick();
    triggerHaptic(12);

    try {
      await undoSettlementBatch(activeHousehold.id, batch.id, batch.txIds, batch.cashbackTxId);
      showToast(`Đã hoàn tác quyết toán thẻ ${batch.cardName}!`, 'info');
    } catch (err) {
      console.error('Lỗi khi hoàn tác quyết toán:', err);
      showToast('Không thể hoàn tác quyết toán. Vui lòng thử lại!', 'error');
      throw err;
    }
  };

  // HOÀN TÁC QUYẾT TOÁN CHO 1 GIAO DỊCH RIÊNG LẺ
  const undoSingleSettlement = async (txId: string): Promise<void> => {
    if (!isFirebaseActive || !activeHousehold) return;
    playActionClick();
    triggerHaptic(10);

    try {
      await undoSingleTransactionSettlement(activeHousehold.id, txId);
      showToast('Đã chuyển khoản chi về trạng thái chờ sao kê', 'info');
    } catch (err) {
      console.error('Lỗi khi hủy quyết toán giao dịch:', err);
      showToast('Không thể hủy quyết toán giao dịch.', 'error');
      throw err;
    }
  };

  // CẬP NHẬT THÔNG TIN QUYẾT TOÁN CỦA GIAO DỊCH (Ngày quyết toán, người trả)
  const updateSettlementInfo = async (
    txId: string,
    settledAt: string,
    settledBy: 'Chồng' | 'Vợ'
  ): Promise<void> => {
    if (!isFirebaseActive || !activeHousehold) return;
    playActionClick();
    triggerHaptic(8);

    try {
      await updateTransactionSettlementInfo(activeHousehold.id, txId, settledAt, settledBy);
      showToast('Đã cập nhật ngày quyết toán!', 'success');
    } catch (err) {
      console.error('Lỗi cập nhật ngày quyết toán:', err);
      showToast('Không thể cập nhật ngày quyết toán.', 'error');
      throw err;
    }
  };

  // CẬP NHẬT NGÂN SÁCH THÁNG
  const updateBudget = async (newBudget: number) => {
    if (!activeHousehold || isNaN(newBudget) || newBudget < 0) return;
    const oldBudget = activeHousehold.monthlyBudget;

    setActiveHousehold((prev) => prev ? { ...prev, monthlyBudget: newBudget } : null);
    setUserHouseholds((prev) =>
      prev.map((hh) => (hh.id === activeHousehold.id ? { ...hh, monthlyBudget: newBudget } : hh))
    );

    if (isFirebaseActive && firebaseUser) {
      try {
        await firestoreUpdateHouseholdBudget(activeHousehold.id, newBudget);
        showToast(`Đã cập nhật ngân sách tháng thành ${formatVND(newBudget)}`, 'success');
      } catch (err) {
        console.error('Lỗi cập nhật ngân sách tháng lên Firestore:', err);
        // Rollback lại giá trị cũ
        setActiveHousehold((prev) => prev ? { ...prev, monthlyBudget: oldBudget } : null);
        setUserHouseholds((prev) =>
          prev.map((hh) => (hh.id === activeHousehold.id ? { ...hh, monthlyBudget: oldBudget } : hh))
        );
        showToast('Không thể lưu ngân sách. Vui lòng thử lại!', 'error');
        throw err;
      }
    } else {
      showToast(`Đã cập nhật ngân sách tháng thành ${formatVND(newBudget)}`, 'success');
    }
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
    // Đảm bảo không truyền undefined field
    const cleanData = { ...catData };
    if (cleanData.monthlyLimit === undefined || cleanData.monthlyLimit === null || isNaN(cleanData.monthlyLimit) || cleanData.monthlyLimit <= 0) {
      delete cleanData.monthlyLimit;
    }

    const newCat: Category = {
      ...cleanData,
      id: `cat_${Date.now()}`,
      order: categories.length + 1,
      isArchived: false,
      createdAt: new Date().toISOString()
    };
    playSuccessChime();
    triggerHaptic(10);
    setCategories((prev) => [...prev, newCat]);

    if (isFirebaseActive && activeHousehold && firebaseUser) {
      try {
        await saveCategory(activeHousehold.id, newCat);
        showToast(`Đã tạo nhóm "${newCat.name}"`, 'success');
      } catch (error) {
        console.error('Lỗi khi lưu danh mục lên Firestore:', error);
        // Rollback state nếu lưu thất bại
        setCategories((prev) => prev.filter((c) => c.id !== newCat.id));
        showToast('Không thể lưu nhóm chi tiêu. Vui lòng thử lại!', 'error');
        throw error;
      }
    } else {
      showToast(`Đã tạo nhóm "${newCat.name}"`, 'success');
    }
  };

  // CHỈNH SỬA DANH MỤC
  const editCategory = async (categoryId: string, updates: Partial<Category>) => {
    playActionClick();
    triggerHaptic(10);
    const prevCategory = categories.find((c) => c.id === categoryId);

    setCategories((prev) =>
      prev.map((c) => (c.id === categoryId ? { ...c, ...updates } : c))
    );

    if (isFirebaseActive && activeHousehold && firebaseUser) {
      try {
        await updateCategory(activeHousehold.id, categoryId, updates);
        showToast('Đã lưu thay đổi danh mục', 'success');
      } catch (error) {
        console.error('Lỗi khi cập nhật danh mục trên Firestore:', error);
        // Rollback nếu thất bại
        if (prevCategory) {
          setCategories((prev) =>
            prev.map((c) => (c.id === categoryId ? prevCategory : c))
          );
        }
        showToast('Không thể cập nhật danh mục. Vui lòng thử lại!', 'error');
        throw error;
      }
    } else {
      showToast('Đã lưu thay đổi danh mục', 'success');
    }
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
        showToast('Đã thêm phím tắt gợi ý 1-chạm!', 'success');
      } catch (err) {
        console.error('Lỗi tạo Quick Tag trên Firestore:', err);
        setQuickTags((prev) => prev.filter((t) => t.id !== tempId));
        showToast('Không thể lưu phím tắt lên đám mây. Vui lòng thử lại!', 'error');
        throw err;
      }
    } else {
      showToast('Đã thêm phím tắt gợi ý 1-chạm!', 'success');
    }
  };

  // CHỈNH SỬA QUICK TAG
  const editQuickTag = async (tagId: string, updates: Partial<QuickTagItem>) => {
    playActionClick();
    triggerHaptic(10);
    const prevTags = quickTags;
    setQuickTags((prev) => prev.map((t) => (t.id === tagId ? { ...t, ...updates } : t)));

    if (isFirebaseActive && activeHousehold && firebaseUser) {
      try {
        await firestoreUpdateQuickTag(activeHousehold.id, tagId, updates);
        showToast('Đã cập nhật phím tắt!', 'success');
      } catch (err) {
        console.error('Lỗi cập nhật Quick Tag trên Firestore:', err);
        setQuickTags(prevTags);
        showToast('Không thể cập nhật phím tắt. Vui lòng thử lại!', 'error');
        throw err;
      }
    } else {
      showToast('Đã cập nhật phím tắt!', 'success');
    }
  };

  // XÓA QUICK TAG
  const removeQuickTag = async (tagId: string) => {
    playActionClick();
    triggerHaptic(10);
    const prevTags = quickTags;
    setQuickTags((prev) => prev.filter((t) => t.id !== tagId));

    if (isFirebaseActive && activeHousehold && firebaseUser) {
      try {
        await firestoreDeleteQuickTag(activeHousehold.id, tagId);
        showToast('Đã xóa phím tắt!', 'info');
      } catch (err) {
        console.error('Lỗi xóa Quick Tag trên Firestore:', err);
        setQuickTags(prevTags);
        showToast('Không thể xóa phím tắt. Vui lòng thử lại!', 'error');
        throw err;
      }
    } else {
      showToast('Đã xóa phím tắt!', 'info');
    }
  };

  // TẠO TỔ ẤM MỚI
  const createNewHousehold = async (name: string, budget: number) => {
    if (isFirebaseActive && currentUser) {
      const h = await createHousehold(name, budget, currentUser);
      setActiveHousehold(h);
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
    const cleanData = { ...goalData };
    if (!cleanData.deadline) delete cleanData.deadline;
    if (!cleanData.note?.trim()) delete cleanData.note;
    if (!cleanData.monthlyTarget || cleanData.monthlyTarget <= 0) delete cleanData.monthlyTarget;
    if (!cleanData.categoryId) delete cleanData.categoryId;
    if (!cleanData.categoryKey) delete cleanData.categoryKey;

    const newGoal: FinancialGoal = {
      ...cleanData,
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
        showToast(`Đã tạo mục tiêu "${newGoal.title}"`, 'success');
      } catch (err) {
        console.error('Lỗi lưu mục tiêu lên Firestore:', err);
        setFinancialGoals((prev) => prev.filter((g) => g.id !== newGoal.id));
        showToast('Không thể lưu mục tiêu lên đám mây. Vui lòng thử lại!', 'error');
        throw err;
      }
    } else {
      showToast(`Đã tạo mục tiêu "${newGoal.title}"`, 'success');
    }
  };

  // CHỈNH SỬA THÔNG TIN MỤC TIÊU
  const editGoal = async (goalId: string, updates: Partial<FinancialGoal>) => {
    playActionClick();
    triggerHaptic(10);
    const existing = financialGoals.find((g) => g.id === goalId);
    if (!existing) return;

    setFinancialGoals((prev) =>
      sortFinancialGoals(prev.map((g) => (g.id === goalId ? { ...g, ...updates, updatedAt: Date.now() } : g)))
    );

    if (isFirebaseActive && activeHousehold && firebaseUser) {
      try {
        await saveFinancialGoal(activeHousehold.id, { ...existing, ...updates, updatedAt: Date.now() });
        showToast('Đã lưu thay đổi mục tiêu', 'success');
      } catch (err) {
        console.error('Lỗi cập nhật mục tiêu lên Firestore:', err);
        setFinancialGoals((prev) =>
          sortFinancialGoals(prev.map((g) => (g.id === goalId ? existing : g)))
        );
        showToast('Không thể lưu thay đổi mục tiêu. Vui lòng thử lại!', 'error');
        throw err;
      }
    } else {
      showToast('Đã lưu thay đổi mục tiêu', 'success');
    }
  };

  // XÓA MỤC TIÊU
  const removeGoal = async (goalId: string) => {
    playActionClick();
    triggerHaptic(15);
    const target = financialGoals.find((g) => g.id === goalId);
    if (!target) return;

    setFinancialGoals((prev) => prev.filter((g) => g.id !== goalId));

    if (isFirebaseActive && activeHousehold && firebaseUser) {
      try {
        await deleteFinancialGoal(activeHousehold.id, goalId);
        showToast(`Đã xóa mục tiêu "${target?.title || ''}"`, 'info');
      } catch (err) {
        console.error('Lỗi xóa mục tiêu trên Firestore:', err);
        setFinancialGoals((prev) => sortFinancialGoals([...prev, target]));
        showToast('Không thể xóa mục tiêu. Vui lòng thử lại!', 'error');
        throw err;
      }
    } else {
      showToast(`Đã xóa mục tiêu "${target?.title || ''}"`, 'info');
    }
  };

  // CẬP NHẬT TRỰC TIẾP DƯ NỢ / SỐ TIỀN CỦA MỤC TIÊU
  const updateGoalAmount = async (goalId: string, newAmount: number) => {
    playSuccessChime();
    triggerHaptic(10);
    const existing = financialGoals.find((g) => g.id === goalId);
    if (!existing) return;

    const nextStatus = existing.type === 'DEBT_PAYOFF'
      ? (newAmount === 0 ? 'COMPLETED' : 'ACTIVE')
      : (existing.targetAmount > 0 && newAmount >= existing.targetAmount ? 'COMPLETED' : 'ACTIVE');

    setFinancialGoals((prev) =>
      sortFinancialGoals(
        prev.map((g) => {
          if (g.id !== goalId) return g;
          return { ...g, currentAmount: newAmount, status: nextStatus, updatedAt: Date.now() };
        })
      )
    );

    if (isFirebaseActive && activeHousehold && firebaseUser) {
      try {
        await saveFinancialGoal(activeHousehold.id, {
          ...existing,
          currentAmount: newAmount,
          status: nextStatus,
          updatedAt: Date.now()
        });
        showToast('Đã cập nhật số tiền mục tiêu thành công!', 'success');
      } catch (err) {
        console.error('Lỗi cập nhật số tiền mục tiêu:', err);
        setFinancialGoals((prev) =>
          sortFinancialGoals(prev.map((g) => (g.id === goalId ? existing : g)))
        );
        showToast('Không thể cập nhật số tiền mục tiêu. Vui lòng thử lại!', 'error');
        throw err;
      }
    } else {
      showToast('Đã cập nhật số tiền mục tiêu thành công!', 'success');
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
        // Dọn dẹp danh sách cũ trước khi nạp dữ liệu của tổ ấm mới
        setPendingExpenses([]);
        setTransactions([]);
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
    setCurrentUser(null);
    setActiveHousehold(null);
    setUserHouseholds([]);
    setTransactions([]);
    setPendingExpenses([]);
    setCreditCards([]);
    setUnsettledCardTransactions([]);
    setRawSettlementBatches([]);
    setSettledCardTransactions([]);
    setCashbackTransactions([]);
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
        compactCurrency,
        toggleCompactCurrency,
        defaultCollapseDays,
        toggleDefaultCollapseDays,
        mobileShowBalanceDetails,
        toggleMobileShowBalanceDetails,
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
        pendingExpenses,
        activePendingExpenses,
        totalPendingAmount,
        logPendingExpense,
        editPendingExpense,
        removePendingExpense,
        confirmPaidPendingExpense,
        creditCards,
        activeCreditCards,
        unsettledCardExpenses,
        totalUnsettledCardAmount,
        totalAllCreditCardDebt,
        addCreditCard,
        editCreditCard,
        removeCreditCard,
        settleCard,
        settlementBatches,
        cashbackTransactions,
        cardCashbackByCardId,
        totalCardCashback,
        recordCardCashback,
        undoSettlement,
        undoSingleSettlement,
        updateSettlementInfo,
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
