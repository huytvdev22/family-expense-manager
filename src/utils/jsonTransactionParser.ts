import type { Category, CategoryKey } from '../types';
import { getLocalDateString } from './currency';

export interface ParsedTransactionItem {
  id: string; // Tạm thời dùng cho danh sách review
  selected: boolean;
  amount: number;
  type: 'EXPENSE' | 'INCOME';
  categoryId: string;
  categoryName: string;
  categoryKey: CategoryKey;
  paidBy: string;
  date: string; // "YYYY-MM-DD"
  note: string;
}

export interface ParsedPendingItem {
  id: string;
  selected: boolean;
  name: string;
  amount: number;
  dueDate: string; // "YYYY-MM-DD" hoặc ""
  categoryId: string;
  categoryName: string;
  categoryKey: CategoryKey;
  note: string;
  assignedTo: string;
}

export interface ParseResult<T> {
  success: boolean;
  items: T[];
  error?: string;
  rawCount?: number;
}

/**
 * Trích xuất chuỗi JSON từ văn bản (ưu tiên bóc tách codeblock markdown ```json ... ```)
 */
export function extractJsonFromText(rawText: string): string {
  if (!rawText) return '';
  const trimmed = rawText.trim();

  // 1. Tìm kiếm codeblock ```json ... ``` hoặc ``` ... ```
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    return codeBlockMatch[1].trim();
  }

  // 2. Tìm mảng JSON bắt đầu bằng '[' và kết thúc bằng ']'
  const firstBracket = trimmed.indexOf('[');
  const lastBracket = trimmed.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    return trimmed.substring(firstBracket, lastBracket + 1).trim();
  }

  // 3. Tìm object JSON đơn bắt đầu bằng '{' và kết thúc bằng '}'
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.substring(firstBrace, lastBrace + 1).trim();
  }

  return trimmed;
}

/**
 * Chuẩn hóa chuỗi ngày bất kỳ về YYYY-MM-DD
 */
