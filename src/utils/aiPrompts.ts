import type { Category } from '../types';

export type AIPromptPurpose = 'EXPENSE' | 'INCOME' | 'PENDING' | 'ALL';

export interface AIPromptPurposeOption {
  id: AIPromptPurpose;
  title: string;
  badge: string;
  description: string;
  colorClass: string;
}

export const AI_PROMPT_PURPOSES: AIPromptPurposeOption[] = [
  {
    id: 'EXPENSE',
    title: 'Khoản chi tiêu',
    badge: 'Chi tiêu',
    description: 'Trích xuất lịch sử trừ tiền ngân hàng, bill mua sắm, quẹt thẻ...',
    colorClass: 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]'
  },
  {
    id: 'INCOME',
    title: 'Khoản thu nhập',
    badge: 'Thu nhập',
    description: 'Trích xuất tiền lương, thưởng, tiền nhận chuyển khoản...',
    colorClass: 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]'
  },
  {
    id: 'PENDING',
    title: 'Khoản chờ thanh toán',
    badge: 'Hóa đơn chờ',
    description: 'Trích xuất tiền điện, nước, internet, học phí, tiền vay sắp tới...',
    colorClass: 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]'
  },
  {
    id: 'ALL',
    title: 'Tổng hợp cả Thu & Chi',
    badge: 'Cả Thu & Chi',
    description: 'Trích xuất sao kê ngân hàng có cả biến động tăng và giảm...',
    colorClass: 'bg-[#E7EFEF] text-[#0F3D39] border-[#0F3D39]/20'
  }
];

interface GeneratePromptParams {
  purpose: AIPromptPurpose;
  categories: Category[];
  memberNames?: string[];
  currentRole?: 'Chồng' | 'Vợ';
}

/**
 * Sinh Prompt chuẩn cho AI (ChatGPT, Gemini, Claude)
 * Tự động chèn danh sách danh mục thực tế của tổ ấm và vai trò thành viên
 */
