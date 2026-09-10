import { useState, useRef, useCallback, useEffect } from 'react';
import { triggerHaptic } from './haptics';

interface UseSwipeDownDismissOptions {
  isOpen: boolean;
  onClose: () => void;
  threshold?: number; // Khoảng cách kéo tối thiểu để kích hoạt đóng (mặc định 75px)
}

export function useSwipeDownDismiss({ isOpen, onClose, threshold = 75 }: UseSwipeDownDismissOptions) {
  // Trạng thái còn trong DOM hay không (để đợi hiệu ứng trượt xuống đáy hoàn tất trước khi gỡ khỏi DOM)
  const [isRendered, setIsRendered] = useState<boolean>(isOpen);
  // Trạng thái visual hiển thị (để kích hoạt transition CSS mượt mà)
  const [isVisible, setIsVisible] = useState<boolean>(false);

  const [dragY, setDragY] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const startYRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const isClosingRef = useRef<boolean>(false);

  // Quản lý Hiệu ứng Mở (Entrance) & Đóng (Exit)
  useEffect(() => {
    if (isOpen) {
      isClosingRef.current = false;
      setIsRendered(true);
      setDragY(0);
      // Đợi DOM render frame đầu ở vị trí ngoài màn hình (translateY 100%), sau đó mới trượt lên 0%
      const rafId = requestAnimationFrame(() => {
        setIsVisible(true);
      });
      return () => cancelAnimationFrame(rafId);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setIsRendered(false);
      }, 260);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Hàm kích hoạt đóng với hiệu ứng trượt xuống đáy rồi mới gọi callback
  const triggerClose = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    setIsVisible(false);
    setDragY(0);
    setTimeout(() => {
      onClose();
      setIsRendered(false);
      isClosingRef.current = false;
    }, 260);
  }, [onClose]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1 || isClosingRef.current) return;
    startYRef.current = e.touches[0].clientY;
    startTimeRef.current = Date.now();
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging || isClosingRef.current) return;
      const currentY = e.touches[0].clientY;
      const deltaY = currentY - startYRef.current;

      if (deltaY > 0) {
        // Kéo xuống: tấm sheet bám sát theo ngón tay
        setDragY(deltaY);
      } else {
        // Kéo ngược lên trên: lực cản cao su
        setDragY(deltaY * 0.15);
      }
    },
    [isDragging]
  );

  const handleTouchEnd = useCallback(() => {
    if (!isDragging || isClosingRef.current) return;
    setIsDragging(false);

    const elapsed = Math.max(1, Date.now() - startTimeRef.current);
    const velocity = dragY / elapsed; // Vận tốc vuốt (px/ms)

    // Nếu khoảng cách kéo > ngưỡng HOẶC vuốt nhanh dứt khoát
    if (dragY > threshold || (velocity > 0.45 && dragY > 20)) {
      triggerHaptic(8);
      triggerClose();
    } else {
      // Đàn hồi (snap back) trở lại vị trí 0
      setDragY(0);
    }
  }, [isDragging, dragY, threshold, triggerClose]);

  // CSS Style cho tấm Bottom Sheet
  const sheetStyle: React.CSSProperties = {
    transform: !isVisible
      ? 'translateY(100%)'
      : dragY !== 0
      ? `translateY(${dragY}px)`
      : 'translateY(0)',
    transition: isDragging
      ? 'none'
      : isVisible
      ? 'transform 320ms cubic-bezier(0.16, 1, 0.3, 1), max-height 250ms ease-out'
      : 'transform 260ms cubic-bezier(0.4, 0, 1, 1)'
  };

  // CSS Style cho lớp nền Backdrop (KHÔNG đổi opacity khi kéo ngón tay - giữ vững độ tối!)
  const backdropStyle: React.CSSProperties = {
    opacity: isVisible ? 1 : 0,
    transition: 'opacity 250ms ease-out'
  };

  return {
    isRendered,
    isVisible,
    isDragging,
    triggerClose,
    swipeHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd
    },
    sheetStyle,
    backdropStyle
  };
}
