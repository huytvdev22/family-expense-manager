import { useState, useRef, useCallback } from 'react';
import { triggerHaptic } from './haptics';

interface UseSwipeDownDismissOptions {
  onClose: () => void;
  threshold?: number; // Khoảng cách kéo tối thiểu để kích hoạt đóng (mặc định 75px)
}

export function useSwipeDownDismiss({ onClose, threshold = 75 }: UseSwipeDownDismissOptions) {
  const [dragY, setDragY] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isClosing, setIsClosing] = useState<boolean>(false);

  const startYRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    startYRef.current = e.touches[0].clientY;
    startTimeRef.current = Date.now();
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging) return;
      const currentY = e.touches[0].clientY;
      const deltaY = currentY - startYRef.current;

      if (deltaY > 0) {
        // Kéo xuống: tấm sheet di chuyển theo ngón tay
        setDragY(deltaY);
      } else {
        // Kéo ngược lên trên: áp dụng lực cản cao su (rubber band resistance)
        setDragY(deltaY * 0.15);
      }
    },
    [isDragging]
  );

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    const elapsed = Math.max(1, Date.now() - startTimeRef.current);
    const velocity = dragY / elapsed; // Vận tốc vuốt (px/ms)

    // Nếu khoảng cách kéo > ngưỡng HOẶC vuốt nhanh dứt khoát (velocity > 0.4)
    if (dragY > threshold || (velocity > 0.4 && dragY > 25)) {
      setIsClosing(true);
      triggerHaptic(8);
      // Đợi hiệu ứng trượt xuống đáy hoàn tất trước khi gọi callback đóng
      setTimeout(() => {
        onClose();
        setIsClosing(false);
        setDragY(0);
      }, 220);
    } else {
      // Đàn hồi (snap back) trở lại vị trí cũ êm ái
      setDragY(0);
    }
  }, [isDragging, dragY, threshold, onClose]);

  // CSS Style cho tấm Bottom Sheet
  const sheetStyle: React.CSSProperties = {
    transform: isClosing
      ? 'translateY(100%)'
      : dragY > 0
      ? `translateY(${dragY}px)`
      : dragY < 0
      ? `translateY(${dragY}px)`
      : 'translateY(0)',
    transition: isDragging
      ? 'none'
      : 'transform 220ms cubic-bezier(0.32, 0.72, 0, 1), max-height 250ms ease-out',
    touchAction: 'none'
  };

  // CSS Style cho lớp nền Backdrop (mờ dần khi kéo xuống)
  const backdropStyle: React.CSSProperties = {
    opacity: isClosing ? 0 : Math.max(0.15, 1 - dragY / 320),
    transition: isDragging ? 'none' : 'opacity 220ms ease-out'
  };

  return {
    isDragging,
    dragY,
    isClosing,
    swipeHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd
    },
    sheetStyle,
    backdropStyle
  };
}
