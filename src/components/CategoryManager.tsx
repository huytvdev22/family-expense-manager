import React, { useState, useMemo } from 'react';
import { Plus, FolderTree, Check, Edit3, Trash2, RotateCcw, Archive, Shield, X, Zap } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatVND } from '../utils/currency';
import { playActionClick, playSuccessChime } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';
import type { Category, CategoryKey, QuickTagItem } from '../types';
import { renderCategoryIcon } from '../utils/categoryIcons';
import { useToast } from './Toast';

const CATEGORY_ICON_OPTIONS = [
  { key: 'home', label: 'Tổ ấm' },
  { key: 'coffee', label: 'Cà phê & Hẹn hò' },
  { key: 'shopping-cart', label: 'Mua sắm' },
  { key: 'utensils', label: 'Ăn uống' },
  { key: 'heart-pulse', label: 'Sức khỏe' },
  { key: 'baby', label: 'Con cái' },
  { key: 'car', label: 'Đi lại' },
  { key: 'piggy-bank', label: 'Tích lũy' },
  { key: 'landmark', label: 'Ngân hàng & Nợ' },
  { key: 'briefcase', label: 'Công việc' },
  { key: 'wallet', label: 'Ví tiền' },
  { key: 'coins', label: 'Tiền mặt' },
  { key: 'banknote', label: 'Lương & Thưởng' },
  { key: 'sparkles', label: 'Làm đẹp' },
  { key: 'book-open', label: 'Học tập' },
  { key: 'plane', label: 'Du lịch' },
  { key: 'dumbbell', label: 'Thể thao' },
  { key: 'gift', label: 'Hiếu hỉ & Quà' },
  { key: 'phone', label: 'Hóa đơn & Mạng' },
  { key: 'zap', label: 'Điện nước' },
  { key: 'folder', label: 'Khác' },
];

const COLOR_OPTIONS = [
  { label: 'Pine Emerald', hex: '#0F3D39' },
  { label: 'Muted Sage', hex: '#4A6B68' },
  { label: 'Warm Amber', hex: '#B45309' },
  { label: 'Emerald Green', hex: '#10B981' },
  { label: 'Rose Wine', hex: '#E11D48' },
  { label: 'Deep Charcoal', hex: '#1C1917' }
];

const QUICK_TAG_EMOJIS_EXPENSE = ['🛒', '☕', '🍜', '⛽', '🍼', '💡', '💊', '🛋️', '🐷', '🎬', '👗', '✈️', '🎁', '📱', '🏋️', '📚', '⚡', '🔧'];
const QUICK_TAG_EMOJIS_INCOME = ['💼', '🎉', '💻', '📈', '🎁', '💵', '🪙', '💰', '🏆', '🧧', '🏢', '🤝'];

