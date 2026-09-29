import React, { useState } from 'react';
import { History, Calendar, CheckCircle2, ChevronDown, ChevronRight, RotateCcw, AlertTriangle, CreditCard as CardIcon, ReceiptText } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatVND, formatCompactVND, formatDisplayDate } from '../utils/currency';
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
  const { settlementBatches, undoSettlement, compactCurrency } = useApp();

  const [expandedBatchIds, setExpandedBatchIds] = useState<Record<string, boolean>>({});
  const [confirmingUndoBatch, setConfirmingUndoBatch] = useState<SettlementBatch | null>(null);
  const [isUndoing, setIsUndoing] = useState<boolean>(false);

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

  const handleConfirmUndo = async () => {
    if (!confirmingUndoBatch) return;
    try {
      setIsUndoing(true);
      await undoSettlement(confirmingUndoBatch);
      setConfirmingUndoBatch(null);
    } catch (err) {
      console.error('Lỗi khi hoàn tác quyết toán:', err);
    } finally {
      setIsUndoing(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Lịch sử quyết toán thẻ"
      subtitle={`${settlementBatches.length} đợt đã thanh toán sao kê`}
      icon={
        <div className="w-9 h-9 rounded-xl bg-[#0F3D39] text-white flex items-center justify-center shadow-2xs">
          <History className="w-4 h-4 stroke-[2.5]" />
        </div>
      }
      maxHeight="max-h-[92dvh] sm:max-h-[85vh]"
    >
      <div className="space-y-3 pb-6">
        {settlementBatches.length === 0 ? (
          <div className="p-8 text-center bg-white border border-[#E6E2DA] rounded-2xl space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#F5F3EF] text-[#A8A29E] flex items-center justify-center mx-auto mb-2">
              <History className="w-6 h-6 stroke-[1.5]" />
            </div>
            <p className="text-sm font-semibold text-[#1C1917]">
              Chưa có đợt quyết toán thẻ nào
            </p>
            <p className="text-xs text-[#78716C] max-w-xs mx-auto leading-relaxed">
              Khi bạn bấm xác nhận thanh toán sao kê cho thẻ tín dụng, nhật ký các đợt cùng chi tiết các khoản quẹt sẽ hiển thị tại đây.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {settlementBatches.map((batch) => {
              const isExpanded = Boolean(expandedBatchIds[batch.id]);
              const itemCount = batch.txSnapshots?.length || batch.txIds.length;

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
                        </div>

                        {/* Thông tin Ngày quyết toán & Người quyết toán */}
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-[#78716C]">
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
                        {displayAmount(batch.amount)}
                      </span>
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
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            playActionClick();
                            triggerHaptic(10);
                            setConfirmingUndoBatch(batch);
                          }}
                          className="text-[11px] text-[#DC2626] hover:text-[#991B1B] font-semibold flex items-center gap-1 cursor-pointer hover:underline"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Hoàn tác đợt này</span>
                        </button>
                      </div>

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

        {/* Modal Xác nhận Hoàn tác quyết toán */}
        {confirmingUndoBatch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-sm w-full p-4 border border-[#E6E2DA] shadow-xl space-y-3">
              <div className="flex items-center gap-2.5 text-[#DC2626]">
                <div className="w-8 h-8 rounded-xl bg-[#FEF2F2] flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
                </div>
                <h3 className="text-sm font-bold text-[#1C1917]">
                  Hoàn tác quyết toán thẻ?
                </h3>
              </div>
              <p className="text-xs text-[#78716C] leading-relaxed">
                Bạn có chắc muốn hủy quyết toán cho đợt thẻ{' '}
                <strong className="text-[#1C1917]">{confirmingUndoBatch.cardName}</strong> trị giá{' '}
                <strong className="text-[#0F3D39] font-mono">{formatVND(confirmingUndoBatch.amount)}</strong>?
                Toàn bộ {confirmingUndoBatch.txSnapshots?.length || confirmingUndoBatch.txIds.length} khoản chi sẽ được đưa trở lại danh sách chờ quyết toán.
              </p>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmingUndoBatch(null)}
                  disabled={isUndoing}
                  className="flex-1 py-2.5 rounded-xl border border-[#E6E2DA] text-xs font-semibold text-[#78716C] hover:bg-[#F5F3EF] cursor-pointer transition-colors"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleConfirmUndo}
                  disabled={isUndoing}
                  className="flex-1 py-2.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold shadow-xs cursor-pointer transition-colors flex items-center justify-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{isUndoing ? 'Đang hoàn tác...' : 'Xác nhận hủy'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </BottomSheet>
  );
};
