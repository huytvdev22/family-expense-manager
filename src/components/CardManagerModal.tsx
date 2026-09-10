import React, { useState } from 'react';
import { X, Plus, Check, Edit2, Trash2, CreditCard as CardIcon, Calendar, ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { playActionClick } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';
import { useBodyScrollLock } from '../utils/scrollLock';
import { useToast } from './Toast';
import { useSwipeDownDismiss } from '../utils/useSwipeDownDismiss';
import type { CreditCard } from '../types';

interface CardManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CardManagerModal: React.FC<CardManagerModalProps> = ({ isOpen, onClose }) => {
  const { creditCards, addCreditCard, editCreditCard, removeCreditCard } = useApp();
  const { showToast } = useToast();

  useBodyScrollLock(isOpen);

  // Chế độ màn hình: 'LIST' (Danh sách thẻ) hoặc 'FORM' (Thêm/Sửa thẻ)
  const [viewMode, setViewMode] = useState<'LIST' | 'FORM'>('LIST');
  const [editingCardId, setEditingCardId] = useState<string | null>(null);

  // Form state tối giản: chỉ còn tên thẻ, 4 số cuối, ngày sao kê, ngày đến hạn và màu sắc
  const [name, setName] = useState('');
  const [last4Digits, setLast4Digits] = useState('');
  const [color, setColor] = useState('#DC2626');
  const [statementDay, setStatementDay] = useState<number>(20);
  const [paymentDueDay, setPaymentDueDay] = useState<number>(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const COLOR_PRESETS = [
    { name: 'Đỏ HSBC', hex: '#DC2626' },
    { name: 'Cam MSB', hex: '#EA580C' },
    { name: 'Xanh BIDV', hex: '#0F766E' },
    { name: 'Xanh Navy', hex: '#1E3A8A' },
    { name: 'Tím Than', hex: '#4C1D95' },
    { name: 'Đen Sang Trọng', hex: '#1C1917' }
  ];

  const resetForm = () => {
    setName('');
    setLast4Digits('');
    setColor('#DC2626');
    setStatementDay(20);
    setPaymentDueDay(5);
    setEditingCardId(null);
    setViewMode('LIST');
  };

  // Cử chỉ vuốt kéo xuống để đóng Bottom Sheet trên di động
  const { swipeHandlers, sheetStyle, backdropStyle, isClosing } = useSwipeDownDismiss({
    onClose: () => {
      resetForm();
      onClose();
    },
    threshold: 75
  });

  const handleStartAdd = () => {
    playActionClick();
    triggerHaptic(8);
    resetForm();
    setViewMode('FORM');
  };

  const handleStartEdit = (card: CreditCard) => {
    playActionClick();
    triggerHaptic(8);
    setEditingCardId(card.id);
    setName(card.name);
    setLast4Digits(card.last4Digits);
    setColor(card.color || '#DC2626');
    setStatementDay(card.statementDay);
    setPaymentDueDay(card.paymentDueDay);
    setViewMode('FORM');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Vui lòng nhập tên thẻ / ngân hàng', 'warning');
      return;
    }
    if (!last4Digits.trim() || last4Digits.length !== 4) {
      showToast('Vui lòng nhập đúng 4 số cuối của thẻ', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingCardId) {
        await editCreditCard(editingCardId, {
          name: name.trim(),
          last4Digits: last4Digits.trim(),
          color,
          statementDay: Number(statementDay),
          paymentDueDay: Number(paymentDueDay)
        });
      } else {
        await addCreditCard({
          name: name.trim(),
          last4Digits: last4Digits.trim(),
          color,
          statementDay: Number(statementDay),
          paymentDueDay: Number(paymentDueDay),
          isActive: true
        });
      }
      resetForm();
    } catch (err) {
      console.error('Lỗi khi lưu thẻ tín dụng:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (card: CreditCard) => {
    if (window.confirm(`Bạn có chắc muốn gỡ thẻ "${card.name}" (•••• ${card.last4Digits})?`)) {
      await removeCreditCard(card.id);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-70 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/55 backdrop-blur-xs animate-in fade-in duration-150 touch-none"
      style={backdropStyle}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting && !isClosing) {
          playActionClick();
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        style={sheetStyle}
        className="bg-white border border-[#E6E2DA] rounded-t-3xl sm:rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[88vh] animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 pb-safe transition-[max-height] duration-200 ease-out"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Vùng kéo vuốt Header (Swipe to dismiss) */}
        <div {...swipeHandlers} className="cursor-grab active:cursor-grabbing select-none bg-white rounded-t-3xl shrink-0">
          <div className="w-full pt-2 pb-1 flex items-center justify-center sm:hidden">
            <div className="w-9 h-1 bg-[#D6D3CD] rounded-full hover:bg-[#A8A29E] transition-colors" />
          </div>

          {/* Header Bottom Sheet */}
          <div className="px-5 pb-3 pt-0 sm:py-4 border-b border-[#F5F3EF] flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {viewMode === 'FORM' ? (
              <button
                type="button"
                onClick={() => {
                  playActionClick();
                  setViewMode('LIST');
                }}
                className="w-8 h-8 rounded-xl text-[#78716C] hover:text-[#1C1917] hover:bg-[#F5F3EF] flex items-center justify-center transition-colors cursor-pointer mr-0.5"
                title="Quay lại danh sách"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <div className="w-8 h-8 rounded-xl bg-[#FAF9F6] border border-[#E6E2DA] text-[#0F3D39] flex items-center justify-center shadow-2xs font-bold shrink-0">
                <CardIcon className="w-4 h-4 stroke-[2.5]" />
              </div>
            )}
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-[#1C1917] truncate">
                {viewMode === 'FORM'
                  ? editingCardId
                    ? 'Chỉnh sửa thẻ'
                    : 'Thêm thẻ tín dụng'
                  : 'Thẻ tín dụng gia đình'}
              </h3>
              <p className="text-[11px] text-[#78716C] truncate">
                {viewMode === 'FORM'
                  ? 'Thiết lập chu kỳ sao kê & thanh toán'
                  : `${creditCards.length} thẻ đang quản lý`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              playActionClick();
              onClose();
            }}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-xl text-[#78716C] hover:text-[#1C1917] hover:bg-[#F5F3EF] flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
          </div>
        </div>

        {/* Nội dung cuộn */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 overscroll-contain flex-1">
          {/* =========================================================================
              VIEW 1: DANH SÁCH THẺ TÍN DỤNG
              ========================================================================= */}
          {viewMode === 'LIST' && (
            <div className="space-y-3">
              {/* Nút Thêm thẻ mới nổi bật */}
              <button
                type="button"
                onClick={handleStartAdd}
                className="w-full py-3 px-4 rounded-2xl border-2 border-dashed border-[#E6E2DA] hover:border-[#0F3D39] bg-[#FAF9F6] text-xs font-semibold text-[#0F3D39] flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98 min-h-[44px]"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm thẻ tín dụng mới</span>
              </button>

              {creditCards.length === 0 ? (
                <div className="py-4 px-3 text-center bg-[#FAF9F6] border border-[#E6E2DA] rounded-2xl text-xs text-[#78716C]">
                  <p className="font-medium text-[#78716C]">Gia đình chưa có thẻ tín dụng nào.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {creditCards.map((card) => (
                    <div
                      key={card.id}
                      className="flex items-center justify-between p-3 rounded-2xl border border-[#E6E2DA] bg-white shadow-2xs hover:border-[#0F3D39]/40 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-2xs shrink-0"
                          style={{ backgroundColor: card.color || '#0F3D39' }}
                        >
                          <CardIcon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#1C1917] truncate">
                            {card.name} •••• {card.last4Digits}
                          </p>
                          <p className="text-[10px] text-[#78716C] mt-0.5">
                            Chốt ngày {card.statementDay} • Hạn ngày {card.paymentDueDay} hàng tháng
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(card)}
                          className="w-8 h-8 flex items-center justify-center text-[#78716C] hover:text-[#0F3D39] hover:bg-[#F5F3EF] rounded-xl transition-colors cursor-pointer"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(card)}
                          className="w-8 h-8 flex items-center justify-center text-[#E11D48] hover:bg-[#FFF1F2] rounded-xl transition-colors cursor-pointer"
                          title="Xóa thẻ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              VIEW 2: FORM THÊM / SỬA THẺ TỐI GIẢN
              ========================================================================= */}
          {viewMode === 'FORM' && (
            <form onSubmit={handleSave} className="space-y-4">
              {/* Tên thẻ & 4 số cuối */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-[#78716C] mb-1 uppercase tracking-wider">
                    Tên thẻ / Ngân hàng
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="VD: HSBC, MSB, BIDV JCB..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] text-xs font-semibold text-[#1C1917] focus:outline-none focus:border-[#0F3D39] focus:bg-white transition-colors"
                    autoFocus
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#78716C] mb-1 uppercase tracking-wider">
                    4 số cuối
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={last4Digits}
                    onChange={(e) => setLast4Digits(e.target.value.replace(/\D/g, ''))}
                    placeholder="VD: 8828"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] text-xs font-mono font-bold text-[#1C1917] text-center focus:outline-none focus:border-[#0F3D39] focus:bg-white transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Chu kỳ sao kê & Hạn thanh toán */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-[#78716C] mb-1 uppercase tracking-wider">
                    Ngày chốt sao kê
                  </label>
                  <div className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] text-xs">
                    <Calendar className="w-3.5 h-3.5 text-[#78716C] shrink-0" />
                    <span className="text-[#78716C] text-[11px] shrink-0">Ngày</span>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={statementDay}
                      onChange={(e) => setStatementDay(Number(e.target.value))}
                      className="w-full font-mono font-bold text-[#1C1917] focus:outline-none text-right pr-1 bg-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#78716C] mb-1 uppercase tracking-wider">
                    Hạn thanh toán
                  </label>
                  <div className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] text-xs">
                    <Calendar className="w-3.5 h-3.5 text-[#0F3D39] shrink-0" />
                    <span className="text-[#78716C] text-[11px] shrink-0">Ngày</span>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={paymentDueDay}
                      onChange={(e) => setPaymentDueDay(Number(e.target.value))}
                      className="w-full font-mono font-bold text-[#0F3D39] focus:outline-none text-right pr-1 bg-transparent"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Màu sắc nhận diện thẻ */}
              <div>
                <label className="block text-[11px] font-semibold text-[#78716C] mb-1.5 uppercase tracking-wider">
                  Màu đại diện
                </label>
                <div className="flex items-center gap-2">
                  {COLOR_PRESETS.map((p) => (
                    <button
                      key={p.hex}
                      type="button"
                      onClick={() => setColor(p.hex)}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                        color === p.hex ? 'ring-2 ring-offset-2 ring-[#1C1917] scale-105' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: p.hex }}
                      title={p.name}
                    >
                      {color === p.hex && <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nút hành động form */}
              <div className="pt-3 border-t border-[#F5F3EF] flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode('LIST')}
                  disabled={isSubmitting}
                  className="flex-1 min-h-[44px] py-2.5 rounded-2xl border border-[#E6E2DA] text-xs font-semibold text-[#78716C] hover:bg-[#F5F3EF] transition-all cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-2 min-h-[44px] py-2.5 rounded-2xl bg-[#0F3D39] text-white text-xs font-bold hover:bg-[#134E48] shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{editingCardId ? 'Lưu thay đổi' : 'Thêm thẻ'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer Bottom Sheet */}
        {viewMode === 'LIST' && (
          <div className="p-3 sm:p-4 border-t border-[#F5F3EF] bg-white shrink-0">
            <button
              type="button"
              onClick={() => {
                playActionClick();
                onClose();
              }}
              className="w-full py-3 min-h-[44px] rounded-2xl bg-[#0F3D39] hover:bg-[#174E4A] text-white text-xs sm:text-sm font-bold transition-all shadow-2xs active:scale-98 cursor-pointer flex items-center justify-center"
            >
              Đóng
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