interface CategoryManagerProps {
  className?: string;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({ className = '' }) => {
  const { 
    categories, 
    activeHousehold, 
    createCategory, 
    editCategory, 
    removeCategory, 
    restoreCategory,
    quickTags,
    createQuickTag,
    editQuickTag,
    removeQuickTag
  } = useApp();
  const { showToast } = useToast();

  // Chế độ xem theo loại: 'EXPENSE' (Khoản chi) hoặc 'INCOME' (Thu nhập)
  const [activeType, setActiveType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');

  // Trạng thái Quản lý Quick Tag
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [editingTag, setEditingTag] = useState<QuickTagItem | null>(null);
  const [tagLabel, setTagLabel] = useState('');
  const [tagEmoji, setTagEmoji] = useState('🛒');
  const [tagCategoryId, setTagCategoryId] = useState('');
  const [tagDefaultAmount, setTagDefaultAmount] = useState('');

  // Trạng thái thêm mới
  const [isAdding, setIsAdding] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState(COLOR_OPTIONS[0].hex);
  const [newCatIcon, setNewCatIcon] = useState('folder');
  const [newCatLimit, setNewCatLimit] = useState('');

  // Trạng thái chỉnh sửa danh mục
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editIcon, setEditIcon] = useState('folder');
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

  // Lọc Quick Tags theo loại hiện tại (Khoản chi hoặc Thu nhập)
  const currentTypeQuickTags = useMemo(() => {
    return quickTags
      .filter((t) => (t.type || (t.categoryKey === 'INCOME' ? 'INCOME' : 'EXPENSE')) === activeType)
      .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  }, [quickTags, activeType]);

  const resetTagForm = () => {
    setIsAddingTag(false);
    setEditingTag(null);
    setTagLabel('');
    setTagEmoji(activeType === 'INCOME' ? '💼' : '🛒');
    setTagCategoryId('');
    setTagDefaultAmount('');
  };

  const handleStartAddTag = () => {
    playActionClick();
    triggerHaptic(10);
    setEditingTag(null);
    setIsAddingTag(true);
    setTagLabel('');
    setTagEmoji(activeType === 'INCOME' ? '💼' : '🛒');
    setTagCategoryId(activeCategories[0]?.id || '');
    setTagDefaultAmount('');
  };

  const handleStartEditTag = (tag: QuickTagItem) => {
    playActionClick();
    triggerHaptic(10);
    setEditingTag(tag);
    setIsAddingTag(false);
    setTagLabel(tag.label);
    setTagEmoji(tag.emoji);
    setTagCategoryId(tag.categoryId);
    setTagDefaultAmount(tag.defaultAmount ? String(tag.defaultAmount) : '');
  };

  const handleSaveQuickTag = async () => {
    if (!tagLabel.trim()) {
      showToast('Vui lòng nhập tên phím tắt', 'warning');
      return;
    }
    const matchedCat = categories.find((c) => c.id === tagCategoryId) || activeCategories[0];
    if (!matchedCat) {
      showToast('Vui lòng chọn danh mục cho phím tắt', 'warning');
      return;
    }
    const amountVal = Number(tagDefaultAmount.replace(/\D/g, ''));

    if (editingTag) {
      await editQuickTag(editingTag.id, {
        label: tagLabel.trim(),
        emoji: tagEmoji.trim() || (activeType === 'INCOME' ? '💰' : '🛒'),
        categoryId: matchedCat.id,
        categoryName: matchedCat.name,
        categoryKey: matchedCat.categoryKey,
        type: activeType,
        defaultAmount: amountVal > 0 ? amountVal : undefined
      });
    } else {
      await createQuickTag({
        label: tagLabel.trim(),
        emoji: tagEmoji.trim() || (activeType === 'INCOME' ? '💰' : '🛒'),
        categoryId: matchedCat.id,
        categoryName: matchedCat.name,
        categoryKey: matchedCat.categoryKey,
        type: activeType,
        defaultAmount: amountVal > 0 ? amountVal : undefined,
        order: currentTypeQuickTags.length + 1
      });
    }
    resetTagForm();
  };

  const handleDeleteQuickTag = async (tag: QuickTagItem) => {
    if (window.confirm(`Bạn có chắc muốn xóa phím tắt "${tag.emoji} ${tag.label}"?`)) {
      await removeQuickTag(tag.id);
    }
  };

  // Bắt đầu chỉnh sửa một danh mục
  const handleStartEdit = (cat: Category) => {
    playActionClick();
    triggerHaptic(10);
    setEditingCat(cat);
    setEditName(cat.name);
    setEditColor(cat.color || COLOR_OPTIONS[0].hex);
    setEditIcon(cat.icon || 'folder');
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
      icon: editIcon,
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
      icon: newCatIcon || (activeType === 'INCOME' ? 'briefcase' : 'folder'),
      color: newCatColor,
      isDefault: false,
      monthlyLimit: !isNaN(limitVal) && limitVal > 0 ? limitVal : undefined
    });

    setIsAdding(false);
    setNewCatName('');
    setNewCatLimit('');
    setNewCatIcon(activeType === 'INCOME' ? 'briefcase' : 'folder');
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

