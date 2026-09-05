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

export function getCurrentYearMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
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
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (dateString === todayStr) {
    return 'Hôm nay';
  }
  if (dateString === yesterdayStr) {
    return 'Hôm qua';
  }

  const [y, m, d] = dateString.split('-');
  return `${d}/${m}/${y}`;
}
