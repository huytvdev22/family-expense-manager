import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  runTransaction,
  increment,
  arrayUnion,
  query,
  where,
  orderBy,
  onSnapshot,
  type Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';
import type { Household, Category, Transaction, MonthlySummary, Invitation, UserProfile } from '../types';
import { DEFAULT_CATEGORIES } from './mockData';

/**
 * TẠO HOẶC LẤY HỒ SƠ NGƯỜI DÙNG TỪ GOOGLE AUTH
 */
export async function getOrCreateUserProfile(user: { uid: string; email: string | null; displayName: string | null; photoURL: string | null }): Promise<UserProfile> {
  if (!db) throw new Error('Firestore chưa được khởi tạo');

  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);

  if (snap.exists()) {
    return snap.data() as UserProfile;
  }

  // Tạo mới profile nếu lần đầu đăng nhập
  const newProfile: UserProfile = {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || 'Thành viên',
    photoURL: user.photoURL || undefined,
    householdIds: [],
    activeHouseholdId: '',
    createdAt: new Date().toISOString(),
    updatedAt: Date.now()
  };

  await setDoc(userRef, newProfile);
  return newProfile;
}

/**
 * KHỞI TẠO TỔ ẤM MỚI (Tự động sinh 4 danh mục mặc định)
 */
export async function createHousehold(name: string, monthlyBudget: number, user: UserProfile): Promise<Household> {
  if (!db) throw new Error('Firestore chưa được khởi tạo');

  const householdRef = doc(collection(db, 'households'));
  const householdId = householdRef.id;

  const newHousehold: Household = {
    id: householdId,
    name: name.trim() || 'Tổ Ấm Nhỏ',
    ownerUid: user.uid,
    members: [user.uid],
    memberNames: {
      [user.uid]: user.displayName || 'Chồng/Vợ'
    },
    memberEmails: {
      [user.uid]: user.email
    },
    memberPhotos: user.photoURL ? { [user.uid]: user.photoURL } : {},
    memberRoles: user.role ? { [user.uid]: user.role } : { [user.uid]: 'Chồng' },
    currency: 'VND',
    monthlyBudget: monthlyBudget || 30000000,
    createdAt: new Date().toISOString(),
    updatedAt: Date.now()
  };

  await setDoc(householdRef, newHousehold);

  // Sinh 4 danh mục chuẩn
  const catCol = collection(db, `households/${householdId}/categories`);
  for (const cat of DEFAULT_CATEGORIES) {
    await setDoc(doc(catCol, cat.id), cat);
  }

  // Cập nhật profile người dùng trỏ tới tổ ấm mới
  const userRef = doc(db, 'users', user.uid);
  await updateDoc(userRef, {
    householdIds: arrayUnion(householdId),
    activeHouseholdId: householdId,
    updatedAt: Date.now()
  });

  return newHousehold;
}

/**
 * LẤY THÔNG TIN HỘ GIA ĐÌNH THEO ID
 */
export async function getHousehold(householdId: string): Promise<Household | null> {
  if (!db) throw new Error('Firestore chưa được khởi tạo');

  const householdRef = doc(db, 'households', householdId);
  const snap = await getDoc(householdRef);

  if (!snap.exists()) {
    return null;
  }

  return snap.data() as Household;
}

/**
 * LẤY TẤT CẢ CÁC TỔ ẤM MÀ NGƯỜI DÙNG THUỘC VỀ
 */
export async function getUserHouseholds(householdIds: string[]): Promise<Household[]> {
  if (!db || !householdIds || householdIds.length === 0) return [];
  const results: Household[] = [];
  for (const id of householdIds) {
    if (!id) continue;
    try {
      const h = await getHousehold(id);
      if (h) results.push(h);
    } catch (err) {
      console.warn(`Không thể tải thông tin tổ ấm ${id}:`, err);
    }
  }
  return results;
}

/**
 * THÊM GIAO DỊCH NGUYÊN TỬ (ATOMIC TRANSACTION)
 * Cập nhật đồng thời bản ghi giao dịch và bảng tổng hợp tháng theo DATABASE_DESIGN.md
 */
