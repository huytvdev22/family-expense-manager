import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { playActionClick } from '../utils/audio';
import { useSwipeDownDismiss } from '../utils/useSwipeDownDismiss';
import { useBodyScrollLock } from '../utils/scrollLock';

export interface BottomSheetProps {
  /** Trạng thái mở Bottom Sheet */
  isOpen: boolean;
  /** Hàm callback khi đóng */
  onClose: () => void;
  /** Tiêu đề chính */
  title?: React.ReactNode;
  /** Tiêu đề phụ / mô tả ngắn */
  subtitle?: React.ReactNode;
  /** Icon phân loại ở góc trái header */
  icon?: React.ReactNode;
  /** Phần tử tùy biến bên phải header (trước nút Close) */
  headerRight?: React.ReactNode;
  /** Tùy biến toàn bộ Header thay vì dùng header mặc định */
  customHeader?: React.ReactNode;
  /** Nội dung thân Bottom Sheet */
  children: React.ReactNode;
  /** Vùng chân cố định (nút hành động Xác nhận / Lưu / Đóng...) */
  footer?: React.ReactNode;
  /** Chiều cao tối đa (mặc định: 'max-h-[92dvh] sm:max-h-[88vh]') */
  maxHeight?: string;
  /** Hiển thị nút đóng X (mặc định: true) */
  showCloseButton?: boolean;
  /** Hiển thị thanh vuốt drag handle pill trên mobile (mặc định: true) */
  showDragHandle?: boolean;
  /** Không cho phép đóng khi chạm vào lớp mờ backdrop */
  preventCloseOnBackdrop?: boolean;
  /** Class tùy biến cho panel card */
  panelClassName?: string;
  /** Class tùy biến cho vùng thân cuộn */
  bodyClassName?: string;
  /** Class tùy biến cho header */
  headerClassName?: string;
}

/**
 * Common Bottom Sheet Component
 * - Chuẩn hóa kiến trúc Mobile-First cho toàn ứng dụng.
 * - Sử dụng createPortal(..., document.body) để thoát khỏi Containing Block & Stacking Context cha,
 *   khắc phục triệt để lỗi hở đáy trên Safari / iPhone PWA.
 * - Tấm nền bám sát đáy màn hình vật lý (bottom: 0), đệm an toàn pb-safe cho Home Indicator.
 * - Tích hợp cử chỉ vuốt xuống đóng mượt mà (useSwipeDownDismiss) và khóa cuộn nền (useBodyScrollLock).
 */
export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  headerRight,
  customHeader,
  children,
  footer,
  maxHeight = 'max-h-[92dvh] sm:max-h-[88vh]',
  showCloseButton = true,
  showDragHandle = true,
  preventCloseOnBackdrop = false,
  panelClassName = '',
  bodyClassName = 'p-4 sm:p-5',
  headerClassName = ''
}) => {
  // Đảm bảo chỉ render Portal trên môi trường client-side (tránh SSR / hydration issue)
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Khóa cuộn trang nền khi Bottom Sheet mở
  useBodyScrollLock(isOpen);

  // Xử lý hiệu ứng mở/đóng và cử chỉ vuốt kéo xuống
  const { isRendered, swipeHandlers, sheetStyle, backdropStyle, triggerClose } = useSwipeDownDismiss({
    isOpen,
    onClose,
    threshold: 75
  });

  if (!isMounted || !isRendered) return null;

  const content = (
    <div className="fixed inset-0 z-60 pointer-events-none">
      {/* 1. Backdrop làm tối & mờ trang nền */}
      <div
        className="fixed inset-0 z-60 bg-black/55 backdrop-blur-xs pointer-events-auto"
        style={backdropStyle}
        onClick={() => {
          if (!preventCloseOnBackdrop) {
            playActionClick();
            triggerClose();
          }
        }}
        aria-hidden="true"
      />

      {/* 2. Container căn chỉnh đáy trên Mobile, căn giữa trên Desktop */}
      <div className="fixed inset-x-0 bottom-0 z-60 flex flex-col justify-end pointer-events-none sm:inset-0 sm:items-center sm:justify-center sm:p-4">
        {/* 3. Panel Bottom Sheet Card màu trắng - Bám sát đáy tuyệt đối */}
        <div
          role="dialog"
          aria-modal="true"
          style={sheetStyle}
          className={`pointer-events-auto bg-white border-t border-x border-[#E6E2DA] sm:border rounded-t-3xl sm:rounded-3xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden pb-safe ${maxHeight} ${panelClassName}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header có hỗ trợ cử chỉ vuốt xuống (Swipe to dismiss) */}
          {customHeader ? (
            <div {...swipeHandlers} className="shrink-0 select-none touch-none">
              {customHeader}
            </div>
          ) : (
            <div
              {...swipeHandlers}
              className={`shrink-0 select-none touch-none bg-white rounded-t-3xl border-b border-[#F5F3EF] ${headerClassName}`}
            >
              {/* Thanh chỉ báo vuốt (Drag Handle Pill) */}
              {showDragHandle && (
                <div className="w-full pt-2 pb-1 flex items-center justify-center sm:hidden cursor-grab active:cursor-grabbing">
                  <div className="w-9 h-1 bg-[#D6D3CD] rounded-full hover:bg-[#A8A29E] transition-colors" />
                </div>
              )}

              {/* Hàng tiêu đề & Nút đóng */}
              <div className="px-5 py-3 sm:py-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {icon && (
                    <div className="shrink-0 flex items-center justify-center">
                      {icon}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    {title && (
                      typeof title === 'string' ? (
                        <h3 className="text-sm font-bold text-[#1C1917] truncate leading-tight">
                          {title}
                        </h3>
                      ) : (
                        title
                      )
                    )}
                    {subtitle && (
                      typeof subtitle === 'string' ? (
                        <p className="text-[11px] text-[#78716C] truncate mt-0.5 leading-normal">
                          {subtitle}
                        </p>
                      ) : (
                        subtitle
                      )
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {headerRight}
                  {showCloseButton && (
                    <button
                      type="button"
                      onClick={() => {
                        playActionClick();
                        triggerClose();
                      }}
                      className="w-8 h-8 rounded-xl text-[#78716C] hover:text-[#1C1917] hover:bg-[#F5F3EF] flex items-center justify-center transition-colors cursor-pointer min-h-[32px] min-w-[32px]"
                      title="Đóng (hoặc vuốt xuống)"
                      aria-label="Đóng"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Thân cuộn Bottom Sheet - Tự động cuộn mượt mà */}
          <div className={`flex-1 overflow-y-auto overscroll-contain touch-pan-y ${bodyClassName}`}>
            {children}
          </div>

          {/* Vùng chân cố định Footer (nếu có) */}
          {footer && (
            <div className="shrink-0 border-t border-[#F5F3EF] bg-white">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};
