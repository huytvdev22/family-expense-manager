import React, { useState } from 'react';
import {
  History,
  Calendar,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  AlertTriangle,
  CreditCard as CardIcon,
  ReceiptText,
  Gift,
  Plus,
  Check,
  X,
  Trash2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatVND, formatCompactVND, formatDisplayDate, getLocalDateString } from '../utils/currency';
import { playActionClick } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';
import { BottomSheet } from './BottomSheet';
import type { SettlementBatch } from '../types';

interface SettlementHistoryBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettlementHistoryBottomSheet: React.FC<SettlementHistoryBottomSheetProps> = ({
  isOpen,
  onClose
}) => {
  const {
    settlementBatches,
    undoSettlement,
    compactCurrency,
    activeCreditCards,
    totalCardCashback,
    cardCashbackByCardId,
    cashbackTransactions,
    recordCardCashback,
    removeTransaction,
    userRole
  } = useApp();

  const [expandedBatchIds, setExpandedBatchIds] = useState<Record<string, boolean>>({});
  const [confirmingUndoBatchId, setConfirmingUndoBatchId] = useState<string | null>(null);
  const [isUndoing, setIsUndoing] = useState<boolean>(false);

  // State cho Form ghi nhận Cashback lẻ nhanh
  const [showAddCashback, setShowAddCashback] = useState<boolean>(false);
  const [selectedCardId, setSelectedCardId] = useState<string>('');
  const [cashbackRaw, setCashbackRaw] = useState<string>('');
  const [receivedBy, setReceivedBy] = useState<'Chồng' | 'Vợ'>(userRole || 'Chồng');
  const [cashbackDate, setCashbackDate] = useState<string>(getLocalDateString());
  const [cashbackNote, setCashbackNote] = useState<string>('');
  const [isSavingCashback, setIsSavingCashback] = useState<boolean>(false);

  const displayAmount = (amount: number) => {
    return compactCurrency ? formatCompactVND(amount) : formatVND(amount);
  };

  const toggleExpand = (batchId: string) => {
    playActionClick();
    triggerHaptic(6);
    setExpandedBatchIds((prev) => ({
      ...prev,
      [batchId]: !prev[batchId]
    }));
  };

  const handleOpenAddCashback = () => {
    playActionClick();
    triggerHaptic(8);
    if (!selectedCardId && activeCreditCards.length > 0) {
      setSelectedCardId(activeCreditCards[0].id);
    }
    setReceivedBy(userRole || 'Chồng');
    setCashbackDate(getLocalDateString());
    setCashbackRaw('');
    setCashbackNote('');
    setShowAddCashback(true);
  };

  const cashbackNumeric = parseInt(cashbackRaw.replace(/\D/g, ''), 10) || 0;
  const formattedCashback = cashbackNumeric > 0
    ? new Intl.NumberFormat('vi-VN').format(cashbackNumeric)
    : '';

  const handleSaveStandaloneCashback = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetCardId = selectedCardId || activeCreditCards[0]?.id;
    if (!targetCardId || cashbackNumeric <= 0) return;

    try {
      setIsSavingCashback(true);
      await recordCardCashback(targetCardId, cashbackNumeric, receivedBy, cashbackDate, cashbackNote);
      setShowAddCashback(false);
      setCashbackRaw('');
      setCashbackNote('');
    } catch (err) {
      console.error('Lỗi khi lưu cashback:', err);
    } finally {
      setIsSavingCashback(false);
    }
  };

  const handleConfirmUndo = async (batch: SettlementBatch) => {
    try {
      setIsUndoing(true);
      await undoSettlement(batch);
      setConfirmingUndoBatchId(null);
    } catch (err) {
      console.error('Lỗi khi hoàn tác quyết toán:', err);
    } finally {
      setIsUndoing(false);
    }
  };

  // Các khoản cashback độc lập (không gắn trực tiếp với một settlementBatchId hoặc hiển thị tất cả)
  const batchCashbackTxIds = new Set(
    settlementBatches.map((b) => b.cashbackTxId).filter(Boolean) as string[]
  );
  const standaloneCashbacks = cashbackTransactions.filter((tx) => !batchCashbackTxIds.has(tx.id));

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Lịch sử quyết toán & Cashback"
      subtitle={`${settlementBatches.length} đợt sao kê • Đã hoàn ${formatVND(totalCardCashback)}`}
      icon={
        <div className="w-9 h-9 rounded-xl bg-[#0F3D39] text-white flex items-center justify-center shadow-2xs">
          <History className="w-4 h-4 stroke-[2.5]" />
        </div>
      }
      maxHeight="max-h-[92dvh] sm:max-h-[85vh]"
    >
      <div className="space-y-4 pb-6">
        {/* Banner Thống kê Tổng Cashback & Nút Ghi nhận Hoàn tiền thẻ */}
        <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-2xl p-3.5 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#059669] text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Gift className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#047857]">
                  Tổng tiền hoàn thẻ (Cashback)
                </p>
                <p className="text-base sm:text-lg font-mono font-bold text-[#065F46] tabular-nums leading-tight mt-0.5">
                  +{formatVND(totalCardCashback)}
                </p>
              </div>
            </div>

            {activeCreditCards.length > 0 && !showAddCashback && (
              <button
                type="button"
                onClick={handleOpenAddCashback}
                className="px-3 py-2 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold flex items-center gap-1 shadow-2xs transition-all cursor-pointer shrink-0 active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Ghi nhận Cashback</span>
              </button>
            )}
          </div>

          {/* Thống kê nhanh Cashback theo từng thẻ */}
          {activeCreditCards.length > 0 && totalCardCashback > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-[#A7F3D0]/60">
              {activeCreditCards.map((c) => {
                const cb = cardCashbackByCardId[c.id] || 0;
                if (cb <= 0) return null;
                return (
                  <span
                    key={c.id}
                    className="px-2 py-0.5 rounded-lg bg-white/90 border border-[#A7F3D0] text-[10px] font-mono text-[#065F46] flex items-center gap-1"
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: c.color || '#0F3D39' }}
                    />
                    <span className="font-semibold">{c.name}:</span>
                    <span className="font-bold">+{displayAmount(cb)}</span>
                  </span>
                );
              })}
            </div>
          )}

          {/* Form Ghi nhận nhanh Cashback rời */}
          {showAddCashback && (
            <form
              onSubmit={handleSaveStandaloneCashback}
              className="bg-white border border-[#A7F3D0] rounded-xl p-3 space-y-3 animate-in fade-in duration-150"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#065F46] flex items-center gap-1.5">
                  <Gift className="w-3.5 h-3.5 text-[#059669]" />
                  Ghi nhận khoản hoàn tiền thẻ
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddCashback(false)}
                  className="text-[#78716C] hover:text-[#1C1917] p-1 rounded-lg cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Chọn thẻ tín dụng */}
              <div>
                <label className="block text-[10px] font-semibold text-[#78716C] uppercase tracking-wider mb-1">
                  Thẻ được hoàn tiền
                </label>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {activeCreditCards.map((card) => {
                    const isSelected = (selectedCardId || activeCreditCards[0]?.id) === card.id;
                    return (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => {
                          playActionClick();
                          setSelectedCardId(card.id);
                        }}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border shrink-0 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#0F3D39] text-white border-[#0F3D39] shadow-2xs'
                            : 'bg-[#FAF9F6] text-[#1C1917] border-[#E6E2DA]'
                        }`}
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: isSelected ? '#A7F3D0' : card.color }}
                        />
                        <span>{card.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Số tiền hoàn & Ngày nhận */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-semibold text-[#78716C] uppercase tracking-wider mb-1">
                    Số tiền được hoàn (VND)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formattedCashback}
                    onChange={(e) => setCashbackRaw(e.target.value.replace(/\D/g, ''))}
                    placeholder="VD: 300.000"
                    className="w-full px-3 py-2 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] text-xs font-mono font-bold text-[#059669] focus:outline-none focus:border-[#059669] focus:bg-white"
                    autoFocus
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-[#78716C] uppercase tracking-wider mb-1">
                    Người nhận & Ngày hoàn
                  </label>
                  <div className="flex items-center gap-1.5">
                    <div className="flex bg-[#F5F3EF] border border-[#E6E2DA] rounded-xl p-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setReceivedBy('Chồng')}
                        className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer ${
                          receivedBy === 'Chồng' ? 'bg-[#0F3D39] text-white' : 'text-[#78716C]'
                        }`}
                      >
                        Chồng
                      </button>
                      <button
                        type="button"
                        onClick={() => setReceivedBy('Vợ')}
                        className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer ${
                          receivedBy === 'Vợ' ? 'bg-[#B45309] text-white' : 'text-[#78716C]'
                        }`}
                      >
                        Vợ
                      </button>
                    </div>
                    <input
                      type="date"
                      value={cashbackDate}
                      onChange={(e) => setCashbackDate(e.target.value)}
                      className="flex-1 min-w-0 px-2.5 py-1.5 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] text-[11px] font-mono text-[#1C1917]"
                    />
                  </div>
                </div>
              </div>

              {/* Ghi chú tùy chọn */}
              <input
                type="text"
                value={cashbackNote}
                onChange={(e) => setCashbackNote(e.target.value)}
                placeholder="Ghi chú (VD: Hoàn tiền siêu thị tháng 9...)"
                className="w-full px-3 py-2 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] text-xs text-[#1C1917] focus:outline-none focus:border-[#059669] focus:bg-white"
              />

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddCashback(false)}
                  className="px-3 py-2 rounded-xl border border-[#E6E2DA] text-xs font-semibold text-[#78716C] hover:bg-[#F5F3EF] cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSavingCashback || cashbackNumeric <= 0}
                  className="px-4 py-2 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{isSavingCashback ? 'Đang lưu...' : 'Lưu Cashback'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Danh sách các khoản Cashback độc lập (nếu có) */}
        {standaloneCashbacks.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-[11px] font-bold text-[#78716C] uppercase tracking-wider px-0.5 flex items-center gap-1.5">
              <Gift className="w-3.5 h-3.5 text-[#059669]" />
              <span>Khoản hoàn tiền thẻ độc lập ({standaloneCashbacks.length})</span>
            </h4>
            <div className="divide-y divide-[#E6E2DA]/60 border border-[#E6E2DA] rounded-2xl overflow-hidden bg-white shadow-2xs">
              {standaloneCashbacks.map((tx) => (
                <div
                  key={tx.id}
                  className="p-3 flex items-center justify-between gap-2 text-xs hover:bg-[#FAF9F6]"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.2 rounded-md bg-[#ECFDF5] text-[#059669] font-mono text-[10px] font-bold border border-[#A7F3D0]">
                        {tx.cardName || 'Thẻ tín dụng'}
                      </span>
                      <p className="font-semibold text-[#1C1917] truncate">
                        {tx.note || 'Hoàn tiền thẻ tín dụng'}
                      </p>
                    </div>
                    <p className="text-[10px] text-[#78716C] font-mono mt-0.5">
                      {formatDisplayDate(tx.date)} • {tx.paidBy} nhận
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono font-bold text-[#059669] tabular-nums">
                      +{displayAmount(tx.amount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeTransaction(tx)}
                      className="p-1 text-[#A8A29E] hover:text-[#DC2626] rounded-lg hover:bg-[#FEF2F2] transition-colors cursor-pointer"
                      title="Xóa khoản hoàn tiền này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Danh sách các đợt quyết toán sao kê thẻ */}
        <div className="space-y-2">
          <h4 className="text-[11px] font-bold text-[#78716C] uppercase tracking-wider px-0.5 flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-[#0F3D39]" />
            <span>Các đợt đã quyết toán sao kê ({settlementBatches.length})</span>
          </h4>

          {settlementBatches.length === 0 ? (
            <div className="p-8 text-center bg-white border border-[#E6E2DA] rounded-2xl space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[#F5F3EF] text-[#A8A29E] flex items-center justify-center mx-auto mb-2">
                <History className="w-6 h-6 stroke-[1.5]" />
              </div>
              <p className="text-sm font-semibold text-[#1C1917]">
                Chưa có đợt quyết toán thẻ nào
              </p>
              <p className="text-xs text-[#78716C] max-w-xs mx-auto leading-relaxed">
                Khi bạn bấm xác nhận thanh toán sao kê cho thẻ tín dụng, nhật ký các đợt cùng tiền hoàn (Cashback) sẽ hiển thị tại đây.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {settlementBatches.map((batch) => {
                const isExpanded = Boolean(expandedBatchIds[batch.id]);
                const itemCount = batch.txSnapshots?.length || batch.txIds.length;
                const hasCashback = Boolean(batch.cashbackAmount && batch.cashbackAmount > 0);
                const netPaid = hasCashback
                  ? (batch.netAmount !== undefined ? batch.netAmount : Math.max(0, batch.amount - (batch.cashbackAmount || 0)))
                  : batch.amount;
                const isConfirmingUndo = confirmingUndoBatchId === batch.id;

                return (
                  <div
                    key={batch.id}
                    className="bg-white border border-[#E6E2DA] rounded-2xl overflow-hidden shadow-2xs transition-all hover:border-[#D3CDC2]"
                  >
                    {/* Header của đợt quyết toán */}
                    <div
                      onClick={() => toggleExpand(batch.id)}
                      className="p-3.5 flex items-start justify-between gap-3 cursor-pointer hover:bg-[#FAF9F6] transition-colors select-none"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs mt-0.5"
                          style={{ backgroundColor: batch.cardColor || '#0F3D39' }}
                        >
                          <CardIcon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-[#1C1917] truncate">
                              {batch.cardName}
                            </span>
                            {batch.last4Digits && (
                              <span className="text-[10px] font-mono text-[#78716C]">
                                •••• {batch.last4Digits}
                              </span>
                            )}
                            {hasCashback && (
                              <span className="px-1.5 py-0.2 rounded-md bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] text-[10px] font-mono font-bold">
                                🎁 Hoàn +{displayAmount(batch.cashbackAmount!)}
                              </span>
                            )}
                          </div>

                          {/* Thông tin Ngày quyết toán & Người quyết toán */}
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-[#78716C] flex-wrap">
                            <span className="flex items-center gap-1 font-mono font-medium text-[#1C1917]">
                              <Calendar className="w-3 h-3 text-[#0F3D39]" />
                              Ngày quyết toán: <strong className="text-[#0F3D39]">{formatDisplayDate(batch.settledAt)}</strong>
                            </span>
                            <span className="text-[#D3CDC2]">•</span>
                            <span
                              className={`px-1.5 py-0.2 rounded-md font-medium text-[10px] ${
                                batch.settledBy === 'Chồng'
                                  ? 'bg-[#E7EFEF] text-[#0F3D39]'
                                  : 'bg-[#FEF3C7] text-[#B45309]'
                              }`}
                            >
                              {batch.settledBy} trả
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Số tiền & Toggle mũi tên */}
                      <div className="flex flex-col items-end shrink-0">
                        <span className="text-xs sm:text-sm font-bold font-mono text-[#0F3D39] tabular-nums">
                          {displayAmount(netPaid)}
                        </span>
                        {hasCashback && (
                          <span className="text-[10px] font-mono text-[#A8A29E] line-through">
                            {displayAmount(batch.amount)}
                          </span>
                        )}
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-[#78716C]">
                          <span>{itemCount} khoản quẹt</span>
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-[#A8A29E]" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-[#A8A29E]" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Chi tiết danh sách các khoản quẹt trong đợt */}
                    {isExpanded && (
                      <div className="px-3.5 pb-3.5 pt-2 border-t border-[#F5F3EF] bg-[#FAF9F6]/60 animate-in fade-in duration-150 space-y-3">
                        <div className="flex items-center justify-between text-[11px] text-[#78716C] font-semibold px-0.5">
                          <span className="flex items-center gap-1">
                            <ReceiptText className="w-3.5 h-3.5" />
                            Chi tiết các khoản chi ({itemCount}):
                          </span>
                          {!isConfirmingUndo && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                playActionClick();
                                triggerHaptic(10);
                                setConfirmingUndoBatchId(batch.id);
                              }}
                              className="text-[11px] text-[#DC2626] hover:text-[#991B1B] font-semibold flex items-center gap-1 cursor-pointer hover:underline"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Hoàn tác đợt này</span>
                            </button>
                          )}
                        </div>

                        {/* Thanh xác nhận Hoàn tác nội tuyến (Inline Confirmation) */}
                        {isConfirmingUndo && (
                          <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] space-y-2.5 animate-in fade-in duration-150">
                            <div className="flex items-start gap-2 text-xs text-[#991B1B]">
                              <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
                              <p className="leading-relaxed">
                                Hủy quyết toán đợt thẻ <strong>{batch.cardName}</strong> ({formatVND(batch.amount)})? Toàn bộ {itemCount} khoản chi sẽ quay về danh sách chờ sao kê
                                {hasCashback ? ' và khoản thu Cashback đi kèm cũng sẽ được thu hồi.' : '.'}
                              </p>
                            </div>
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setConfirmingUndoBatchId(null)}
                                disabled={isUndoing}
                                className="px-3 py-1.5 rounded-lg bg-white border border-[#E6E2DA] text-xs font-semibold text-[#78716C] cursor-pointer"
                              >
                                Hủy
                              </button>
                              <button
                                type="button"
                                onClick={() => handleConfirmUndo(batch)}
                                disabled={isUndoing}
                                className="px-3 py-1.5 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>{isUndoing ? 'Đang hoàn tác...' : 'Xác nhận hoàn tác'}</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {batch.txSnapshots && batch.txSnapshots.length > 0 ? (
                          <div className="divide-y divide-[#E6E2DA]/60 border border-[#E6E2DA] rounded-xl overflow-hidden bg-white">
                            {batch.txSnapshots.map((item, idx) => (
                              <div
                                key={item.id || idx}
                                className="p-2.5 flex items-center justify-between gap-2 hover:bg-[#FAF9F6] text-xs"
                              >
                                <div className="min-w-0">
                                  <p className="font-medium text-[#1C1917] truncate">
                                    {item.note || item.categoryName}
                                  </p>
                                  <div className="flex items-center gap-1.5 text-[10px] text-[#78716C] mt-0.5">
                                    <span className="font-mono">{formatDisplayDate(item.date)}</span>
                                    <span>•</span>
                                    <span className="truncate">{item.categoryName}</span>
                                    {item.paidBy && (
                                      <>
                                        <span>•</span>
                                        <span>{item.paidBy} quẹt</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <span className="font-mono font-semibold text-[#1C1917] shrink-0 tabular-nums">
                                  {formatVND(item.amount)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-3 bg-white border border-[#E6E2DA] rounded-xl text-center text-xs text-[#78716C]">
                            Đợt quyết toán gồm {batch.txIds.length} khoản chi.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </BottomSheet>
  );
};
