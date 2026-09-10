/**
 * TIỆN ÍCH ĐỊNH DẠNG TIỀN TỆ & THỜI GIAN
 * Đảm bảo các con số luôn hiển thị thẳng hàng (Tabular Numerics)
 */

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

/**
 * Tự động tính ngày đến hạn thanh toán sao kê gần nhất cho thẻ tín dụng (YYYY-MM-DD)
 * Dựa vào ngày đến hạn thanh toán hàng tháng (paymentDueDay).
 */
export function calculateCardNextDueDate(paymentDueDay: number): string {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed
  const currentDay = now.getDate();

  let targetYear = currentYear;
  let targetMonth = currentMonth;

  if (currentDay > paymentDueDay) {
    // Hạn tháng này đã qua, hạn tiếp theo rơi vào tháng sau
    targetMonth += 1;
    if (targetMonth > 11) {
      targetMonth = 0;
      targetYear += 1;
    }
  }

  // Xử lý tháng có ít ngày hơn paymentDueDay (vd tháng 2)
  const lastDayOfTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  const finalDay = Math.min(paymentDueDay, lastDayOfTargetMonth);

  const y = targetYear;
  const m = String(targetMonth + 1).padStart(2, '0');
  const d = String(finalDay).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
