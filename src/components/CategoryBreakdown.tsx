import React, { useMemo } from 'react';
import { Layers } from 'lucide-react';
import type { Category, Transaction } from '../types';
import { formatVND } from '../utils/currency';
import { renderCategoryIcon } from '../utils/categoryIcons';

interface CategoryBreakdownProps {
  transactions: Transaction[];
  categories: Category[];
  totalExpense: number;
}

// Bảng màu mộc mạc chuẩn Harmony Ledger (Pine, Terracotta, Ochre, Sage, Slate)
const HARMONY_COLORS = [
  '#0F3D39', // Pine Emerald
  '#B45309', // Terracotta
  '#D97706', // Warm Amber
  '#2E605C', // Deep Sage
  '#4A6B68', // Muted Teal
  '#78716C', // Warm Stone
  '#9A3412', // Rust Ochre
  '#374151'  // Charcoal
];

export const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({
  transactions,
  categories,
  totalExpense
}) => {
  // Tính toán số tiền và lượt chi cho từng danh mục
  const categoryStats = useMemo(() => {
    const statsMap: Record<string, { amount: number; count: number }> = {};

    transactions.forEach((tx) => {
      if (tx.type === 'EXPENSE') {
        if (!statsMap[tx.categoryId]) {
          statsMap[tx.categoryId] = { amount: 0, count: 0 };
        }
        statsMap[tx.categoryId].amount += tx.amount;
        statsMap[tx.categoryId].count += 1;
      }
    });

    // Ghép với danh sách Category gốc và sắp xếp từ chi nhiều nhất đến ít nhất
    const list = categories
      .map((cat, index) => {
        const stat = statsMap[cat.id] || { amount: 0, count: 0 };
        const percent = totalExpense > 0 ? Math.round((stat.amount / totalExpense) * 100) : 0;
        const color = cat.color || HARMONY_COLORS[index % HARMONY_COLORS.length];

        return {
          id: cat.id,
          name: cat.name,
          icon: cat.icon || 'folder',
          amount: stat.amount,
          count: stat.count,
          percent,
          color,
          monthlyLimit: cat.monthlyLimit
        };
      })
      .filter((item) => item.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    return list;
  }, [transactions, categories, totalExpense]);

  return (
    <div className="bg-white border border-[#E6E2DA] rounded-3xl p-5 shadow-xs flex flex-col gap-4">
      {/* Tiêu đề khối */}
      <div className="flex items-center justify-between border-b border-[#F5F3EF] pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#E7EFEF] text-[#0F3D39] flex items-center justify-center">
            <Layers className="w-4 h-4 stroke-[2]" />
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#1C1917]">
              Cơ cấu theo nhóm chi
            </h3>
            <p className="text-[11px] text-[#78716C]">
              {categoryStats.length} nhóm phát sinh chi tiêu
            </p>
          </div>
        </div>

        <span className="text-xs font-mono font-medium text-[#78716C]">
          100% tỷ trọng
        </span>
      </div>

      {categoryStats.length === 0 ? (
        <div className="py-8 text-center text-xs text-[#78716C] font-mono">
          Chưa có khoản chi nào trong tháng này.
        </div>
      ) : (
        <>
          {/* 1. Thanh tỷ trọng phân bổ ngang (Segmented Proportional Bar) */}
          <div className="space-y-1.5">
            <div className="h-3 w-full rounded-full overflow-hidden flex bg-[#F5F3EF] border border-[#E6E2DA]/60">
              {categoryStats.map((cat) => (
                <div
                  key={cat.id}
                  style={{
                    width: `${cat.percent}%`,
                    backgroundColor: cat.color
                  }}
                  className="h-full transition-all duration-300 first:rounded-l-full last:rounded-r-full"
                  title={`${cat.name}: ${formatVND(cat.amount)} (${cat.percent}%)`}
                />
              ))}
            </div>

            {/* Chú thích nhanh 3 nhóm chi lớn nhất */}
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#78716C] pt-1">
              {categoryStats.slice(0, 3).map((cat) => (
                <div key={cat.id} className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="truncate max-w-[110px]">{cat.name}</span>
                  <span className="font-mono font-semibold text-[#1C1917]">
                    {cat.percent}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Danh sách chi tiết các danh mục */}
          <div className="divide-y divide-[#F5F3EF] mt-1">
            {categoryStats.map((cat) => {
              const isOverLimit = cat.monthlyLimit && cat.amount > cat.monthlyLimit;

              return (
                <div key={cat.id} className="py-2.5 flex items-center justify-between gap-3">
                  {/* Nhóm & Tên */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border border-[#E6E2DA]/80 bg-[#FAF9F6] shadow-2xs">
                      {renderCategoryIcon(cat.icon, "w-4 h-4", cat.color)}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-[#1C1917] truncate">
                          {cat.name}
                        </span>
                        <span className="text-[10px] font-mono text-[#78716C] px-1.5 py-0.2 rounded-md bg-[#F5F3EF]">
                          {cat.count} lần
                        </span>
                      </div>
                      {cat.monthlyLimit ? (
                        <p className="text-[10px] font-mono text-[#78716C]">
                          Hạn mức: {formatVND(cat.monthlyLimit)}
                          {isOverLimit && (
                            <span className="text-[#E11D48] ml-1 font-semibold">
                              (Vượt)
                            </span>
                          )}
                        </p>
                      ) : (
                        <p className="text-[10px] text-[#A8A29E] font-mono">
                          Chiếm {cat.percent}% tổng chi
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Số tiền & Tỷ lệ */}
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold font-mono text-[#1C1917] tabular-nums">
                      {formatVND(cat.amount)}
                    </span>
                    <div className="w-16 bg-[#F5F3EF] h-1.5 rounded-full overflow-hidden mt-1 ml-auto">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${cat.percent}%`,
                          backgroundColor: cat.color
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
