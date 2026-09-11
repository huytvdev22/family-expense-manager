/**
 * TIỆN ÍCH ĐỊNH DẠNG TIỀN TỆ & THỜI GIAN
 * Đảm bảo các con số luôn hiển thị thẳng hàng (Tabular Numerics)
 */
import type { CreditCard, Transaction } from '../types';

export function formatVND(amount: number, showSymbol = true): string {
  if (isNaN(amount)) return showSymbol ? '0 ₫' : '0';
  
  const formatted = new Intl.NumberFormat('vi-VN').format(Math.round(amount));
  return showSymbol ? `${formatted} ₫` : formatted;
}

export function formatCompactVND(amount: number): string {
  if (isNaN(amount) || amount === 0) return '0 ₫';

  const sign = amount < 0 ? '-' : '';
  const abs = Math.abs(amount);

  if (abs >= 1_000_000_000) {
    const val = (abs / 1_000_000_000).toFixed(1).replace('.0', '').replace('.', ',');
    return `${sign}${val} tỷ`;
  }
  if (abs >= 1_000_000) {
    const val = (abs / 1_000_000).toFixed(1).replace('.0', '').replace('.', ',');
    return `${sign}${val} tr`;
  }
  if (abs >= 1_000) {
    return `${sign}${Math.round(abs / 1_000)} k`;
  }
  return `${sign}${abs} ₫`;
}

/**
 * Lấy chuỗi ngày YYYY-MM-DD theo giờ địa phương của thiết bị.
 * Tránh triệt để lỗi múi giờ UTC (khi ở GMT+7 lúc 00:00 - 06:59 sáng, UTC vẫn thuộc về ngày hôm trước).
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Lấy chuỗi tháng YYYY-MM theo giờ địa phương của thiết bị.
 */
export function getLocalYearMonthString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function getCurrentYearMonth(): string {
  return getLocalYearMonthString(new Date());
}

export function formatYearMonthLabel(yearMonth?: string): string {
  if (!yearMonth || typeof yearMonth !== 'string') {
    const now = new Date();
    return `Tháng ${now.getMonth() + 1}/${now.getFullYear()}`;
  }
  const parts = yearMonth.split('-');
  if (parts.length < 2) return `Tháng ${yearMonth}`;
  return `Tháng ${parts[1]}/${parts[0]}`;
}

export function formatDateLabel(dateString: string): string {
  if (!dateString) return '';
  const todayStr = getLocalDateString(new Date());

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterday);

  if (dateString === todayStr) {
    return 'Hôm nay';
  }
  if (dateString === yesterdayStr) {
    return 'Hôm qua';
  }

  const parts = dateString.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d}/${m}/${y}`;
  }
  return dateString;
}

/**
 * Định dạng chuỗi ngày YYYY-MM-DD thành DD/MM/YYYY chuẩn tiếng Việt
 */
export function formatDisplayDate(dateString: string): string {
  if (!dateString) return '';
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d}/${m}/${y}`;
  }
  return dateString;
}

/**
 * Tính số ngày chênh lệch giữa ngày đến hạn và hôm nay.
 * Trả về số âm nếu đã quá hạn, 0 nếu là hôm nay, số dương nếu trong tương lai.
 */
