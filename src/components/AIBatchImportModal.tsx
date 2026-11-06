import React, { useState, useMemo, useEffect } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  ClipboardPaste,
  Trash2,
  Calendar,
  Tag,
  User,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  FileCode,
  CheckCircle2,
  Loader2,
  Info
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatVND, getLocalDateString } from '../utils/currency';
import { playActionClick, playSuccessChime } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';
import { renderCategoryIcon } from '../utils/categoryIcons';
import { BottomSheet } from './BottomSheet';
import { useToast } from './Toast';
import {
  AIPromptPurpose,
  AI_PROMPT_PURPOSES,
  generateAIPrompt
} from '../utils/aiPrompts';
import {
  ParsedTransactionItem,
  ParsedPendingItem,
  parseAITransactionsJson,
  parseAIPendingExpensesJson
} from '../utils/jsonTransactionParser';
import type { Category } from '../types';

interface AIBatchImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPurpose?: AIPromptPurpose;
}

export const AIBatchImportModal: React.FC<AIBatchImportModalProps> = ({
  isOpen,
  onClose,
  initialPurpose = 'EXPENSE'
}) => {
  const {
    categories,
    userRole,
    activeHousehold,
    logBatchTransactions,
    logBatchPendingExpenses,
    firebaseUser
  } = useApp();
  const { showToast } = useToast();

  // Tab chính: 'PROMPT' (Lấy prompt) | 'IMPORT' (Dán & Phê duyệt)
  const [activeTab, setActiveTab] = useState<'PROMPT' | 'IMPORT'>('PROMPT');

  // Mục đích trích xuất: 'EXPENSE' | 'INCOME' | 'PENDING' | 'ALL'
  const [selectedPurpose, setSelectedPurpose] = useState<AIPromptPurpose>(initialPurpose);

  // Trạng thái đã sao chép Prompt
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);

  // Dữ liệu nhập vào
  const [rawJsonInput, setRawJsonInput] = useState<string>('');
  const [parseError, setParseError] = useState<string | null>(null);

  // Danh sách giao dịch sau khi parse
  const [isReviewMode, setIsReviewMode] = useState<boolean>(false);
  const [parsedTransactions, setParsedTransactions] = useState<ParsedTransactionItem[]>([]);
  const [parsedPendingItems, setParsedPendingItems] = useState<ParsedPendingItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Lấy danh sách tên thành viên trong tổ ấm
  const memberNames = useMemo(() => {
    if (activeHousehold?.memberNames) {
      const names = Object.values(activeHousehold.memberNames).filter(Boolean);
      if (names.length > 0) return names;
    }
    return ['Chồng', 'Vợ'];
  }, [activeHousehold]);

  // Sinh Prompt động theo mục đích và danh mục hiện tại của gia đình
  const currentPrompt = useMemo(() => {
    return generateAIPrompt({
      purpose: selectedPurpose,
      categories,
      memberNames,
      currentRole: userRole
    });
  }, [selectedPurpose, categories, memberNames, userRole]);

  // Reset form khi mở modal
  useEffect(() => {
    if (isOpen) {
      setActiveTab('PROMPT');
      setRawJsonInput('');
      setParseError(null);
      setIsReviewMode(false);
      setParsedTransactions([]);
      setParsedPendingItems([]);
      setIsSubmitting(false);
      setCopiedPrompt(false);
    }
  }, [isOpen]);

  // Sao chép Prompt vào clipboard
  const handleCopyPrompt = async () => {
    playActionClick();
    triggerHaptic(12);
    try {
      await navigator.clipboard.writeText(currentPrompt);
      setCopiedPrompt(true);
      showToast('Đã sao chép câu lệnh gửi AI vào bộ nhớ tạm!', 'success');
      setTimeout(() => setCopiedPrompt(false), 3000);
    } catch {
      showToast('Không thể sao chép tự động. Hãy bôi đen và copy thủ công nhé!', 'warning');
    }
  };

  // Dán từ Clipboard vào ô textarea
  const handlePasteFromClipboard = async () => {
    playActionClick();
    triggerHaptic(10);
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setRawJsonInput(text);
        setParseError(null);
        showToast('Đã dán dữ liệu từ bộ nhớ tạm!', 'info');
      } else {
        showToast('Bộ nhớ tạm đang trống!', 'warning');
      }
    } catch {
      showToast('Trình duyệt chưa cấp quyền đọc bộ nhớ tạm. Bạn hãy dán bằng phím tắt (Ctrl+V hoặc chạm giữ Dán) nhé!', 'info');
    }
  };

  // Nạp dữ liệu mẫu để người dùng thử nghiệm nhanh
  const handleLoadSampleData = () => {
    playActionClick();
    triggerHaptic(10);
    const sampleYear = new Date().getFullYear();
    if (selectedPurpose === 'PENDING') {
      const sample = `\`\`\`json
[
  {
    "title": "Tiền điện sinh hoạt tháng này",
    "amount": 780000,
    "dueDate": "${sampleYear}-11-15",
    "category": "Điện nước",
    "note": "Mã KH: PE02000123456",
    "assignedTo": "${userRole}"
  },
  {
    "title": "Học phí mầm non",
    "amount": 3200000,
    "dueDate": "${sampleYear}-11-20",
    "category": "Học phí",
    "note": "Chuyển khoản theo số tài khoản trường",
    "assignedTo": "Vợ"
  }
]
\`\`\``;
      setRawJsonInput(sample);
    } else if (selectedPurpose === 'INCOME') {
      const sample = `\`\`\`json
[
  {
    "date": "${sampleYear}-11-05",
    "amount": 15000000,
    "type": "INCOME",
    "category": "Lương",
    "note": "Công ty thanh toán lương tháng 10",
    "paidBy": "${userRole}"
  },
  {
    "date": "${sampleYear}-11-06",
    "amount": 2000000,
    "type": "INCOME",
    "category": "Thưởng",
    "note": "Thưởng dự án hoàn thành tốt",
    "paidBy": "${userRole === 'Chồng' ? 'Vợ' : 'Chồng'}"
  }
]
\`\`\``;
      setRawJsonInput(sample);
    } else {
      const sample = `\`\`\`json
[
  {
    "date": "${sampleYear}-11-06",
    "amount": 55000,
    "type": "EXPENSE",
    "category": "Ăn uống",
    "note": "Cà phê sáng cùng đồng nghiệp",
    "paidBy": "${userRole}"
  },
  {
    "date": "${sampleYear}-11-06",
    "amount": 340000,
    "type": "EXPENSE",
    "category": "Đi chợ",
    "note": "Siêu thị WinMart mua thực phẩm",
    "paidBy": "Vợ"
  },
  {
    "date": "${sampleYear}-11-05",
    "amount": 120000,
    "type": "EXPENSE",
    "category": "Di chuyển",
    "note": "Đổ xăng xe máy",
    "paidBy": "Chồng"
  }
]
\`\`\``;
      setRawJsonInput(sample);
    }
    setParseError(null);
    showToast('Đã nạp dữ liệu mẫu thử nghiệm!', 'info');
  };

  // Thực hiện phân tích dữ liệu JSON
  const handleParseData = () => {
    playActionClick();
    triggerHaptic(12);

    if (!rawJsonInput.trim()) {
      setParseError('Vui lòng dán dữ liệu JSON vào ô bên dưới trước khi bấm phân tích.');
      return;
    }

    if (selectedPurpose === 'PENDING') {
      const result = parseAIPendingExpensesJson(rawJsonInput, categories, userRole);
      if (!result.success || result.items.length === 0) {
        setParseError(result.error || 'Không trích xuất được khoản chờ nào.');
        return;
      }
      setParsedPendingItems(result.items);
      setIsReviewMode(true);
      setParseError(null);
      showToast(`Đã nhận diện thành công ${result.items.length} khoản chờ!`, 'success');
    } else {
      const result = parseAITransactionsJson(rawJsonInput, categories, userRole);
      if (!result.success || result.items.length === 0) {
        setParseError(result.error || 'Không trích xuất được giao dịch nào.');
        return;
      }
      setParsedTransactions(result.items);
      setIsReviewMode(true);
      setParseError(null);
      showToast(`Đã nhận diện thành công ${result.items.length} giao dịch!`, 'success');
    }
  };

  // Toggle chọn tất cả giao dịch
  const isAllTxSelected = parsedTransactions.length > 0 && parsedTransactions.every((tx) => tx.selected);
  const handleToggleSelectAllTx = () => {
    playActionClick();
    triggerHaptic(8);
    const nextState = !isAllTxSelected;
    setParsedTransactions((prev) => prev.map((tx) => ({ ...tx, selected: nextState })));
  };

  // Toggle chọn tất cả khoản chờ
  const isAllPendingSelected = parsedPendingItems.length > 0 && parsedPendingItems.every((item) => item.selected);
  const handleToggleSelectAllPending = () => {
    playActionClick();
    triggerHaptic(8);
    const nextState = !isAllPendingSelected;
    setParsedPendingItems((prev) => prev.map((item) => ({ ...item, selected: nextState })));
  };

  // Cập nhật 1 trường của giao dịch
  const handleUpdateTxField = (id: string, updates: Partial<ParsedTransactionItem>) => {
    setParsedTransactions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  // Cập nhật 1 trường của khoản chờ
  const handleUpdatePendingField = (id: string, updates: Partial<ParsedPendingItem>) => {
    setParsedPendingItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  // Xóa 1 giao dịch khỏi danh sách
  const handleDeleteTxItem = (id: string) => {
    playActionClick();
    triggerHaptic(10);
    setParsedTransactions((prev) => prev.filter((item) => item.id !== id));
  };

  // Xóa 1 khoản chờ khỏi danh sách
  const handleDeletePendingItem = (id: string) => {
    playActionClick();
    triggerHaptic(10);
    setParsedPendingItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Thống kê tổng tiền cho màn review giao dịch
  const selectedTxCount = parsedTransactions.filter((tx) => tx.selected).length;
  const totalExpenseAmount = parsedTransactions
    .filter((tx) => tx.selected && tx.type === 'EXPENSE')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const totalIncomeAmount = parsedTransactions
    .filter((tx) => tx.selected && tx.type === 'INCOME')
    .reduce((sum, tx) => sum + tx.amount, 0);

  // Thống kê cho khoản chờ
  const selectedPendingCount = parsedPendingItems.filter((p) => p.selected).length;
  const totalPendingAmount = parsedPendingItems
    .filter((p) => p.selected)
    .reduce((sum, p) => sum + p.amount, 0);

  // Phê duyệt & Lưu vào cơ sở dữ liệu
  const handleApproveAndSave = async () => {
    playActionClick();
    triggerHaptic(15);

    if (selectedPurpose === 'PENDING') {
      const itemsToSave = parsedPendingItems.filter((p) => p.selected && p.amount > 0);
      if (itemsToSave.length === 0) {
        showToast('Vui lòng chọn ít nhất 1 khoản chờ để lưu!', 'warning');
        return;
      }

      setIsSubmitting(true);
      try {
        const payload = itemsToSave.map((item) => ({
          name: item.name.trim(),
          amount: item.amount,
          type: 'EXPENSE' as const,
          categoryId: item.categoryId,
          categoryName: item.categoryName,
          categoryKey: item.categoryKey,
          dueDate: item.dueDate || '',
          assignedTo: (item.assignedTo as 'Chồng' | 'Vợ') || userRole,
          createdByUid: firebaseUser?.uid || '',
          createdByName: userRole,
          note: item.note.trim() || item.name.trim(),
          status: 'PENDING' as const
        }));

        await logBatchPendingExpenses(payload);
        playSuccessChime();
        onClose();
      } catch (err) {
        console.error('Lỗi khi lưu khoản chờ theo lô:', err);
        showToast('Có lỗi xảy ra khi lưu khoản chờ. Vui lòng thử lại!', 'error');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      const txsToSave = parsedTransactions.filter((tx) => tx.selected && tx.amount > 0);
      if (txsToSave.length === 0) {
        showToast('Vui lòng chọn ít nhất 1 giao dịch để lưu!', 'warning');
        return;
      }

      setIsSubmitting(true);
      try {
        const payload = txsToSave.map((tx) => ({
          amount: tx.amount,
          type: tx.type,
          categoryId: tx.categoryId,
          categoryName: tx.categoryName,
          categoryKey: tx.categoryKey,
          paidBy: tx.paidBy,
          paidByUid: firebaseUser?.uid || '',
          date: tx.date || getLocalDateString(),
          note: tx.note.trim()
        }));

        await logBatchTransactions(payload);
        playSuccessChime();
        onClose();
      } catch (err) {
        console.error('Lỗi khi lưu giao dịch theo lô:', err);
        showToast('Có lỗi xảy ra khi lưu giao dịch. Vui lòng thử lại!', 'error');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <span className="text-sm sm:text-base font-bold text-[#1C1917] tracking-tight">
            Nhập nhanh từ AI
          </span>
          <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-[#E7EFEF] text-[#0F3D39] border border-[#0F3D39]/20">
            Smart JSON
          </span>
        </div>
      }
      subtitle="Chuyển ảnh chụp ngân hàng & hóa đơn thành giao dịch sổ cái"
      icon={
        <div className="w-10 h-10 rounded-2xl bg-[#0F3D39] text-[#FAF9F6] flex items-center justify-center shadow-xs">
          <Sparkles className="w-5 h-5 text-[#FEF3C7] stroke-[2.2]" />
        </div>
      }
      maxHeight="max-h-[92dvh] sm:max-h-[88vh]"
      bodyClassName="p-0 flex flex-col"
      footer={
        isReviewMode ? (
          <div className="p-3 sm:p-4 bg-white border-t border-[#E6E2DA] flex items-center justify-between gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                playActionClick();
                triggerHaptic(8);
                setIsReviewMode(false);
              }}
              className="px-3.5 py-2.5 rounded-xl border border-[#E6E2DA] hover:bg-[#FAF9F6] text-[#78716C] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer min-h-[42px]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Dán lại</span>
            </button>

            <button
              type="button"
              disabled={
                isSubmitting ||
                (selectedPurpose === 'PENDING' ? selectedPendingCount === 0 : selectedTxCount === 0)
              }
              onClick={handleApproveAndSave}
              className={`flex-1 px-4 py-2.5 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-2 shadow-2xs active:scale-95 transition-all cursor-pointer min-h-[42px] ${
                selectedPurpose === 'PENDING'
                  ? 'bg-[#15803D] hover:bg-[#166534]'
                  : 'bg-[#0F3D39] hover:bg-[#174E4A]'
              } disabled:opacity-50 disabled:pointer-events-none`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang lưu dữ liệu...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>
                    Phê duyệt & Lưu (
                    {selectedPurpose === 'PENDING' ? selectedPendingCount : selectedTxCount})
                  </span>
                </>
              )}
            </button>
          </div>
        ) : (
          activeTab === 'IMPORT' && (
            <div className="p-3 sm:p-4 bg-white border-t border-[#E6E2DA] flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  playActionClick();
                  triggerHaptic(8);
                  setActiveTab('PROMPT');
                }}
                className="px-3.5 py-2.5 rounded-xl border border-[#E6E2DA] hover:bg-[#FAF9F6] text-[#78716C] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer min-h-[42px]"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Xem câu lệnh AI</span>
              </button>

              <button
                type="button"
                onClick={handleParseData}
                disabled={!rawJsonInput.trim()}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#0F3D39] hover:bg-[#174E4A] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 transition-all cursor-pointer min-h-[42px] disabled:opacity-50 disabled:pointer-events-none"
              >
                <Sparkles className="w-4 h-4 text-[#FEF3C7]" />
                <span>Phân tích & Xem trước</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        )
      }
    >
      <div className="flex-1 flex flex-col min-h-0">
        {/* THANH ĐIỀU HƯỚNG 2 TAB NẾU CHƯA Ở REVIEW MODE */}
        {!isReviewMode && (
          <div className="p-3 bg-[#FAF9F6] border-b border-[#E6E2DA] shrink-0">
            <div className="grid grid-cols-2 gap-2 bg-[#F5F3EF] p-1 rounded-2xl border border-[#E6E2DA]/80">
              <button
                type="button"
                onClick={() => {
                  playActionClick();
                  triggerHaptic(8);
                  setActiveTab('PROMPT');
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'PROMPT'
                    ? 'bg-white text-[#0F3D39] shadow-2xs'
                    : 'text-[#78716C] hover:text-[#1C1917]'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>1. Lấy câu lệnh Prompt</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playActionClick();
                  triggerHaptic(8);
                  setActiveTab('IMPORT');
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'IMPORT'
                    ? 'bg-white text-[#0F3D39] shadow-2xs'
                    : 'text-[#78716C] hover:text-[#1C1917]'
                }`}
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                <span>2. Dán & Phê duyệt</span>
              </button>
            </div>
          </div>
        )}

        {/* NỘI DUNG CHÍNH CUỘN MƯỢT MÀ */}
        <div className="p-4 sm:p-5 overflow-y-auto overscroll-contain touch-pan-y flex-1 space-y-4">
          {/* =========================================================================
              PHÂN VÙNG 1: REVIEW MODE (XEM TRƯỚC VÀ CHỈNH SỬA GIAO DỊCH)
              ========================================================================= */}
          {isReviewMode ? (
            <div className="space-y-4">
              {/* BANNER TÓM TẮT SỐ LIỆU */}
              <div className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E6E2DA] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#0F3D39]" />
                    <span className="text-xs font-bold text-[#1C1917]">
                      {selectedPurpose === 'PENDING'
                        ? `${selectedPendingCount}/${parsedPendingItems.length} khoản chờ được chọn`
                        : `${selectedTxCount}/${parsedTransactions.length} giao dịch được chọn`}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={
                      selectedPurpose === 'PENDING'
                        ? handleToggleSelectAllPending
                        : handleToggleSelectAllTx
                    }
                    className="text-[11px] font-semibold text-[#0F3D39] hover:underline cursor-pointer"
                  >
                    {selectedPurpose === 'PENDING'
                      ? isAllPendingSelected
                        ? 'Bỏ chọn tất cả'
                        : 'Chọn tất cả'
                      : isAllTxSelected
                      ? 'Bỏ chọn tất cả'
                      : 'Chọn tất cả'}
                  </button>
                </div>

                {/* Tổng số tiền */}
                <div className="pt-2 border-t border-[#E6E2DA]/60 flex items-center justify-between text-xs font-mono">
                  {selectedPurpose === 'PENDING' ? (
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[#78716C]">Tổng khoản chờ thanh toán:</span>
                      <span className="font-bold text-[#15803D] text-sm">
                        {formatVND(totalPendingAmount)}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between w-full flex-wrap gap-2">
                      {totalExpenseAmount > 0 && (
                        <span>
                          Tổng chi: <strong className="text-[#B45309]">{formatVND(totalExpenseAmount)}</strong>
                        </span>
                      )}
                      {totalIncomeAmount > 0 && (
                        <span>
                          Tổng thu: <strong className="text-[#047857]">+{formatVND(totalIncomeAmount)}</strong>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Hướng dẫn thao tác nhanh */}
              <p className="text-[11px] text-[#78716C] px-1">
                💡 Bạn có thể chạm vào số tiền, ngày, danh mục hoặc người chi để chỉnh sửa trước khi phê duyệt lưu vào sổ cái.
              </p>

              {/* DANH SÁCH THẺ GIAO DỊCH (SỔ CÁI) */}
              {selectedPurpose !== 'PENDING' && (
                <div className="space-y-3">
                  {parsedTransactions.map((tx) => {
                    const isExpense = tx.type === 'EXPENSE';
                    const matchedCat = categories.find((c) => c.id === tx.categoryId);

                    return (
                      <div
                        key={tx.id}
                        className={`p-3.5 rounded-2xl border transition-all space-y-3 ${
                          tx.selected
                            ? 'bg-white border-[#0F3D39]/30 shadow-2xs'
                            : 'bg-[#FAF9F6] border-[#E6E2DA] opacity-60'
                        }`}
                      >
                        {/* Hàng 1: Checkbox, Phân loại Thu/Chi, Số tiền & Nút xóa */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={tx.selected}
                              onChange={(e) => handleUpdateTxField(tx.id, { selected: e.target.checked })}
                              className="w-4 h-4 rounded text-[#0F3D39] focus:ring-0 cursor-pointer"
                            />

                            {/* Toggle 1-chạm Thu / Chi */}
                            <button
                              type="button"
                              onClick={() => {
                                playActionClick();
                                triggerHaptic(8);
                                const nextType = isExpense ? 'INCOME' : 'EXPENSE';
                                const nextCat = categories.find((c) => c.type === nextType && !c.isArchived) || categories[0];
                                handleUpdateTxField(tx.id, {
                                  type: nextType,
                                  categoryId: nextCat.id,
                                  categoryName: nextCat.name,
                                  categoryKey: nextCat.categoryKey
                                });
                              }}
                              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border cursor-pointer active:scale-95 transition-transform ${
                                isExpense
                                  ? 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]'
                                  : 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]'
                              }`}
                              title="Chạm để chuyển đổi giữa Chi tiêu và Thu nhập"
                            >
                              {isExpense ? 'Chi tiêu' : 'Thu nhập'}
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Ô nhập số tiền */}
                            <div className="relative">
                              <input
                                type="number"
                                value={tx.amount || ''}
                                onChange={(e) =>
                                  handleUpdateTxField(tx.id, {
                                    amount: Math.max(0, Number(e.target.value))
                                  })
                                }
                                className={`text-sm sm:text-base font-bold font-mono text-right w-28 sm:w-36 p-1.5 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] focus:bg-white focus:border-[#0F3D39] outline-hidden ${
                                  isExpense ? 'text-[#B45309]' : 'text-[#047857]'
                                }`}
                                placeholder="0"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteTxItem(tx.id)}
                              className="p-1.5 rounded-lg text-[#A8A29E] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
                              title="Xóa giao dịch này"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Hàng 2: Ghi chú */}
                        <div>
                          <input
                            type="text"
                            value={tx.note}
                            onChange={(e) => handleUpdateTxField(tx.id, { note: e.target.value })}
                            placeholder="Ghi chú nội dung giao dịch..."
                            className="w-full text-xs p-2 rounded-xl border border-[#E6E2DA] bg-white focus:border-[#0F3D39] outline-hidden"
                          />
                        </div>

                        {/* Hàng 3: Danh mục, Ngày & Người chi */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                          {/* Chọn Danh mục */}
                          <div className="flex items-center gap-1.5 bg-[#FAF9F6] p-1.5 rounded-xl border border-[#E6E2DA]">
                            <Tag className="w-3.5 h-3.5 text-[#78716C] shrink-0" />
                            <select
                              value={tx.categoryId}
                              onChange={(e) => {
                                const cat = categories.find((c) => c.id === e.target.value);
                                if (cat) {
                                  handleUpdateTxField(tx.id, {
                                    categoryId: cat.id,
                                    categoryName: cat.name,
                                    categoryKey: cat.categoryKey
                                  });
                                }
                              }}
                              className="bg-transparent text-xs text-[#1C1917] font-semibold w-full outline-hidden cursor-pointer"
                            >
                              {categories
                                .filter((c) => c.type === tx.type && !c.isArchived)
                                .map((cat) => (
                                  <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                  </option>
                                ))}
                            </select>
                          </div>

                          {/* Chọn Ngày */}
                          <div className="flex items-center gap-1.5 bg-[#FAF9F6] p-1.5 rounded-xl border border-[#E6E2DA]">
                            <Calendar className="w-3.5 h-3.5 text-[#78716C] shrink-0" />
                            <input
                              type="date"
                              value={tx.date}
                              onChange={(e) => handleUpdateTxField(tx.id, { date: e.target.value })}
                              className="bg-transparent text-xs text-[#1C1917] font-mono font-medium w-full outline-hidden cursor-pointer"
                            />
                          </div>

                          {/* Chọn Người chi (1-chạm toggle) */}
                          <div className="flex items-center gap-1.5 bg-[#FAF9F6] p-1 rounded-xl border border-[#E6E2DA] justify-between">
                            <div className="flex items-center gap-1 pl-1">
                              <User className="w-3.5 h-3.5 text-[#78716C]" />
                              <span className="text-[11px] text-[#78716C]">Người chi:</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {['Chồng', 'Vợ'].map((role) => (
                                <button
                                  key={role}
                                  type="button"
                                  onClick={() => handleUpdateTxField(tx.id, { paidBy: role })}
                                  className={`px-2 py-0.5 text-[10px] font-bold rounded-lg transition-colors cursor-pointer ${
                                    tx.paidBy === role
                                      ? 'bg-[#0F3D39] text-white shadow-2xs'
                                      : 'text-[#78716C] hover:bg-white'
                                  }`}
                                >
                                  {role}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* DANH SÁCH THẺ KHOẢN CHỜ THANH TOÁN (PENDING) */}
              {selectedPurpose === 'PENDING' && (
                <div className="space-y-3">
                  {parsedPendingItems.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-2xl border transition-all space-y-3 ${
                        item.selected
                          ? 'bg-white border-[#15803D]/40 shadow-2xs'
                          : 'bg-[#FAF9F6] border-[#E6E2DA] opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={item.selected}
                            onChange={(e) => handleUpdatePendingField(item.id, { selected: e.target.checked })}
                            className="w-4 h-4 rounded text-[#15803D] focus:ring-0 cursor-pointer"
                          />
                          <span className="text-xs font-bold text-[#1C1917]">Khoản cần trả</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={item.amount || ''}
                            onChange={(e) =>
                              handleUpdatePendingField(item.id, {
                                amount: Math.max(0, Number(e.target.value))
                              })
                            }
                            className="text-sm sm:text-base font-bold font-mono text-right w-28 sm:w-36 p-1.5 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] focus:bg-white focus:border-[#15803D] text-[#15803D] outline-hidden"
                            placeholder="0"
                          />
                          <button
                            type="button"
                            onClick={() => handleDeletePendingItem(item.id)}
                            className="p-1.5 rounded-lg text-[#A8A29E] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
                            title="Xóa khoản chờ này"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Tên khoản chi */}
                      <div>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleUpdatePendingField(item.id, { name: e.target.value })}
                          placeholder="Tên khoản chi (VD: Tiền điện sinh hoạt, Học phí...)"
                          className="w-full text-xs p-2 rounded-xl border border-[#E6E2DA] bg-white focus:border-[#15803D] outline-hidden font-semibold"
                        />
                      </div>

                      {/* Hạn thanh toán & Người chi */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1.5 bg-[#FAF9F6] p-1.5 rounded-xl border border-[#E6E2DA]">
                          <Calendar className="w-3.5 h-3.5 text-[#78716C] shrink-0" />
                          <span className="text-[11px] text-[#78716C] shrink-0">Hạn:</span>
                          <input
                            type="date"
                            value={item.dueDate}
                            onChange={(e) => handleUpdatePendingField(item.id, { dueDate: e.target.value })}
                            className="bg-transparent text-xs text-[#1C1917] font-mono w-full outline-hidden cursor-pointer"
                          />
                        </div>

                        <div className="flex items-center gap-1.5 bg-[#FAF9F6] p-1 rounded-xl border border-[#E6E2DA] justify-between">
                          <span className="text-[11px] text-[#78716C] pl-1">Phụ trách:</span>
                          <div className="flex items-center gap-1">
                            {['Chồng', 'Vợ'].map((role) => (
                              <button
                                key={role}
                                type="button"
                                onClick={() => handleUpdatePendingField(item.id, { assignedTo: role })}
                                className={`px-2 py-0.5 text-[10px] font-bold rounded-lg transition-colors cursor-pointer ${
                                  item.assignedTo === role
                                    ? 'bg-[#15803D] text-white shadow-2xs'
                                    : 'text-[#78716C] hover:bg-white'
                                }`}
                              >
                                {role}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* =========================================================================
                  PHÂN VÙNG 2: TAB 1 - LẤY CÂU LỆNH PROMPT GỬI CHO AI
                  ========================================================================= */}
              {activeTab === 'PROMPT' && (
                <div className="space-y-4">
                  {/* BỘ 4 NÚT CHỌN MỤC ĐÍCH */}
                  <div>
                    <label className="text-xs font-bold text-[#78716C] uppercase tracking-wider block mb-2 font-mono">
                      Chọn mục đích bạn muốn trích xuất:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {AI_PROMPT_PURPOSES.map((p) => {
                        const isSelected = selectedPurpose === p.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              playActionClick();
                              triggerHaptic(8);
                              setSelectedPurpose(p.id);
                            }}
                            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? 'bg-white border-[#0F3D39] shadow-xs ring-1 ring-[#0F3D39]'
                                : 'bg-[#FAF9F6] border-[#E6E2DA] hover:bg-white'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md border ${p.colorClass}`}>
                                {p.badge}
                              </span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-[#0F3D39] stroke-[2.5]" />}
                            </div>
                            <span className="text-xs font-bold text-[#1C1917] block">
                              {p.title}
                            </span>
                            <span className="text-[10px] text-[#78716C] mt-0.5 line-clamp-1">
                              {p.description}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* NÚT COPY PROMPT CHÍNH */}
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={handleCopyPrompt}
                      className="w-full py-3 px-4 rounded-2xl bg-[#0F3D39] hover:bg-[#174E4A] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-2xs active:scale-98 transition-all cursor-pointer"
                    >
                      {copiedPrompt ? (
                        <>
                          <Check className="w-4 h-4 text-[#A7F3D0] stroke-[2.5]" />
                          <span>Đã sao chép câu lệnh!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Sao chép câu lệnh gửi AI (Copy Prompt)</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        playActionClick();
                        triggerHaptic(8);
                        setActiveTab('IMPORT');
                      }}
                      className="w-full py-2 px-3 rounded-xl border border-[#E6E2DA] hover:bg-[#FAF9F6] text-[#0F3D39] text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>Tôi đã có dữ liệu JSON từ AI → Sang bước Dán dữ liệu</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* HƯỚNG DẪN 3 BƯỚC NHANH */}
                  <div className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E6E2DA] space-y-2 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-[#1C1917]">
                      <Info className="w-4 h-4 text-[#0F3D39]" />
                      <span>Cách dùng siêu tốc:</span>
                    </div>
                    <ol className="list-decimal list-inside space-y-1 text-[#78716C] text-[11px] leading-relaxed">
                      <li>
                        Bấm nút <strong>"Sao chép câu lệnh"</strong> ở trên.
                      </li>
                      <li>
                        Mở <strong>ChatGPT</strong> hoặc <strong>Gemini</strong>, dán câu lệnh và đính kèm ảnh chụp màn hình ngân hàng / hóa đơn.
                      </li>
                      <li>
                        Khi AI trả về kết quả trong khung đen, bấm nút <strong>Copy code</strong>, rồi quay lại app chọn tab <strong>"2. Dán & Phê duyệt"</strong>!
                      </li>
                    </ol>
                  </div>

                  {/* KHUNG XEM TRƯỚC PROMPT ĐỘNG */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-[#78716C]">
                      <span>Xem nội dung câu lệnh đã tối ưu:</span>
                      <span className="font-mono text-[10px]">Tự động map danh mục gia đình</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-[#F5F3EF] border border-[#E6E2DA] text-[11px] font-mono text-[#44403C] max-h-40 overflow-y-auto whitespace-pre-wrap leading-relaxed select-all">
                      {currentPrompt}
                    </div>
                  </div>
                </div>
              )}

              {/* =========================================================================
                  PHÂN VÙNG 3: TAB 2 - DÁN DỮ LIỆU JSON TỪ AI
                  ========================================================================= */}
              {activeTab === 'IMPORT' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#78716C] uppercase tracking-wider font-mono">
                      Dán kết quả JSON từ AI vào đây:
                    </label>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleLoadSampleData}
                        className="text-[11px] text-[#0F3D39] hover:underline font-semibold cursor-pointer"
                      >
                        Dữ liệu mẫu
                      </button>

                      <button
                        type="button"
                        onClick={handlePasteFromClipboard}
                        className="text-[11px] text-[#0F3D39] bg-[#E7EFEF] px-2 py-0.5 rounded-lg border border-[#0F3D39]/20 font-bold inline-flex items-center gap-1 cursor-pointer active:scale-95 transition-transform"
                      >
                        <ClipboardPaste className="w-3 h-3" />
                        <span>Dán từ bộ nhớ</span>
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <textarea
                      rows={9}
                      value={rawJsonInput}
                      onChange={(e) => {
                        setRawJsonInput(e.target.value);
                        setParseError(null);
                      }}
                      placeholder={`Ví dụ dữ liệu JSON từ AI:\n\`\`\`json\n[\n  {\n    "date": "${new Date().getFullYear()}-11-06",\n    "amount": 55000,\n    "type": "EXPENSE",\n    "category": "Ăn uống",\n    "note": "Cà phê sáng Highlands",\n    "paidBy": "${userRole}"\n  }\n]\n\`\`\``}
                      className="w-full p-3 rounded-2xl border border-[#E6E2DA] bg-[#FAF9F6] focus:bg-white focus:border-[#0F3D39] text-xs font-mono text-[#1C1917] outline-hidden resize-none leading-relaxed"
                    />
                  </div>

                  {/* THÔNG BÁO LỖI NẾU PARSE THẤT BẠI */}
                  {parseError && (
                    <div className="p-3 rounded-2xl bg-[#FEF2F2] border border-[#FCA5A5] flex items-start gap-2.5 text-xs text-[#DC2626]">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div className="flex-1 leading-relaxed">
                        <strong className="block font-semibold">Không thể đọc dữ liệu:</strong>
                        <span>{parseError}</span>
                      </div>
                    </div>
                  )}

                  <div className="p-3 rounded-2xl bg-[#FAF9F6] border border-[#E6E2DA] text-[11px] text-[#78716C] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#0F3D39] shrink-0" />
                    <span>
                      Hệ thống tự động lọc bỏ các đoạn text thừa, tự nhận diện codeblock markdown và tự động khớp danh mục thực tế của tổ ấm.
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </BottomSheet>
  );
};
