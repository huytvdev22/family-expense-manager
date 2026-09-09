import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Check, Trash2, Calendar, Target, ChevronDown, Clock, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from './Toast';
import { formatVND, getLocalDateString, formatDueDateBadge } from '../utils/currency';
import { playActionClick } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';
import { renderGoalIcon, renderCategoryIcon } from '../utils/categoryIcons';
import { useBodyScrollLock } from '../utils/scrollLock';
import type { PendingExpense, CategoryKey } from '../types';

interface EditPendingExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingExpense: PendingExpense | null;
}

export const EditPendingExpenseModal: React.FC<EditPendingExpenseModalProps> = ({
  isOpen,
  onClose,
  pendingExpense
}) => {
  const { categories, editPendingExpense, removePendingExpense, confirmPaidPendingExpense, financialGoals, userRole } = useApp();
  const { showToast } = useToast();

  // Khóa cuộn trang nền trên iOS khi mở Modal / Bottom Sheet
  useBodyScrollLock(isOpen && Boolean(pendingExpense));

  const [amountStr, setAmountStr] = useState<string>('0');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [assignedTo, setAssignedTo] = useState<'Chồng' | 'Vợ' | 'Cả hai'>('Chồng');
  const [dueDate, setDueDate] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  
  // Trạng thái xác nhận thanh toán (bấm "Xác nhận đã chi")
  const [showConfirmPaid, setShowConfirmPaid] = useState<boolean>(false);
  const [actualPaidBy, setActualPaidBy] = useState<'Chồng' | 'Vợ'>('Chồng');
  const [actualPaidDate, setActualPaidDate] = useState<string>(getLocalDateString());

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isSubmittingPaid, setIsSubmittingPaid] = useState<boolean>(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState<boolean>(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  // Khởi tạo form khi pendingExpense thay đổi
  useEffect(() => {
    if (pendingExpense) {
      setAmountStr(String(pendingExpense.amount));
      setSelectedCategoryId(pendingExpense.categoryId);
      setAssignedTo(pendingExpense.assignedTo || 'Chồng');
      setDueDate(pendingExpense.dueDate || getLocalDateString());
      setNote(pendingExpense.note || '');
      setSelectedGoalId(pendingExpense.goalId || null);
      setIsCategoryOpen(false);
      setShowConfirmPaid(false);
      setActualPaidBy(pendingExpense.assignedTo === 'Vợ' ? 'Vợ' : (userRole || 'Chồng'));
      setActualPaidDate(getLocalDateString());
    }
  }, [pendingExpense, userRole]);

  // Lọc danh mục chi tiêu
  const expenseCategories = useMemo(() => {
    const list = categories.filter((c) => !c.isArchived && (c.type || 'EXPENSE') === 'EXPENSE');
    return list.length > 0 ? list : categories;
  }, [categories]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryOpen(false);
      }
    };

    if (isCategoryOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isCategoryOpen]);

  // Danh mục đang chọn
  const selectedCategory = useMemo(() => {
    return categories.find((c) => c.id === selectedCategoryId) || expenseCategories[0];
  }, [categories, selectedCategoryId, expenseCategories]);

  // Mục tiêu tự do tài chính phù hợp (Trả nợ / Tích lũy)
  const matchingGoals = useMemo(() => {
    const currentCat = categories.find((c) => c.id === selectedCategoryId);
    if (!currentCat) return [];

    const isDebtCat = currentCat.id === 'cat_debt' 
      || currentCat.name.toLowerCase().includes('nợ') 
      || currentCat.name.toLowerCase().includes('ngân hàng');

    const isSavingCat = currentCat.categoryKey === 'SAVING' 
      || currentCat.name.toLowerCase().includes('tích lũy') 
      || currentCat.name.toLowerCase().includes('tiết kiệm');

    if (isDebtCat) {
      return financialGoals.filter((g) => g.status === 'ACTIVE' && g.type === 'DEBT_PAYOFF');
    }
    if (isSavingCat) {
      return financialGoals.filter((g) => g.status === 'ACTIVE' && g.type === 'SAVINGS');
    }
    return [];
  }, [categories, selectedCategoryId, financialGoals]);

  if (!isOpen || !pendingExpense) return null;

  const dueBadge = formatDueDateBadge(dueDate);

  // Xử lý lưu thay đổi thông tin khoản chờ
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(amountStr);
    if (isNaN(amount) || amount <= 0) {
      showToast('Vui lòng nhập số tiền hợp lệ lớn hơn 0', 'warning');
      return;
    }

    try {
      setIsSaving(true);
      const currentCat = categories.find((c) => c.id === selectedCategoryId) || selectedCategory;
      const selectedGoal = financialGoals.find((g) => g.id === selectedGoalId);

      const updates: Partial<PendingExpense> = {
        amount,
        categoryId: currentCat.id,
        categoryName: currentCat.name,
        categoryKey: currentCat.categoryKey as CategoryKey,
        assignedTo,
        dueDate,
        note: note.trim() || currentCat.name,
        goalId: selectedGoalId || undefined,
        goalName: selectedGoalId ? (selectedGoal?.title || '') : undefined
      };

      await editPendingExpense(pendingExpense.id, updates);
      onClose();
    } catch (err) {
      console.error('Lỗi khi lưu cập nhật khoản chờ:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Xóa khoản chờ
  const handleDelete = async () => {
    if (window.confirm(`Bạn có chắc muốn xóa khoản chờ "${pendingExpense.note || pendingExpense.categoryName}" (${formatVND(pendingExpense.amount)})?`)) {
      try {
        setIsDeleting(true);
        await removePendingExpense(pendingExpense.id);
        onClose();
      } catch (err) {
        console.error('Lỗi xóa khoản chờ:', err);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // Thực hiện "Xác nhận đã chi" (1-tap chuyển sang sổ cái)
  const handleConfirmPaid = async () => {
    try {
      setIsSubmittingPaid(true);
      await confirmPaidPendingExpense(pendingExpense, actualPaidBy, actualPaidDate);
      onClose();
    } catch (err) {
      console.error('Lỗi xác nhận thanh toán:', err);
    } finally {
      setIsSubmittingPaid(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-60 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/55 backdrop-blur-xs animate-in fade-in duration-150 touch-none"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSaving && !isDeleting && !isSubmittingPaid) {
          playActionClick();
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="bg-white border border-[#E6E2DA] rounded-t-3xl sm:rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[90vh] animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="px-5 py-4 border-b border-[#F5F3EF] flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FEF3C7] text-[#B45309] flex items-center justify-center shadow-2xs font-bold">
              <Clock className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1C1917]">Chi tiết khoản chờ thanh toán</h3>
              <p className="text-[11px] text-[#78716C]">Hóa đơn & nhắc nợ cần chi</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              playActionClick();
              onClose();
            }}
            disabled={isSaving || isDeleting || isSubmittingPaid}
            className="w-8 h-8 rounded-xl text-[#78716C] hover:text-[#1C1917] hover:bg-[#F5F3EF] flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Thân Modal cuộn */}
        <form onSubmit={handleSave} className="p-4 sm:p-5 overflow-y-auto space-y-4 overscroll-contain flex-1">
          {/* Banner Cảnh báo Hạn chót trực quan */}
          <div
            className={`p-3 rounded-2xl border flex items-center justify-between text-xs font-medium shadow-2xs ${
              dueBadge.status === 'OVERDUE'
                ? 'bg-[#FEF2F2] border-[#FCA5A5] text-[#B91C1C]'
                : dueBadge.status === 'DUE_SOON'
                ? 'bg-[#FFFBEB] border-[#FDE68A] text-[#B45309]'
                : 'bg-[#FAF9F6] border-[#E6E2DA] text-[#78716C]'
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 shrink-0" />
              <span>{dueBadge.label}</span>
            </div>
            <span className="font-semibold font-mono text-[11px] px-2 py-0.5 rounded-md bg-white/80 border border-current/20">
              {assignedTo === 'Cả hai' ? 'Cả 2 người phụ trách' : `${assignedTo} phụ trách`}
            </span>
          </div>

          {/* Hộp xác nhận đã chi (nếu đang bấm nút Xác nhận) */}
          {showConfirmPaid && (
            <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-2xl p-3.5 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center gap-2 text-xs font-bold text-[#065F46]">
                <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                <span>Xác nhận đã thanh toán khoản này vào Sổ cái</span>
              </div>
              <p className="text-[11px] text-[#047857] leading-relaxed">
                Khoản tiền <strong>{formatVND(Number(amountStr) || pendingExpense.amount)}</strong> sẽ được ghi thành khoản chi thực tế và trừ vào số dư tổ ấm.
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#065F46] mb-1">
                    Ai là người đã trả?
                  </label>
                  <div className="bg-white border border-[#A7F3D0] rounded-xl p-0.5 flex">
                    <button
                      type="button"
                      onClick={() => setActualPaidBy('Chồng')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        actualPaidBy === 'Chồng' ? 'bg-[#0F3D39] text-white' : 'text-[#065F46]'
                      }`}
                    >
                      Chồng
                    </button>
                    <button
                      type="button"
                      onClick={() => setActualPaidBy('Vợ')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        actualPaidBy === 'Vợ' ? 'bg-[#B45309] text-white' : 'text-[#065F46]'
                      }`}
                    >
                      Vợ
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#065F46] mb-1">
                    Ngày thanh toán
                  </label>
                  <input
                    type="date"
                    value={actualPaidDate}
                    onChange={(e) => setActualPaidDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-[#A7F3D0] bg-white text-xs font-mono text-[#065F46] focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowConfirmPaid(false)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold text-[#065F46] bg-white border border-[#A7F3D0] hover:bg-[#F0FDF4] transition-colors"
                >
                  Quay lại
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPaid}
                  disabled={isSubmittingPaid}
                  className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-[#059669] hover:bg-[#047857] shadow-sm flex items-center justify-center gap-1.5 transition-all"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSubmittingPaid ? 'Đang ghi sổ...' : 'Chốt đã thanh toán'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Ô số tiền */}
          <div>
            <label className="block text-xs font-medium text-[#78716C] mb-1.5">
              Số tiền cần chi (₫)
            </label>
            <div className="relative">
              <input
                type="number"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                min="0"
                step="1000"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] text-base font-bold font-mono text-[#B45309] focus:outline-none focus:ring-2 focus:ring-[#B45309]/20 focus:border-[#B45309]"
                required
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-[#A8A29E]">
                {formatVND(Number(amountStr))}
              </span>
            </div>
          </div>

          {/* Danh mục chi tiêu */}
          <div className="relative" ref={categoryDropdownRef}>
            <label className="block text-xs font-medium text-[#78716C] mb-1.5">
              Nhóm chi tiêu
            </label>
            <button
              type="button"
              onClick={() => setIsCategoryOpen(!isCategoryOpen)}
              className={`w-full px-3.5 py-2.5 rounded-xl border bg-[#FAF9F6] text-xs flex items-center justify-between transition-all cursor-pointer ${
                isCategoryOpen ? 'border-[#0F3D39] ring-2 ring-[#0F3D39]/20 bg-white' : 'border-[#E6E2DA]'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border border-[#E6E2DA]/80 bg-white shadow-2xs">
                  {renderCategoryIcon(selectedCategory?.icon, "w-3.5 h-3.5", selectedCategory?.color || '#0F3D39')}
                </span>
                <span className="font-semibold text-[#1C1917] truncate">
                  {selectedCategory?.name || 'Chọn danh mục'}
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-[#78716C] transition-transform duration-200 shrink-0 ${
                  isCategoryOpen ? 'rotate-180 text-[#0F3D39]' : ''
                }`}
              />
            </button>

            {isCategoryOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 max-h-52 overflow-y-auto bg-white border border-[#E6E2DA] rounded-2xl shadow-xl p-1.5 z-40 space-y-0.5 animate-in fade-in duration-150">
                {expenseCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      playActionClick();
                      triggerHaptic(8);
                      setSelectedCategoryId(cat.id);
                      setIsCategoryOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                      selectedCategoryId === cat.id ? 'bg-[#E7EFEF] text-[#0F3D39] font-semibold' : 'text-[#1C1917] hover:bg-[#FAF9F6]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border border-[#E6E2DA]/80 bg-[#FAF9F6] shadow-2xs">
                        {renderCategoryIcon(cat.icon, "w-3.5 h-3.5", cat.color || '#0F3D39')}
                      </span>
                      <span className="truncate">{cat.name}</span>
                    </div>
                    {selectedCategoryId === cat.id && <Check className="w-3.5 h-3.5 text-[#0F3D39] shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Gắn mục tiêu Tự do Tài chính nếu có */}
          {matchingGoals.length > 0 && (
            <div className="bg-[#FAF9F6] border border-[#E6E2DA] rounded-2xl p-2.5 flex flex-col gap-1.5 shadow-2xs">
              <div className="flex items-center justify-between px-0.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0F3D39]">
                  <Target className="w-3.5 h-3.5 text-[#B45309]" />
                  <span>Gắn vào mục tiêu Tự do Tài chính:</span>
                </div>
                {selectedGoalId && (
                  <button
                    type="button"
                    onClick={() => setSelectedGoalId(null)}
                    className="text-[10px] text-[#78716C] hover:text-[#E11D48] underline transition-colors cursor-pointer"
                  >
                    Không gắn
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {matchingGoals.map((g) => {
                  const isChosen = selectedGoalId === g.id;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => {
                        playActionClick();
                        triggerHaptic(8);
                        setSelectedGoalId(isChosen ? null : g.id);
                      }}
                      className={`shrink-0 px-2.5 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-all ${
                        isChosen
                          ? 'bg-[#0F3D39] text-white border-[#0F3D39] font-semibold'
                          : 'bg-white text-[#1C1917] border-[#E6E2DA] hover:bg-[#F5F3EF]'
                      }`}
                    >
                      <span>{renderGoalIcon(g.icon, g.type, "w-3 h-3", isChosen ? 'currentColor' : '#B45309')}</span>
                      <span className="truncate max-w-[130px]">{g.title}</span>
                      {isChosen && <Check className="w-3 h-3 stroke-[2.5]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Người phụ trách thanh toán */}
          <div>
            <label className="block text-xs font-medium text-[#78716C] mb-1.5">
              Phân công ai thanh toán?
            </label>
            <div className="bg-[#F5F3EF] border border-[#E6E2DA] rounded-2xl p-1 flex items-center shadow-2xs">
              {(['Chồng', 'Vợ', 'Cả hai'] as const).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => {
                    playActionClick();
                    triggerHaptic(8);
                    setAssignedTo(role);
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                    assignedTo === role
                      ? 'bg-[#B45309] text-white shadow-2xs font-bold'
                      : 'text-[#78716C] hover:text-[#1C1917]'
                  }`}
                >
                  {role === 'Cả hai' ? 'Cả hai' : `${role} phụ trách`}
                </button>
              ))}
            </div>
          </div>

          {/* Ngày đến hạn */}
          <div>
            <label className="block text-xs font-medium text-[#78716C] mb-1.5">
              Hạn chót thanh toán (Due Date)
            </label>
            <div className="relative">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] text-xs font-mono text-[#1C1917] focus:outline-none focus:border-[#B45309]"
                required
              />
              <Calendar className="w-4 h-4 text-[#78716C] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Ghi chú */}
          <div>
            <label className="block text-xs font-medium text-[#78716C] mb-1.5">
              Ghi chú / Tên hóa đơn
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Hóa đơn tiền điện EVN, Học phí..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] text-xs text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#0F3D39]"
            />
          </div>

          {/* Thanh công cụ hành động */}
          <div className="pt-3 border-t border-[#F5F3EF] flex flex-col sm:flex-row items-center justify-between gap-2.5">
            {/* Nút hành động nhanh: Xác nhận đã chi */}
            {!showConfirmPaid && (
              <button
                type="button"
                onClick={() => {
                  playActionClick();
                  triggerHaptic(10);
                  setShowConfirmPaid(true);
                }}
                disabled={isSaving || isDeleting}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#059669] text-white text-xs font-bold hover:bg-[#047857] shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Xác nhận đã chi ({formatVND(Number(amountStr) || pendingExpense.amount)})</span>
              </button>
            )}

            <div className="flex items-center justify-between w-full sm:w-auto gap-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting || isSaving || isSubmittingPaid}
                className="px-3 py-2.5 rounded-xl text-xs font-semibold text-[#E11D48] bg-white border border-[#FECDD3] hover:bg-[#FFF1F2] transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Đang xóa...' : 'Xóa'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    playActionClick();
                    onClose();
                  }}
                  disabled={isSaving || isDeleting || isSubmittingPaid}
                  className="px-3.5 py-2.5 rounded-xl border border-[#E6E2DA] text-xs font-semibold text-[#78716C] hover:bg-[#F5F3EF] transition-all cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isDeleting || isSubmittingPaid}
                  className="px-4 py-2.5 rounded-xl bg-[#0F3D39] text-white text-xs font-semibold hover:bg-[#134E48] shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
