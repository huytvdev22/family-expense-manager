import React, { useState } from 'react';
import { Plus, Check, Edit2, Trash2, CreditCard as CardIcon, Calendar, ArrowLeft, Info, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { playActionClick } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';
import { getCardBillingCycleInfo, formatDisplayDate } from '../utils/currency';
import { useToast } from './Toast';
import { BottomSheet } from './BottomSheet';
import type { CreditCard, CreditCardDueType } from '../types';

interface CardManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CardManagerModal: React.FC<CardManagerModalProps> = ({ isOpen, onClose }) => {
  const { creditCards, addCreditCard, editCreditCard, removeCreditCard } = useApp();
  const { showToast } = useToast();

  // Chế độ màn hình: 'LIST' (Danh sách thẻ) hoặc 'FORM' (Thêm/Sửa thẻ)
  const [viewMode, setViewMode] = useState<'LIST' | 'FORM'>('LIST');
  const [editingCardId, setEditingCardId] = useState<string | null>(null);

  // Form state tối giản
  const [name, setName] = useState('');
  const [last4Digits, setLast4Digits] = useState('');
  const [color, setColor] = useState('#DC2626');
  const [statementDay, setStatementDay] = useState<number>(20);
  const [dueType, setDueType] = useState<CreditCardDueType>('FIXED_DAY');
  const [paymentDueDay, setPaymentDueDay] = useState<number>(5);
  const [daysAfterStatement, setDaysAfterStatement] = useState<number>(25);
  const [gracePeriodDays, setGracePeriodDays] = useState<number>(55);
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
    setDueType('FIXED_DAY');
    setPaymentDueDay(5);
    setDaysAfterStatement(25);
    setGracePeriodDays(55);
    setEditingCardId(null);
    setViewMode('LIST');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

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
    setDueType(card.dueType || 'FIXED_DAY');
    setPaymentDueDay(card.paymentDueDay || 5);
    setDaysAfterStatement(card.daysAfterStatement || 25);
    setGracePeriodDays(card.gracePeriodDays || 55);
    setViewMode('FORM');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Vui lòng nhập tên thẻ hoặc ngân hàng', 'warning');
      return;
    }
    if (!last4Digits.trim() || last4Digits.length !== 4) {
      showToast('Vui lòng nhập đúng 4 số cuối của thẻ', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      const cardPayload = {
        name: name.trim(),
        last4Digits: last4Digits.trim(),
        color,
        statementDay: Number(statementDay),
        dueType,
        paymentDueDay: Number(paymentDueDay),
        daysAfterStatement: dueType === 'GRACE_PERIOD' ? Number(daysAfterStatement) : undefined,
        gracePeriodDays: dueType === 'GRACE_PERIOD' ? Number(gracePeriodDays) : undefined
      };

      if (editingCardId) {
        await editCreditCard(editingCardId, cardPayload);
      } else {
        await addCreditCard({
          ...cardPayload,
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

  const previewCycle = getCardBillingCycleInfo({
    id: 'preview',
    householdId: '',
    name: name || 'Thẻ',
    last4Digits: last4Digits || '0000',
    color,
    statementDay: Number(statementDay) || 20,
    dueType,
    paymentDueDay: Number(paymentDueDay) || 5,
    daysAfterStatement: Number(daysAfterStatement) || 25,
    gracePeriodDays: Number(gracePeriodDays) || 55,
    isActive: true,
    createdAt: '',
    updatedAt: 0
  });

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      title={
        viewMode === 'FORM'
          ? editingCardId
            ? 'Chỉnh sửa thẻ'
            : 'Thêm thẻ tín dụng'
          : 'Thẻ tín dụng gia đình'
      }
      subtitle={
        viewMode === 'FORM'
          ? 'Thiết lập chu kỳ sao kê & hạn thanh toán'
          : `${creditCards.length} thẻ đang quản lý`
      }
      icon={
        viewMode === 'FORM' ? (
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
        )
      }
      footer={
        viewMode === 'LIST' ? (
          <div className="p-3 sm:p-4">
            <button
              type="button"
              onClick={() => {
                playActionClick();
                handleClose();
              }}
              className="w-full min-h-[44px] py-2.5 rounded-2xl bg-[#0F3D39] text-white text-xs font-bold hover:bg-[#134E48] transition-all cursor-pointer shadow-sm"
            >
              Đóng
            </button>
          </div>
        ) : null
      }
    >
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
                        Chốt ngày {card.statementDay} •{' '}
                        {card.dueType === 'GRACE_PERIOD'
                          ? `Hạn sau sao kê ${card.daysAfterStatement || 25} ngày`
                          : `Hạn ngày ${card.paymentDueDay || 5} hàng tháng`}
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
          VIEW 2: FORM THÊM / SỬA THẺ
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

          {/* Ngày chốt sao kê */}
          <div>
            <label className="block text-[11px] font-semibold text-[#78716C] mb-1 uppercase tracking-wider">
              Ngày chốt sao kê hàng tháng
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
              <span className="text-[#78716C] text-[11px] shrink-0">hàng tháng</span>
            </div>
          </div>

          {/* Phương thức tính hạn thanh toán */}
          <div>
            <label className="block text-[11px] font-semibold text-[#78716C] mb-1.5 uppercase tracking-wider">
              Cách tính hạn thanh toán
            </label>
            <div className="bg-[#F5F3EF] p-1 rounded-2xl flex border border-[#E6E2DA] shadow-2xs">
              <button
                type="button"
                onClick={() => {
                  playActionClick();
                  setDueType('FIXED_DAY');
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  dueType === 'FIXED_DAY'
                    ? 'bg-[#0F3D39] text-white font-bold shadow-2xs'
                    : 'text-[#78716C] hover:text-[#1C1917]'
                }`}
              >
                Cố định ngày trong tháng
              </button>
              <button
                type="button"
                onClick={() => {
                  playActionClick();
                  setDueType('GRACE_PERIOD');
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  dueType === 'GRACE_PERIOD'
                    ? 'bg-[#0F3D39] text-white font-bold shadow-2xs'
                    : 'text-[#78716C] hover:text-[#1C1917]'
                }`}
              >
                Số ngày sau sao kê
              </button>
            </div>
          </div>

          {/* Input cấu hình theo dueType */}
          {dueType === 'FIXED_DAY' ? (
            <div>
              <label className="block text-[11px] font-semibold text-[#78716C] mb-1 uppercase tracking-wider">
                Hạn thanh toán hàng tháng
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
                <span className="text-[#78716C] text-[11px] shrink-0">hàng tháng (tháng kế tiếp)</span>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-[11px] font-semibold text-[#78716C] mb-1 uppercase tracking-wider">
                Hạn thanh toán sau sao kê
              </label>
              <div className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] text-xs">
                <Clock className="w-3.5 h-3.5 text-[#0F3D39] shrink-0" />
                <span className="text-[#78716C] text-[11px] shrink-0">Sau ngày chốt sao kê</span>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={daysAfterStatement}
                  onChange={(e) => {
                    const days = Number(e.target.value);
                    setDaysAfterStatement(days);
                    setGracePeriodDays(days + 30);
                  }}
                  className="w-full font-mono font-bold text-[#0F3D39] focus:outline-none text-right pr-1 bg-transparent"
                  required
                />
                <span className="text-[#78716C] text-[11px] shrink-0">ngày</span>
              </div>
            </div>
          )}

          {/* Smart Preview Mô phỏng chu kỳ */}
          <div className="bg-[#FAF9F6] border border-[#E6E2DA] rounded-2xl p-3 text-xs space-y-2">
            <div className="flex items-center gap-1.5 text-[#0F3D39] font-bold">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>Mô phỏng chu kỳ sao kê thực tế</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1.5 border-t border-[#E6E2DA]">
              <div className="bg-white p-2.5 rounded-xl border border-[#E6E2DA]/80 shadow-2xs">
                <span className="text-[#78716C] block text-[10px] uppercase font-semibold">Kỳ chốt vừa qua</span>
                <span className="font-mono font-bold text-[#1C1917] block mt-0.5">{formatDisplayDate(previewCycle.currentStatementDate)}</span>
                <span className="text-[10px] text-[#B45309] block mt-1 font-semibold">
                  ➔ Hạn trả: {formatDisplayDate(previewCycle.currentDueDate)}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-[#E6E2DA]/80 shadow-2xs">
                <span className="text-[#78716C] block text-[10px] uppercase font-semibold">Kỳ chốt kế tiếp</span>
                <span className="font-mono font-bold text-[#1C1917] block mt-0.5">{formatDisplayDate(previewCycle.nextStatementDate)}</span>
                <span className="text-[10px] text-[#059669] block mt-1 font-semibold">
                  ➔ Hạn trả: {formatDisplayDate(previewCycle.nextDueDate)}
                </span>
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
    </BottomSheet>
  );
};
