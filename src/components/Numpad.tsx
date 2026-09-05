import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Delete, Check, Tag, Target, ChevronDown } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatVND } from '../utils/currency';
import { playKeyClick, playActionClick } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';
import { renderGoalIcon, renderCategoryIcon } from '../utils/categoryIcons';
import { QuickTags } from './QuickTags';
import { DEFAULT_INCOME_QUICK_TAGS, DEFAULT_CATEGORIES } from '../services/mockData';
import type { QuickTagItem, CategoryKey, Transaction } from '../types';
import { useToast } from './Toast';

interface NumpadProps {
  onSuccess?: () => void;
}

export const Numpad: React.FC<NumpadProps> = ({ onSuccess }) => {
  const { categories, logTransaction, currentUser, userRole, financialGoals } = useApp();
  const { showToast } = useToast();

  // Loại giao dịch: 'EXPENSE' (Khoản chi) hoặc 'INCOME' (Thu nhập)
  const [txType, setTxType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');

  // Giá trị số tiền đang nhập dạng chuỗi
  const [amountStr, setAmountStr] = useState<string>('0');
  
  // Người chi / Người nhận: Tự động chọn theo vai trò của người dùng ("Chồng" hoặc "Vợ")
  const [paidBy, setPaidBy] = useState<'Chồng' | 'Vợ'>(userRole || 'Chồng');

  // Tự động cập nhật paidBy khi vai trò người dùng thay đổi
  useEffect(() => {
    if (userRole) {
      setPaidBy(userRole);
    }
  }, [userRole]);

  // Lọc danh mục theo loại giao dịch (chỉ lấy danh mục đang hoạt động, bỏ qua danh mục đã ẩn)
  const currentCategories = useMemo(() => {
    const activeList = categories.filter((c) => !c.isArchived);
    const list = activeList.filter((c) => (c.type || 'EXPENSE') === txType);
    if (list.length > 0) return list;
    // Fallback an toàn: nếu danh mục của loại này chưa kịp tải, hiển thị danh mục mặc định chuẩn của đúng loại đó
    return DEFAULT_CATEGORIES.filter((c) => (c.type || 'EXPENSE') === txType);
  }, [categories, txType]);

  // Nhóm chi/thu được chọn
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    currentCategories[0]?.id || (txType === 'INCOME' ? 'cat_income_salary' : 'cat_essential')
  );

  // Mục tiêu Tự do Tài chính liên kết (nếu danh mục là Trả nợ hoặc Tích lũy)
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

  // Xác định mục tiêu liên quan dựa trên danh mục được chọn (Trả nợ hoặc Tích lũy)
  const matchingGoals = useMemo(() => {
    const currentCat = categories.find((c) => c.id === selectedCategoryId);
    if (!currentCat) return [];

    const isDebtCat = currentCat.id === 'cat_debt' 
      || currentCat.name.toLowerCase().includes('nợ') 
      || currentCat.name.toLowerCase().includes('ngân hàng');

    const isSavingCat = currentCat.categoryKey === 'SAVING' 
      || currentCat.name.toLowerCase().includes('tích lũy') 
      || currentCat.name.toLowerCase().includes('tiết kiệm');

    if (isDebtCat) {
      return financialGoals.filter((g) => g.status === 'ACTIVE' && g.type === 'DEBT_PAYOFF');
    }
    if (isSavingCat) {
      return financialGoals.filter((g) => g.status === 'ACTIVE' && g.type === 'SAVINGS');
    }
    return [];
  }, [categories, selectedCategoryId, financialGoals]);

  // Tự động gắn mục tiêu đầu tiên nếu danh mục khớp và người dùng chưa chọn
  useEffect(() => {
    if (matchingGoals.length > 0) {
      setSelectedGoalId((prev) => {
        if (prev && matchingGoals.some((g) => g.id === prev)) return prev;
        return matchingGoals[0].id;
      });
    } else {
      setSelectedGoalId(null);
    }
  }, [matchingGoals]);

  // Ghi chú / Diễn giải
  const [note, setNote] = useState<string>('');
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState<boolean>(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  // Tự động chuyển danh mục mặc định khi đổi loại giao dịch
  useEffect(() => {
    const firstCat = categories.find((c) => !c.isArchived && (c.type || 'EXPENSE') === txType)
      || DEFAULT_CATEGORIES.find((c) => (c.type || 'EXPENSE') === txType);
    if (firstCat) {
      setSelectedCategoryId(firstCat.id);
    }
    setSelectedTagId(null);
    setNote('');
    setIsCategoryOpen(false);
  }, [txType, categories]);

  // Đóng dropdown khi bấm ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryOpen(false);
      }
    };

    if (isCategoryOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isCategoryOpen]);

  // Danh mục đang được chọn
  const selectedCategory = useMemo(() => {
    return currentCategories.find((c) => c.id === selectedCategoryId) || currentCategories[0];
  }, [currentCategories, selectedCategoryId]);

  // Phím số bấm
  const handleDigit = (digit: string) => {
    playKeyClick();
    triggerHaptic(8);

    setAmountStr((prev) => {
      if (prev === '0') return digit;
      if (prev.length >= 11) return prev; // Giới hạn độ dài tránh tràn
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
    setSelectedGoalId(null);
  };

  // Phím cộng nhanh (+10k, +50k... hoặc +1tr, +2tr...)
  const handleAddQuick = (val: number) => {
    playActionClick();
    triggerHaptic(10);

    setAmountStr((prev) => {
      const current = Number(prev) || 0;
      return String(current + val);
    });
  };

  // Danh sách phím cộng nhanh theo loại giao dịch
  const quickAmounts = useMemo(() => {
    if (txType === 'INCOME') {
      return [
        { label: '+1tr', val: 1000000 },
        { label: '+2tr', val: 2000000 },
        { label: '+5tr', val: 5000000 },
        { label: '+10tr', val: 10000000 }
      ];
    }
    return [
      { label: '+10k', val: 10000 },
      { label: '+50k', val: 50000 },
      { label: '+100k', val: 100000 },
      { label: '+500k', val: 500000 }
    ];
  }, [txType]);

  // Chọn từ dải Quick Tags 1-chạm
  const handleSelectQuickTag = (tag: QuickTagItem) => {
    setSelectedTagId(tag.id);
    setSelectedCategoryId(tag.categoryId);
    setNote(tag.label);
    if (tag.defaultAmount && amountStr === '0') {
      setAmountStr(String(tag.defaultAmount));
    }
  };

  // Ghi nhận giao dịch (Chi tiêu hoặc Thu nhập)
  const handleSubmit = async () => {
    const amount = Number(amountStr);
    if (amount <= 0) {
      showToast(`Vui lòng nhập số tiền ${txType === 'EXPENSE' ? 'chi tiêu' : 'thu nhập'} lớn hơn 0`, 'warning');
      return;
    }

    const currentCat = categories.find((c) => c.id === selectedCategoryId) || currentCategories[0] || categories[0];
    const todayStr = new Date().toISOString().split('T')[0];
    const selectedGoal = financialGoals.find((g) => g.id === selectedGoalId);

    try {
      setIsSubmitting(true);
      const txPayload: Omit<Transaction, 'id' | 'createdAt' | 'timestamp'> = {
        amount,
        type: txType,
        categoryId: currentCat.id,
        categoryName: currentCat.name,
        categoryKey: currentCat.categoryKey as CategoryKey,
        paidBy,
        paidByUid: currentUser?.uid || 'anonymous',
        note: note.trim() || currentCat.name,
        date: todayStr,
      };

      if (selectedGoalId) {
        txPayload.goalId = selectedGoalId;
        txPayload.goalName = selectedGoal?.title || '';
      }

      await logTransaction(txPayload);

      // Reset màn hình
      setAmountStr('0');
      setNote('');
      setSelectedTagId(null);
      setPaidBy(userRole || 'Chồng');
      setSelectedGoalId(null);

      showToast(`Đã ghi nhận ${txType === 'EXPENSE' ? 'khoản chi' : 'thu nhập'} ${formatVND(amount)}`, 'success');

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Lỗi khi ghi sổ:', error);
      showToast(`Có lỗi xảy ra khi ghi nhận ${txType === 'EXPENSE' ? 'khoản chi' : 'thu nhập'}.`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Hỗ trợ gõ trực tiếp bằng bàn phím máy tính trên Desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Bỏ qua nếu đang gõ trong input ghi chú
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleDelete();
      } else if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        handleClear();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (amountStr !== '0' && !isSubmitting) {
          handleSubmit();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [amountStr, selectedCategoryId, note, paidBy, txType, isSubmitting]);

  return (
    <div className="bg-white border border-[#E6E2DA] rounded-3xl p-3.5 sm:p-4 shadow-sm flex flex-col gap-2.5 sm:gap-3">
      {/* 0. Bộ chuyển đổi loại giao dịch: Khoản chi vs Thu nhập */}
      <div className="bg-[#F5F3EF] border border-[#E6E2DA] rounded-2xl p-1 flex items-center">
        <button
          type="button"
          onClick={() => {
            playActionClick();
            triggerHaptic(10);
            setTxType('EXPENSE');
          }}
          className={`flex-1 py-1.5 sm:py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all tactile-btn ${
            txType === 'EXPENSE'
              ? 'bg-[#0F3D39] text-white shadow-2xs'
              : 'text-[#78716C] hover:text-[#1C1917]'
          }`}
        >
          <span>💸 Khoản chi</span>
        </button>
        <button
          type="button"
          onClick={() => {
            playActionClick();
            triggerHaptic(10);
            setTxType('INCOME');
          }}
          className={`flex-1 py-1.5 sm:py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all tactile-btn ${
            txType === 'INCOME'
              ? 'bg-[#10B981] text-white shadow-2xs'
              : 'text-[#78716C] hover:text-[#1C1917]'
          }`}
        >
          <span>💰 Thu nhập</span>
        </button>
      </div>

      {/* 1. Màn hình hiển thị số tiền (Display) */}
      <div className="bg-[#FAF9F6] border border-[#E6E2DA] rounded-2xl p-2.5 sm:p-3 flex flex-col items-center justify-center min-h-[68px] sm:min-h-[74px] relative">
        <span className="text-[10px] uppercase font-mono text-[#78716C] tracking-wider mb-0.5">
          {txType === 'EXPENSE' ? 'Số tiền chi tiêu' : 'Số tiền thu nhập'}
        </span>
        <div className="flex items-baseline gap-1 text-[#1C1917]">
          {txType === 'INCOME' && amountStr !== '0' && (
            <span className="text-2xl font-bold font-mono text-[#10B981]">+</span>
          )}
          <span
            className={`text-3xl sm:text-4xl font-bold font-mono tracking-tight tabular-nums ${
              txType === 'INCOME' && amountStr !== '0' ? 'text-[#0F3D39]' : 'text-[#1C1917]'
            }`}
          >
            {formatVND(Number(amountStr), false)}
          </span>
          <span className="text-sm font-semibold text-[#78716C]">₫</span>
        </div>

        {amountStr !== '0' && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-[#A8A29E] hover:text-[#E11D48] px-2 py-1 rounded-md hover:bg-white active:scale-95 transition-all"
            title="Xóa hết (Phím C hoặc Esc)"
          >
            C
          </button>
        )}
      </div>

      {/* 2. Dải gợi ý Quick Tags 1-chạm */}
      <QuickTags
        onSelectTag={handleSelectQuickTag}
        selectedTagId={selectedTagId}
        tags={txType === 'INCOME' ? DEFAULT_INCOME_QUICK_TAGS : undefined}
      />

      {/* 3. Bộ chuyển đổi: Người chi / Người nhận & Ghi chú */}
      <div className="grid grid-cols-2 gap-2">
        {/* Toggle Người chi / nhận */}
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
            {txType === 'EXPENSE' ? 'Chồng chi' : 'Chồng nhận'}
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
            {txType === 'EXPENSE' ? 'Vợ chi' : 'Vợ nhận'}
          </button>
        </div>

        {/* Ô nhập ghi chú nhanh */}
        <div className="relative flex items-center">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={txType === 'EXPENSE' ? 'Ghi chú chi tiết...' : 'Nguồn thu (Lương, thưởng...)'}
            className="w-full h-full bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl px-3 py-1.5 text-xs text-[#1C1917] placeholder:text-[#A8A29E] outline-hidden focus:border-[#0F3D39]"
          />
        </div>
      </div>

      {/* 4. Bộ chọn Nhóm chi tiêu / Nguồn thu dạng droplist */}
      <div className="relative" ref={categoryDropdownRef}>
        <div className="flex items-center gap-1 mb-1.5 px-0.5">
          <Tag className="w-3 h-3 text-[#78716C]" />
          <span className="text-[11px] uppercase tracking-wider font-semibold text-[#78716C]">
            {txType === 'EXPENSE' ? 'Chọn nhóm chi' : 'Chọn nguồn thu'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            playActionClick();
            triggerHaptic(5);
            setIsCategoryOpen((prev) => !prev);
          }}
          className={`w-full px-3.5 py-2 sm:py-2.5 rounded-xl border bg-[#FAF9F6] text-xs flex items-center justify-between transition-all cursor-pointer ${
            isCategoryOpen
              ? 'border-[#0F3D39] ring-2 ring-[#0F3D39]/20 bg-white'
              : 'border-[#E6E2DA] hover:border-[#0F3D39]/50'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border border-[#E6E2DA]/80 bg-white shadow-2xs">
              {renderCategoryIcon(selectedCategory?.icon, "w-3.5 h-3.5", selectedCategory?.color || (txType === 'INCOME' ? '#10B981' : '#0F3D39'))}
            </span>
            <span className="font-semibold text-[#1C1917] truncate">
              {selectedCategory?.name || (txType === 'EXPENSE' ? 'Chọn nhóm chi' : 'Chọn nguồn thu')}
            </span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-[#78716C] transition-transform duration-200 shrink-0 ${
              isCategoryOpen ? 'rotate-180 text-[#0F3D39]' : ''
            }`}
          />
        </button>

        {/* Menu thả xuống */}
        {isCategoryOpen && (
          <div className="absolute top-full left-0 right-0 mt-1.5 max-h-52 overflow-y-auto bg-white border border-[#E6E2DA] rounded-2xl shadow-xl p-1.5 z-40 space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
            {currentCategories.map((cat) => {
              const isSelected = selectedCategoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    playActionClick();
                    triggerHaptic(10);
                    setSelectedCategoryId(cat.id);
                    setIsCategoryOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 sm:py-2.5 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? txType === 'INCOME'
                        ? 'bg-[#ECFDF5] text-[#047857] font-semibold'
                        : 'bg-[#E7EFEF] text-[#0F3D39] font-semibold'
                      : 'text-[#1C1917] hover:bg-[#FAF9F6]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border border-[#E6E2DA]/80 bg-[#FAF9F6] shadow-2xs">
                      {renderCategoryIcon(cat.icon, "w-3.5 h-3.5", cat.color || (txType === 'INCOME' ? '#10B981' : '#0F3D39'))}
                    </span>
                    <span className="truncate">{cat.name}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#0F3D39] shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 4.5. Dải gợi ý gắn vào Mục tiêu Tự do Tài chính (Tự động xuất hiện khi chọn Trả nợ / Tích lũy) */}
      {matchingGoals.length > 0 && (
        <div className="bg-[#FAF9F6] border border-[#E6E2DA] rounded-2xl p-2 sm:p-2.5 flex flex-col gap-1.5 shadow-2xs animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center justify-between px-0.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0F3D39]">
              <Target className="w-3.5 h-3.5 text-[#B45309]" />
              <span>Gắn vào mục tiêu Tự do Tài chính:</span>
            </div>
            {selectedGoalId && (
              <button
                type="button"
                onClick={() => setSelectedGoalId(null)}
                className="text-[10px] text-[#78716C] hover:text-[#E11D48] underline transition-colors"
              >
                Không gắn
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {matchingGoals.map((g) => {
              const isChosen = selectedGoalId === g.id;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => {
                    playActionClick();
                    triggerHaptic(10);
                    setSelectedGoalId(isChosen ? null : g.id);
                  }}
                  className={`shrink-0 px-2.5 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-all tactile-btn ${
                    isChosen
                      ? 'bg-[#0F3D39] text-white border-[#0F3D39] shadow-2xs font-semibold'
                      : 'bg-white text-[#1C1917] border-[#E6E2DA] hover:bg-[#F5F3EF]'
                  }`}
                >
                  <span className="shrink-0 flex items-center justify-center">
                    {renderGoalIcon(
                      g.icon,
                      g.type,
                      "w-3.5 h-3.5",
                      isChosen ? 'currentColor' : (g.color || (g.type === 'DEBT_PAYOFF' ? '#B45309' : '#10B981'))
                    )}
                  </span>
                  <span className="truncate max-w-[130px]">{g.title}</span>
                  <span className={`text-[10px] font-mono ${isChosen ? 'text-white/80' : 'text-[#78716C]'}`}>
                    ({formatVND(g.currentAmount, false)}₫)
                  </span>
                  {isChosen && <Check className="w-3 h-3 stroke-[2.5]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Phím cộng nhanh */}
      <div className="grid grid-cols-4 gap-1.5">
        {quickAmounts.map((item) => (
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
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => handleDigit(digit)}
            className="h-11 sm:h-12 rounded-2xl bg-white border border-[#E6E2DA] hover:border-[#D3CDC2] text-lg sm:text-xl font-bold font-mono text-[#1C1917] flex items-center justify-center transition-all tactile-btn shadow-2xs"
          >
            {digit}
          </button>
        ))}

        {/* Phím 000 */}
        <button
          type="button"
          onClick={() => handleDigit('000')}
          className="h-11 sm:h-12 rounded-2xl bg-white border border-[#E6E2DA] hover:border-[#D3CDC2] text-xs sm:text-sm font-semibold font-mono text-[#78716C] flex items-center justify-center transition-all tactile-btn shadow-2xs"
        >
          000
        </button>

        {/* Phím 0 */}
        <button
          type="button"
          onClick={() => handleDigit('0')}
          className="h-11 sm:h-12 rounded-2xl bg-white border border-[#E6E2DA] hover:border-[#D3CDC2] text-lg sm:text-xl font-bold font-mono text-[#1C1917] flex items-center justify-center transition-all tactile-btn shadow-2xs"
        >
          0
        </button>

        {/* Phím xóa lùi */}
        <button
          type="button"
          onClick={handleDelete}
          className="h-11 sm:h-12 rounded-2xl bg-[#F5F3EF] border border-[#E6E2DA] text-[#78716C] hover:text-[#E11D48] flex items-center justify-center transition-all tactile-btn shadow-2xs"
          title="Xóa ký tự cuối (Phím Backspace)"
        >
          <Delete className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* 7. Nút Ghi sổ chốt hạ */}
      <button
        type="button"
        disabled={isSubmitting || amountStr === '0'}
        onClick={handleSubmit}
        className={`w-full py-3 sm:py-3.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all tactile-btn shadow-xs ${
          amountStr === '0' || isSubmitting
            ? 'bg-[#E6E2DA] text-[#A8A29E] cursor-not-allowed'
            : txType === 'INCOME'
            ? 'bg-[#10B981] text-white hover:bg-[#059669] active:scale-98'
            : 'bg-[#0F3D39] text-[#FAF9F6] hover:bg-[#174E4A] active:scale-98'
        }`}
      >
        <Check className="w-4 h-4 stroke-[2.5]" />
        <span>
          {txType === 'INCOME'
            ? `Ghi nhận thu nhập (+${formatVND(Number(amountStr))})`
            : `Ghi nhận khoản chi (${formatVND(Number(amountStr))})`}
        </span>
      </button>

      {/* Gợi ý phím tắt trên Desktop */}
      <p className="hidden sm:block text-[10.5px] text-center text-[#A8A29E] font-mono">
        ⌨️ Gõ trực tiếp bằng bàn phím (0-9, Backspace, Enter)
      </p>
    </div>
  );
};
