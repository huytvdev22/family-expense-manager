import React, { useState, useEffect, useMemo } from 'react';
import { X, Check, Trash2, Calendar, Tag, User, DollarSign, FileText } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from './Toast';
import { formatVND } from '../utils/currency';
import { playActionClick } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';
import type { Transaction, CategoryKey } from '../types';

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  isOpen,
  onClose,
  transaction
}) => {
  const { categories, editTransaction, removeTransaction } = useApp();
  const { showToast } = useToast();

  const [txType, setTxType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [amountStr, setAmountStr] = useState<string>('0');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [paidBy, setPaidBy] = useState<'Chồng' | 'Vợ'>('Chồng');
  const [date, setDate] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Khởi tạo form khi transaction thay đổi
  useEffect(() => {
    if (transaction) {
      setTxType(transaction.type || 'EXPENSE');
      setAmountStr(String(transaction.amount));
      setSelectedCategoryId(transaction.categoryId);
      setPaidBy(transaction.paidBy as 'Chồng' | 'Vợ');
      setDate(transaction.date || new Date().toISOString().split('T')[0]);
      setNote(transaction.note || '');
    }
  }, [transaction]);

  // Lọc danh mục theo loại giao dịch
  const currentCategories = useMemo(() => {
    const list = categories.filter((c) => (!c.isArchived || c.id === transaction?.categoryId) && (c.type || 'EXPENSE') === txType);
    return list.length > 0 ? list : categories;
  }, [categories, txType, transaction?.categoryId]);

  // Đảm bảo selectedCategoryId luôn hợp lệ với loại giao dịch
  useEffect(() => {
    if (currentCategories.length > 0 && !currentCategories.some((c) => c.id === selectedCategoryId)) {
      setSelectedCategoryId(currentCategories[0].id);
    }
  }, [txType, currentCategories, selectedCategoryId]);

  if (!isOpen || !transaction) return null;

  // Xử lý lưu thay đổi
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(amountStr);
    if (isNaN(amount) || amount <= 0) {
      showToast('Vui lòng nhập số tiền lớn hơn 0', 'warning');
      return;
    }

    if (!date) {
      showToast('Vui lòng chọn ngày giao dịch', 'warning');
      return;
    }

    const cat = categories.find((c) => c.id === selectedCategoryId) || currentCategories[0];
    if (!cat) {
      showToast('Vui lòng chọn danh mục hợp lệ', 'warning');
      return;
    }

    try {
      setIsSaving(true);
      playActionClick();
      triggerHaptic(10);

      const updatedTx: Transaction = {
        ...transaction,
        amount,
        type: txType,
        categoryId: cat.id,
        categoryName: cat.name,
        categoryKey: cat.categoryKey as CategoryKey,
        paidBy,
        note: note.trim() || cat.name,
        date
      };

      await editTransaction(transaction, updatedTx);
      showToast(`Đã cập nhật ${txType === 'EXPENSE' ? 'khoản chi' : 'thu nhập'} thành công!`, 'success');
      onClose();
    } catch (err) {
      console.error('Lỗi khi cập nhật giao dịch:', err);
      showToast('Có lỗi xảy ra khi lưu thay đổi.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Xử lý xóa nhanh từ modal
  const handleDelete = async () => {
    const typeLabel = transaction.type === 'INCOME' ? 'khoản thu' : 'khoản chi';
    if (window.confirm(`Bạn có chắc muốn xóa ${typeLabel} "${transaction.note || transaction.categoryName}" (${formatVND(transaction.amount)})?`)) {
      try {
        setIsDeleting(true);
        playActionClick();
        triggerHaptic(15);
        await removeTransaction(transaction);
        showToast(`Đã xóa ${typeLabel}`, 'info');
        onClose();
      } catch (err) {
        console.error('Lỗi khi xóa giao dịch:', err);
        showToast('Có lỗi xảy ra khi xóa.', 'error');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        role="dialog" 
        aria-modal="true" 
        className="bg-white border border-[#E6E2DA] rounded-3xl w-full max-w-md p-5 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-[#F5F3EF]">
          <h3 className="text-base font-bold text-[#1C1917]">
            Chỉnh sửa {txType === 'EXPENSE' ? 'khoản chi' : 'thu nhập'}
          </h3>
          <button
            type="button"
            onClick={() => {
              playActionClick();
              onClose();
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#A8A29E] hover:text-[#1C1917] hover:bg-[#F5F3EF] transition-all cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-4 space-y-4">
          {/* Bộ chọn loại giao dịch: Khoản chi vs Thu nhập */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-[#F5F3EF] border border-[#E6E2DA] rounded-2xl shadow-2xs">
            <button
              type="button"
              onClick={() => {
                playActionClick();
                triggerHaptic(10);
                setTxType('EXPENSE');
              }}
              className={`py-2 rounded-xl text-xs font-semibold transition-all tactile-btn cursor-pointer ${
                txType === 'EXPENSE'
                  ? 'bg-white text-[#C15C3D] shadow-xs'
                  : 'text-[#78716C] hover:text-[#1C1917]'
              }`}
            >
              Khoản chi
            </button>
            <button
              type="button"
              onClick={() => {
                playActionClick();
                triggerHaptic(10);
                setTxType('INCOME');
              }}
              className={`py-2 rounded-xl text-xs font-semibold transition-all tactile-btn cursor-pointer ${
                txType === 'INCOME'
                  ? 'bg-[#0F3D39] text-white shadow-xs'
                  : 'text-[#78716C] hover:text-[#1C1917]'
              }`}
            >
              Thu nhập
            </button>
          </div>

          {/* Nhập số tiền */}
          <div>
            <label className="block text-xs font-medium text-[#78716C] mb-1.5">
              Số tiền (VNĐ)
            </label>
            <div className="relative">
              <input
                type="number"
                min="1000"
                step="1000"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] font-mono text-lg font-bold text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#0F3D39]/20 focus:border-[#0F3D39]"
                placeholder="Nhập số tiền..."
                required
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-medium text-[#78716C]">
                {formatVND(Number(amountStr) || 0)}
              </div>
            </div>
          </div>

          {/* Chọn danh mục */}
          <div>
            <label className="block text-xs font-medium text-[#78716C] mb-1.5">
              Danh mục {txType === 'EXPENSE' ? 'chi tiêu' : 'thu nhập'}
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1 border border-[#F5F3EF] rounded-2xl bg-[#FAF9F6]">
              {currentCategories.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      playActionClick();
                      triggerHaptic(10);
                      setSelectedCategoryId(cat.id);
                    }}
                    className={`flex items-center gap-2 p-2 rounded-xl text-left text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white text-[#1C1917] font-semibold shadow-xs border border-[#E6E2DA]'
                        : 'text-[#78716C] hover:bg-white/60'
                    }`}
                  >
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color || '#0F3D39' }}
                    />
                    <span className="truncate">{cat.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#0F3D39] ml-auto shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chọn người chi / người nhận */}
          <div>
            <label className="block text-xs font-medium text-[#78716C] mb-1.5">
              {txType === 'EXPENSE' ? 'Người chi tiền' : 'Người nhận tiền'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['Chồng', 'Vợ'] as const).map((person) => {
                const isSelected = paidBy === person;
                return (
                  <button
                    key={person}
                    type="button"
                    onClick={() => {
                      playActionClick();
                      triggerHaptic(10);
                      setPaidBy(person);
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? person === 'Chồng'
                          ? 'border-[#0F3D39] bg-[#E7EFEF] text-[#0F3D39]'
                          : 'border-[#B45309] bg-[#FEF3C7] text-[#B45309]'
                        : 'border-[#E6E2DA] bg-white text-[#78716C] hover:bg-[#FAF9F6]'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>{person}</span>
                    {isSelected && <Check className="w-3 h-3 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ngày giao dịch */}
          <div>
            <label className="block text-xs font-medium text-[#78716C] mb-1.5">
              Ngày ghi nhận
            </label>
            <div className="relative">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] text-xs font-mono text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#0F3D39]/20 focus:border-[#0F3D39]"
                required
              />
            </div>
          </div>

          {/* Ghi chú */}
          <div>
            <label className="block text-xs font-medium text-[#78716C] mb-1.5">
              Ghi chú thêm
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Cà phê sáng, Đi siêu thị..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] text-xs text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#0F3D39]/20 focus:border-[#0F3D39]"
            />
          </div>

          {/* Các nút hành động */}
          <div className="pt-3 border-t border-[#F5F3EF] flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting || isSaving}
              className="px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#E11D48] hover:bg-[#FFF1F2] border border-transparent hover:border-[#FDA4AF] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isDeleting ? 'Đang xóa...' : 'Xóa khoản này'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  playActionClick();
                  onClose();
                }}
                disabled={isSaving || isDeleting}
                className="px-3.5 py-2.5 rounded-xl border border-[#E6E2DA] text-xs font-semibold text-[#78716C] hover:bg-[#F5F3EF] transition-all cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSaving || isDeleting}
                className="px-4 py-2.5 rounded-xl bg-[#0F3D39] text-white text-xs font-semibold hover:bg-[#134E48] shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
