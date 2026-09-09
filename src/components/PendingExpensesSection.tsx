import React, { useState } from 'react';
import { Clock, Check, Calendar, Pencil } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatVND, formatCompactVND, formatDueDateBadge } from '../utils/currency';
import { renderCategoryIcon } from '../utils/categoryIcons';
import { playActionClick } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';
import { EditPendingExpenseModal } from './EditPendingExpenseModal';
import { ConfirmPaidBottomSheet } from './ConfirmPaidBottomSheet';
import type { PendingExpense } from '../types';

export const PendingExpensesSection: React.FC = () => {
  const { activePendingExpenses, totalPendingAmount, compactCurrency, categories } = useApp();
  const [selectedItem, setSelectedItem] = useState<PendingExpense | null>(null);
  const [confirmingItem, setConfirmingItem] = useState<PendingExpense | null>(null);

  const displayAmount = (amount: number) => {
    return compactCurrency ? formatCompactVND(amount) : formatVND(amount);
  };

  const handleOpenItem = (item: PendingExpense) => {
    playActionClick();
    triggerHaptic(8);
    setSelectedItem(item);
  };

  const handleQuickConfirmPaid = (e: React.MouseEvent, item: PendingExpense) => {
    e.stopPropagation();
    playActionClick();
    triggerHaptic(10);
    setConfirmingItem(item);
  };

  // Nếu không có khoản chờ nào
  if (activePendingExpenses.length === 0) {
    return (
      <section className="bg-white border border-[#E6E2DA] rounded-3xl p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#B45309]" />
            <h2 className="text-xs uppercase tracking-wider font-semibold text-[#78716C]">
              Khoản chờ thanh toán
            </h2>
          </div>
          <span className="text-[11px] font-mono text-[#10B981] font-semibold bg-[#ECFDF5] px-2 py-0.5 rounded-full">
            Đã sạch nợ & hóa đơn 🎉
          </span>
        </div>
        <p className="text-xs text-[#A8A29E] mt-2 text-center py-2">
          Không có hóa đơn hay khoản chi nào đang chờ đến hạn.
        </p>
      </section>
    );
  }

  return (
    <>
      <section className="bg-white border border-[#E6E2DA] rounded-3xl p-4 sm:p-5 shadow-sm">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-[#F5F3EF]">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-5 h-5 rounded-lg bg-[#FEF3C7] text-[#B45309] flex items-center justify-center shrink-0">
              <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <h2 className="text-xs uppercase tracking-wider font-bold text-[#1C1917] truncate">
              Khoản chờ thanh toán
            </h2>
            <span className="text-[11px] font-mono font-bold bg-[#FEF3C7] text-[#B45309] px-2 py-0.2 rounded-full shrink-0">
              {activePendingExpenses.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-xs text-[#B45309] font-bold shrink-0">
            <span className="text-[11px] text-[#78716C] font-normal hidden sm:inline">Tổng chờ:</span>
            <span>{displayAmount(totalPendingAmount)}</span>
          </div>
        </div>

        {/* Danh sách các khoản chờ */}
        <div className="divide-y divide-[#F5F3EF] border border-[#F5F3EF] rounded-2xl overflow-hidden bg-[#FAF9F6]/60">
          {activePendingExpenses.map((item) => {
            const dueBadge = formatDueDateBadge(item.dueDate);
            const isOverdue = dueBadge.status === 'OVERDUE';
            const isDueSoon = dueBadge.status === 'DUE_SOON';
            const cat = categories.find((c) => c.id === item.categoryId);

            return (
              <div
                key={item.id}
                onClick={() => handleOpenItem(item)}
                className="flex items-center justify-between gap-3 p-3 hover:bg-white transition-colors group cursor-pointer"
              >
                {/* Cột trái: Icon danh mục, Tên khoản & Badge Hạn chót gọn gàng */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border border-[#E6E2DA]/80 bg-white shadow-2xs">
                    {renderCategoryIcon(cat?.icon, "w-4 h-4", cat?.color || (isOverdue ? '#DC2626' : '#B45309'))}
                  </span>

                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#1C1917] truncate group-hover:text-[#B45309] transition-colors">
                      {item.note || item.categoryName}
                    </p>

                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                      {/* Badge Hạn chót ngắn gọn: "Còn X ngày" hoặc "Hạn hôm nay" */}
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.2 rounded-md font-mono flex items-center gap-1 ${
                          isOverdue
                            ? 'bg-[#FEF2F2] text-[#B91C1C] border border-[#FCA5A5]'
                            : isDueSoon
                            ? 'bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]'
                            : 'bg-white text-[#78716C] border border-[#E6E2DA]'
                        }`}
                      >
                        <Calendar className="w-2.5 h-2.5" />
                        <span>{dueBadge.label}</span>
                      </span>

                      {/* Mục tiêu tài chính nếu có */}
                      {item.goalName && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-[#ECFDF5] text-[#047857] flex items-center gap-0.5 max-w-[120px] truncate">
                          🎯 {item.goalName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Cột phải: Số tiền & Nút hành động */}
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    title={formatVND(item.amount)}
                    className="text-xs font-bold font-mono tabular-nums text-[#B45309]"
                  >
                    {displayAmount(item.amount)}
                  </span>

                  {/* Nút Xác nhận đã chi nhanh (Mở ngay Bottom Sheet) */}
                  <button
                    type="button"
                    onClick={(e) => handleQuickConfirmPaid(e, item)}
                    className="w-7 h-7 rounded-xl flex items-center justify-center text-[#059669] hover:text-white bg-[#ECFDF5] hover:bg-[#059669] border border-[#A7F3D0] transition-all shadow-2xs cursor-pointer active:scale-95"
                    title="Xác nhận đã thanh toán khoản này"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>

                  {/* Icon chỉnh sửa */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenItem(item);
                    }}
                    className="text-[#A8A29E] hover:text-[#0F3D39] p-1 rounded-lg hover:bg-[#F5F3EF] opacity-70 group-hover:opacity-100 transition-all cursor-pointer"
                    title="Chỉnh sửa chi tiết"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Modal Chỉnh sửa chi tiết */}
      <EditPendingExpenseModal
        isOpen={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        pendingExpense={selectedItem}
      />

      {/* Bottom Sheet Xác nhận khoản chi nhanh 1-chạm */}
      <ConfirmPaidBottomSheet
        isOpen={Boolean(confirmingItem)}
        onClose={() => setConfirmingItem(null)}
        pendingExpense={confirmingItem}
      />
    </>
  );
};
