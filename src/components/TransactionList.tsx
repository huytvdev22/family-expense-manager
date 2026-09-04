import React from 'react';
import { useApp } from '../context/AppContext';
import { formatVND, formatDateVN } from '../utils/currency';
import { Trash2, ShoppingCart, Coffee, HeartPulse, PiggyBank } from 'lucide-react';
import type { Transaction } from '../types';

const CATEGORY_ICON_MAP: Record<string, React.ElementType> = {
  cat_essential: ShoppingCart,
  cat_living: Coffee,
  cat_unexpected: HeartPulse,
  cat_saving: PiggyBank
};

export const TransactionList: React.FC = () => {
  const { transactions, deleteTransaction } = useApp();

  // Nhóm giao dịch theo ngày
  const groupedTransactions = transactions.reduce((groups, tx) => {
    const date = tx.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(tx);
    return groups;
  }, {} as Record<string, Transaction[]>);

  const sortedDates = Object.keys(groupedTransactions).sort((a, b) => b.localeCompare(a));

  if (transactions.length === 0) {
    return (
      <div className="surface-card p-8 text-center text-on-surface-variant">
        <p className="text-sm font-medium">Chưa có giao dịch nào trong tháng.</p>
        <p className="text-xs text-on-surface-variant/80 mt-1">Chạm vào một Quick Tag ở trên để ghi khoản chi đầu tiên!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          Dòng Thời Gian Chi Tiêu
        </h2>
        <span className="text-xs text-on-surface-variant">
          {transactions.length} giao dịch
        </span>
      </div>

      <div className="space-y-3">
        {sortedDates.map((date) => {
          const txs = groupedTransactions[date];
          const totalDayExpense = txs
            .filter(t => t.type === 'EXPENSE')
            .reduce((sum, t) => sum + t.amount, 0);

          return (
            <div key={date} className="surface-card p-3.5 space-y-2.5">
              {/* Tiêu đề Ngày */}
              <div className="flex items-center justify-between border-b border-border/60 pb-2 text-xs">
                <span className="font-bold text-primary">
                  {formatDateVN(date)}
                </span>
                <span className="font-mono text-on-surface-variant">
                  Tổng ngày: <strong className="text-on-surface font-bold">{formatVND(totalDayExpense)}</strong>
                </span>
              </div>

              {/* Các dòng giao dịch */}
              <div className="divide-y divide-border/40">
                {txs.map((tx) => {
                  const IconComp = CATEGORY_ICON_MAP[tx.categoryId] || ShoppingCart;
                  const isExpense = tx.type === 'EXPENSE';

                  return (
                    <div
                      key={tx.id}
                      className="py-2 flex items-center justify-between gap-3 group hover:bg-neutral rounded-xl px-1 transition-colors"
                    >
                      {/* Icon & Diễn giải */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isExpense
                              ? 'bg-surface-container text-primary'
                              : 'bg-income-container text-income-text'
                          }`}
                        >
                          <IconComp className="w-4 h-4" />
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-on-surface truncate">
                            {tx.note}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded-md font-semibold ${
                                tx.paidBy === 'Chồng'
                                  ? 'bg-primary/10 text-primary'
                                  : 'bg-tertiary/15 text-tertiary'
                              }`}
                            >
                              {tx.paidBy}
                            </span>
                            <span className="text-[10px] text-on-surface-variant truncate">
                              {tx.categoryName}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Số tiền & Nút xóa */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <p
                            className={`text-sm font-bold font-mono ${
                              isExpense ? 'text-on-surface' : 'text-income'
                            }`}
                          >
                            {isExpense ? '-' : '+'}
                            {formatVND(tx.amount)}
                          </p>
                        </div>

                        <button
                          onClick={() => deleteTransaction(tx.id)}
                          title="Xóa giao dịch"
                          className="opacity-40 hover:opacity-100 hover:text-expense p-1.5 transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
