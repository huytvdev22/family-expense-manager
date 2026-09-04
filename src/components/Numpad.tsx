import React, { useState } from 'react';
import { Delete, Check, X, Tag } from 'lucide-react';
import { soundEngine, triggerHaptic } from '../utils/audio';
import { formatVND } from '../utils/currency';
import type { Category, QuickTag } from '../types';

interface NumpadProps {
  initialTag?: QuickTag | null;
  categories: Category[];
  currentMember: string;
  onClose: () => void;
  onSubmit: (data: {
    amount: number;
    categoryId: string;
    note: string;
    type: 'EXPENSE' | 'INCOME';
  }) => void;
}

export const Numpad: React.FC<NumpadProps> = ({
  initialTag,
  categories,
  currentMember,
  onClose,
  onSubmit
}) => {
  const [amountStr, setAmountStr] = useState<string>('');
  const [selectedCatId, setSelectedCatId] = useState<string>(() => {
    if (initialTag) {
      const found = categories.find(c => c.id === initialTag.categoryKey);
      return found ? found.id : categories[0]?.id || '';
    }
    return categories[0]?.id || '';
  });
  const [note, setNote] = useState<string>(initialTag ? initialTag.label : '');
  const [type, setType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');

  const handleKeyPress = (char: string) => {
    soundEngine.playWoodClick(char === '000' ? 0.85 : 1.0);
    triggerHaptic(10);

    if (amountStr.length >= 10) return; // Giới hạn độ dài

    if (char === '000') {
      if (amountStr === '' || amountStr === '0') return;
      setAmountStr(prev => prev + '000');
    } else {
      if (amountStr === '0') {
        setAmountStr(char);
      } else {
        setAmountStr(prev => prev + char);
      }
    }
  };

  const handleBackspace = () => {
    soundEngine.playWoodClick(0.75);
    triggerHaptic(15);
    setAmountStr(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    soundEngine.playWoodClick(0.7);
    triggerHaptic(20);
    setAmountStr('');
  };

  const numericAmount = parseInt(amountStr, 10) || 0;

  const handleSubmit = () => {
    if (numericAmount <= 0) return;

    onSubmit({
      amount: numericAmount,
      categoryId: selectedCatId,
      note: note.trim() || (type === 'EXPENSE' ? 'Chi tiêu gia đình' : 'Thu nhập'),
      type
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm transition-opacity">
      <div 
        className="w-full max-w-lg bg-[#FAF9F6] rounded-t-3xl border-t border-[#D2DDD8] shadow-2xl p-5 pb-8 safe-bottom animate-in slide-in-from-bottom duration-200"
      >
        {/* Thanh kéo & Nút đóng */}
        <div className="flex items-center justify-between pb-3 border-b border-[#D2DDD8]/60">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#516361]">
              Ghi bởi: <strong className="text-[#0F3D39] font-bold">{currentMember}</strong>
            </span>
            {/* Chuyển Loại Thu / Chi */}
            <div className="flex bg-[#F0F4F2] p-0.5 rounded-lg border border-[#D2DDD8] text-xs">
              <button
                type="button"
                onClick={() => setType('EXPENSE')}
                className={`px-2 py-0.5 rounded-md font-semibold ${
                  type === 'EXPENSE' ? 'bg-[#E11D48] text-white' : 'text-[#516361]'
                }`}
              >
                Chi tiêu
              </button>
              <button
                type="button"
                onClick={() => setType('INCOME')}
                className={`px-2 py-0.5 rounded-md font-semibold ${
                  type === 'INCOME' ? 'bg-[#10B981] text-white' : 'text-[#516361]'
                }`}
              >
                Thu nhập
              </button>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F0F4F2] flex items-center justify-center text-[#516361] hover:text-[#192423]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Màn hình hiển thị số tiền to rõ */}
        <div className="py-4 text-center">
          <div className="text-xs font-medium text-[#516361] uppercase tracking-wider mb-1">
            Số tiền ({type === 'EXPENSE' ? 'Chi trả' : 'Thu vào'})
          </div>
          <div className="text-4xl font-extrabold font-mono text-[#0F3D39] tracking-tight min-h-[48px] flex items-center justify-center">
            {numericAmount > 0 ? formatVND(numericAmount) : '0 đ'}
          </div>
        </div>

        {/* Chọn Danh Mục & Ghi chú nhanh */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {categories.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCatId(cat.id);
                  triggerHaptic(8);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 border transition-all ${
                  selectedCatId === cat.id
                    ? 'bg-[#0F3D39] text-[#FFFFFF] border-[#0F3D39] shadow-sm'
                    : 'bg-[#FFFFFF] text-[#516361] border-[#D2DDD8] hover:border-[#0F3D39]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Ô ghi chú ngắn */}
          <div className="flex items-center gap-2 bg-[#FFFFFF] border border-[#D2DDD8] rounded-xl px-3 py-2">
            <Tag className="w-4 h-4 text-[#516361] shrink-0" />
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Ghi chú nhanh (ví dụ: Chợ rau, Bỉm cho bé...)"
              className="w-full text-xs bg-transparent border-none p-0 focus:ring-0"
            />
          </div>
        </div>

        {/* Bàn Phím Số Cơ Học Custom Numpad */}
        <div className="grid grid-cols-3 gap-2.5">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              className="h-14 rounded-2xl bg-[#FFFFFF] border border-[#D2DDD8] text-2xl font-bold font-mono text-[#192423] shadow-sm active:bg-[#F0F4F2] flex items-center justify-center"
            >
              {num}
            </button>
          ))}

          {/* Hàng cuối: 000, 0, Backspace */}
          <button
            onClick={() => handleKeyPress('000')}
            className="h-14 rounded-2xl bg-[#FFFFFF] border border-[#D2DDD8] text-lg font-bold font-mono text-[#516361] shadow-sm active:bg-[#F0F4F2] flex items-center justify-center"
          >
            .000
          </button>

          <button
            onClick={() => handleKeyPress('0')}
            className="h-14 rounded-2xl bg-[#FFFFFF] border border-[#D2DDD8] text-2xl font-bold font-mono text-[#192423] shadow-sm active:bg-[#F0F4F2] flex items-center justify-center"
          >
            0
          </button>

          <button
            onClick={handleBackspace}
            className="h-14 rounded-2xl bg-[#F0F4F2] border border-[#D2DDD8] text-[#516361] shadow-sm active:bg-[#E4ECE7] flex items-center justify-center"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>

        {/* Nút Hoàn Tất Lưu Khoản Chi */}
        <div className="mt-3.5 flex gap-2">
          <button
            type="button"
            onClick={handleClear}
            className="px-4 py-3.5 rounded-2xl bg-[#F0F4F2] border border-[#D2DDD8] text-xs font-semibold text-[#516361] hover:bg-[#E4ECE7]"
          >
            Xóa
          </button>

          <button
            type="button"
            disabled={numericAmount <= 0}
            onClick={handleSubmit}
            className={`flex-1 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all ${
              numericAmount > 0
                ? 'bg-[#0F3D39] text-[#FFFFFF] hover:bg-[#164E48] active:scale-[0.98]'
                : 'bg-[#D2DDD8] text-[#FAF9F6] cursor-not-allowed'
            }`}
          >
            <Check className="w-5 h-5" />
            Lưu Giao Dịch ({formatVND(numericAmount)})
          </button>
        </div>
      </div>
    </div>
  );
};
