import React from 'react';
import { useApp } from '../context/AppContext';
import { formatVND } from '../utils/currency';
import { PiggyBank, TrendingDown, Wallet, Users } from 'lucide-react';

export const BalanceCard: React.FC = () => {
  const { monthlySummary, household } = useApp();

  const totalExpense = monthlySummary.totalExpense;
  const budget = household.monthlyBudget || 40000000;
  const budgetPercent = Math.min(100, Math.round((totalExpense / budget) * 100));
  const isBudgetWarning = budgetPercent >= 85;

  const husbandExpense = monthlySummary.byMember['Chồng'] || 0;
  const wifeExpense = monthlySummary.byMember['Vợ'] || 0;
  const totalMemberExpense = husbandExpense + wifeExpense;

  const husbandPercent = totalMemberExpense > 0 ? Math.round((husbandExpense / totalMemberExpense) * 100) : 50;
  const wifePercent = 100 - husbandPercent;

  return (
    <div className="surface-card p-4 sm:p-5 space-y-4">
      {/* Hàng 1: Tổng chi & Tích lũy */}
      <div className="grid grid-cols-2 gap-3">
        {/* Khối Tổng Chi */}
        <div className="bg-neutral p-3.5 rounded-2xl border border-border min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant mb-1">
            <TrendingDown className="w-3.5 h-3.5 text-expense shrink-0" />
            <span className="truncate">Tổng chi tháng này</span>
          </div>
          <p className="text-lg sm:text-xl font-bold font-mono text-primary truncate">
            {formatVND(totalExpense)}
          </p>
          <p className="text-[11px] text-on-surface-variant mt-1 truncate">
            Hạn mức: <span className="font-mono">{formatVND(budget)}</span>
          </p>
        </div>

        {/* Khối Tích Lũy */}
        <div className="bg-income-container/40 p-3.5 rounded-2xl border border-income/20 min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-income-text mb-1">
            <PiggyBank className="w-3.5 h-3.5 text-income shrink-0" />
            <span className="truncate">Số dư tích lũy</span>
          </div>
          <p className="text-lg sm:text-xl font-bold font-mono text-income-text truncate">
            {formatVND(monthlySummary.netSavings)}
          </p>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-[11px] font-semibold text-income-text bg-income-container px-1.5 py-0.5 rounded-full font-mono truncate">
              +{monthlySummary.savingsPercent}% thu nhập
            </span>
          </div>
        </div>
      </div>

      {/* Hàng 2: Thanh tiến trình Ngân sách */}
      <div>
        <div className="flex justify-between items-center text-xs mb-1.5">
          <span className="text-on-surface-variant font-medium flex items-center gap-1">
            <Wallet className="w-3.5 h-3.5 text-primary" />
            Tiến độ ngân sách
          </span>
          <span className={`font-mono font-bold ${isBudgetWarning ? 'text-warning-text' : 'text-primary'}`}>
            {budgetPercent}%
          </span>
        </div>
        <div className="w-full h-2.5 bg-surface-container rounded-full overflow-hidden border border-border">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              isBudgetWarning ? 'bg-warning' : 'bg-primary'
            }`}
            style={{ width: `${budgetPercent}%` }}
          />
        </div>
      </div>

      {/* Hàng 3: Cán Cân Chi Tiêu Vợ - Chồng */}
      <div className="pt-2 border-t border-border/60">
        <div className="flex justify-between items-center text-xs mb-2">
          <span className="text-on-surface-variant font-medium flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-tertiary" />
            Cán cân chi trả Vợ - Chồng
          </span>
          <span className="text-[11px] text-on-surface-variant">Đồng hành vun vén</span>
        </div>

        {/* Thanh kép tỷ lệ */}
        <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden flex border border-border">
          <div
            className="bg-primary h-full transition-all duration-500"
            style={{ width: `${husbandPercent}%` }}
            title={`Chồng: ${formatVND(husbandExpense)} (${husbandPercent}%)`}
          />
          <div
            className="bg-tertiary h-full transition-all duration-500"
            style={{ width: `${wifePercent}%` }}
            title={`Vợ: ${formatVND(wifeExpense)} (${wifePercent}%)`}
          />
        </div>

        {/* Chú giải số liệu */}
        <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center text-xs mt-2 font-mono gap-1 sm:gap-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />
            <span className="text-on-surface font-medium">Chồng: {formatVND(husbandExpense)} ({husbandPercent}%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-tertiary shrink-0" />
            <span className="text-on-surface font-medium">Vợ: {formatVND(wifeExpense)} ({wifePercent}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
