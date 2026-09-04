import React, { useState } from 'react';
import { Delete, Check, Plus, Tag } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatVND } from '../utils/currency';
import { playKeyClick, playActionClick } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';
import { QuickTags } from './QuickTags';
import type { Category, QuickTagItem, CategoryKey } from '../types';

interface NumpadProps {
  onSuccess?: () => void;
}

export const Numpad: React.FC<NumpadProps> = ({ onSuccess }) => {
  const { categories, logTransaction, currentUser } = useApp();

  // Giá trị số tiền đang nhập dạng chuỗi
  const [amountStr, setAmountStr] = useState<string>('0');
  
  // Người chi: mặc định lấy "Chồng" hoặc "Vợ"
  const [paidBy, setPaidBy] = useState<'Chồng' | 'Vợ'>('Chồng');

  // Nhóm chi được chọn
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    categories[0]?.id || 'cat_essential'
  );

  // Ghi chú / Diễn giải
  const [note, setNote] = useState<string>('');
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Phím số bấm
  const handleDigit = (digit: string) => {
    playKeyClick();
    triggerHaptic(8);

    setAmountStr((prev) => {
      if (prev === '0') return digit;
      if (prev.length >= 10) return prev; // Giới hạn độ dài tránh tràn
      return prev + digit;
    });
  };

  // Phím xóa 1 ký tự
  const handleDelete = () => {
    playKeyClick();
    triggerHaptic(10);

    setAmountStr((prev) => {
      if (prev.length <= 1) return '0';
      return prev.slice(0, -1);
    });
  };

  // Phím xóa hết
  const handleClear = () => {
    playActionClick();
    triggerHaptic(15);
    setAmountStr('0');
    setNote('');
    setSelectedTagId(null);
  };

  // Phím cộng nhanh (+10k, +50k, +100k, +500k)
  const handleAddQuick = (val: number) => {
    playActionClick();
    triggerHaptic(10);

    setAmountStr((prev) => {
      const current = Number(prev) || 0;
      return String(current + val);
    });
  };

  // Chọn từ dải Quick Tags 1-chạm
  const handleSelectQuickTag = (tag: QuickTagItem) => {
    setSelectedTagId(tag.id);
    setSelectedCategoryId(tag.categoryId);
    setNote(tag.label);
    if (tag.defaultAmount && amountStr === '0') {
      setAmountStr(String(tag.defaultAmount));
    }
  };

  // Ghi nhận chi tiêu
  const handleSubmit = async () => {
    const amount = Number(amountStr);
    if (amount <= 0) {
      alert('Vui lòng nhập số tiền chi tiêu lớn hơn 0');
      return;
    }

    const currentCat = categories.find((c) => c.id === selectedCategoryId) || categories[0];
    const todayStr = new Date().toISOString().split('T')[0];

    try {
      setIsSubmitting(true);
      await logTransaction({
        amount,
        type: 'EXPENSE',
        categoryId: currentCat.id,
        categoryName: currentCat.name,
        categoryKey: currentCat.categoryKey as CategoryKey,
        paidBy,
        paidByUid: currentUser?.uid || 'anonymous',
        note: note.trim() || currentCat.name,
        date: todayStr
      });

      // Reset màn hình
      setAmountStr('0');
      setNote('');
      setSelectedTagId(null);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Lỗi khi ghi sổ:', error);
      alert('Có lỗi xảy ra khi ghi nhận khoản chi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-[#E6E2DA] rounded-3xl p-4 shadow-sm flex flex-col gap-3">
      {/* 1. Màn hình hiển thị số tiền (Display) */}
      <div className="bg-[#FAF9F6] border border-[#E6E2DA] rounded-2xl p-3.5 flex flex-col items-center justify-center min-h-[76px] relative">
        <span className="text-[10px] uppercase font-mono text-[#78716C] tracking-wider mb-0.5">
          Số tiền ghi sổ
        </span>
        <div className="flex items-baseline gap-1 text-[#1C1917]">
          <span className="text-3xl sm:text-4xl font-bold font-mono tracking-tight tabular-nums">
            {formatVND(Number(amountStr), false)}
          </span>
          <span className="text-sm font-semibold text-[#78716C]">₫</span>
        </div>

        {amountStr !== '0' && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-[#A8A29E] hover:text-[#E11D48] px-2 py-1 rounded-md hover:bg-white active:scale-95 transition-all"
            title="Xóa hết"
          >
            C
          </button>
        )}
      </div>

      {/* 2. Dải gợi ý Quick Tags 1-chạm */}
      <QuickTags onSelectTag={handleSelectQuickTag} selectedTagId={selectedTagId} />

      {/* 3. Bộ chuyển đổi: Người chi (Vợ/Chồng) & Ghi chú */}
      <div className="grid grid-cols-2 gap-2">
        {/* Toggle Người chi */}
        <div className="bg-[#F5F3EF] border border-[#E6E2DA] rounded-xl p-1 flex items-center">
          <button
            type="button"
            onClick={() => {
              playActionClick();
              triggerHaptic(10);
              setPaidBy('Chồng');
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all tactile-btn ${
              paidBy === 'Chồng'
                ? 'bg-[#0F3D39] text-white shadow-2xs'
                : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            Chồng chi
          </button>
          <button
            type="button"
            onClick={() => {
              playActionClick();
              triggerHaptic(10);
              setPaidBy('Vợ');
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all tactile-btn ${
              paidBy === 'Vợ'
                ? 'bg-[#B45309] text-white shadow-2xs'
                : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            Vợ chi
          </button>
        </div>

        {/* Ô nhập ghi chú nhanh */}
        <div className="relative flex items-center">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ghi chú chi tiết..."
            className="w-full h-full bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl px-3 py-1.5 text-xs text-[#1C1917] placeholder:text-[#A8A29E] outline-hidden focus:border-[#0F3D39]"
          />
        </div>
      </div>

      {/* 4. Bộ chọn Nhóm chi tiêu (Categories) */}
      <div>
        <div className="flex items-center gap-1 mb-1.5 px-0.5">
          <Tag className="w-3 h-3 text-[#78716C]" />
          <span className="text-[11px] uppercase tracking-wider font-semibold text-[#78716C]">
            Chọn nhóm chi
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {categories.map((cat) => {
            const isSelected = selectedCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  playActionClick();
                  triggerHaptic(10);
                  setSelectedCategoryId(cat.id);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl border text-xs text-left transition-all tactile-btn ${
                  isSelected
                    ? 'border-[#0F3D39] bg-[#E7EFEF] text-[#0F3D39] font-semibold shadow-2xs'
                    : 'border-[#E6E2DA] bg-white text-[#1C1917] hover:bg-[#F5F3EF]'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color || '#0F3D39' }}
                />
                <span className="truncate">{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Phím cộng nhanh (+10k, +50k, +100k, +500k) */}
      <div className="grid grid-cols-4 gap-1.5">
        {[
          { label: '+10k', val: 10000 },
          { label: '+50k', val: 50000 },
          { label: '+100k', val: 100000 },
          { label: '+500k', val: 500000 }
        ].map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => handleAddQuick(item.val)}
            className="py-1.5 rounded-xl border border-[#E6E2DA] bg-[#F5F3EF] text-xs font-mono font-medium text-[#4A6B68] hover:bg-white active:scale-95 transition-all tactile-btn"
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* 6. Bàn phím số cơ học (Dieter Rams Numpad Matrix) */}
      <div className="grid grid-cols-3 gap-2">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => handleDigit(digit)}
            className="h-13 rounded-2xl bg-white border border-[#E6E2DA] hover:border-[#D3CDC2] text-xl font-bold font-mono text-[#1C1917] flex items-center justify-center transition-all tactile-btn shadow-2xs"
          >
            {digit}
          </button>
        ))}

        {/* Phím 000 */}
        <button
          type="button"
          onClick={() => handleDigit('000')}
          className="h-13 rounded-2xl bg-white border border-[#E6E2DA] hover:border-[#D3CDC2] text-sm font-semibold font-mono text-[#78716C] flex items-center justify-center transition-all tactile-btn shadow-2xs"
        >
          000
        </button>

        {/* Phím 0 */}
        <button
          type="button"
          onClick={() => handleDigit('0')}
          className="h-13 rounded-2xl bg-white border border-[#E6E2DA] hover:border-[#D3CDC2] text-xl font-bold font-mono text-[#1C1917] flex items-center justify-center transition-all tactile-btn shadow-2xs"
        >
          0
        </button>

        {/* Phím xóa lùi */}
        <button
          type="button"
          onClick={handleDelete}
          className="h-13 rounded-2xl bg-[#F5F3EF] border border-[#E6E2DA] text-[#78716C] hover:text-[#E11D48] flex items-center justify-center transition-all tactile-btn shadow-2xs"
          title="Xóa ký tự cuối"
        >
          <Delete className="w-5 h-5" />
        </button>
      </div>

      {/* 7. Nút Ghi sổ chốt hạ */}
      <button
        type="button"
        disabled={isSubmitting || amountStr === '0'}
        onClick={handleSubmit}
        className={`w-full py-3.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all tactile-btn shadow-xs ${
          amountStr === '0' || isSubmitting
            ? 'bg-[#E6E2DA] text-[#A8A29E] cursor-not-allowed'
            : 'bg-[#0F3D39] text-[#FAF9F6] hover:bg-[#174E4A] active:scale-98'
        }`}
      >
        <Check className="w-4 h-4 stroke-[2.5]" />
        <span>Ghi sổ ngay ({formatVND(Number(amountStr))})</span>
      </button>
    </div>
  );
};
