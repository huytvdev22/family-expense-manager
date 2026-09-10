import React, { useMemo } from 'react';
import { 
  SlidersHorizontal, 
  Check, 
  CheckSquare, 
  Landmark
} from 'lucide-react';
import type { Category, Transaction } from '../types';
import { formatVND } from '../utils/currency';
import { renderCategoryIcon } from '../utils/categoryIcons';
import { playActionClick } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';
import { BottomSheet } from './BottomSheet';

interface ReportCategoryFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  transactions: Transaction[];
  excludedCategoryIds: string[];
  onToggleCategory: (categoryId: string) => void;
  onSelectAll: () => void;
  onExcludeDebtAndSavings: () => void;
}

export const ReportCategoryFilterModal: React.FC<ReportCategoryFilterModalProps> = ({
  isOpen,
  onClose,
  categories = [],
  transactions = [],
  excludedCategoryIds = [],
  onToggleCategory,
  onSelectAll,
  onExcludeDebtAndSavings
}) => {
  // Lọc chỉ lấy danh mục chi tiêu (EXPENSE)
  const expenseCategories = useMemo(() => {
    return (categories || []).filter((cat) => cat.type === 'EXPENSE' && !cat.isArchived);
  }, [categories]);

  // Tính tổng chi tiêu trong tháng cho từng danh mục
  const categoryAmountMap = useMemo(() => {
    const map: Record<string, number> = {};
    (transactions || []).forEach((tx) => {
      if (tx.type === 'EXPENSE') {
        map[tx.categoryId] = (map[tx.categoryId] || 0) + tx.amount;
      }
    });
    return map;
  }, [transactions]);

  // Sắp xếp danh mục: các danh mục có chi tiêu xếp trước (tiền lớn xếp trước)
  const sortedCategories = useMemo(() => {
    return [...expenseCategories].sort((a, b) => {
      const amountA = categoryAmountMap[a.id] || 0;
      const amountB = categoryAmountMap[b.id] || 0;
      if (amountA !== amountB) {
        return amountB - amountA;
      }
      return a.name.localeCompare(b.name);
    });
  }, [expenseCategories, categoryAmountMap]);

  // Thống kê số lượng & số tiền bị loại trừ
  const totalExpenseCount = expenseCategories.length;
  const excludedCount = excludedCategoryIds.length;
  const includedCount = Math.max(0, totalExpenseCount - excludedCount);

  const excludedTotalAmount = useMemo(() => {
    return excludedCategoryIds.reduce((sum, catId) => {
      return sum + (categoryAmountMap[catId] || 0);
    }, 0);
  }, [excludedCategoryIds, categoryAmountMap]);

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Danh mục tính Báo cáo & Dự phóng"
      subtitle="Chọn các nhóm chi đưa vào nhịp chi & dự phóng"
      icon={
        <div className="w-8 h-8 rounded-xl bg-[#E7EFEF] text-[#0F3D39] flex items-center justify-center">
          <SlidersHorizontal className="w-4 h-4" />
        </div>
      }
      maxHeight="max-h-[90dvh] sm:max-h-[85vh]"
      bodyClassName="p-0 flex flex-col"
      footer={
        <div className="px-5 py-3 flex items-center justify-between gap-3">
          <p className="text-[11px] text-[#78716C]">
            Đã lưu tự động theo Hộ gia đình
          </p>

          <button
            type="button"
            onClick={() => {
              playActionClick();
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl bg-[#0F3D39] text-white text-xs font-bold hover:bg-[#174E4A] active:scale-95 transition-all shadow-xs cursor-pointer min-h-[40px]"
          >
            Hoàn tất
          </button>
        </div>
      }
    >
      {/* Hướng dẫn ngắn gọn & Thẻ tóm tắt */}
      <div className="px-5 py-3 bg-[#FAF9F6] border-b border-[#E6E2DA]/60 space-y-2.5 shrink-0">
        <p className="text-[11px] text-[#57534E] leading-relaxed">
          💡 Tắt những khoản chi lớn bất thường (như trả nợ ngân hàng, mua sắm lớn...) để tốc độ chi mỗi ngày và dự phóng cuối tháng phản ánh trung thực nhịp sinh hoạt tổ ấm.
        </p>

        {/* Tóm tắt trạng thái */}
        <div className="flex items-center justify-between p-2.5 rounded-2xl bg-white border border-[#E6E2DA] text-xs">
          <div>
            <span className="text-[#78716C]">Đang đưa vào tính toán:</span>
            <strong className="font-mono text-[#0F3D39] ml-1.5 font-bold">
              {includedCount}/{totalExpenseCount} nhóm
            </strong>
          </div>

          {excludedCount > 0 && (
            <div className="text-[11px] font-mono font-semibold text-[#B45309]">
              Loại trừ: {formatVND(excludedTotalAmount)}
            </div>
          )}
        </div>

        {/* Nút tác vụ nhanh */}
        <div className="flex items-center gap-2 pt-0.5">
          <button
            type="button"
            onClick={() => {
              playActionClick();
              triggerHaptic(6);
              onSelectAll();
            }}
            className="flex-1 py-2 px-2.5 rounded-xl border border-[#E6E2DA] bg-white hover:bg-[#F5F3EF] text-xs font-medium text-[#1C1917] flex items-center justify-center gap-1.5 transition-colors active:scale-98 cursor-pointer min-h-[38px]"
          >
            <CheckSquare className="w-3.5 h-3.5 text-[#0F3D39]" />
            <span>Chọn tất cả</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playActionClick();
              triggerHaptic(6);
              onExcludeDebtAndSavings();
            }}
            className="flex-1 py-2 px-2.5 rounded-xl border border-[#E6E2DA] bg-white hover:bg-[#F5F3EF] text-xs font-medium text-[#B45309] flex items-center justify-center gap-1.5 transition-colors active:scale-98 cursor-pointer min-h-[38px]"
            title="Loại trừ các nhóm Trả nợ & Tích lũy"
          >
            <Landmark className="w-3.5 h-3.5" />
            <span>Loại trừ Trả nợ</span>
          </button>
        </div>
      </div>

      {/* Danh sách danh mục chi tiêu */}
      <div className="flex-1 overflow-y-auto overscroll-contain touch-pan-y px-5 py-3 divide-y divide-[#F5F3EF] bg-white">
        {sortedCategories.map((cat) => {
          const isExcluded = excludedCategoryIds.includes(cat.id);
          const isIncluded = !isExcluded;
          const amount = categoryAmountMap[cat.id] || 0;

          return (
            <div
              key={cat.id}
              onClick={() => {
                playActionClick();
                triggerHaptic(6);
                onToggleCategory(cat.id);
              }}
              className={`py-3 flex items-center justify-between gap-3 cursor-pointer select-none transition-colors rounded-xl px-2.5 -mx-2.5 ${
                isIncluded ? 'hover:bg-[#FAF9F6]' : 'opacity-60 bg-[#FAF9F6]/50 hover:opacity-80'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Checkbox */}
                <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors shrink-0 ${
                  isIncluded 
                    ? 'bg-[#0F3D39] border-[#0F3D39] text-white' 
                    : 'border-[#D6D3D1] bg-white text-transparent'
                }`}>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>

                {/* Icon Danh mục */}
                <div 
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: cat.color || '#0F3D39' }}
                >
                  {renderCategoryIcon(cat.icon || 'folder', 'w-4 h-4')}
                </div>

                {/* Tên danh mục & Nhãn */}
                <div className="min-w-0">
                  <p className={`text-xs font-semibold truncate ${isIncluded ? 'text-[#1C1917]' : 'text-[#78716C] line-through'}`}>
                    {cat.name}
                  </p>
                  <p className="text-[10px] text-[#78716C] font-mono">
                    {cat.categoryKey === 'ESSENTIAL' && 'Thiết yếu'}
                    {cat.categoryKey === 'LIVING' && 'Sinh hoạt'}
                    {cat.categoryKey === 'UNEXPECTED' && 'Đột xuất'}
                    {cat.categoryKey === 'SAVING' && 'Tích lũy & Đầu tư'}
                    {cat.categoryKey === 'OTHER' && 'Khác'}
                    {cat.name.toLowerCase().includes('nợ') && ' • Khoản nợ'}
                  </p>
                </div>
              </div>

              {/* Số tiền phát sinh trong tháng */}
              <div className="text-right shrink-0">
                <div className={`text-xs font-bold font-mono tabular-nums ${
                  amount > 0 
                    ? (isIncluded ? 'text-[#1C1917]' : 'text-[#78716C]')
                    : 'text-[#A8A29E]'
                }`}>
                  {amount > 0 ? formatVND(amount) : '0 ₫'}
                </div>
                <div className="text-[10px] font-mono">
                  {isIncluded ? (
                    <span className="text-[#0F3D39] font-medium">Đang tính</span>
                  ) : (
                    <span className="text-[#B45309] font-medium">Loại trừ</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </BottomSheet>
  );
};