export async function addTransactionWithSummary(
  householdId: string,
  txData: Omit<Transaction, 'id' | 'createdAt' | 'timestamp'>
): Promise<string> {
  if (!db) throw new Error('Firestore chưa được khởi tạo');

  const yearMonth = txData.date.substring(0, 7); // "YYYY-MM"
  const summaryRef = doc(db, `households/${householdId}/monthly_summaries/${yearMonth}`);
  const txCol = collection(db, `households/${householdId}/transactions`);
  const newTxRef = doc(txCol);

  const timestamp = Date.now();
  const createdAt = new Date().toISOString();

  await runTransaction(db, async (transaction) => {
    // 1. Ghi bản ghi giao dịch
    transaction.set(newTxRef, {
      ...txData,
      id: newTxRef.id,
      timestamp,
      createdAt
    });

    // 2. Cập nhật cộng dồn số liệu tháng nguyên tử
    const isExpense = txData.type === 'EXPENSE';
    const amount = txData.amount;

    transaction.set(summaryRef, {
      yearMonth,
      totalExpense: isExpense ? increment(amount) : increment(0),
      totalIncome: !isExpense ? increment(amount) : increment(0),
      [`byCategory.${txData.categoryId}`]: isExpense ? increment(amount) : increment(0),
      [`byMember.${txData.paidBy}`]: isExpense ? increment(amount) : increment(0),
      transactionCount: increment(1),
      updatedAt: Date.now()
    }, { merge: true });
  });

  return newTxRef.id;
}

/**
 * XÓA GIAO DỊCH NGUYÊN TỬ (Giảm trừ số liệu tổng hợp tháng)
 */
export async function deleteTransactionWithSummary(
  householdId: string,
  tx: Transaction
): Promise<void> {
  if (!db) throw new Error('Firestore chưa được khởi tạo');

  const yearMonth = tx.date.substring(0, 7);
  const summaryRef = doc(db, `households/${householdId}/monthly_summaries/${yearMonth}`);
  const txRef = doc(db, `households/${householdId}/transactions/${tx.id}`);

  await runTransaction(db, async (transaction) => {
    transaction.delete(txRef);

    const isExpense = tx.type === 'EXPENSE';
    const amount = tx.amount;

    transaction.set(summaryRef, {
      yearMonth,
      totalExpense: isExpense ? increment(-amount) : increment(0),
      totalIncome: !isExpense ? increment(-amount) : increment(0),
      [`byCategory.${tx.categoryId}`]: isExpense ? increment(-amount) : increment(0),
      [`byMember.${tx.paidBy}`]: isExpense ? increment(-amount) : increment(0),
      transactionCount: increment(-1),
      updatedAt: Date.now()
    }, { merge: true });
  });
}

/**
 * CẬP NHẬT GIAO DỊCH NGUYÊN TỬ (Điều chỉnh số liệu tổng hợp tháng)
 */
