import React from 'react';
import { X } from 'lucide-react';
import { playActionClick } from '../utils/audio';
import { useSwipeDownDismiss } from '../utils/useSwipeDownDismiss';
import { useBodyScrollLock } from '../utils/scrollLock';
import { Numpad } from './Numpad';

interface NumpadBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NumpadBottomSheet: React.FC<NumpadBottomSheetProps> = ({ isOpen, onClose }) => {
  useBodyScrollLock(isOpen);

  const { isRendered, swipeHandlers, sheetStyle, backdropStyle, triggerClose } = useSwipeDownDismiss({
    isOpen,
    onClose,
    threshold: 75
  });

  if (!isRendered) return null;

  return (
    <div
      className="fixed inset-0 z-60 flex items-end justify-center p-0 bg-black/55 backdrop-blur-xs sm:hidden touch-none"
      style={backdropStyle}
      onTouchMove={(e) => {
        if (e.target === e.currentTarget) e.preventDefault();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          playActionClick();
          triggerClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        style={sheetStyle}
        className="bg-[#FAF9F6] border border-[#E6E2DA] rounded-t-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[94dvh] pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Vùng kéo vuốt Header (Swipe to dismiss) */}
        <div {...swipeHandlers} className="bg-white rounded-t-3xl select-none cursor-grab active:cursor-grabbing shrink-0">
          {/* Thanh chỉ báo vuốt (Drag handle pill) siêu mảnh tinh tế */}
          <div className="w-full pt-2 pb-1 flex items-center justify-center">
            <div className="w-9 h-1 bg-[#D6D3CD] rounded-full hover:bg-[#A8A29E] transition-colors" />
          </div>

          {/* Tiêu đề & Nút đóng */}
          <div className="px-4 pb-2.5 pt-0.5 border-b border-[#E6E2DA] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-[#0F3D39] text-[#FAF9F6] flex items-center justify-center shadow-2xs text-xs font-bold font-mono">
                ₫
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#1C1917]">Ghi nhận thu chi</h3>
                <p className="text-[10px] text-[#78716C]">Nhập số tiền hoặc chạm gợi ý nhanh</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                playActionClick();
                triggerClose();
              }}
              className="w-7 h-7 rounded-xl text-[#78716C] hover:text-[#1C1917] hover:bg-[#F5F3EF] flex items-center justify-center transition-colors cursor-pointer"
              title="Đóng (hoặc vuốt xuống)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Thân cuộn Bottom Sheet - Tự động co giãn mượt mà theo nội dung */}
        <div className="p-2.5 sm:p-3 overflow-y-auto overscroll-contain touch-pan-y pb-4">
          <Numpad
            isBottomSheet
            onSuccess={triggerClose}
          />
        </div>
      </div>
    </div>
  );
};
