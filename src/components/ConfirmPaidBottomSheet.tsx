import React, { useState, useEffect } from 'react';
import { Check, CheckCircle2, Calendar } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatVND, getLocalDateString, formatDisplayDate } from '../utils/currency';
import { playActionClick } from '../utils/audio';
import { BottomSheet } from './BottomSheet';
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

  const [paidBy, setPaidBy] = useState<'Chồng' | 'Vợ'>('Chồng');
  const [paidDate, setPaidDate] = useState<string>(getLocalDateString());
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (pendingExpense) {
      setPaidBy(userRole || 'Chồng');
      setPaidDate(getLocalDateString());
    }
  }, [pendingExpense, userRole]);

  if (!pendingExpense) return null;

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
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Xác nhận khoản chi"
      subtitle={pendingExpense.note || pendingExpense.categoryName}
      icon={
        <div className="w-8 h-8 rounded-xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center shadow-2xs font-bold shrink-0">
          <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
        </div>
      }
      footer={
        <div className="p-3 sm:p-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              playActionClick();
              onClose();
            }}
            disabled={isSubmitting}
            className="flex-1 min-h-[44px] py-2.5 rounded-2xl border border-[#E6E2DA] text-xs font-semibold text-[#78716C] hover:bg-[#F5F3EF] transition-all cursor-pointer flex items-center justify-center"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="flex-1 min-h-[44px] py-2.5 rounded-2xl bg-[#059669] text-white text-xs font-bold hover:bg-[#047857] shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{isSubmitting ? 'Đang ghi sổ...' : 'Xác nhận đã chi'}</span>
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Dòng mô tả ngắn gọn */}
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
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
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
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
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
            <div className="relative w-full min-w-0 flex items-center justify-between px-3.5 py-2.5 rounded-2xl border border-[#E6E2DA] bg-[#FAF9F6] text-xs font-mono text-[#1C1917] shadow-2xs hover:border-[#0F3D39] transition-colors">
              <div className="flex items-center gap-2 min-w-0">
                <Calendar className="w-4 h-4 text-[#0F3D39] shrink-0" />
                <span className="font-bold text-[#1C1917] tabular-nums tracking-tight">
                  {formatDisplayDate(paidDate)}
                </span>
              </div>
              <span className="text-[10px] text-[#A8A29E] font-sans shrink-0">
                Đổi ngày ▾
              </span>
              <input
                type="date"
                value={paidDate}
                onChange={(e) => setPaidDate(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                required
              />
            </div>
          </div>
        </div>
      </div>
    </BottomSheet>
  );
};
