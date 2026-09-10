import React, { useState, useEffect } from 'react';
import { X, Check, Calendar, CreditCard as CardIcon, ReceiptText, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatVND, getLocalDateString, formatDisplayDate } from '../utils/currency';
import { playActionClick } from '../utils/audio';
import { useBodyScrollLock } from '../utils/scrollLock';
import type { CreditCard, Transaction } from '../types';

interface SettleCreditCardBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  card: CreditCard | null;
  transactions: Transaction[];
  totalAmount: number;
  dueDate: string;
}

export const SettleCreditCardBottomSheet: React.FC<SettleCreditCardBottomSheetProps> = ({
  isOpen,
  onClose,
  card,
  transactions,
  totalAmount,
  dueDate
}) => {
  const { settleCard, userRole } = useApp();

  useBodyScrollLock(isOpen && Boolean(card));

  const [paidBy, setPaidBy] = useState<'Chồng' | 'Vợ'>('Chồng');
  const [paidDate, setPaidDate] = useState<string>(getLocalDateString());
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (card) {
      setPaidBy(userRole || 'Chồng');
      setPaidDate(getLocalDateString());
    }
  }, [card, userRole]);

  if (!isOpen || !card) return null;

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      await settleCard(card.id, paidBy, paidDate);
      onClose();
    } catch (err) {
      console.error('Lỗi khi quyết toán thẻ:', err);
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
        className="bg-white border border-[#E6E2DA] rounded-t-3xl sm:rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[88vh] animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bottom Sheet */}
        <div className="px-5 py-4 border-b border-[#F5F3EF] flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-2xs font-bold shrink-0"
              style={{ backgroundColor: card.color || '#0F3D39' }}
            >
              <CardIcon className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-[#1C1917] truncate">
                Quyết toán sao kê {card.name}
              </h3>
              <p className="text-[11px] text-[#78716C] font-mono truncate">
                {card.name} •••• {card.last4Digits}
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

        {/* Nội dung cuộn */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 overscroll-contain flex-1">
          {/* Card Tóm tắt Dư nợ sao kê */}
          <div
            className="rounded-2xl p-4 text-white shadow-sm relative overflow-hidden flex flex-col justify-between"
            style={{
              background: `linear-gradient(135deg, ${card.color || '#0F3D39'}, #1C1917)`
            }}
          >
            {/* Họa tiết trang trí chìm */}
            <div className="absolute -right-4 -bottom-6 opacity-15 pointer-events-none">
              <CardIcon className="w-28 h-28 text-white" />
            </div>

            <div className="flex items-center justify-between text-xs opacity-90 mb-2">
              <span className="font-semibold uppercase tracking-wider">{card.name}</span>
              <span className="font-mono bg-white/20 px-2 py-0.5 rounded-md text-[10px]">
                •••• {card.last4Digits}
              </span>
            </div>

            <div className="my-1">
              <p className="text-[11px] opacity-80 uppercase tracking-wider">Tổng dư nợ cần thanh toán</p>
              <p className="text-2xl sm:text-3xl font-bold font-mono tracking-tight tabular-nums mt-0.5">
                {formatVND(totalAmount)}
              </p>
            </div>

            <div className="flex items-center justify-between text-[11px] opacity-85 pt-2 border-t border-white/15">
              <span>Hạn sao kê: {formatDisplayDate(dueDate)}</span>
              <span>{transactions.length} khoản quẹt</span>
            </div>
          </div>

          {/* Dòng giải thích phương án hạch toán */}
          <div className="bg-[#FAF9F6] border border-[#E6E2DA] rounded-2xl p-3 text-xs text-[#78716C] flex items-start gap-2 leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-[#0F3D39] shrink-0 mt-0.5" />
            <p>
              Các khoản chi quẹt thẻ đã được tính vào ngân sách chi tiêu tháng lúc phát sinh. Bấm xác nhận sẽ chuyển trạng thái sang <strong>Đã tất toán sao kê</strong> từ tài khoản của người chi.
            </p>
          </div>

          {/* Bộ chọn Người thanh toán & Ngày thanh toán */}
          <div className="grid grid-cols-2 gap-3">
            {/* Ai đã thanh toán */}
            <div>
              <label className="block text-[11px] font-semibold text-[#78716C] mb-1.5 uppercase tracking-wider">
                Ai thanh toán?
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

            {/* Ngày thanh toán */}
            <div>
              <label className="block text-[11px] font-semibold text-[#78716C] mb-1.5 uppercase tracking-wider">
                Ngày thanh toán
              </label>
              <div className="relative w-full min-w-0 flex items-center justify-between px-3.5 py-2.5 rounded-2xl border border-[#E6E2DA] bg-[#FAF9F6] text-xs font-mono text-[#1C1917] shadow-2xs hover:border-[#0F3D39] transition-colors">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Calendar className="w-3.5 h-3.5 text-[#0F3D39] shrink-0" />
                  <span className="font-bold text-[#1C1917] tabular-nums tracking-tight">
                    {formatDisplayDate(paidDate)}
                  </span>
                </div>
                <span className="text-[10px] text-[#A8A29E] font-sans shrink-0">
                  Đổi ▾
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

          {/* Danh sách các khoản quẹt trong kỳ này */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#1C1917] flex items-center gap-1.5">
                <ReceiptText className="w-3.5 h-3.5 text-[#78716C]" />
                Các khoản quẹt thẻ trong kỳ ({transactions.length})
              </span>
              <span className="text-xs font-mono font-bold text-[#0F3D39]">
                {formatVND(totalAmount)}
              </span>
            </div>

            <div className="divide-y divide-[#F5F3EF] border border-[#E6E2DA] rounded-2xl overflow-hidden bg-[#FAF9F6] max-h-48 overflow-y-auto">
              {transactions.length === 0 ? (
                <div className="p-3 text-center text-xs text-[#A8A29E]">
                  Không có giao dịch quẹt thẻ nào đang chờ quyết toán.
                </div>
              ) : (
                transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-2.5 text-xs">
                    <div className="min-w-0 pr-2">
                      <p className="font-semibold text-[#1C1917] truncate">
                        {tx.note || tx.categoryName}
                      </p>
                      <p className="text-[10px] text-[#78716C] font-mono">
                        {formatDisplayDate(tx.date)} • {tx.paidBy} quẹt
                      </p>
                    </div>
                    <span className="font-mono font-bold text-[#1C1917] shrink-0 tabular-nums">
                      {formatVND(tx.amount)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer Nút hành động */}
        <div className="p-4 pb-6 sm:pb-4 border-t border-[#F5F3EF] bg-white shrink-0 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              playActionClick();
              onClose();
            }}
            disabled={isSubmitting}
            className="flex-1 min-h-[44px] py-3 rounded-2xl border border-[#E6E2DA] text-xs font-semibold text-[#78716C] hover:bg-[#F5F3EF] transition-all cursor-pointer flex items-center justify-center"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting || transactions.length === 0}
            className="flex-2 min-h-[44px] py-3 rounded-2xl bg-[#0F3D39] text-white text-xs font-bold hover:bg-[#134E48] shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            <Check className="w-4 h-4 stroke-[2.5] shrink-0" />
            <span className="truncate">{isSubmitting ? 'Đang quyết toán...' : `Xác nhận đã trả (${formatVND(totalAmount)})`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