export function getDaysDiffFromToday(targetDateStr: string): number {
  if (!targetDateStr) return 0;
  const todayStr = getLocalDateString();
  const [tY, tM, tD] = todayStr.split('-').map(Number);
  const [targetY, targetM, targetD] = targetDateStr.split('-').map(Number);

  const today = new Date(tY, tM - 1, tD);
  const target = new Date(targetY, targetM - 1, targetD);

  const diffMs = target.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Lấy nhãn thời hạn thanh toán trực quan kèm trạng thái cảnh báo
 */
export function formatDueDateBadge(dueDateStr: string): {
  label: string;
  status: 'OVERDUE' | 'DUE_SOON' | 'UPCOMING';
  daysDiff: number;
} {
  const diff = getDaysDiffFromToday(dueDateStr);

  if (diff < 0) {
    return {
      label: `Quá hạn ${Math.abs(diff)} ngày`,
      status: 'OVERDUE',
      daysDiff: diff
    };
  }
  if (diff === 0) {
    return {
      label: `Hạn hôm nay`,
      status: 'DUE_SOON',
      daysDiff: 0
    };
  }
  if (diff === 1) {
    return {
      label: `Hạn ngày mai`,
      status: 'DUE_SOON',
      daysDiff: 1
    };
  }
  return {
    label: `Còn ${diff} ngày`,
    status: diff <= 3 ? 'DUE_SOON' : 'UPCOMING',
    daysDiff: diff
  };
}

export interface CardBillingCycleInfo {
  // Kỳ sao kê gần nhất đã chốt (đang đến hạn thanh toán trong tháng)
  currentStatementDate: string; // "YYYY-MM-DD"
  currentDueDate: string; // "YYYY-MM-DD"
  // Kỳ sao kê tiếp theo đang tích lũy
  nextStatementDate: string; // "YYYY-MM-DD"
  nextDueDate: string; // "YYYY-MM-DD"
}

/**
 * Trích xuất nhãn tháng rút gọn từ chuỗi ngày (VD: "2026-08-28" -> "T8")
 */
export function formatTxMonth(dateString: string): string {
  if (!dateString || dateString.length < 7) return '';
  const month = parseInt(dateString.substring(5, 7), 10);
  return `T${month}`;
}

/**
 * Tính toán thông tin chu kỳ sao kê và hạn thanh toán cho thẻ tín dụng.
 * Hỗ trợ cả 2 chuẩn: Cố định ngày (FIXED_DAY) và Ân hạn sau sao kê (GRACE_PERIOD).
 */
export function getCardBillingCycleInfo(card: CreditCard, referenceDate: Date = new Date()): CardBillingCycleInfo {
  const refYear = referenceDate.getFullYear();
  const refMonth = referenceDate.getMonth(); // 0-indexed
  const refDay = referenceDate.getDate();

  const statementDay = card.statementDay || 20;

  // Xác định ngày chốt sao kê của tháng tham chiếu
  const maxDaysThisMonth = new Date(refYear, refMonth + 1, 0).getDate();
  const actualStatementDayThisMonth = Math.min(statementDay, maxDaysThisMonth);

  // Xác định kỳ sao kê gần nhất đã chốt:
  // Nếu ngày hiện tại <= ngày chốt sao kê tháng này: kỳ sao kê gần nhất vừa chốt là của THÁNG TRƯỚC
  // Nếu ngày hiện tại > ngày chốt sao kê tháng này: kỳ sao kê gần nhất vừa chốt là của THÁNG NÀY
  let pastStatementYear = refYear;
  let pastStatementMonth = refMonth;

  let upcomingStatementYear = refYear;
  let upcomingStatementMonth = refMonth;

  if (refDay <= actualStatementDayThisMonth) {
    // Chưa chốt sao kê tháng này -> Kỳ đã chốt là tháng trước
    pastStatementMonth = refMonth - 1;
    if (pastStatementMonth < 0) {
      pastStatementMonth = 11;
      pastStatementYear = refYear - 1;
    }
    // Kỳ tiếp theo là tháng này
    upcomingStatementMonth = refMonth;
    upcomingStatementYear = refYear;
  } else {
    // Đã chốt sao kê tháng này -> Kỳ đã chốt là tháng này
    pastStatementMonth = refMonth;
    pastStatementYear = refYear;
    // Kỳ tiếp theo là tháng sau
    upcomingStatementMonth = refMonth + 1;
    if (upcomingStatementMonth > 11) {
      upcomingStatementMonth = 0;
      upcomingStatementYear = refYear + 1;
    }
  }

  // Hàm tạo chuỗi YYYY-MM-DD
  const formatYMD = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // 1. Tạo Date cho kỳ sao kê đã chốt
  const maxDaysPast = new Date(pastStatementYear, pastStatementMonth + 1, 0).getDate();
  const pastStmtDate = new Date(pastStatementYear, pastStatementMonth, Math.min(statementDay, maxDaysPast));

  // 2. Tạo Date cho kỳ sao kê kế tiếp
  const maxDaysUpcoming = new Date(upcomingStatementYear, upcomingStatementMonth + 1, 0).getDate();
  const upcomingStmtDate = new Date(upcomingStatementYear, upcomingStatementMonth, Math.min(statementDay, maxDaysUpcoming));

  // Hàm tính hạn thanh toán từ ngày sao kê
  const calcDueDate = (stmtDate: Date): Date => {
    if (card.dueType === 'GRACE_PERIOD') {
      const graceDays = card.daysAfterStatement || (card.gracePeriodDays ? card.gracePeriodDays - 30 : 25);
      return new Date(stmtDate.getFullYear(), stmtDate.getMonth(), stmtDate.getDate() + graceDays);
    } else {
      // Cố định ngày trong tháng sau ngày sao kê
      const dueYear = stmtDate.getMonth() === 11 ? stmtDate.getFullYear() + 1 : stmtDate.getFullYear();
      const dueMonth = (stmtDate.getMonth() + 1) % 12;
      const maxDueDay = new Date(dueYear, dueMonth + 1, 0).getDate();
      const actualDueDay = Math.min(card.paymentDueDay || 5, maxDueDay);
      return new Date(dueYear, dueMonth, actualDueDay);
    }
  };

  const pastDueDate = calcDueDate(pastStmtDate);
  const upcomingDueDate = calcDueDate(upcomingStmtDate);

  return {
    currentStatementDate: formatYMD(pastStmtDate),
    currentDueDate: formatYMD(pastDueDate),
    nextStatementDate: formatYMD(upcomingStmtDate),
    nextDueDate: formatYMD(upcomingDueDate)
  };
}

/**
 * Phân loại một giao dịch quẹt thẻ tín dụng:
 * - 'STATEMENT': Thuộc kỳ sao kê đã chốt gần nhất (đang đến hạn thanh toán đợt này)
 * - 'NEXT_CYCLE': Thuộc kỳ sao kê kế tiếp (chưa chốt sao kê / đang tích lũy)
 */
export function classifyCardTransaction(
  tx: Transaction,
  cycleInfo: CardBillingCycleInfo
): 'STATEMENT' | 'NEXT_CYCLE' {
  const txDate = tx.date || '';
  if (txDate <= cycleInfo.currentStatementDate) {
    return 'STATEMENT';
  }
  return 'NEXT_CYCLE';
}

/**
 * Tự động tính ngày đến hạn thanh toán sao kê gần nhất cho thẻ tín dụng (YYYY-MM-DD)
 * Hỗ trợ nhận vào `CreditCard` object hoặc fallback nhận số `paymentDueDay` (number)
 */
export function calculateCardNextDueDate(cardOrDueDay: CreditCard | number, referenceDate: Date = new Date()): string {
  if (typeof cardOrDueDay === 'object' && cardOrDueDay !== null) {
    const cycleInfo = getCardBillingCycleInfo(cardOrDueDay, referenceDate);
    return cycleInfo.currentDueDate;
  }

  // Fallback dành cho code cũ gọi calculateCardNextDueDate(number)
  const paymentDueDay = typeof cardOrDueDay === 'number' ? cardOrDueDay : 5;
  const now = referenceDate;
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDay = now.getDate();

  let targetYear = currentYear;
  let targetMonth = currentMonth;

  if (currentDay > paymentDueDay) {
    targetMonth += 1;
    if (targetMonth > 11) {
      targetMonth = 0;
      targetYear += 1;
    }
  }

  const lastDayOfTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  const finalDay = Math.min(paymentDueDay, lastDayOfTargetMonth);

  const y = targetYear;
  const m = String(targetMonth + 1).padStart(2, '0');
  const d = String(finalDay).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
