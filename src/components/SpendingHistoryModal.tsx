import React from 'react';
import { X, Receipt, ChevronRight } from 'lucide-react';
import type { Transaction } from '../types';
import { formatVND, formatDateLabel } from '../utils/currency';
import { playActionClick } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';

interface SpendingHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  badgeText: string;
  badgeColor?: 'pine' | 'amber';
  icon: React.ReactNode;
  iconBgColor?: string;
  summaryLeft: {
    label: string;
    amount: number;
    count: number;
  };
  summaryRight: {
    label: string;
    value: string | React.ReactNode;
    subtext?: string;
    valueColor?: string;
  };
  transactions: Transaction[];
  onSelectTransaction?: (tx: Transaction) => void;
  emptyMessage?: string;
}

export const SpendingHistoryModal: React.FC<SpendingHistoryModalProps> = ({
  isOpen,
  onClose,
  title,
  badgeText,
  badgeColor = 'pine',
  icon,
  iconBgColor = '#0F3D39',
  summaryLeft,
  summaryRight,
  transactions,
  onSelectTransaction,
  emptyMessage = 'Chưa có khoản chi tiêu nào được ghi nhận.'
}) => {
  if (!isOpen) return null;

  const handleClose = () => {
    playActionClick();
    triggerHaptic(6);
    onClose();
  };

  const handleItemClick = (tx: Transaction) => {
    playActionClick();
    triggerHaptic(10);
    if (onSelectTransaction) {
      onSelectTransaction(tx);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1C1917]/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-[#E6E2DA] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] animate-in zoom-in-95 duration-200">
        {/* Header Modal */}
        <div className="p-4 sm:p-5 border-b border-[#F5F3EF] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs"
              style={{ backgroundColor: iconBgColor }}
            >
              {icon}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    badgeColor === 'amber'
                      ? 'bg-[#FEF3C7] text-[#B45309]'
                      : 'bg-[#E7EFEF] text-[#0F3D39]'
                  }`}
                >
                  {badgeText}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-[#1C1917] truncate mt-0.5">
                {title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-xl text-[#78716C] hover:text-[#1C1917] hover:bg-[#F5F3EF] flex items-center justify-center transition-colors shrink-0 cursor-pointer"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thống kê tóm tắt nhanh */}
        <div className="px-4 sm:px-5 py-3 bg-[#FAF9F6] border-b border-[#F5F3EF] grid grid-cols-2 gap-3 shrink-0">
          <div>
            <span className="text-[11px] text-[#78716C] block">
              {summaryLeft.label}
            </span>
            <span className="text-sm font-bold font-mono text-[#0F3D39]">
              {formatVND(summaryLeft.amount)}
            </span>
            <span className="text-[10px] text-[#78716C] block mt-0.5 font-mono">
              ({summaryLeft.count} giao dịch)
            </span>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-[#78716C] block">
              {summaryRight.label}
            </span>
            <span
              className={`text-sm font-bold font-mono ${
                summaryRight.valueColor || 'text-[#0F3D39]'
              }`}
            >
              {summaryRight.value}
            </span>
            {summaryRight.subtext && (
              <span className="text-[10px] text-[#78716C] block mt-0.5 font-mono">
                {summaryRight.subtext}
              </span>
            )}
          </div>
        </div>

        {/* Danh sách các khoản chi tiêu */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-2.5">
          {transactions.length === 0 ? (
            <div className="text-center py-8 px-4 bg-[#FAF9F6] rounded-2xl border border-dashed border-[#E6E2DA]">
              <div className="w-10 h-10 mx-auto rounded-xl bg-white border border-[#E6E2DA] flex items-center justify-center text-[#78716C] mb-2.5 shadow-2xs">
                <Receipt className="w-5 h-5 stroke-[1.5]" />
              </div>
              <p className="text-xs font-semibold text-[#1C1917]">
                {emptyMessage}
              </p>
              <p className="text-[11px] text-[#78716C] mt-1 max-w-xs mx-auto leading-relaxed">
                Các khoản chi tiêu được ghi nhận sẽ tự động xuất hiện tại đây.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-[#78716C] px-1">
                <span>Tất cả các lần đã ghi nhận</span>
                <span className="font-mono font-medium">{transactions.length} giao dịch</span>
              </div>
              <div className="divide-y divide-[#F5F3EF] border border-[#F5F3EF] rounded-2xl overflow-hidden bg-[#FAF9F6]/60">
                {transactions.map((tx) => {
                  const isIncome = tx.type === 'INCOME';
                  return (
                    <div
                      key={tx.id}
                      onClick={() => handleItemClick(tx)}
                      className="p-3 hover:bg-white transition-colors flex items-center justify-between gap-3 cursor-pointer group"
                      title={onSelectTransaction ? 'Bấm để xem hoặc chỉnh sửa giao dịch này' : undefined}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[#1C1917] truncate group-hover:text-[#0F3D39] transition-colors">
                            {tx.note || tx.categoryName}
                          </span>
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full font-medium shrink-0 ${
                              isIncome
                                ? 'bg-[#ECFDF5] text-[#047857]'
                                : tx.paidBy === 'Chồng'
                                ? 'bg-[#E7EFEF] text-[#0F3D39]'
                                : 'bg-[#FEF3C7] text-[#B45309]'
                            }`}
                          >
                            {isIncome ? `${tx.paidBy} nhận` : tx.paidBy}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-[#78716C] mt-0.5">
                          <span>{formatDateLabel(tx.date)}</span>
                          <span>•</span>
                          <span className="truncate">{tx.categoryName}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-xs sm:text-sm font-bold font-mono ${
                            isIncome ? 'text-[#059669]' : 'text-[#0F3D39]'
                          }`}
                        >
                          {isIncome ? '+' : ''}{formatVND(tx.amount)}
                        </span>
                        {onSelectTransaction && (
                          <ChevronRight className="w-3.5 h-3.5 text-[#D3CDC2] group-hover:text-[#0F3D39] group-hover:translate-x-0.5 transition-all" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 bg-white border-t border-[#F5F3EF] flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#0F3D39] text-white text-xs font-bold hover:bg-[#174E4A] transition-colors cursor-pointer text-center"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
