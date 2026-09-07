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