export function normalizeDateString(dateRaw?: string): string {
  if (!dateRaw || typeof dateRaw !== 'string') {
    return getLocalDateString();
  }
  const clean = dateRaw.trim();

  // Khớp YYYY-MM-DD hoặc YYYY/MM/DD
  const ymdMatch = clean.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (ymdMatch) {
    const [, y, m, d] = ymdMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Khớp DD/MM/YYYY hoặc DD-MM-YYYY
  const dmyMatch = clean.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Khớp DD/MM (không có năm -> lấy năm hiện tại)
  const dmMatch = clean.match(/^(\d{1,2})[-/.](\d{1,2})$/);
  if (dmMatch) {
    const [, d, m] = dmMatch;
    const currentYear = new Date().getFullYear();
    return `${currentYear}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  return getLocalDateString();
}

/**
 * Chuẩn hóa số tiền (chuyển chuỗi hoặc số âm thành số nguyên dương)
 */
export function normalizeAmount(amountRaw: unknown): number {
  if (typeof amountRaw === 'number') {
    return Math.abs(Math.round(amountRaw)) || 0;
  }
  if (typeof amountRaw === 'string') {
    // Loại bỏ dấu chấm, phẩy, đ, vnd, dấu cách
    const clean = amountRaw.replace(/[.,\sđVNDvnd+-]/g, '');
    const num = Number(clean);
    return isNaN(num) ? 0 : Math.abs(Math.round(num));
  }
  return 0;
}

/**
 * Tự động tìm kiếm và khớp Danh mục phù hợp trong tổ ấm
 */
export function findMatchingCategory(
  categoryNameOrKeyword: string | undefined,
  type: 'EXPENSE' | 'INCOME',
  categories: Category[]
): Category {
  const pool = categories.filter((c) => c.type === type && !c.isArchived);
  if (pool.length === 0) {
    // Fallback danh mục bất kỳ
    return categories[0] || {
      id: 'cat_other',
      name: 'Khác',
      type,
      categoryKey: 'OTHER' as CategoryKey,
      icon: 'more-horizontal',
      color: '#78716C',
      order: 99,
      isDefault: true,
      isArchived: false,
      createdAt: ''
    };
  }

  if (!categoryNameOrKeyword || typeof categoryNameOrKeyword !== 'string') {
    // Lấy danh mục mặc định hoặc đầu tiên
    return pool.find((c) => c.name.toLowerCase().includes('khác')) || pool[0];
  }

  const cleanKeyword = categoryNameOrKeyword.trim().toLowerCase();

  // 1. Khớp chính xác tên
  const exactMatch = pool.find((c) => c.name.toLowerCase() === cleanKeyword);
  if (exactMatch) return exactMatch;

  // 2. Khớp chuỗi con (includes)
  const includesMatch = pool.find(
    (c) => c.name.toLowerCase().includes(cleanKeyword) || cleanKeyword.includes(c.name.toLowerCase())
  );
  if (includesMatch) return includesMatch;

  // 3. Khớp một số từ khóa phổ biến trong tiếng Việt
  const keywordMappings: Record<string, string[]> = {
    'ăn uống': ['cơm', 'phở', 'bún', 'cà phê', 'cafe', 'ăn sáng', 'ăn trưa', 'ăn tối', 'nhậu', 'trà sữa', 'bánh'],
    'đi chợ': ['siêu thị', 'chợ', 'thịt', 'rau', 'cá', 'trái cây', 'winmart', 'coopmart', 'bách hóa xanh'],
    'điện nước': ['tiền điện', 'evn', 'tiền nước', 'internet', 'wifi', 'viettel', 'fpt', 'vnpt', 'rác'],
    'di chuyển': ['xăng', 'grab', 'be', 'taxi', 'gửi xe', 'bảo dưỡng xe', 'rửa xe', 'vé xe'],
    'mua sắm': ['shopee', 'lazada', 'tiki', 'quần áo', 'giày dép', 'mỹ phẩm', 'đồ dùng'],
    'nhà cửa': ['tiền nhà', 'thuê nhà', 'sửa nhà', 'chung cư', 'dịch vụ tòa nhà'],
    'lương': ['lương', 'salary', 'thu nhập', 'lương t', 'thù lao', 'tạm ứng']
  };

  for (const [catSubStr, keywords] of Object.entries(keywordMappings)) {
    if (keywords.some((kw) => cleanKeyword.includes(kw))) {
      const mapped = pool.find((c) => c.name.toLowerCase().includes(catSubStr));
      if (mapped) return mapped;
    }
  }

  // 4. Fallback danh mục "Khác" hoặc danh mục đầu tiên
  return pool.find((c) => c.name.toLowerCase().includes('khác')) || pool[0];
}

/**
 * Phân tích chuỗi JSON AI thành danh sách giao dịch Sổ cái
 */
export function parseAITransactionsJson(
  rawInput: string,
  categories: Category[],
  defaultRole: 'Chồng' | 'Vợ' = 'Chồng'
): ParseResult<ParsedTransactionItem> {
  const cleanJson = extractJsonFromText(rawInput);
  if (!cleanJson) {
    return {
      success: false,
      items: [],
      error: 'Vui lòng dán dữ liệu JSON vào ô nhập liệu.'
    };
  }

  let parsedData: unknown;
  try {
    parsedData = JSON.parse(cleanJson);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      items: [],
      error: `Cú pháp JSON không hợp lệ: ${errorMsg}. Bạn hãy kiểm tra đã copy đầy đủ dấu ngoặc [ ... ] từ AI chưa nhé!`
    };
  }

  const rawArray = Array.isArray(parsedData) ? parsedData : [parsedData];
  if (rawArray.length === 0) {
    return {
      success: false,
      items: [],
      error: 'Dữ liệu JSON là mảng rỗng, không tìm thấy giao dịch nào.'
    };
  }

  const validItems: ParsedTransactionItem[] = [];

  rawArray.forEach((item: Record<string, unknown>, index) => {
    if (!item || typeof item !== 'object') return;

    // Xác định loại (EXPENSE / INCOME)
    let type: 'EXPENSE' | 'INCOME' = 'EXPENSE';
    const rawType = String(item.type || item.loai || '').toUpperCase();
    if (rawType.includes('INCOME') || rawType.includes('THU') || String(item.amount).startsWith('+')) {
      type = 'INCOME';
    }

    const amount = normalizeAmount(item.amount || item.soTien || item.tien);
    if (amount <= 0) return; // Bỏ qua giao dịch 0đ

    const date = normalizeDateString(String(item.date || item.ngay || ''));
    const note = String(item.note || item.ghiChu || item.noiDung || item.category || '').trim();

    // Xác định người chi / nhận
    const rawPaidBy = String(item.paidBy || item.nguoiChi || item.nguoiNhan || '').trim();
    let paidBy = defaultRole;
    if (rawPaidBy.toLowerCase().includes('vợ') || rawPaidBy.toLowerCase().includes('vo')) {
      paidBy = 'Vợ';
    } else if (rawPaidBy.toLowerCase().includes('chồng') || rawPaidBy.toLowerCase().includes('chong')) {
      paidBy = 'Chồng';
    }

    // Map danh mục
    const rawCatName = String(item.category || item.danhMuc || item.phanLoai || note || '');
    const matchedCategory = findMatchingCategory(rawCatName, type, categories);

    validItems.push({
      id: `ai_tx_${Date.now()}_${index}`,
      selected: true,
      amount,
      type,
      categoryId: matchedCategory.id,
      categoryName: matchedCategory.name,
      categoryKey: matchedCategory.categoryKey || 'OTHER',
      paidBy,
      date,
      note
    });
  });

  if (validItems.length === 0) {
    return {
      success: false,
      items: [],
      error: 'Không trích xuất được giao dịch hợp lệ nào có số tiền lớn hơn 0đ. Vui lòng kiểm tra lại cấu trúc dữ liệu JSON.'
    };
  }

  return {
    success: true,
    items: validItems,
    rawCount: rawArray.length
  };
}

/**
 * Phân tích chuỗi JSON AI thành danh sách Khoản chờ thanh toán (Pending Expenses)
 */
export function parseAIPendingExpensesJson(
  rawInput: string,
  categories: Category[],
  defaultRole: 'Chồng' | 'Vợ' = 'Chồng'
): ParseResult<ParsedPendingItem> {
  const cleanJson = extractJsonFromText(rawInput);
  if (!cleanJson) {
    return {
      success: false,
      items: [],
      error: 'Vui lòng dán dữ liệu JSON vào ô nhập liệu.'
    };
  }

  let parsedData: unknown;
  try {
    parsedData = JSON.parse(cleanJson);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      items: [],
      error: `Cú pháp JSON không hợp lệ: ${errorMsg}. Vui lòng kiểm tra lại cấu trúc JSON!`
    };
  }

  const rawArray = Array.isArray(parsedData) ? parsedData : [parsedData];
  if (rawArray.length === 0) {
    return {
      success: false,
      items: [],
      error: 'Dữ liệu JSON là mảng rỗng, không tìm thấy khoản chờ nào.'
    };
  }

  const validItems: ParsedPendingItem[] = [];

  rawArray.forEach((item: Record<string, unknown>, index) => {
    if (!item || typeof item !== 'object') return;

    const amount = normalizeAmount(item.amount || item.soTien || item.tien);
    if (amount <= 0) return;

    const name = String(item.title || item.name || item.ten || item.note || item.category || 'Khoản chi dự kiến').trim();
    const dueDateRaw = String(item.dueDate || item.hanThanhToan || item.ngay || '');
    const dueDate = dueDateRaw ? normalizeDateString(dueDateRaw) : '';
    const note = String(item.note || item.ghiChu || item.noiDung || '').trim();

    const rawAssignedTo = String(item.assignedTo || item.paidBy || item.nguoiChi || '').trim();
    let assignedTo = defaultRole;
    if (rawAssignedTo.toLowerCase().includes('vợ') || rawAssignedTo.toLowerCase().includes('vo')) {
      assignedTo = 'Vợ';
    } else if (rawAssignedTo.toLowerCase().includes('chồng') || rawAssignedTo.toLowerCase().includes('chong')) {
      assignedTo = 'Chồng';
    }

    const rawCatName = String(item.category || item.danhMuc || name);
    const matchedCategory = findMatchingCategory(rawCatName, 'EXPENSE', categories);

    validItems.push({
      id: `ai_pending_${Date.now()}_${index}`,
      selected: true,
      name,
      amount,
      dueDate,
      categoryId: matchedCategory.id,
      categoryName: matchedCategory.name,
      categoryKey: matchedCategory.categoryKey || 'OTHER',
      note,
      assignedTo
    });
  });

  if (validItems.length === 0) {
    return {
      success: false,
      items: [],
      error: 'Không trích xuất được khoản chờ thanh toán hợp lệ nào có số tiền lớn hơn 0đ.'
    };
  }

  return {
    success: true,
    items: validItems,
    rawCount: rawArray.length
  };
}

