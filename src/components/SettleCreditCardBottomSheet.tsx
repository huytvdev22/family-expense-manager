import React, { useState, useEffect } from 'react';
import { Check, Calendar, CreditCard as CardIcon, ReceiptText, ShieldCheck, Gift, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatVND, getLocalDateString, formatDisplayDate } from '../utils/currency';
import { playActionClick } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';
import { BottomSheet } from './BottomSheet';
import type { CreditCard, Transaction, UnsettledCardGroup } from '../types';

interface SettleCreditCardBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  card: CreditCard | null;
  group?: UnsettledCardGroup | null;
  transactions?: Transaction[];
  totalAmount?: number;
  dueDate?: string;
}

const CASHBACK_PRESETS = [100000, 200000, 300000, 500000];

export const SettleCreditCardBottomSheet: React.FC<SettleCreditCardBottomSheetProps> = ({
  isOpen,
  onClose,
  card,
  group,
  transactions = [],
  totalAmount = 0,
  dueDate = ''
}) => {
  const { settleCard, userRole } = useApp();

  const [paidBy, setPaidBy] = useState<'Chồng' | 'Vợ'>('Chồng');
  const [paidDate, setPaidDate] = useState<string>(getLocalDateString());
  const [settleMode, setSettleMode] = useState<'STATEMENT_ONLY' | 'ALL'>('STATEMENT_ONLY');
  const [cashbackRaw, setCashbackRaw] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (card) {
      setPaidBy(userRole || 'Chồng');
      setPaidDate(getLocalDateString());
      setCashbackRaw('');
      // Nếu có nợ sao kê kỳ này thì mặc định chọn STATEMENT_ONLY, nếu không thì chọn ALL
      if (group && group.statementAmount > 0) {
        setSettleMode('STATEMENT_ONLY');
      } else {
        setSettleMode('ALL');
      }
    }
  }, [card, userRole, group, isOpen]);

  if (!card) return null;

  const hasStatementDebt = (group?.statementAmount ?? 0) > 0;
  const hasNextCycleDebt = (group?.nextCycleAmount ?? 0) > 0;
  const showModeSelector = Boolean(group && hasStatementDebt && hasNextCycleDebt);

  const activeAmount = settleMode === 'STATEMENT_ONLY' && group
    ? group.statementAmount
    : (group?.totalAmount ?? totalAmount);

  const activeTxs = settleMode === 'STATEMENT_ONLY' && group
    ? group.statementTxs
    : (group?.transactions ?? transactions);

  const activeDueDate = settleMode === 'STATEMENT_ONLY' && group
    ? group.currentDueDate
    : (group?.statementAmount ? group.currentDueDate : group?.nextDueDate || dueDate);

  const cashbackAmount = parseInt(cashbackRaw.replace(/\D/g, ''), 10) || 0;
  const netAmount = Math.max(0, activeAmount - cashbackAmount);

  const handleCashbackInput = (val: string) => {
    const digits = val.replace(/\D/g, '');
    setCashbackRaw(digits);
  };

  const formattedCashbackInput = cashbackAmount > 0
    ? new Intl.NumberFormat('vi-VN').format(cashbackAmount)
    : '';

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      await settleCard(card.id, paidBy, settleMode, paidDate, cashbackAmount > 0 ? cashbackAmount : undefined);
      onClose();
    } catch (err) {
      console.error('Lỗi khi quyết toán thẻ:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={`Quyết toán sao kê ${card.name}`}
      subtitle={`${card.name} •••• ${card.last4Digits}`}
      icon={
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-2xs font-bold shrink-0"
          style={{ backgroundColor: card.color || '#0F3D39' }}
        >
          <CardIcon className="w-4 h-4 stroke-[2.5]" />
        </div>
      }
      maxHeight="max-h-[92dvh] sm:max-h-[88vh]"
      footer={
        <div className="p-3 sm:p-4 flex items-center gap-2">
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
            disabled={isSubmitting || activeTxs.length === 0}
            className="flex-2 min-h-[44px] py-3 rounded-2xl bg-[#0F3D39] text-white text-xs font-bold hover:bg-[#134E48] shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            <Check className="w-4 h-4 stroke-[2.5] shrink-0" />
            <span className="truncate">
              {isSubmitting
                ? 'Đang quyết toán...'
                : cashbackAmount > 0
                ? `Xác nhận trả (${formatVND(netAmount)})`
                : `Xác nhận đã trả (${formatVND(activeAmount)})`}
            </span>
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Card Tóm tắt Dư nợ & Khấu trừ Cashback */}
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
            <p className="text-[11px] opacity-80 uppercase tracking-wider">
              {cashbackAmount > 0
                ? 'Số tiền thực trả (Sau khi trừ Cashback)'
                : settleMode === 'STATEMENT_ONLY'
                ? 'Dư nợ sao kê đến hạn cần thanh toán'
                : 'Tổng dư nợ quyết toán'}
            </p>
            <p className="text-2xl sm:text-3xl font-bold font-mono tracking-tight tabular-nums mt-0.5">
              {formatVND(netAmount)}
            </p>

            {cashbackAmount > 0 && (
              <div className="flex items-center gap-2 mt-1.5 text-[11px] font-mono">
                <span className="opacity-75 line-through">{formatVND(activeAmount)}</span>
                <span className="bg-[#059669] text-white px-2 py-0.5 rounded-md font-bold">
                  🎁 Hoàn tiền: -{formatVND(cashbackAmount)}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] opacity-85 pt-2 border-t border-white/15">
            <span>Hạn sao kê: {formatDisplayDate(activeDueDate)}</span>
            <span>{activeTxs.length} khoản quẹt</span>
          </div>
        </div>

        {/* Bộ chọn Chế độ quyết toán: Trả sao kê kỳ này vs Tất toán toàn bộ */}
        {showModeSelector && (
          <div>
            <label className="block text-[11px] font-semibold text-[#78716C] mb-1.5 uppercase tracking-wider">
              Khoản muốn thanh toán
            </label>
            <div className="grid grid-cols-2 gap-2 bg-[#F5F3EF] p-1 rounded-2xl border border-[#E6E2DA]">
              <button
                type="button"
                onClick={() => {
                  playActionClick();
                  setSettleMode('STATEMENT_ONLY');
                }}
                className={`py-2.5 px-3 rounded-xl text-xs transition-all cursor-pointer text-left ${
                  settleMode === 'STATEMENT_ONLY'
                    ? 'bg-[#0F3D39] text-white shadow-2xs font-bold'
                    : 'text-[#78716C] hover:text-[#1C1917]'
                }`}
              >
                <div className="font-semibold truncate">Trả sao kê kỳ này</div>
                <div className={`text-[11px] font-mono font-bold mt-0.5 ${settleMode === 'STATEMENT_ONLY' ? 'text-[#A7F3D0]' : 'text-[#B45309]'}`}>
                  {formatVND(group!.statementAmount)}
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  playActionClick();
                  setSettleMode('ALL');
                }}
                className={`py-2.5 px-3 rounded-xl text-xs transition-all cursor-pointer text-left ${
                  settleMode === 'ALL'
                    ? 'bg-[#0F3D39] text-white shadow-2xs font-bold'
                    : 'text-[#78716C] hover:text-[#1C1917]'
                }`}
              >
                <div className="font-semibold truncate">Tất toán toàn bộ</div>
                <div className={`text-[11px] font-mono font-bold mt-0.5 ${settleMode === 'ALL' ? 'text-[#A7F3D0]' : 'text-[#78716C]'}`}>
                  {formatVND(group!.totalAmount)}
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Khối nhập Tiền hoàn thẻ / Cashback kỳ này */}
        <div className="bg-[#FAF9F6] border border-[#E6E2DA] rounded-2xl p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-[#0F3D39] uppercase tracking-wider flex items-center gap-1.5">
              <Gift className="w-3.5 h-3.5 text-[#059669]" />
              <span>Tiền hoàn thẻ / Cashback kỳ này (Tùy chọn)</span>
            </label>
            {cashbackAmount > 0 && (
              <button
                type="button"
                onClick={() => {
                  playActionClick();
                  setCashbackRaw('');
                }}
                className="text-[10px] text-[#78716C] hover:text-[#DC2626] flex items-center gap-0.5 cursor-pointer"
              >
                <X className="w-3 h-3" />
                <span>Xóa</span>
              </button>
            )}
          </div>

          <div className="relative flex items-center">
            <input
              type="text"
              inputMode="numeric"
              value={formattedCashbackInput}
              onChange={(e) => handleCashbackInput(e.target.value)}
              placeholder="Nhập số tiền ngân hàng hoàn (VD: 300.000)"
              className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-[#E6E2DA] bg-white text-xs font-mono font-bold text-[#059669] placeholder:font-sans placeholder:font-normal placeholder:text-[#A8A29E] focus:outline-none focus:border-[#059669] transition-colors"
            />
            <span className="absolute right-3.5 text-xs font-mono font-bold text-[#78716C] pointer-events-none">
              ₫
            </span>
          </div>

          {/* Các mức Cashback gợi ý 1-chạm */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {CASHBACK_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  playActionClick();
                  triggerHaptic(6);
                  setCashbackRaw(String(preset));
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold border transition-all cursor-pointer ${
                  cashbackAmount === preset
                    ? 'bg-[#059669] text-white border-[#059669] shadow-2xs'
                    : 'bg-white text-[#78716C] border-[#E6E2DA] hover:border-[#059669] hover:text-[#059669]'
                }`}
              >
                +{preset / 1000}k
              </button>
            ))}
          </div>

          {cashbackAmount > 0 && (
            <p className="text-[11px] text-[#059669] font-medium leading-relaxed">
              ✓ Hệ thống sẽ tự động ghi nhận <strong>+{formatVND(cashbackAmount)}</strong> vào danh mục <strong>Hoàn tiền & Ưu đãi thẻ</strong> trong tháng này.
            </p>
          )}
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

        {/* Dòng giải thích phương án hạch toán */}
        <div className="bg-[#FAF9F6] border border-[#E6E2DA] rounded-2xl p-3 text-xs text-[#78716C] flex items-start gap-2 leading-relaxed">
          <ShieldCheck className="w-4 h-4 text-[#0F3D39] shrink-0 mt-0.5" />
          <p>
            Các khoản chi quẹt thẻ đã được tính vào ngân sách chi tiêu tháng lúc phát sinh. Bấm xác nhận sẽ chuyển trạng thái sang <strong>Đã tất toán sao kê</strong> từ tài khoản của người chi.
          </p>
        </div>

        {/* Danh sách các khoản quẹt được chọn thanh toán */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#1C1917] flex items-center gap-1.5">
              <ReceiptText className="w-3.5 h-3.5 text-[#78716C]" />
              Khoản quẹt thanh toán đợt này ({activeTxs.length})
            </span>
            <span className="text-xs font-mono font-bold text-[#0F3D39]">
              {formatVND(activeAmount)}
            </span>
          </div>

          <div className="divide-y divide-[#F5F3EF] border border-[#E6E2DA] rounded-2xl overflow-hidden bg-[#FAF9F6] max-h-48 overflow-y-auto">
            {activeTxs.length === 0 ? (
              <div className="p-3 text-center text-xs text-[#A8A29E]">
                Không có giao dịch quẹt thẻ nào đang chờ quyết toán.
              </div>
            ) : (
              activeTxs.map((tx) => (
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
    </BottomSheet>
  );
};
