import React, { useState, useMemo } from 'react';
import { Plus, FolderTree, Check, Edit3, Trash2, RotateCcw, Archive, Shield, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatVND } from '../utils/currency';
import { playActionClick, playSuccessChime } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';
import type { Category, CategoryKey } from '../types';
import { useToast } from './Toast';

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
  const { categories, activeHousehold, createCategory, editCategory, removeCategory, restoreCategory } = useApp();
  const { showToast } = useToast();

  // Chế độ xem theo loại: 'EXPENSE' (Khoản chi) hoặc 'INCOME' (Thu nhập)
  const [activeType, setActiveType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');

  // Trạng thái thêm mới
  const [isAdding, setIsAdding] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState(COLOR_OPTIONS[0].hex);
  const [newCatLimit, setNewCatLimit] = useState('');

  // Trạng thái chỉnh sửa danh mục
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editLimit, setEditLimit] = useState('');

  // Trạng thái hiển thị danh mục đã ẩn
  const [showArchived, setShowArchived] = useState(false);

  // Lọc danh mục đang hoạt động
  const activeCategories = useMemo(() => {
    return categories.filter((c) => !c.isArchived && (c.type || 'EXPENSE') === activeType);
  }, [categories, activeType]);

  // Lọc danh mục đã ẩn / lưu trữ
  const archivedCategories = useMemo(() => {
    return categories.filter((c) => c.isArchived && (c.type || 'EXPENSE') === activeType);
  }, [categories, activeType]);

  // Bắt đầu chỉnh sửa một danh mục
  const handleStartEdit = (cat: Category) => {
    playActionClick();
    triggerHaptic(10);
    setEditingCat(cat);
    setEditName(cat.name);
    setEditColor(cat.color || COLOR_OPTIONS[0].hex);
    setEditLimit(cat.monthlyLimit ? String(cat.monthlyLimit) : '');
  };

  // Lưu chỉnh sửa danh mục
  const handleSaveEdit = async () => {
    if (!editingCat) return;

    if (!editName.trim()) {
      showToast('Vui lòng nhập tên danh mục', 'warning');
      return;
    }

    const limitVal = Number(editLimit);
    const updates: Partial<Category> = {
      name: editName.trim(),
      color: editColor,
      monthlyLimit: !isNaN(limitVal) && limitVal > 0 ? limitVal : undefined
    };

    await editCategory(editingCat.id, updates);
    setEditingCat(null);
  };

  // Thêm nhóm mới
  const handleAddCategory = async () => {
    if (!newCatName.trim()) {
      showToast('Vui lòng nhập tên danh mục', 'warning');
      return;
    }

    const limitVal = Number(newCatLimit);
    await createCategory({
      name: newCatName.trim(),
      type: activeType,
      categoryKey: (activeType === 'INCOME' ? 'INCOME' : 'OTHER') as CategoryKey,
      icon: activeType === 'INCOME' ? 'briefcase' : 'folder',
      color: newCatColor,
      isDefault: false,
      monthlyLimit: !isNaN(limitVal) && limitVal > 0 ? limitVal : undefined
    });

    setIsAdding(false);
    setNewCatName('');
    setNewCatLimit('');
  };

  // Xóa hoặc Ẩn danh mục
  const handleDeleteCategory = async (cat: Category) => {
    if (cat.isDefault) {
      showToast('Đây là danh mục chuẩn mặc định, không thể xóa.', 'info');
      return;
    }

    const confirmMsg = `Bạn có chắc muốn xóa/ẩn nhóm "${cat.name}"?\n(Nếu nhóm đã có lịch sử thu chi, hệ thống sẽ tự động chuyển sang trạng thái Ẩn để bảo vệ số liệu các tháng trước)`;
    if (window.confirm(confirmMsg)) {
      await removeCategory(cat);
    }
  };

  // Khôi phục danh mục đã ẩn
  const handleRestore = async (cat: Category) => {
    await restoreCategory(cat.id);
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
              setEditingCat(null);
              setIsAdding(false);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all tactile-btn cursor-pointer ${
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
              setEditingCat(null);
              setIsAdding(false);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all tactile-btn cursor-pointer ${
              activeType === 'INCOME'
                ? 'bg-[#10B981] text-white shadow-2xs'
                : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            💰 Thu nhập
          </button>
        </div>
      </div>

      {/* Danh sách các nhóm danh mục đang hoạt động */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {activeCategories.map((cat) => {
          return (
            <div
              key={cat.id}
              className="p-3.5 rounded-2xl border border-[#F5F3EF] bg-[#FAF9F6] hover:bg-white hover:border-[#E6E2DA] transition-all flex flex-col justify-between gap-2.5 shadow-2xs group"
            >
              {/* Dòng 1: Tên nhóm, màu và các nút thao tác */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                    style={{ backgroundColor: cat.color }}
                  />
                  <p className="text-xs font-bold text-[#1C1917] truncate">{cat.name}</p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {cat.isDefault ? (
                    <span 
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-[#E7EFEF] text-[#0F3D39] font-medium flex items-center gap-0.5"
                      title="Danh mục chuẩn mặc định của ứng dụng"
                    >
                      <Shield className="w-2.5 h-2.5" />
                      <span>Chuẩn</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat)}
                      className="text-[#A8A29E] hover:text-[#E11D48] p-1 rounded-md hover:bg-[#FFF1F2] opacity-70 group-hover:opacity-100 transition-all cursor-pointer"
                      title="Xóa hoặc ẩn nhóm này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleStartEdit(cat)}
                    className="text-[#A8A29E] hover:text-[#0F3D39] p-1 rounded-md hover:bg-[#E7EFEF] opacity-70 group-hover:opacity-100 transition-all cursor-pointer"
                    title="Chỉnh sửa tên, màu sắc, hạn mức"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Dòng 2: Hạn mức ngân sách */}
              <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-[#F5F3EF]">
                <span className="text-[#78716C]">Hạn mức tháng:</span>
                <span className="font-mono text-[#0F3D39] font-semibold">
                  {cat.monthlyLimit ? formatVND(cat.monthlyLimit) : 'Không giới hạn'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Form Chỉnh sửa Danh mục Inline */}
      {editingCat && (
        <div className="p-4 rounded-2xl border-2 border-[#0F3D39]/30 bg-white space-y-3 shadow-md animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-[#F5F3EF]">
            <div className="flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-[#0F3D39]" />
              <h4 className="text-xs font-bold text-[#1C1917]">
                Chỉnh sửa danh mục: <span className="text-[#0F3D39]">{editingCat.name}</span>
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setEditingCat(null)}
              className="text-[#78716C] hover:text-[#1C1917] p-1 rounded-md hover:bg-[#F5F3EF]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-[#78716C] block mb-1">Tên danh mục:</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Nhập tên danh mục..."
                className="w-full text-xs p-2.5 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] outline-hidden focus:border-[#0F3D39]"
                autoFocus
              />
            </div>

            <div>
              <label className="text-[11px] text-[#78716C] block mb-1">Hạn mức tháng (VNĐ - tùy chọn):</label>
              <input
                type="number"
                value={editLimit}
                onChange={(e) => setEditLimit(e.target.value)}
                placeholder="VD: 5000000 (để trống = không giới hạn)"
                className="w-full text-xs p-2.5 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] outline-hidden focus:border-[#0F3D39] font-mono"
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
                  onClick={() => setEditColor(c.hex)}
                  className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                    editColor === c.hex ? 'scale-110 ring-2 ring-[#0F3D39] ring-offset-2' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {/* Nút hành động sửa */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E6E2DA]">
            <button
              type="button"
              onClick={() => setEditingCat(null)}
              className="px-3.5 py-2 rounded-xl text-xs text-[#78716C] hover:bg-[#F5F3EF] transition-all cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSaveEdit}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#0F3D39] text-white hover:bg-[#174E4A] flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Lưu thay đổi</span>
            </button>
          </div>
        </div>
      )}

      {/* Form thêm mới danh mục inline */}
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
                placeholder={activeType === 'EXPENSE' ? 'Ví dụ: Trả nợ ngân hàng, Thú cưng...' : 'Ví dụ: Tiền thưởng, Cổ tức...'}
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
                placeholder="Ví dụ: 8000000"
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
                  className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                    newCatColor === c.hex ? 'scale-110 ring-2 ring-[#0F3D39] ring-offset-2' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {/* Nút hành động thêm */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E6E2DA]">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3.5 py-2 rounded-xl text-xs text-[#78716C] hover:bg-[#E6E2DA]/50 transition-all cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleAddCategory}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#0F3D39] text-white hover:bg-[#174E4A] flex items-center gap-1.5 transition-all shadow-2xs active:scale-95 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Lưu nhóm mới</span>
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            playActionClick();
            setIsAdding(true);
            setEditingCat(null);
          }}
          className="w-full py-3 rounded-2xl border-2 border-dashed border-[#D3CDC2] hover:border-[#0F3D39] text-xs font-semibold text-[#0F3D39] hover:bg-[#E7EFEF]/50 flex items-center justify-center gap-1.5 transition-all tactile-btn cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm nhóm {activeType === 'EXPENSE' ? 'chi tiêu' : 'thu nhập'} mới</span>
        </button>
      )}

      {/* Khu vực danh mục đã ẩn (Lưu trữ) */}
      {archivedCategories.length > 0 && (
        <div className="pt-3 border-t border-[#F5F3EF]">
          <button
            type="button"
            onClick={() => setShowArchived((prev) => !prev)}
            className="flex items-center gap-2 text-xs font-semibold text-[#78716C] hover:text-[#1C1917] transition-colors cursor-pointer"
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Danh mục đã ẩn ({archivedCategories.length})</span>
            <span className="text-[10px] text-[#A8A29E] font-normal">
              {showArchived ? '(Bấm để thu gọn)' : '(Bấm để xem và khôi phục)'}
            </span>
          </button>

          {showArchived && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 animate-in fade-in duration-150">
              {archivedCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="p-3 rounded-2xl border border-dashed border-[#D6D2CA] bg-[#FAF9F6]/80 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-3 h-3 rounded-full opacity-50 shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-xs text-[#78716C] line-through truncate">
                      {cat.name}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRestore(cat)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#E6E2DA] text-[11px] font-semibold text-[#0F3D39] hover:bg-[#E7EFEF] transition-all cursor-pointer shadow-2xs"
                    title="Khôi phục danh mục này về hoạt động"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Khôi phục</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