export async function updateTransactionWithSummary(
  householdId: string,
  oldTx: Transaction,
  updatedTx: Transaction
): Promise<void> {
  if (!db) throw new Error('Firestore chưa được khởi tạo');
  const firestore = db;

  const oldYearMonth = oldTx.date.substring(0, 7);
  const newYearMonth = updatedTx.date.substring(0, 7);
  const txRef = doc(firestore, `households/${householdId}/transactions/${oldTx.id}`);

  const oldIsExpense = oldTx.type === 'EXPENSE';
  const newIsExpense = updatedTx.type === 'EXPENSE';

  await runTransaction(firestore, async (transaction) => {
    // 1. Cập nhật bản ghi giao dịch
    transaction.set(txRef, {
      ...updatedTx,
      updatedAt: Date.now()
    }, { merge: true });

    // 2. Điều chỉnh số liệu tháng
    if (oldYearMonth === newYearMonth) {
      // Trường hợp cùng tháng: tính chênh lệch trực tiếp
      const summaryRef = doc(firestore, `households/${householdId}/monthly_summaries/${newYearMonth}`);
      const updates: Record<string, any> = {
        yearMonth: newYearMonth,
        updatedAt: Date.now()
      };

      // Khoản chi cũ & mới
      const oldExpenseAmount = oldIsExpense ? oldTx.amount : 0;
      const newExpenseAmount = newIsExpense ? updatedTx.amount : 0;
      const expenseDelta = newExpenseAmount - oldExpenseAmount;
      if (expenseDelta !== 0) {
        updates.totalExpense = increment(expenseDelta);
      }

      // Khoản thu cũ & mới
      const oldIncomeAmount = !oldIsExpense ? oldTx.amount : 0;
      const newIncomeAmount = !newIsExpense ? updatedTx.amount : 0;
      const incomeDelta = newIncomeAmount - oldIncomeAmount;
      if (incomeDelta !== 0) {
        updates.totalIncome = increment(incomeDelta);
      }

      // Theo danh mục (chỉ tính với EXPENSE)
      if (oldIsExpense && newIsExpense) {
        if (oldTx.categoryId === updatedTx.categoryId) {
          if (expenseDelta !== 0) {
            updates[`byCategory.${updatedTx.categoryId}`] = increment(expenseDelta);
          }
        } else {
          updates[`byCategory.${oldTx.categoryId}`] = increment(-oldTx.amount);
          updates[`byCategory.${updatedTx.categoryId}`] = increment(updatedTx.amount);
        }
      } else if (oldIsExpense && !newIsExpense) {
        // Đổi từ chi tiêu sang thu nhập
        updates[`byCategory.${oldTx.categoryId}`] = increment(-oldTx.amount);
      } else if (!oldIsExpense && newIsExpense) {
        // Đổi từ thu nhập sang chi tiêu
        updates[`byCategory.${updatedTx.categoryId}`] = increment(updatedTx.amount);
      }

      // Theo thành viên (chỉ tính với EXPENSE)
      if (oldIsExpense && newIsExpense) {
        if (oldTx.paidBy === updatedTx.paidBy) {
          if (expenseDelta !== 0) {
            updates[`byMember.${updatedTx.paidBy}`] = increment(expenseDelta);
          }
        } else {
          updates[`byMember.${oldTx.paidBy}`] = increment(-oldTx.amount);
          updates[`byMember.${updatedTx.paidBy}`] = increment(updatedTx.amount);
        }
      } else if (oldIsExpense && !newIsExpense) {
        updates[`byMember.${oldTx.paidBy}`] = increment(-oldTx.amount);
      } else if (!oldIsExpense && newIsExpense) {
        updates[`byMember.${updatedTx.paidBy}`] = increment(updatedTx.amount);
      }

      transaction.set(summaryRef, updates, { merge: true });
    } else {
      // Trường hợp khác tháng: trừ khỏi tháng cũ và cộng vào tháng mới
      const oldSummaryRef = doc(firestore, `households/${householdId}/monthly_summaries/${oldYearMonth}`);
      const newSummaryRef = doc(firestore, `households/${householdId}/monthly_summaries/${newYearMonth}`);

      // Giảm trừ tháng cũ
      transaction.set(oldSummaryRef, {
        yearMonth: oldYearMonth,
        totalExpense: oldIsExpense ? increment(-oldTx.amount) : increment(0),
        totalIncome: !oldIsExpense ? increment(-oldTx.amount) : increment(0),
        [`byCategory.${oldTx.categoryId}`]: oldIsExpense ? increment(-oldTx.amount) : increment(0),
        [`byMember.${oldTx.paidBy}`]: oldIsExpense ? increment(-oldTx.amount) : increment(0),
        transactionCount: increment(-1),
        updatedAt: Date.now()
      }, { merge: true });

      // Cộng vào tháng mới
      transaction.set(newSummaryRef, {
        yearMonth: newYearMonth,
        totalExpense: newIsExpense ? increment(updatedTx.amount) : increment(0),
        totalIncome: !newIsExpense ? increment(updatedTx.amount) : increment(0),
        [`byCategory.${updatedTx.categoryId}`]: newIsExpense ? increment(updatedTx.amount) : increment(0),
        [`byMember.${updatedTx.paidBy}`]: newIsExpense ? increment(updatedTx.amount) : increment(0),
        transactionCount: increment(1),
        updatedAt: Date.now()
      }, { merge: true });
    }
  });
}

/**
 * LẮNG NGHE REALTIME DANH MỤC CỦA TỔ ẤM
 */
export function subscribeCategories(
  householdId: string,
  onData: (categories: Category[]) => void
): Unsubscribe {
  if (!db) return () => {};

  const q = query(
    collection(db, `households/${householdId}/categories`),
    orderBy('order', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const list: Category[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as Category);
    });
    onData(list);
  }, (err) => {
    console.warn('Lỗi subscribeCategories:', err);
  });
}

/**
 * LƯU DANH MỤC MỚI VÀO TỔ ẤM
 */
export async function saveCategory(
  householdId: string,
  category: Category
): Promise<void> {
  if (!db) throw new Error('Firestore chưa được khởi tạo');

  const catRef = doc(db, `households/${householdId}/categories/${category.id}`);
  await setDoc(catRef, category);
}

/**
 * CẬP NHẬT THÔNG TIN DANH MỤC (Tên, màu sắc, hạn mức...)
 */
export async function updateCategory(
  householdId: string,
  categoryId: string,
  updates: Partial<Category>
): Promise<void> {
  if (!db) throw new Error('Firestore chưa được khởi tạo');

  const catRef = doc(db, `households/${householdId}/categories/${categoryId}`);
  await updateDoc(catRef, {
    ...updates,
    updatedAt: Date.now()
  });
}

