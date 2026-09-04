import React, { useMemo } from 'react';
import { Trash2, Receipt, Calendar } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatVND, formatDateLabel } from '../utils/currency';
import { playActionClick } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';
import type { Transaction } from '../types';

export const TransactionList: React.FC = () => {
  const { transactions, removeTransaction } = useApp();

  // Nhóm giao dịch theo ngày (date: "YYYY-MM-DD")
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    
    transactions.forEach((tx) => {
      const dateKey = tx.date;
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(tx);
    });

    // Sắp xếp các ngày giảm dần
    const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a));
    return sortedDates.map((date) => ({
      date,
      items: groups[date],
      dayTotal: groups[date].reduce((sum, item) => sum + (item.type === 'EXPENSE' ? item.amount : 0), 0)
    }));
  }, [transactions]);

  const handleDelete = async (tx: Transaction) => {
    if (window.confirm(`Xóa khoản chi "${tx.note || tx.categoryName}" (${formatVND(tx.amount)})?`)) {
      playActionClick();
      triggerHaptic(15);
      await removeTransaction(tx);
    }
  };

  if (transactions.length === 0) {
    return (
      <section className="bg-white border border-[#E6E2DA] rounded-3xl p-8 text-center shadow-sm">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-[#F5F3EF] flex items-center justify-center text-[#78716C] mb-3">
          <Receipt className="w-6 h-6 stroke-[1.5]" />
        </div>
        <h3 className="text-sm font-semibold text-[#1C1917]">Sổ cái đang trống</h3>
        <p className="text-xs text-[#78716C] mt-1 max-w-sm mx-auto leading-relaxed">
          Chưa có khoản chi tiêu nào được ghi nhận trong tháng này. Hãy chạm bàn phím bên dưới để ghi lại chi tiêu đầu tiên của tổ ấm nhé!
        </p>
      </section>
    );
  }

  return (
    <section className="bg-white border border-[#E6E2DA] rounded-3xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#F5F3EF]">
        <div className="flex items-center gap-2">
          <Receipt className="w-4 h-4 text-[#0F3D39]" />
          <h2 className="text-xs uppercase tracking-wider font-semibold text-[#78716C]">
            Sổ cái chi tiêu gần đây
          </h2>
        </div>
        <span className="text-xs font-mono text-[#78716C]">
          {transactions.length} giao dịch
        </span>
      </div>

      <div className="space-y-4">
        {groupedTransactions.map(({ date, items, dayTotal }) => (
          <div key={date} className="space-y-2">
            {/* Header ngày */}
            <div className="flex items-center justify-between text-xs font-medium text-[#78716C] px-1">
              <span className="flex items-center gap-1.5 font-semibold text-[#1C1917]">
                <Calendar className="w-3.5 h-3.5 text-[#A8A29E]" />
                {formatDateLabel(date)}
              </span>
              <span className="font-mono text-[11px] tabular-nums text-[#78716C]">
                Tổng ngày: {formatVND(dayTotal)}
              </span>
            </div>

            {/* Danh sách các khoản trong ngày */}
            <div className="divide-y divide-[#F5F3EF] border border-[#F5F3EF] rounded-2xl overflow-hidden bg-[#FAF9F6]/50">
              {items.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between gap-3 p-3 hover:bg-white transition-colors group"
                >
                  {/* Cột trái: Tên khoản chi, danh mục, người chi */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-2 h-2 rounded-full bg-[#0F3D39] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[#1C1917] truncate">
                        {tx.note || tx.categoryName}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-[#78716C] truncate">
                          {tx.categoryName}
                        </span>
                        <span className="text-[#D3CDC2] text-[10px]">•</span>
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full font-medium ${
                            tx.paidBy === 'Chồng'
                              ? 'bg-[#E7EFEF] text-[#0F3D39]'
                              : 'bg-[#FEF3C7] text-[#B45309]'
                          }`}
                        >
                          {tx.paidBy}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Cột phải: Số tiền thẳng hàng & Nút xóa */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-semibold font-mono text-[#1C1917] tabular-nums">
                      {formatVND(tx.amount)}
                    </span>
                    <button
                      onClick={() => handleDelete(tx)}
                      className="text-[#A8A29E] hover:text-[#E11D48] p-1 rounded-lg hover:bg-[#FFF1F2] opacity-70 group-hover:opacity-100 transition-all"
                      title="Xóa giao dịch"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
