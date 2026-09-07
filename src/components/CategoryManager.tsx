import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Plus, FolderTree, Check, Edit3, Trash2, RotateCcw, Archive, Shield, X, Zap, ChevronDown } from 'lucide-react';
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

  // Tab chính: 'CATEGORIES' (Quản lý Danh mục) hoặc 'QUICK_TAGS' (Gợi ý 1-chạm)
  const [mainTab, setMainTab] = useState<'CATEGORIES' | 'QUICK_TAGS'>('CATEGORIES');

  // Trạng thái Quản lý Quick Tag
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [editingTag, setEditingTag] = useState<QuickTagItem | null>(null);
  const [tagLabel, setTagLabel] = useState('');
  const [tagEmoji, setTagEmoji] = useState('🛒');
  const [tagCategoryId, setTagCategoryId] = useState('');
  const [tagDefaultAmount, setTagDefaultAmount] = useState('');
  const [isTagCatDropdownOpen, setIsTagCatDropdownOpen] = useState(false);
  const tagCatDropdownRef = useRef<HTMLDivElement>(null);

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

  // Danh mục đang chọn cho Quick Tag
  const selectedTagCategory = useMemo(() => {
    return activeCategories.find((c) => c.id === tagCategoryId) || activeCategories[0];
  }, [activeCategories, tagCategoryId]);

  // Đóng dropdown chọn danh mục khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tagCatDropdownRef.current && !tagCatDropdownRef.current.contains(event.target as Node)) {
        setIsTagCatDropdownOpen(false);
      }
    };
    if (isTagCatDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isTagCatDropdownOpen]);

  const resetTagForm = () => {
    setIsAddingTag(false);
    setEditingTag(null);
    setTagLabel('');
    setTagEmoji(activeType === 'INCOME' ? '💼' : '🛒');
    setTagCategoryId('');
    setTagDefaultAmount('');
    setIsTagCatDropdownOpen(false);
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
    setIsTagCatDropdownOpen(false);
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
    setIsTagCatDropdownOpen(false);
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

    try {
      await editCategory(editingCat.id, updates);
      setEditingCat(null);
    } catch (e) {
      console.error('Lỗi khi sửa danh mục:', e);
    }
  };

  // Thêm nhóm mới
  const handleAddCategory = async () => {
    if (!newCatName.trim()) {
      showToast('Vui lòng nhập tên danh mục', 'warning');
      return;
    }

    const limitVal = Number(newCatLimit);
    try {
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
    } catch (e) {
      console.error('Lỗi khi thêm danh mục:', e);
    }
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
            {mainTab === 'CATEGORIES' ? <FolderTree className="w-4 h-4" /> : <Zap className="w-4 h-4 fill-[#0F3D39]" />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#1C1917]">
              {mainTab === 'CATEGORIES' ? 'Quản lý nhóm chi tiêu & nguồn thu' : 'Quản lý phím tắt'}
            </h3>
            <p className="text-[11px] text-[#78716C]">
              {mainTab === 'CATEGORIES'
                ? `Tùy biến các danh mục của ${activeHousehold?.name || 'tổ ấm'}`
                : 'Tùy biến các phím tắt xuất hiện trên bàn phím ghi sổ nhanh'}
            </p>
          </div>
        </div>

        {/* Bộ chuyển đổi loại: Khoản chi vs Thu nhập */}
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

      {/* THANH CHUYỂN ĐỔI TAB CHÍNH: Nhóm Danh mục vs Phím tắt */}
      <div className="flex items-center gap-1.5 p-1 bg-[#F5F3EF] border border-[#E6E2DA] rounded-2xl">
        <button
          type="button"
          onClick={() => {
            playActionClick();
            triggerHaptic(10);
            setMainTab('CATEGORIES');
          }}
          className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            mainTab === 'CATEGORIES'
              ? 'bg-white text-[#0F3D39] shadow-xs'
              : 'text-[#78716C] hover:text-[#1C1917]'
          }`}
        >
          <FolderTree className="w-3.5 h-3.5" />
          <span>Nhóm danh mục</span>
          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-medium ${
            mainTab === 'CATEGORIES' ? 'bg-[#E7EFEF] text-[#0F3D39]' : 'bg-[#E6E2DA] text-[#78716C]'
          }`}>
            {activeCategories.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            playActionClick();
            triggerHaptic(10);
            setMainTab('QUICK_TAGS');
          }}
          className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            mainTab === 'QUICK_TAGS'
              ? 'bg-white text-[#0F3D39] shadow-xs'
              : 'text-[#78716C] hover:text-[#1C1917]'
          }`}
        >
          <Zap className="w-3.5 h-3.5 fill-[#0F3D39]" />
          <span>Phím tắt</span>
          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-medium ${
            mainTab === 'QUICK_TAGS' ? 'bg-[#E7EFEF] text-[#0F3D39]' : 'bg-[#E6E2DA] text-[#78716C]'
          }`}>
            {currentTypeQuickTags.length}
          </span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: QUẢN LÝ NHÓM DANH MỤC
          ========================================================================= */}
      {mainTab === 'CATEGORIES' && (
        <div className="space-y-4 animate-in fade-in duration-150">

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

      {/* Nút kích hoạt Bottom Sheet thêm nhóm danh mục mới */}
      <button
        type="button"
        onClick={() => {
          playActionClick();
          setEditingCat(null);
          setNewCatName('');
          setNewCatLimit('');
          setNewCatColor(COLOR_OPTIONS[0].hex);
          setNewCatIcon(activeType === 'INCOME' ? 'briefcase' : 'folder');
          setIsAdding(true);
        }}
        className="w-full py-3 rounded-2xl border-2 border-dashed border-[#D3CDC2] hover:border-[#0F3D39] text-xs font-semibold text-[#0F3D39] hover:bg-[#E7EFEF]/50 flex items-center justify-center gap-1.5 transition-all tactile-btn cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        <span>Thêm nhóm {activeType === 'EXPENSE' ? 'chi tiêu' : 'thu nhập'} mới</span>
      </button>

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
        </div>
      )}

      {/* =========================================================================
          TAB 2: QUẢN LÝ PHÍM TẮT (QUICK TAGS)
          ========================================================================= */}
      {mainTab === 'QUICK_TAGS' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Danh sách các thẻ Phím tắt hoặc Empty State */}
          {currentTypeQuickTags.length === 0 ? (
            <div className="p-8 rounded-3xl border-2 border-dashed border-[#E6E2DA] bg-[#FAF9F6] text-center space-y-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white border border-[#E6E2DA] shadow-2xs flex items-center justify-center mx-auto text-[#0F3D39]">
                <Zap className="w-6 h-6 opacity-60 fill-[#0F3D39]" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#1C1917]">
                  Chưa có phím tắt {activeType === 'INCOME' ? 'Thu Nhập' : 'Chi Tiêu'} nào
                </p>
                <p className="text-[11px] text-[#78716C] max-w-sm mx-auto mt-0.5">
                  Tạo các phím tắt để chọn nhanh nhóm và số tiền quen thuộc trên bàn phím số
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {currentTypeQuickTags.map((tag) => (
                <div
                  key={tag.id}
                  className="p-3.5 rounded-2xl border border-[#F5F3EF] bg-[#FAF9F6] hover:bg-white hover:border-[#E6E2DA] transition-all flex flex-col justify-between gap-2.5 shadow-2xs group"
                >
                  {/* Dòng 1: Biểu tượng, tên phím tắt và thao tác */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border border-[#E6E2DA]/80 bg-white shadow-2xs text-base">
                        {tag.emoji}
                      </span>
                      <p className="text-xs font-bold text-[#1C1917] truncate">{tag.label}</p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEditTag(tag)}
                        className="text-[#A8A29E] hover:text-[#0F3D39] p-1 rounded-md hover:bg-[#E7EFEF] opacity-70 group-hover:opacity-100 transition-all cursor-pointer"
                        title="Chỉnh sửa phím tắt"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteQuickTag(tag)}
                        className="text-[#A8A29E] hover:text-[#E11D48] p-1 rounded-md hover:bg-[#FFF1F2] opacity-70 group-hover:opacity-100 transition-all cursor-pointer"
                        title="Xóa phím tắt"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Dòng 2: Danh mục gắn kèm & Số tiền mặc định */}
                  <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-[#F5F3EF]">
                    <span className="text-[#78716C] truncate mr-2">
                      Gắn vào: <span className="font-semibold text-[#1C1917]">{tag.categoryName}</span>
                    </span>
                    <span className="font-mono text-[#0F3D39] font-semibold shrink-0">
                      {tag.defaultAmount ? (
                        formatVND(tag.defaultAmount)
                      ) : (
                        <span className="text-[#A8A29E] font-normal font-sans text-[10px]">Tự nhập tiền</span>
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Nút kích hoạt Bottom Sheet thêm phím tắt mới */}
          <button
            type="button"
            onClick={handleStartAddTag}
            className="w-full py-3 rounded-2xl border-2 border-dashed border-[#D3CDC2] hover:border-[#0F3D39] text-xs font-semibold text-[#0F3D39] hover:bg-[#E7EFEF]/50 flex items-center justify-center gap-1.5 transition-all tactile-btn cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm phím tắt {activeType === 'EXPENSE' ? 'chi tiêu' : 'thu nhập'} mới</span>
          </button>
        </div>
      )}

      {/* =========================================================================
          BOTTOM SHEET: THÊM / CHỈNH SỬA NHÓM DANH MỤC
          ========================================================================= */}
      {(isAdding || editingCat) && (
        <div 
          className="fixed inset-0 z-60 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/55 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              playActionClick();
              setIsAdding(false);
              setEditingCat(null);
            }
          }}
        >
          <div 
            role="dialog"
            aria-modal="true"
            className="bg-white border border-[#E6E2DA] rounded-t-3xl sm:rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] animate-in slide-in-from-bottom-3 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Thanh kéo chỉ báo trên mobile */}
            <div className="w-12 h-1.5 bg-[#E6E2DA] rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

            {/* Header Bottom Sheet */}
            <div className="px-5 py-3.5 border-b border-[#F5F3EF] flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[#E7EFEF] text-[#0F3D39] flex items-center justify-center shadow-2xs shrink-0">
                  <FolderTree className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-[#1C1917] truncate">
                    {editingCat 
                      ? `Chỉnh sửa: ${editingCat.name}` 
                      : `Thêm nhóm ${activeType === 'EXPENSE' ? 'chi tiêu' : 'thu nhập'} mới`}
                  </h3>
                  <p className="text-[11px] text-[#78716C] truncate">
                    {editingCat ? 'Cập nhật thông tin nhận diện & hạn mức' : 'Điền thông tin và bấm lưu nhóm'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  playActionClick();
                  setIsAdding(false);
                  setEditingCat(null);
                }}
                className="w-8 h-8 rounded-xl text-[#78716C] hover:text-[#1C1917] hover:bg-[#F5F3EF] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                title="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thân cuộn Bottom Sheet */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-[#78716C] block mb-1">
                    Tên nhóm danh mục <span className="text-[#E11D48]">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingCat ? editName : newCatName}
                    onChange={(e) => {
                      if (editingCat) setEditName(e.target.value);
                      else setNewCatName(e.target.value);
                    }}
                    placeholder={activeType === 'EXPENSE' ? 'Ví dụ: Trả nợ ngân hàng, Thú cưng...' : 'Ví dụ: Tiền thưởng, Cổ tức...'}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] outline-hidden focus:border-[#0F3D39] focus:bg-white transition-all"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#78716C] block mb-1">
                    Hạn mức tháng (VND - tùy chọn):
                  </label>
                  <input
                    type="number"
                    value={editingCat ? editLimit : newCatLimit}
                    onChange={(e) => {
                      if (editingCat) setEditLimit(e.target.value);
                      else setNewCatLimit(e.target.value);
                    }}
                    placeholder="Ví dụ: 8000000"
                    className="w-full text-xs p-2.5 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] outline-hidden focus:border-[#0F3D39] focus:bg-white font-mono transition-all"
                  />
                </div>
              </div>

              {/* Chọn màu sắc */}
              <div className="space-y-1.5 pt-1">
                <span className="text-xs font-semibold text-[#78716C]">Màu sắc nhận diện:</span>
                <div className="flex items-center gap-2.5 flex-wrap">
                  {COLOR_OPTIONS.map((c) => {
                    const currentColor = editingCat ? editColor : newCatColor;
                    const isSelected = currentColor === c.hex;
                    return (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => {
                          playActionClick();
                          triggerHaptic(5);
                          if (editingCat) setEditColor(c.hex);
                          else setNewCatColor(c.hex);
                        }}
                        className={`w-7 h-7 rounded-full transition-all cursor-pointer flex items-center justify-center ${
                          isSelected ? 'scale-110 ring-2 ring-[#0F3D39] ring-offset-2' : 'hover:scale-105 opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c.hex }}
                        title={c.label}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Chọn Icon */}
              <div className="space-y-1.5 pt-1">
                <span className="text-xs font-semibold text-[#78716C]">Biểu tượng (Icon):</span>
                <div className="grid grid-cols-6 sm:grid-cols-7 gap-2 max-h-48 overflow-y-auto p-1.5 bg-[#FAF9F6] rounded-2xl border border-[#E6E2DA]">
                  {CATEGORY_ICON_OPTIONS.map((ic) => {
                    const currentIcon = editingCat ? editIcon : newCatIcon;
                    const currentColor = editingCat ? editColor : newCatColor;
                    const isSelected = currentIcon === ic.key;
                    return (
                      <button
                        key={ic.key}
                        type="button"
                        onClick={() => {
                          playActionClick();
                          triggerHaptic(5);
                          if (editingCat) setEditIcon(ic.key);
                          else setNewCatIcon(ic.key);
                        }}
                        className={`h-10 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#0F3D39] bg-white ring-2 ring-[#0F3D39]/20 shadow-xs scale-105'
                            : 'border-transparent bg-transparent hover:bg-white hover:border-[#E6E2DA]'
                        }`}
                        title={ic.label}
                      >
                        {renderCategoryIcon(ic.key, "w-4 h-4", isSelected ? currentColor : '#78716C')}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer Bottom Sheet */}
            <div className="px-5 py-3.5 bg-[#FAF9F6] border-t border-[#E6E2DA] flex items-center justify-end gap-2.5 shrink-0 pb-safe sm:pb-3.5">
              <button
                type="button"
                onClick={() => {
                  playActionClick();
                  setIsAdding(false);
                  setEditingCat(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#78716C] hover:bg-[#E6E2DA]/50 transition-all cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={editingCat ? handleSaveEdit : handleAddCategory}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#0F3D39] text-white hover:bg-[#174E4A] flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{editingCat ? 'Lưu thay đổi' : 'Lưu nhóm mới'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          BOTTOM SHEET: THÊM / CHỈNH SỬA PHÍM TẮT (QUICK TAGS)
          ========================================================================= */}
      {(isAddingTag || editingTag) && (
        <div 
          className="fixed inset-0 z-60 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/55 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              playActionClick();
              resetTagForm();
            }
          }}
        >
          <div 
            role="dialog"
            aria-modal="true"
            className="bg-white border border-[#E6E2DA] rounded-t-3xl sm:rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] animate-in slide-in-from-bottom-3 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Thanh kéo chỉ báo trên mobile */}
            <div className="w-12 h-1.5 bg-[#E6E2DA] rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

            {/* Header Bottom Sheet */}
            <div className="px-5 py-3.5 border-b border-[#F5F3EF] flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[#E7EFEF] text-[#0F3D39] flex items-center justify-center shadow-2xs shrink-0">
                  <Zap className="w-4 h-4 fill-[#0F3D39]" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-[#1C1917] truncate">
                    {editingTag ? `Chỉnh sửa phím tắt: ${editingTag.label}` : `Thêm phím tắt ${activeType === 'INCOME' ? 'thu nhập' : 'chi tiêu'} mới`}
                  </h3>
                  <p className="text-[11px] text-[#78716C] truncate">Gợi ý 1-chạm khi nhập liệu bàn phím số</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  playActionClick();
                  resetTagForm();
                }}
                className="w-8 h-8 rounded-xl text-[#78716C] hover:text-[#1C1917] hover:bg-[#F5F3EF] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                title="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thân cuộn Bottom Sheet */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
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
                    placeholder={activeType === 'INCOME' ? 'vd: Lương chính, Cổ tức...' : 'vd: Cà phê sáng, Cơm trưa, Xăng xe...'}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] outline-hidden focus:border-[#0F3D39] focus:bg-white transition-all"
                    autoFocus
                  />
                </div>

                {/* Danh mục liên kết */}
                <div className="relative" ref={tagCatDropdownRef}>
                  <label className="text-[11px] font-semibold text-[#78716C] block mb-1">
                    Gắn vào Danh mục <span className="text-[#E11D48]">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      playActionClick();
                      triggerHaptic(5);
                      setIsTagCatDropdownOpen((prev) => !prev);
                    }}
                    className={`w-full px-3 py-2.5 rounded-xl border bg-[#FAF9F6] text-xs flex items-center justify-between transition-all cursor-pointer ${
                      isTagCatDropdownOpen
                        ? 'border-[#0F3D39] ring-2 ring-[#0F3D39]/20 bg-white'
                        : 'border-[#E6E2DA] hover:border-[#0F3D39]/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border border-[#E6E2DA]/80 bg-white shadow-2xs">
                        {renderCategoryIcon(selectedTagCategory?.icon, "w-3.5 h-3.5", selectedTagCategory?.color || (activeType === 'INCOME' ? '#10B981' : '#0F3D39'))}
                      </span>
                      <span className="font-semibold text-[#1C1917] truncate">
                        {selectedTagCategory?.name || (activeType === 'INCOME' ? 'Chọn nguồn thu' : 'Chọn danh mục chi')}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-[#78716C] transition-transform duration-200 shrink-0 ${
                        isTagCatDropdownOpen ? 'rotate-180 text-[#0F3D39]' : ''
                      }`}
                    />
                  </button>

                  {/* Menu thả xuống */}
                  {isTagCatDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 max-h-52 overflow-y-auto bg-white border border-[#E6E2DA] rounded-2xl shadow-xl p-1.5 z-40 space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
                      {activeCategories.map((cat) => {
                        const isSelected = (tagCategoryId || activeCategories[0]?.id) === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              playActionClick();
                              triggerHaptic(10);
                              setTagCategoryId(cat.id);
                              setIsTagCatDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                              isSelected
                                ? activeType === 'INCOME'
                                  ? 'bg-[#ECFDF5] text-[#047857] font-semibold'
                                  : 'bg-[#E7EFEF] text-[#0F3D39] font-semibold'
                                : 'text-[#1C1917] hover:bg-[#FAF9F6]'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border border-[#E6E2DA]/80 bg-white shadow-2xs">
                                {renderCategoryIcon(cat.icon, "w-3.5 h-3.5", cat.color || (activeType === 'INCOME' ? '#10B981' : '#0F3D39'))}
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
                      className="w-12 px-2 py-2 text-center text-base rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] outline-hidden focus:border-[#0F3D39]"
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
                          className={`w-8 h-8 shrink-0 rounded-lg text-sm flex items-center justify-center transition-all cursor-pointer ${
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
                      className="w-full px-3 py-2.5 text-xs font-mono rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] outline-hidden focus:border-[#0F3D39] focus:ring-1 focus:ring-[#0F3D39] transition-all pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#A8A29E] font-medium pointer-events-none">
                      VND
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Bottom Sheet */}
            <div className="px-5 py-3.5 bg-[#FAF9F6] border-t border-[#E6E2DA] flex items-center justify-end gap-2.5 shrink-0 pb-safe sm:pb-3.5">
              <button
                type="button"
                onClick={resetTagForm}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#78716C] hover:bg-[#E6E2DA]/50 transition-all cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveQuickTag}
                className="px-5 py-2.5 rounded-xl bg-[#0F3D39] text-white text-xs font-semibold hover:bg-[#174E4A] transition-all shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{editingTag ? 'Lưu cập nhật' : 'Tạo phím tắt'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
  </div>
);
};