        {/* Bộ chuyển đổi loại: Khoản chi vs Thu nhập & Nút khôi phục mẫu */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center bg-[#F5F3EF] border border-[#E6E2DA] rounded-xl p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => {
                playActionClick();
                triggerHaptic(10);
                setActiveType('EXPENSE');
                setEditingCat(null);
                setIsAdding(false);
                resetTagForm();
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
                resetTagForm();
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
      </div>

      {/* Danh sách các nhóm danh mục đang hoạt động hoặc Empty State */}
      {activeCategories.length === 0 ? (
        <div className="p-8 rounded-3xl border-2 border-dashed border-[#E6E2DA] bg-[#FAF9F6] text-center space-y-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white border border-[#E6E2DA] shadow-2xs flex items-center justify-center mx-auto text-[#0F3D39]">
            <FolderTree className="w-6 h-6 opacity-60" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#1C1917]">
              Chưa có danh mục {activeType === 'INCOME' ? 'Thu Nhập' : 'Chi Tiêu'} nào
            </p>
            <p className="text-[11px] text-[#78716C] max-w-sm mx-auto mt-0.5">
              {activeType === 'INCOME'
                ? 'Tổ ấm của bạn hiện chưa có danh mục thu nhập nào. Bấm nút bên dưới để tạo danh mục mới!'
                : 'Tổ ấm của bạn hiện chưa có danh mục chi tiêu nào. Bấm nút bên dưới để tạo danh mục mới!'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              playActionClick();
              setIsAdding(true);
            }}
            className="px-4 py-2.5 bg-[#0F3D39] hover:bg-[#174E4A] text-white text-xs font-bold rounded-2xl transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm danh mục {activeType === 'INCOME' ? 'Thu Nhập' : 'Chi Tiêu'} mới</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {activeCategories.map((cat) => {
            return (
              <div
                key={cat.id}
                className="p-3.5 rounded-2xl border border-[#F5F3EF] bg-[#FAF9F6] hover:bg-white hover:border-[#E6E2DA] transition-all flex flex-col justify-between gap-2.5 shadow-2xs group"
              >
                {/* Dòng 1: Tên nhóm, icon và các nút thao tác */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border border-[#E6E2DA]/80 bg-white shadow-2xs">
                      {renderCategoryIcon(cat.icon, "w-4 h-4", cat.color)}
                    </span>
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
      )}

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

          {/* Chọn Icon */}
          <div className="space-y-1.5 pt-1">
            <span className="text-xs text-[#78716C]">Biểu tượng (Icon):</span>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {CATEGORY_ICON_OPTIONS.map((ic) => (
                <button
                  key={ic.key}
                  type="button"
                  onClick={() => setEditIcon(ic.key)}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border transition-all cursor-pointer ${
                    editIcon === ic.key
                      ? 'border-[#0F3D39] bg-[#E7EFEF] ring-2 ring-[#0F3D39]/20 shadow-xs'
                      : 'border-[#E6E2DA] bg-[#FAF9F6] hover:bg-white'
                  }`}
                  title={ic.label}
                >
                  {renderCategoryIcon(ic.key, "w-4 h-4", editIcon === ic.key ? editColor : '#78716C')}
                </button>
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

          {/* Chọn Icon */}
          <div className="space-y-1.5 pt-1">
            <span className="text-xs text-[#78716C]">Biểu tượng (Icon):</span>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {CATEGORY_ICON_OPTIONS.map((ic) => (
                <button
                  key={ic.key}
                  type="button"
                  onClick={() => setNewCatIcon(ic.key)}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border transition-all cursor-pointer ${
                    newCatIcon === ic.key
                      ? 'border-[#0F3D39] bg-[#E7EFEF] ring-2 ring-[#0F3D39]/20 shadow-xs'
                      : 'border-[#E6E2DA] bg-white hover:bg-[#FAF9F6]'
                  }`}
                  title={ic.label}
                >
                  {renderCategoryIcon(ic.key, "w-4 h-4", newCatIcon === ic.key ? newCatColor : '#78716C')}
                </button>
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
                    <span className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border border-[#E6E2DA]/60 bg-white/60 shadow-2xs opacity-60">
                      {renderCategoryIcon(cat.icon, "w-3.5 h-3.5", cat.color)}
                    </span>
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

      {/* KHU VỰC: QUẢN LÝ QUICK TAGS (GỢI Ý 1-CHẠM) */}
      <div className="pt-6 border-t-2 border-[#F5F3EF] space-y-3.5">
        {/* Header của Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#E7EFEF] text-[#0F3D39] flex items-center justify-center shadow-2xs">
                <Zap className="w-3.5 h-3.5 fill-[#0F3D39]" />
              </span>
              <h3 className="text-sm font-bold text-[#1C1917]">
                Gợi ý 1-chạm (Quick Tags)
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FAF9F6] border border-[#E6E2DA] text-[#78716C] font-semibold">
                {currentTypeQuickTags.length} phím tắt
              </span>
            </div>
            <p className="text-[11px] text-[#78716C] mt-0.5">
              Phím tắt xuất hiện trên bàn phím ghi sổ để chọn nhanh nhóm {activeType === 'INCOME' ? 'thu nhập' : 'chi tiêu'} và số tiền quen thuộc
            </p>
          </div>

          {!isAddingTag && !editingTag && (
            <button
              type="button"
              onClick={handleStartAddTag}
              className="px-3.5 py-2 bg-[#FAF9F6] hover:bg-white border border-[#E6E2DA] hover:border-[#0F3D39] text-[#0F3D39] text-xs font-semibold rounded-xl transition-all shadow-2xs inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-auto active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm phím tắt</span>
            </button>
          )}
        </div>

        {/* Form Thêm / Sửa Quick Tag */}
        {(isAddingTag || editingTag) && (
          <div className="p-4 rounded-2xl border border-[#0F3D39]/20 bg-[#FAF9F6] shadow-xs space-y-3.5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#1C1917] flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#0F3D39]" />
                {editingTag ? 'Chỉnh sửa phím tắt' : `Thêm phím tắt ${activeType === 'INCOME' ? 'thu nhập' : 'chi tiêu'} mới`}
              </span>
              <button
                type="button"
                onClick={resetTagForm}
                className="p-1 rounded-lg hover:bg-white text-[#78716C] hover:text-[#1C1917] transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Tên nhãn */}
              <div>
                <label className="text-[11px] font-semibold text-[#78716C] block mb-1">
                  Tên phím tắt <span className="text-[#E11D48]">*</span>
                </label>
                <input
                  type="text"
                  value={tagLabel}
                  onChange={(e) => setTagLabel(e.target.value)}
                  placeholder={activeType === 'INCOME' ? 'vd: Lương chính, Thưởng dự án, Cổ tức...' : 'vd: Cà phê sáng, Cơm trưa, Xăng xe, Bỉm sữa...'}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E6E2DA] bg-white focus:outline-none focus:border-[#0F3D39] focus:ring-1 focus:ring-[#0F3D39] transition-all"
                  autoFocus
                />
              </div>

              {/* Danh mục liên kết */}
              <div>
                <label className="text-[11px] font-semibold text-[#78716C] block mb-1">
                  Gắn vào Danh mục <span className="text-[#E11D48]">*</span>
                </label>
                <select
                  value={tagCategoryId}
                  onChange={(e) => setTagCategoryId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E6E2DA] bg-white focus:outline-none focus:border-[#0F3D39] focus:ring-1 focus:ring-[#0F3D39] transition-all"
                >
                  {activeCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Biểu tượng Emoji & Số tiền mặc định */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Chọn Emoji */}
              <div>
                <label className="text-[11px] font-semibold text-[#78716C] block mb-1">
                  Biểu tượng Emoji
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tagEmoji}
                    onChange={(e) => setTagEmoji(e.target.value)}
                    maxLength={4}
                    className="w-12 px-2 py-1.5 text-center text-base rounded-xl border border-[#E6E2DA] bg-white focus:outline-none focus:border-[#0F3D39]"
                  />
                  <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar flex-1">
                    {(activeType === 'INCOME' ? QUICK_TAG_EMOJIS_INCOME : QUICK_TAG_EMOJIS_EXPENSE).map((em) => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => {
                          setTagEmoji(em);
                          playActionClick();
                        }}
                        className={`w-7 h-7 shrink-0 rounded-lg text-sm flex items-center justify-center transition-all cursor-pointer ${
                          tagEmoji === em
                            ? 'bg-[#0F3D39] text-white shadow-2xs scale-105'
                            : 'bg-white border border-[#E6E2DA] hover:bg-[#F5F3EF]'
                        }`}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Số tiền mặc định (tùy chọn) */}
              <div>
                <label className="text-[11px] font-semibold text-[#78716C] block mb-1">
                  Số tiền gợi ý sẵn (Tùy chọn)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={tagDefaultAmount ? Number(tagDefaultAmount.replace(/\D/g, '')).toLocaleString('vi-VN') : ''}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '');
                      setTagDefaultAmount(raw);
                    }}
                    placeholder="Không bắt buộc (vd: 35.000)"
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-[#E6E2DA] bg-white focus:outline-none focus:border-[#0F3D39] focus:ring-1 focus:ring-[#0F3D39] transition-all pr-10"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#A8A29E] font-medium pointer-events-none">
                    VND
                  </span>
                </div>
              </div>
            </div>

            {/* Nút hành động */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={resetTagForm}
                className="px-3.5 py-1.5 rounded-xl border border-[#E6E2DA] bg-white text-xs font-semibold text-[#78716C] hover:text-[#1C1917] transition-all cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveQuickTag}
                className="px-4 py-1.5 rounded-xl bg-[#0F3D39] text-white text-xs font-semibold hover:bg-[#174E4A] transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{editingTag ? 'Lưu cập nhật' : 'Tạo phím tắt'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Danh sách các thẻ Quick Tag */}
        {currentTypeQuickTags.length === 0 ? (
          <div className="p-6 rounded-2xl border border-dashed border-[#E6E2DA] bg-[#FAF9F6] text-center space-y-2">
            <p className="text-xs font-medium text-[#78716C]">
              Chưa có phím tắt nào cho {activeType === 'INCOME' ? 'thu nhập' : 'khoản chi'}.
            </p>
            <button
              type="button"
              onClick={handleStartAddTag}
              className="text-xs font-semibold text-[#0F3D39] hover:underline cursor-pointer inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tạo phím tắt đầu tiên</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {currentTypeQuickTags.map((tag) => (
              <div
                key={tag.id}
                className="p-3 rounded-2xl border border-[#E6E2DA] bg-[#FAF9F6] hover:bg-white hover:border-[#D6D2CA] transition-all flex items-center justify-between gap-2.5 shadow-2xs group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-8 h-8 rounded-xl bg-white border border-[#E6E2DA] flex items-center justify-center text-base shrink-0 shadow-2xs">
                    {tag.emoji}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#1C1917] truncate">
                      {tag.label}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-[#78716C] bg-white border border-[#E6E2DA]/80 px-1.5 py-0.2 rounded-md truncate max-w-[110px]">
                        {tag.categoryName}
                      </span>
                      {tag.defaultAmount && (
                        <span className="text-[10px] font-mono font-semibold text-[#0F3D39]">
                          {formatVND(tag.defaultAmount)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleStartEditTag(tag)}
                    className="p-1.5 rounded-lg text-[#78716C] hover:text-[#0F3D39] hover:bg-[#E7EFEF] transition-all cursor-pointer"
                    title="Chỉnh sửa phím tắt"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteQuickTag(tag)}
                    className="p-1.5 rounded-lg text-[#78716C] hover:text-[#E11D48] hover:bg-[#FEE2E2] transition-all cursor-pointer"
                    title="Xóa phím tắt"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
