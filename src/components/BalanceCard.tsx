import React, { useState } from 'react';
import { Target, Scale, Edit3, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatVND } from '../utils/currency';
import { playActionClick } from '../utils/audio';

export const BalanceCard: React.FC = () => {
  const {
    totalExpense,
    totalIncome,
    netSavings,
    budgetProgress,
    husbandExpense,
    wifeExpense,
    husbandRatio,
    wifeRatio,
    activeHousehold,
    updateBudget
  } = useApp();

  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState(String(activeHousehold?.monthlyBudget || 30000000));

  const handleSaveBudget = async () => {
    const val = Number(budgetInput);
    if (!isNaN(val) && val > 0) {
      await updateBudget(val);
      setIsEditingBudget(false);
      playActionClick();
    }
  };

  const monthlyBudget = activeHousehold?.monthlyBudget || 30000000;
  const isOverBudget = totalExpense > monthlyBudget;

  return (
    <section className="bg-white border border-[#E6E2DA] rounded-3xl p-5 shadow-sm transition-all">
      {/* Hàng 1: Tổng chi tiêu & Ngân sách mục tiêu */}
      <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[#F5F3EF]">
        <div>
          <span className="text-[11px] uppercase tracking-wider font-semibold text-[#78716C] flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-[#B45309]" />
            Tổng chi tiêu tháng này
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono tracking-tight text-[#1C1917] tabular-nums">
              {formatVND(totalExpense)}
            </span>
          </div>
        </div>

        {/* Ngân sách mục tiêu */}
        <div className="text-right">
          <div className="flex items-center justify-end gap-1">
            <span className="text-xs text-[#78716C]">Hạn mức:</span>
            {isEditingBudget ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  className="w-24 text-xs font-mono font-medium px-1.5 py-0.5 border border-[#0F3D39] rounded-md outline-hidden bg-[#FAF9F6]"
                  autoFocus
                />
                <button
                  onClick={handleSaveBudget}
                  className="p-1 rounded-md bg-[#0F3D39] text-white hover:bg-[#174E4A] active:scale-95"
                  title="Lưu hạn mức"
                >
                  <Check className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setBudgetInput(String(monthlyBudget));
                  setIsEditingBudget(true);
                }}
                className="text-xs font-mono font-medium text-[#0F3D39] hover:underline flex items-center gap-1"
                title="Sửa ngân sách mục tiêu"
              >
                <span>{formatVND(monthlyBudget)}</span>
                <Edit3 className="w-3 h-3 text-[#78716C]" />
              </button>
            )}
          </div>
          <p className="text-[11px] text-[#78716C] mt-0.5">
            {isOverBudget ? (
              <span className="text-[#E11D48] font-medium">Vượt {formatVND(totalExpense - monthlyBudget)}</span>
            ) : (
              <span>Còn lại: {formatVND(monthlyBudget - totalExpense)}</span>
            )}
          </p>
        </div>
      </div>

      {/* Thanh đo tiến trình ngân sách */}
      <div className="py-3">
        <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
          <span className="text-[#78716C]">Tiến độ chi tiêu</span>
          <span className={`font-semibold ${isOverBudget ? 'text-[#E11D48]' : 'text-[#0F3D39]'}`}>
            {budgetProgress}%
          </span>
        </div>
        <div className="h-2 w-full bg-[#F5F3EF] rounded-full overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              isOverBudget ? 'bg-[#E11D48]' : 'bg-[#0F3D39]'
            }`}
            style={{ width: `${Math.min(100, budgetProgress)}%` }}
          />
        </div>
      </div>

      {/* Cán cân chi tiêu Vợ - Chồng (Bilateral Balance Sheet) */}
      <div className="pt-3 border-t border-[#F5F3EF]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-[#78716C] flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-[#4A6B68]" />
            Cán cân chi tiêu Vợ — Chồng
          </span>
          <span className="text-[11px] text-[#78716C] font-mono">
            {husbandRatio}% / {wifeRatio}%
          </span>
        </div>

        {/* Thanh song phương (Dual Segment Bar) */}
        <div className="h-2.5 w-full bg-[#F5F3EF] rounded-full overflow-hidden flex gap-0.5 p-0.5">
          <div
            className="h-full bg-[#0F3D39] rounded-l-full transition-all duration-500"
            style={{ width: `${husbandRatio}%` }}
            title={`Chồng: ${husbandRatio}%`}
          />
          <div
            className="h-full bg-[#B45309] rounded-r-full transition-all duration-500"
            style={{ width: `${wifeRatio}%` }}
            title={`Vợ: ${wifeRatio}%`}
          />
        </div>

        {/* Số tiền chi tiết từng người */}
        <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#0F3D39] shrink-0" />
            <div className="truncate">
              <span className="text-[#78716C]">Chồng: </span>
              <span className="font-semibold text-[#1C1917] tabular-nums">{formatVND(husbandExpense)}</span>
            </div>
          </div>
          <div className="flex items-center justify-end gap-1.5 text-right">
            <div className="truncate">
              <span className="text-[#78716C]">Vợ: </span>
              <span className="font-semibold text-[#1C1917] tabular-nums">{formatVND(wifeExpense)}</span>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-[#B45309] shrink-0" />
          </div>
        </div>
      </div>
    </section>
  );
};