export function generateAIPrompt({
  purpose,
  categories,
  memberNames = ['Chồng', 'Vợ'],
  currentRole = 'Chồng'
}: GeneratePromptParams): string {
  const currentYear = new Date().getFullYear();

  // Lọc danh mục theo mục đích
  const expenseCategories = categories
    .filter((c) => c.type === 'EXPENSE' && !c.isArchived)
    .map((c) => c.name);

  const incomeCategories = categories
    .filter((c) => c.type === 'INCOME' && !c.isArchived)
    .map((c) => c.name);

  const activeMembersStr = memberNames.join(' / ');

  if (purpose === 'EXPENSE') {
    const catListStr = expenseCategories.length > 0 
      ? expenseCategories.join(', ')
      : 'Ăn uống, Đi chợ, Điện nước, Mua sắm, Di chuyển & Xăng, Nhà cửa, Y tế, Khác';

    return `Hãy đọc ảnh chụp màn hình lịch sử giao dịch ngân hàng / hóa đơn / biên lai đính kèm và trích xuất TOÀN BỘ các khoản chi tiêu thành một mảng JSON thuần túy đặt bên trong codeblock markdown \`\`\`json ... \`\`\`. Chỉ trả về codeblock JSON này, không viết thêm bất kỳ lời chào hay giải thích nào khác.

Quy tắc trích xuất:
1. "date": Ngày giao dịch theo định dạng "YYYY-MM-DD" (nếu ảnh chỉ ghi ngày tháng như 06/11 thì lấy năm hiện tại là ${currentYear}, ví dụ: "${currentYear}-11-06").
2. "amount": Số tiền nguyên dương (VD: 50000, không có dấu âm "-", không có dấu chấm phẩy, không có chữ "đ" hay "VND").
3. "type": Cố định là "EXPENSE".
4. "category": BẮT BUỘC chọn 1 tên danh mục phù hợp nhất trong danh sách sau: [${catListStr}]. Nếu không chắc chắn hãy chọn "Khác".
5. "note": Nội dung chuyển khoản, tên quán/cửa hàng hoặc người nhận tiền.
6. "paidBy": "${activeMembersStr}" (nếu ảnh không thể hiện rõ ai chi thì mặc định để "${currentRole}").

Định dạng mẫu bắt buộc:
\`\`\`json
[
  {
    "date": "${currentYear}-11-06",
    "amount": 45000,
    "type": "EXPENSE",
    "category": "Ăn uống",
    "note": "Cà phê sáng Highlands",
    "paidBy": "${currentRole}"
  }
]
\`\`\``;
  }

  if (purpose === 'INCOME') {
    const catListStr = incomeCategories.length > 0 
      ? incomeCategories.join(', ')
      : 'Lương, Thưởng, Tiền lãi, Thu nhập phụ, Khác';

    return `Hãy đọc ảnh chụp màn hình lịch sử giao dịch ngân hàng / biên nhận tiền vào đính kèm và trích xuất TOÀN BỘ các khoản thu nhập thành một mảng JSON thuần túy đặt bên trong codeblock markdown \`\`\`json ... \`\`\`. Chỉ trả về codeblock JSON này, không viết thêm bất kỳ lời chào hay giải thích nào khác.

Quy tắc trích xuất:
1. "date": Ngày nhận tiền theo định dạng "YYYY-MM-DD" (nếu ảnh chỉ ghi ngày tháng thì lấy năm ${currentYear}).
2. "amount": Số tiền nguyên dương (VD: 15000000, không có dấu "+", không có chữ "VND").
3. "type": Cố định là "INCOME".
4. "category": BẮT BUỘC chọn 1 tên danh mục phù hợp nhất trong danh sách sau: [${catListStr}]. Nếu không rõ hãy chọn "Khác".
5. "note": Nội dung chuyển khoản hoặc tên đơn vị gửi tiền.
6. "paidBy": "${activeMembersStr}" (người nhận tiền, nếu không rõ để "${currentRole}").

Định dạng mẫu bắt buộc:
\`\`\`json
[
  {
    "date": "${currentYear}-11-05",
    "amount": 15000000,
    "type": "INCOME",
    "category": "Lương",
    "note": "Công ty thanh toán lương tháng 10",
    "paidBy": "${currentRole}"
  }
]
\`\`\``;
  }

  if (purpose === 'PENDING') {
    const catListStr = expenseCategories.length > 0 
      ? expenseCategories.join(', ')
      : 'Điện nước, Nhà cửa, Mua sắm, Học phí, Khác';

    return `Hãy đọc ảnh chụp thông báo hóa đơn / tin nhắn nhắc nợ / khoản phải chi sắp tới đính kèm và trích xuất thành một mảng JSON các khoản CHỜ THANH TOÁN đặt bên trong codeblock markdown \`\`\`json ... \`\`\`. Chỉ trả về codeblock JSON này, không viết thêm bất kỳ lời chào hay giải thích nào khác.

Quy tắc trích xuất:
1. "title": Tên khoản cần trả (VD: "Tiền điện EVN T10", "Tiền nước", "Học phí mầm non", "Trả góp ngân hàng").
2. "amount": Số tiền cần thanh toán (nguyên dương, VD: 1250000).
3. "dueDate": Hạn chót thanh toán theo định dạng "YYYY-MM-DD" (nếu có trên ảnh, nếu không có để trống "").
4. "category": BẮT BUỘC chọn 1 tên danh mục trong danh sách sau: [${catListStr}].
5. "note": Mã khách hàng hoặc thông tin hướng dẫn thanh toán nếu có.
6. "assignedTo": "${activeMembersStr}" (người dự kiến thanh toán, mặc định "${currentRole}").

Định dạng mẫu bắt buộc:
\`\`\`json
[
  {
    "title": "Tiền điện sinh hoạt",
    "amount": 850000,
    "dueDate": "${currentYear}-11-15",
    "category": "Điện nước",
    "note": "Mã KH: PE02000123456",
    "assignedTo": "${currentRole}"
  }
]
\`\`\``;
  }

  // Mặc định: ALL (Cả Thu lẫn Chi)
  const allExpenseStr = expenseCategories.join(', ') || 'Ăn uống, Đi chợ, Điện nước, Mua sắm, Khác';
  const allIncomeStr = incomeCategories.join(', ') || 'Lương, Thưởng, Khác';

  return `Hãy đọc ảnh chụp sao kê tài khoản ngân hàng / lịch sử biến động số dư đính kèm và trích xuất TOÀN BỘ các giao dịch (cả tiền vào và tiền ra) thành một mảng JSON thuần túy đặt bên trong codeblock markdown \`\`\`json ... \`\`\`. Chỉ trả về codeblock JSON này, không viết thêm bất kỳ lời giải thích nào khác.

Quy tắc trích xuất:
1. "date": Ngày giao dịch theo định dạng "YYYY-MM-DD" (nếu chỉ có ngày tháng thì lấy năm ${currentYear}).
2. "amount": Số tiền nguyên dương (VD: 150000).
3. "type": Nếu là tiền ra / trừ tiền / thanh toán thì ghi "EXPENSE". Nếu là tiền vào / cộng tiền / nhận chuyển khoản thì ghi "INCOME".
4. "category": 
   - Với khoản chi (EXPENSE), chọn 1 trong: [${allExpenseStr}].
   - Với khoản thu (INCOME), chọn 1 trong: [${allIncomeStr}].
5. "note": Nội dung chuyển khoản hoặc tên đơn vị giao dịch.
6. "paidBy": "${activeMembersStr}" (mặc định "${currentRole}").

Định dạng mẫu bắt buộc:
\`\`\`json
[
  {
    "date": "${currentYear}-11-06",
    "amount": 50000,
    "type": "EXPENSE",
    "category": "Ăn uống",
    "note": "Chuyển tiền ăn trưa",
    "paidBy": "${currentRole}"
  },
  {
    "date": "${currentYear}-11-05",
    "amount": 5000000,
    "type": "INCOME",
    "category": "Lương",
    "note": "Nhận tiền tạm ứng dự án",
    "paidBy": "${currentRole}"
  }
]
\`\`\``;
}

