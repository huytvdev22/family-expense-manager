import React, { useState, useMemo } from 'react';
import { Plus, FolderTree, Check, Edit3, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatVND } from '../utils/currency';
import { playActionClick } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';
import type { Category, CategoryKey } from '../types';

const COLOR_OPTIONS = [
  { label: 'Pine Emerald', hex: '#0F3D39' },
  { label: 'Muted Sage', hex: '#4A6B68' },
  { label: 'Warm Amber', hex: '#B45309' },
  { label: 'Emerald Green', hex: '#10B981' },
  { label: 'Rose Wine', hex: '#E11D48' },
  { label: 'Deep Charcoal', hex: '#1C1917' }
];

interface CategoryManagerProps {
  className?: string;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({ className = '' }) => {
  const { categories, activeHousehold } = useApp();

  // Chế độ xem theo loại: 'EXPENSE' (Khoản chi) hoặc 'INCOME' (Thu nhập)
  const [activeType, setActiveType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');

  const [isAdding, setIsAdding] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState(COLOR_OPTIONS[0].hex);
  const [newCatLimit, setNewCatLimit] = useState('');

  // Chỉnh sửa hạn mức nhanh
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingLimit, setEditingLimit] = useState<string>('');

  // Lọc danh mục theo loại
  const filteredCategories = useMemo(() => {
    return categories.filter((c) => (c.type || 'EXPENSE') === activeType);
  }, [categories, activeType]);

  // Thêm nhóm mới
  const handleAddCategory = () => {
    if (!newCatName.trim()) {
      alert('Vui lòng nhập tên danh mục');
      return;
    }

    playActionClick();
    triggerHaptic(10);

    const newCat: Category = {
      id: `cat_${Date.now()}`,
      name: newCatName.trim(),
      type: activeType,
      categoryKey: (activeType === 'INCOME' ? 'INCOME' : 'OTHER') as CategoryKey,
      icon: activeType === 'INCOME' ? 'briefcase' : 'folder',
      color: newCatColor,
      order: categories.length + 1,
      isDefault: false,
      monthlyLimit: Number(newCatLimit) || undefined,
      isArchived: false,
      createdAt: new Date().toISOString()
    };

    categories.push(newCat);
    setIsAdding(false);
    setNewCatName('');
    setNewCatLimit('');
  };

  // Lưu hạn mức đã sửa
  const handleSaveLimit = (catId: string) => {
    const cat = categories.find((c) => c.id === catId);
    if (cat) {
      const val = Number(editingLimit);
      cat.monthlyLimit = !isNaN(val) && val > 0 ? val : undefined;
      playActionClick();
      triggerHaptic(10);
    }
    setEditingCatId(null);
    setEditingLimit('');
  };

  return (
    <div className={`bg-white border border-[#E6E2DA] rounded-3xl p-5 shadow-sm space-y-4 ${className}`}>
      {/* Header quản lý */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#F5F3EF]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-[#E7EFEF] text-[#0F3D39] flex items-center justify-center shadow-2xs">
            <FolderTree className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#1C1917]">Quản lý nhóm chi tiêu & nguồn thu</h3>
            <p className="text-[11px] text-[#78716C]">
              Tùy biến các danh mục của {activeHousehold?.name || 'tổ ấm'}
            </p>
          </div>
        </div>

        {/* Bộ chuyển đổi loại: Khoản chi vs Thu nhập */}
        <div className="flex items-center bg-[#F5F3EF] border border-[#E6E2DA] rounded-xl p-0.5 shadow-2xs">
          <button
            type="button"
            onClick={() => {
              playActionClick();
              triggerHaptic(10);
              setActiveType('EXPENSE');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all tactile-btn ${
              activeType === 'EXPENSE'
                ? 'bg-[#0F3D39] text-white shadow-2xs'
                : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            💸 Khoản chi
          </button>
          <button
            type="button"
            onClick={() => {
              playActionClick();
              triggerHaptic(10);
              setActiveType('INCOME');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all tactile-btn ${
              activeType === 'INCOME'
                ? 'bg-[#10B981] text-white shadow-2xs'
                : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            💰 Thu nhập
          </button>
        </div>
      </div>

      {/* Danh sách các nhóm danh mục hiển thị trực tiếp */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {filteredCategories.map((cat) => {
          const isEditing = editingCatId === cat.id;

          return (
            <div
              key={cat.id}
              className="p-3.5 rounded-2xl border border-[#F5F3EF] bg-[#FAF9F6] hover:bg-white hover:border-[#E6E2DA] transition-all flex flex-col justify-between gap-2 shadow-2xs"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                    style={{ backgroundColor: cat.color }}
                  />
                  <p className="text-xs font-bold text-[#1C1917] truncate">{cat.name}</p>
                </div>

                {cat.isDefault && (
                  <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#E7EFEF] text-[#0F3D39] font-medium shrink-0">
                    Chuẩn
                  </span>
                )}
              </div>

              {/* Hạn mức ngân sách */}
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#F5F3EF]/80">
                <span className="text-[#78716C]">Hạn mức:</span>
                {isEditing ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={editingLimit}
                      onChange={(e) => setEditingLimit(e.target.value)}
                      placeholder="Số tiền"
                      className="w-20 text-xs p-1 border border-[#0F3D39] rounded-md outline-hidden bg-white font-mono"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveLimit(cat.id)}
                      className="p-1 rounded-md bg-[#0F3D39] text-white"
                      title="Lưu hạn mức"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditingCatId(cat.id);
                      setEditingLimit(String(cat.monthlyLimit || ''));
                    }}
                    className="font-mono text-[#0F3D39] font-semibold hover:underline flex items-center gap-1"
                    title="Nhấn để sửa hạn mức"
                  >
                    <span>{cat.monthlyLimit ? formatVND(cat.monthlyLimit) : 'Không giới hạn'}</span>
                    <Edit3 className="w-2.5 h-2.5 text-[#A8A29E]" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Form thêm mới danh mục inline ngay trên trang */}
      {isAdding ? (
        <div className="p-4 rounded-2xl border border-[#0F3D39]/30 bg-[#FAF9F6] space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-[#1C1917]">
              Thêm nhóm {activeType === 'EXPENSE' ? 'chi tiêu' : 'thu nhập'} mới
            </h4>
            <span className="text-[10px] text-[#78716C]">Điền thông tin và bấm lưu</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-[#78716C] block mb-1">Tên nhóm danh mục:</label>
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder={activeType === 'EXPENSE' ? 'Ví dụ: Nuôi thú cưng, Đầu tư...' : 'Ví dụ: Cổ tức, Bán đồ cũ...'}
                className="w-full text-xs p-2.5 rounded-xl border border-[#E6E2DA] bg-white outline-hidden focus:border-[#0F3D39]"
                autoFocus
              />
            </div>

            <div>
              <label className="text-[11px] text-[#78716C] block mb-1">Hạn mức tháng (VND - tùy chọn):</label>
              <input
                type="number"
                value={newCatLimit}
                onChange={(e) => setNewCatLimit(e.target.value)}
                placeholder="Ví dụ: 2000000"
                className="w-full text-xs p-2.5 rounded-xl border border-[#E6E2DA] bg-white outline-hidden focus:border-[#0F3D39] font-mono"
              />
            </div>
          </div>

          {/* Chọn màu sắc */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs text-[#78716C]">Màu sắc nhận diện:</span>
            <div className="flex items-center gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setNewCatColor(c.hex)}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    newCatColor === c.hex ? 'scale-110 ring-2 ring-[#0F3D39] ring-offset-2' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {/* Nút hành động */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E6E2DA]">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3.5 py-2 rounded-xl text-xs text-[#78716C] hover:bg-[#E6E2DA]/50 transition-all"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleAddCategory}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#0F3D39] text-white hover:bg-[#174E4A] flex items-center gap-1.5 transition-all shadow-2xs active:scale-95"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Lưu nhóm mới</span>
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => {
            playActionClick();
            setIsAdding(true);
          }}
          className="w-full py-3 rounded-2xl border-2 border-dashed border-[#D3CDC2] hover:border-[#0F3D39] text-xs font-semibold text-[#0F3D39] hover:bg-[#E7EFEF]/50 flex items-center justify-center gap-1.5 transition-all tactile-btn"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm nhóm {activeType === 'EXPENSE' ? 'chi tiêu' : 'thu nhập'} mới</span>
        </button>
      )}
    </div>
  );
};
