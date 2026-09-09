import React, { useState, useEffect } from 'react';
import { X, Check, CheckCircle2, Calendar } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatVND, getLocalDateString } from '../utils/currency';
import { playActionClick } from '../utils/audio';
import { useBodyScrollLock } from '../utils/scrollLock';
import type { PendingExpense } from '../types';

interface ConfirmPaidBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  pendingExpense: PendingExpense | null;
  onSuccess?: () => void;
}

export const ConfirmPaidBottomSheet: React.FC<ConfirmPaidBottomSheetProps> = ({
  isOpen,
  onClose,
  pendingExpense,
  onSuccess
}) => {
  const { confirmPaidPendingExpense, userRole } = useApp();

  useBodyScrollLock(isOpen && Boolean(pendingExpense));

  const [paidBy, setPaidBy] = useState<'Chồng' | 'Vợ'>('Chồng');
  const [paidDate, setPaidDate] = useState<string>(getLocalDateString());
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (pendingExpense) {
      setPaidBy(userRole || 'Chồng');
      setPaidDate(getLocalDateString());
    }
  }, [pendingExpense, userRole]);

  if (!isOpen || !pendingExpense) return null;

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      await confirmPaidPendingExpense(pendingExpense, paidBy, paidDate);
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      console.error('Lỗi khi xác nhận khoản chi:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-70 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/55 backdrop-blur-xs animate-in fade-in duration-150 touch-none"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          playActionClick();
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="bg-white border border-[#E6E2DA] rounded-t-3xl sm:rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header ngắn gọn */}
        <div className="px-5 py-4 border-b border-[#F5F3EF] flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center shadow-2xs font-bold">
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1C1917]">Xác nhận khoản chi</h3>
              <p className="text-[11px] text-[#78716C] truncate max-w-[220px]">
                {pendingExpense.note || pendingExpense.categoryName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              playActionClick();
              onClose();
            }}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-xl text-[#78716C] hover:text-[#1C1917] hover:bg-[#F5F3EF] flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nội dung xác nhận */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* Dòng mô tả ngắn gọn theo đúng yêu cầu */}
          <div className="bg-[#FAF9F6] border border-[#E6E2DA] rounded-2xl p-3.5 text-xs text-[#1C1917] leading-relaxed shadow-2xs">
            Khoản tiền <strong className="font-mono font-bold text-[#0F3D39]">{formatVND(pendingExpense.amount)}</strong> sẽ được ghi vào sổ cái và trừ vào số dư.
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Ai đã trả */}
            <div>
              <label className="block text-[11px] font-semibold text-[#78716C] mb-1.5 uppercase tracking-wider">
                Ai đã trả?
              </label>
              <div className="bg-[#F5F3EF] border border-[#E6E2DA] rounded-2xl p-1 flex shadow-2xs">
                <button
                  type="button"
                  onClick={() => setPaidBy('Chồng')}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                    paidBy === 'Chồng'
                      ? 'bg-[#0F3D39] text-white shadow-2xs font-bold'
                      : 'text-[#78716C] hover:text-[#1C1917]'
                  }`}
                >
                  Chồng
                </button>
                <button
                  type="button"
                  onClick={() => setPaidBy('Vợ')}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                    paidBy === 'Vợ'
                      ? 'bg-[#B45309] text-white shadow-2xs font-bold'
                      : 'text-[#78716C] hover:text-[#1C1917]'
                  }`}
                >
                  Vợ
                </button>
              </div>
            </div>

            {/* Ngày chi */}
            <div>
              <label className="block text-[11px] font-semibold text-[#78716C] mb-1.5 uppercase tracking-wider">
                Ngày thanh toán
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={paidDate}
                  onChange={(e) => setPaidDate(e.target.value)}
                  className="w-full box-border block px-3 py-2 rounded-2xl border border-[#E6E2DA] bg-[#FAF9F6] text-xs font-mono text-[#1C1917] focus:outline-none focus:border-[#0F3D39]"
                  required
                />
                <Calendar className="w-3.5 h-3.5 text-[#78716C] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Các nút bấm hành động */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                playActionClick();
                onClose();
              }}
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-2xl border border-[#E6E2DA] text-xs font-semibold text-[#78716C] hover:bg-[#F5F3EF] transition-all cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-2xl bg-[#059669] text-white text-xs font-bold hover:bg-[#047857] shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{isSubmitting ? 'Đang ghi sổ...' : 'Xác nhận đã chi'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