/**
 * ẨN / LƯU TRỮ DANH MỤC (Soft Delete để bảo vệ lịch sử)
 */
export async function archiveCategory(
  householdId: string,
  categoryId: string
): Promise<void> {
  if (!db) throw new Error('Firestore chưa được khởi tạo');

  const catRef = doc(db, `households/${householdId}/categories/${categoryId}`);
  await updateDoc(catRef, {
    isArchived: true,
    updatedAt: Date.now()
  });
}

/**
 * KHÔI PHỤC DANH MỤC ĐÃ ẨN
 */
export async function unarchiveCategory(
  householdId: string,
  categoryId: string
): Promise<void> {
  if (!db) throw new Error('Firestore chưa được khởi tạo');

  const catRef = doc(db, `households/${householdId}/categories/${categoryId}`);
  await updateDoc(catRef, {
    isArchived: false,
    updatedAt: Date.now()
  });
}

/**
 * XÓA VĨNH VIỄN DANH MỤC (Hard Delete - áp dụng khi danh mục chưa phát sinh giao dịch)
 */
export async function deleteCategoryPermanently(
  householdId: string,
  categoryId: string
): Promise<void> {
  if (!db) throw new Error('Firestore chưa được khởi tạo');

  const catRef = doc(db, `households/${householdId}/categories/${categoryId}`);
  await deleteDoc(catRef);
}

/**
 * LẮNG NGHE REALTIME GIAO DỊCH THEO THÁNG
 */
export function subscribeTransactions(
  householdId: string,
  yearMonth: string,
  onData: (transactions: Transaction[]) => void
): Unsubscribe {
  if (!db) return () => {};

  const startDate = `${yearMonth}-01`;
  const endDate = `${yearMonth}-31`;

  const q = query(
    collection(db, `households/${householdId}/transactions`),
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    orderBy('date', 'desc'),
    orderBy('timestamp', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const list: Transaction[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as Transaction);
    });
    onData(list);
  }, (err) => {
    console.warn('Lỗi subscribeTransactions:', err);
  });
}

/**
 * LẮNG NGHE REALTIME TỔNG KẾT THÁNG
 */
export function subscribeMonthlySummary(
  householdId: string,
  yearMonth: string,
  onData: (summary: MonthlySummary | null) => void
): Unsubscribe {
  if (!db) return () => {};

  const summaryRef = doc(db, `households/${householdId}/monthly_summaries/${yearMonth}`);
  return onSnapshot(summaryRef, (snap) => {
    if (snap.exists()) {
      onData(snap.data() as MonthlySummary);
    } else {
      onData(null);
    }
  }, (err) => {
    console.warn('Lỗi subscribeMonthlySummary:', err);
  });
}

/**
 * TẠO MÃ MỜI THÀNH VIÊN (Có hạn 48 giờ)
 */
export async function createInvitation(
  householdId: string,
  householdName: string,
  user: UserProfile,
  role: 'MEMBER' | 'ADMIN' = 'MEMBER'
): Promise<string> {
  if (!db) throw new Error('Firestore chưa được khởi tạo');

  // Kiểm tra số lượng thành viên hiện tại của tổ ấm (tối đa 2 người: Vợ & Chồng)
  const householdSnap = await getDoc(doc(db, 'households', householdId));
  if (householdSnap.exists()) {
    const data = householdSnap.data() as Household;
    if (data.members && data.members.length >= 2) {
      throw new Error('Tổ ấm đã đủ 2 thành viên đồng hành (Vợ & Chồng), không thể tạo thêm mã mời.');
    }
  }

  // Sinh mã ngắn ngẫu nhiên 6 ký tự (Ví dụ: TOAM-8868)
  const randNum = Math.floor(1000 + Math.random() * 9000);
  const inviteCode = `TOAM-${randNum}`;
  const expiresAt = Date.now() + 48 * 60 * 60 * 1000; // 48 giờ

  const inviteDoc: Invitation = {
    inviteCode,
    householdId,
    householdName,
    createdBy: user.uid,
    createdByName: user.displayName || 'Người trong nhà',
    role,
    expiresAt,
    usedBy: null,
    usedByEmail: null,
    status: 'PENDING',
    createdAt: new Date().toISOString()
  };

  await setDoc(doc(db, 'invitations', inviteCode), inviteDoc);
  return inviteCode;
}

/**
 * ĐỌC THÔNG TIN MÃ MỜI (Dành cho người nhận xem trước thông tin tổ ấm và người mời)
 */
