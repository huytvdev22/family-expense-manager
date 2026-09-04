import React, { useState } from 'react';
import { X, Plus, FolderTree, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatVND } from '../utils/currency';
import { playActionClick } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';
import type { Category, CategoryKey } from '../types';

interface CategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLOR_OPTIONS = [
  { label: 'Pine Emerald', hex: '#0F3D39' },
  { label: 'Muted Sage', hex: '#4A6B68' },
  { label: 'Warm Amber', hex: '#B45309' },
  { label: 'Emerald Green', hex: '#10B981' },
  { label: 'Rose Wine', hex: '#E11D48' },
  { label: 'Deep Charcoal', hex: '#1C1917' }
];

export const CategoryManager: React.FC<CategoryManagerProps> = ({ isOpen, onClose }) => {
  const { categories, activeHousehold } = useApp();

  const [isAdding, setIsAdding] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState(COLOR_OPTIONS[0].hex);
  const [newCatLimit, setNewCatLimit] = useState('');

  if (!isOpen) return null;

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
      type: 'EXPENSE',
      categoryKey: 'OTHER' as CategoryKey,
      icon: 'folder',
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-[#E6E2DA] rounded-3xl w-full max-w-md p-5 shadow-xl relative max-h-[90vh] flex flex-col">
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-[#F5F3EF]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#E7EFEF] text-[#0F3D39] flex items-center justify-center">
              <FolderTree className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#1C1917]">Danh mục chi tiêu</h3>
              <p className="text-[11px] text-[#78716C]">Tùy biến nhóm chi của {activeHousehold?.name || 'tổ ấm'}</p>
            </div>
          </div>
          <button
            onClick={() => {
              playActionClick();
              onClose();
            }}
            className="w-8 h-8 rounded-xl text-[#78716C] hover:text-[#1C1917] hover:bg-[#F5F3EF] flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Danh sách các danh mục */}
        <div className="py-3 overflow-y-auto space-y-2 flex-1">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between p-3 rounded-2xl border border-[#F5F3EF] bg-[#FAF9F6] hover:bg-white transition-all"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                  style={{ backgroundColor: cat.color }}
                />
                <div>
                  <p className="text-xs font-semibold text-[#1C1917]">{cat.name}</p>
                  <p className="text-[10px] text-[#78716C] font-mono">
                    {cat.monthlyLimit ? `Hạn mức: ${formatVND(cat.monthlyLimit)}` : 'Không giới hạn'}
                  </p>
                </div>
              </div>
              {cat.isDefault && (
                <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#E7EFEF] text-[#0F3D39]">
                  Chuẩn
                </span>
              )}
            </div>
          ))}

          {/* Form thêm mới */}
          {isAdding ? (
            <div className="p-3.5 rounded-2xl border border-[#0F3D39]/30 bg-white space-y-3 shadow-xs">
              <h4 className="text-xs font-semibold text-[#1C1917]">Thêm nhóm chi mới</h4>
              
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Tên nhóm (ví dụ: Nuôi thú cưng, Đầu tư...)"
                className="w-full text-xs p-2 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] outline-hidden focus:border-[#0F3D39]"
                autoFocus
              />

              <div className="flex items-center gap-2">
                <span className="text-xs text-[#78716C]">Màu sắc:</span>
                <div className="flex items-center gap-1.5">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setNewCatColor(c.hex)}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        newCatColor === c.hex ? 'scale-110 ring-2 ring-[#0F3D39] ring-offset-1' : ''
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
              </div>

              <input
                type="number"
                value={newCatLimit}
                onChange={(e) => setNewCatLimit(e.target.value)}
                placeholder="Hạn mức tháng (VND - tùy chọn)"
                className="w-full text-xs p-2 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] outline-hidden focus:border-[#0F3D39] font-mono"
              />

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 rounded-xl text-xs text-[#78716C] hover:bg-[#F5F3EF]"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#0F3D39] text-white hover:bg-[#174E4A] flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  Lưu nhóm
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                playActionClick();
                setIsAdding(true);
              }}
              className="w-full py-2.5 rounded-2xl border border-dashed border-[#D3CDC2] hover:border-[#0F3D39] text-xs font-semibold text-[#0F3D39] hover:bg-[#E7EFEF]/50 flex items-center justify-center gap-1.5 transition-all tactile-btn"
            >
              <Plus className="w-3.5 h-3.5" />
              Thêm nhóm chi tiêu mới
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
