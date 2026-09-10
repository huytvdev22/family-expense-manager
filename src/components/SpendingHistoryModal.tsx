import React from 'react';
import { Receipt } from 'lucide-react';
import type { Transaction } from '../types';
import { formatVND, formatDateLabel } from '../utils/currency';
import { playActionClick } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';
import { BottomSheet } from './BottomSheet';

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
  const handleItemClick = (tx: Transaction) => {
    playActionClick();
    triggerHaptic(10);
    if (onSelectTransaction) {
      onSelectTransaction(tx);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mt-0.5 ${
            badgeColor === 'amber'
              ? 'bg-[#FEF3C7] text-[#B45309]'
              : 'bg-[#E7EFEF] text-[#0F3D39]'
          }`}
        >
          {badgeText}
        </span>
      }
      icon={
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs"
          style={{ backgroundColor: iconBgColor }}
        >
          {icon}
        </div>
      }
      maxHeight="max-h-[90dvh] sm:max-h-[85vh]"
      bodyClassName="p-0"
      footer={
        <div className="p-3 sm:p-4">
          <button
            type="button"
            onClick={() => {
              playActionClick();
              triggerHaptic(6);
              onClose();
            }}
            className="w-full py-3 min-h-[44px] rounded-2xl bg-[#0F3D39] hover:bg-[#174E4A] text-white text-xs sm:text-sm font-bold transition-all shadow-2xs active:scale-98 cursor-pointer flex items-center justify-center"
          >
            Đóng
          </button>
        </div>
      }
    >
      {/* Thống kê tóm tắt nhanh */}
      <div className="px-4 sm:px-5 py-3 bg-[#FAF9F6] border-b border-[#F5F3EF] grid grid-cols-2 gap-3 shrink-0">
        <div>
          <span className="text-[11px] text-[#78716C] block">
            {summaryLeft.label}
          </span>
          <span className="text-sm font-bold font-mono text-[#0F3D39]">
            {formatVND(summaryLeft.amount)}
          </span>
          <span className="text-[10px] text-[#78716C] block font-mono">
            {summaryLeft.count} giao dịch
          </span>
        </div>

        <div className="text-right">
          <span className="text-[11px] text-[#78716C] block">
            {summaryRight.label}
          </span>
          <span
            className={`text-sm font-bold font-mono ${
              summaryRight.valueColor || 'text-[#1C1917]'
            }`}
          >
            {summaryRight.value}
          </span>
          {summaryRight.subtext && (
            <span className="text-[10px] text-[#78716C] block">
              {summaryRight.subtext}
            </span>
          )}
        </div>
      </div>

      {/* Danh sách giao dịch chi tiết */}
      <div className="divide-y divide-[#F5F3EF]">
        {transactions.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <Receipt className="w-10 h-10 text-[#D6D3CD] mx-auto mb-2 stroke-[1.5]" />
            <p className="text-xs text-[#78716C] font-medium">{emptyMessage}</p>
          </div>
        ) : (
          transactions.map((tx) => (
            <div
              key={tx.id}
              onClick={() => handleItemClick(tx)}
              className="px-4 sm:px-5 py-3 flex items-center justify-between hover:bg-[#FAF9F6] active:bg-[#F5F3EF] transition-colors cursor-pointer"
            >
              <div className="min-w-0 pr-3">
                <p className="text-xs sm:text-sm font-semibold text-[#1C1917] truncate">
                  {tx.note || tx.categoryName}
                </p>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#78716C]">
                  <span>{formatDateLabel(tx.date)}</span>
                  <span>•</span>
                  <span>{tx.paidBy}</span>
                  {tx.goalName && (
                    <>
                      <span>•</span>
                      <span className="text-[#0F3D39] truncate max-w-[120px]">
                        🎯 {tx.goalName}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs sm:text-sm font-bold font-mono text-[#0F3D39]">
                  {formatVND(tx.amount)}
                </span>
                <span className="text-[10px] text-[#78716C] block">
                  {tx.categoryName}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </BottomSheet>
  );
};