export async function getInvitation(inviteCode: string): Promise<Invitation | null> {
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, 'invitations', inviteCode));
    if (!snap.exists()) return null;
    return snap.data() as Invitation;
  } catch (err) {
    console.error('Lỗi khi đọc thông tin mã mời:', err);
    return null;
  }
}

/**
 * CHẤP NHẬN MÃ MỜI GIA NHẬP TỔ ẤM (Atomic Transaction)
 */
export async function acceptInvitation(
  inviteCode: string,
  user: UserProfile
): Promise<string> {
  if (!db) throw new Error('Firestore chưa được khởi tạo');
  const firestore = db;

  const inviteRef = doc(firestore, 'invitations', inviteCode);

  return await runTransaction(firestore, async (transaction) => {
    const inviteSnap = await transaction.get(inviteRef);
    if (!inviteSnap.exists()) throw new Error('Mã mời không tồn tại hoặc đã bị xóa');

    const invite = inviteSnap.data() as Invitation;
    if (invite.status !== 'PENDING' || invite.expiresAt < Date.now()) {
      throw new Error('Mã mời đã hết hạn hoặc đã được sử dụng');
    }

    if (invite.createdBy === user.uid) {
      throw new Error('Đây là mã mời do chính bạn tạo ra. Hãy gửi liên kết này cho bạn đời của bạn nhé!');
    }

    const householdRef = doc(firestore, 'households', invite.householdId);
    const userRef = doc(firestore, 'users', user.uid);

    // 1. Đổi trạng thái mã mời
    transaction.update(inviteRef, {
      status: 'ACCEPTED',
      usedBy: user.uid,
      usedByEmail: user.email
    });

    // 2. Thêm người dùng vào danh sách thành viên hộ gia đình
    const householdUpdates: Record<string, any> = {
      members: arrayUnion(user.uid),
      [`memberNames.${user.uid}`]: user.displayName || 'Vợ/Chồng',
      [`memberEmails.${user.uid}`]: user.email,
      updatedAt: Date.now()
    };
    if (user.photoURL) {
      householdUpdates[`memberPhotos.${user.uid}`] = user.photoURL;
    }
    if (user.role) {
      householdUpdates[`memberRoles.${user.uid}`] = user.role;
    }
    transaction.update(householdRef, householdUpdates);

    // 3. Cập nhật hồ sơ người dùng
    transaction.set(userRef, {
      householdIds: arrayUnion(invite.householdId),
      activeHouseholdId: invite.householdId,
      updatedAt: Date.now()
    }, { merge: true });

    return invite.householdId;
  });
}

/**
 * THIẾT LẬP VAI TRÒ THÀNH VIÊN TRONG TỔ ẤM ("Chồng" hoặc "Vợ")
 */
export async function setMemberRole(
  householdId: string,
  uid: string,
  role: 'Chồng' | 'Vợ'
): Promise<void> {
  if (!db) throw new Error('Firestore chưa được khởi tạo');

  const householdRef = doc(db, 'households', householdId);
  const userRef = doc(db, 'users', uid);

  await updateDoc(householdRef, {
    [`memberRoles.${uid}`]: role,
    updatedAt: Date.now()
  });

  await updateDoc(userRef, {
    role,
    updatedAt: Date.now()
  }).catch((e) => console.warn('Lỗi lưu role user:', e));
}

/**
 * ĐỒNG BỘ AVATAR CỦA THÀNH VIÊN VÀO TỔ ẤM
 */
export async function syncMemberPhoto(
  householdId: string,
  uid: string,
  photoURL: string
): Promise<void> {
  if (!db || !photoURL) return;

  const householdRef = doc(db, 'households', householdId);
  await updateDoc(householdRef, {
    [`memberPhotos.${uid}`]: photoURL,
    updatedAt: Date.now()
  }).catch((e) => console.warn('Lỗi đồng bộ avatar tổ ấm:', e));
}

/**
 * CẬP NHẬT HOẶC ĐỒNG BỘ EMAIL THÀNH VIÊN VÀO TỔ ẤM
 */
export async function updateMemberEmail(
  householdId: string,
  uid: string,
  email: string
): Promise<void> {
  if (!db || !householdId || !uid) return;

  const householdRef = doc(db, 'households', householdId);
  await updateDoc(householdRef, {
    [`memberEmails.${uid}`]: email.trim().toLowerCase(),
    updatedAt: Date.now()
  }).catch((e) => console.warn('Lỗi cập nhật email thành viên tổ ấm:', e));
}
