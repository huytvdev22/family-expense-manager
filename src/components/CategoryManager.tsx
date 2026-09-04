import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Plus, FolderKanban, Check } from 'lucide-react';
import { formatVND } from '../utils/currency';
import { triggerHaptic } from '../utils/audio';

interface CategoryManagerProps {
  onClose: () => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({ onClose }) => {
  const { categories, addCategory, monthlySummary } = useApp();
  const [isAdding, setIsAdding] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatLimit, setNewCatLimit] = useState('');
  const [newCatColor, setNewCatColor] = useState('#0F3D39');

  const COLOR_OPTIONS = [
    '#0F3D39', // Pine Emerald (Primary)
    '#4A6B68', // Muted Sage (Secondary)
    '#B45309', // Warm Amber (Tertiary)
    '#10B981', // Emerald Green (Income)
    '#E11D48', // Rose Red (Expense)
    '#6366F1', // Indigo Accent
    '#8B5CF6'  // Purple Accent
  ];

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    addCategory({
      name: newCatName.trim(),
      type: 'EXPENSE',
      categoryKey: `CUSTOM_${Date.now()}`,
      icon: 'FolderKanban',
      color: newCatColor,
      order: categories.length + 1,
      isDefault: false,
      monthlyLimit: parseInt(newCatLimit, 10) || undefined
    });

    setNewCatName('');
    setNewCatLimit('');
    setIsAdding(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-neutral rounded-3xl border border-border shadow-2xl p-5 space-y-4 max-h-[90vh] flex flex-col">
        {/* Tiêu đề & Nút đóng */}
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary text-neutral flex items-center justify-center">
              <FolderKanban className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-primary">Quản Lý Nhóm Chi Tiêu</h2>
              <p className="text-[11px] text-on-surface-variant">Tùy biến danh mục riêng của tổ ấm</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Danh sách danh mục hiện có */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {categories.map((cat) => {
            const spent = monthlySummary.byCategory[cat.id] || 0;
            const limit = cat.monthlyLimit || 0;
            const percent = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;

            return (
              <div
                key={cat.id}
                className="p-3 bg-surface rounded-2xl border border-border space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-xs font-bold text-on-surface">{cat.name}</span>
                    {cat.isDefault && (
                      <span className="text-[10px] bg-surface-container text-on-surface-variant px-1.5 py-0.2 rounded-md">
                        Mặc định
                      </span>
                    )}
                  </div>

                  <span className="text-xs font-mono font-bold text-primary">
                    {formatVND(spent)}
                  </span>
                </div>

                {limit > 0 && (
                  <div>
                    <div className="flex justify-between text-[10px] text-on-surface-variant mb-1 font-mono">
                      <span>Đã dùng: {percent}%</span>
                      <span>Hạn mức: {formatVND(limit)}</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: percent > 90 ? '#E11D48' : cat.color
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Form thêm danh mục mới */}
        {isAdding ? (
          <form onSubmit={handleCreateCategory} className="p-3 bg-surface rounded-2xl border border-primary space-y-3">
            <h3 className="text-xs font-bold text-primary">Tạo danh mục mới</h3>

            <input
              type="text"
              required
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              placeholder="Tên nhóm (ví dụ: Nuôi thú cưng, Đầu tư...)"
              className="w-full px-3 py-2 text-xs"
            />

            <input
              type="number"
              value={newCatLimit}
              onChange={e => setNewCatLimit(e.target.value)}
              placeholder="Hạn mức tháng (VND - không bắt buộc)"
              className="w-full px-3 py-2 text-xs font-mono"
            />

            {/* Chọn màu */}
            <div>
              <label className="block text-[11px] text-on-surface-variant mb-1 font-medium">Màu sắc đại diện:</label>
              <div className="flex gap-2">
                {COLOR_OPTIONS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewCatColor(c)}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${
                      newCatColor === c ? 'border-on-surface scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="flex-1 py-2 text-xs font-semibold bg-surface-container rounded-xl text-on-surface-variant"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="flex-1 py-2 text-xs font-semibold bg-primary text-on-primary rounded-xl flex items-center justify-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                Lưu Nhóm
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => {
              setIsAdding(true);
              triggerHaptic(10);
            }}
            className="w-full py-2.5 rounded-2xl border border-dashed border-primary text-primary hover:bg-surface-container text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Thêm Danh Mục Mới
          </button>
        )}
      </div>
    </div>
  );
};
