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
 * LẮNG NGHE REALTIME DANH MỤC CỦA TỔ ẤM
 */
export function subscribeCategories(
  householdId: string,
  onData: (categories: Category[]) => void
): Unsubscribe {
  if (!db) return () => {};

  const q = query(
    collection(db, `households/${householdId}/categories`),
    where('isArchived', '==', false),
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
    if (!inviteSnap.exists()) throw new Error('Mã mời không tồn tại');

    const invite = inviteSnap.data() as Invitation;
    if (invite.status !== 'PENDING' || invite.expiresAt < Date.now()) {
      throw new Error('Mã mời đã hết hạn hoặc đã được sử dụng');
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
    transaction.update(householdRef, {
      members: arrayUnion(user.uid),
      [`memberNames.${user.uid}`]: user.displayName || 'Vợ/Chồng',
      [`memberEmails.${user.uid}`]: user.email,
      updatedAt: Date.now()
    });

    // 3. Cập nhật hồ sơ người dùng
    transaction.set(userRef, {
      householdIds: arrayUnion(invite.householdId),
      activeHouseholdId: invite.householdId,
      updatedAt: Date.now()
    }, { merge: true });

    return invite.householdId;
  });
}
