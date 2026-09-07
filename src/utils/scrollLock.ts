import { useEffect } from 'react';

/**
 * Quản lý trạng thái khóa cuộn (Body Scroll Lock) tối ưu hóa cho iOS WebKit & PWA.
 * 
 * Vấn đề trên iOS Safari/PWA:
 * Đặt `overflow: hidden` trên body không ngăn chặn được thao tác touch-drag cuộn trang
 * và hiện tượng scroll chaining truyền lực vuốt ra layer nền phía sau.
 * 
 * Giải pháp:
 * Sử dụng kỹ thuật `position: fixed` + lưu tọa độ `scrollY` khi khóa,
 * kết hợp cơ chế Reference Counting (đếm số modal đang mở) để phục hồi chính xác
 * vị trí ban đầu của trang khi tất cả modal đã đóng.
 */

let lockCount = 0;
let savedScrollY = 0;
let originalStyles: {
  position: string;
  top: string;
  left: string;
  right: string;
  width: string;
  overflow: string;
} | null = null;

export function lockBodyScroll(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  lockCount++;
  if (lockCount === 1) {
    savedScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;

    originalStyles = {
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      right: document.body.style.right,
      width: document.body.style.width,
      overflow: document.body.style.overflow,
    };

    document.body.style.position = 'fixed';
    document.body.style.top = `-${savedScrollY}px`;
    document.body.style.left = '0px';
    document.body.style.right = '0px';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
  }
}

export function unlockBodyScroll(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    const scrollY = savedScrollY;

    if (originalStyles) {
      document.body.style.position = originalStyles.position;
      document.body.style.top = originalStyles.top;
      document.body.style.left = originalStyles.left;
      document.body.style.right = originalStyles.right;
      document.body.style.width = originalStyles.width;
      document.body.style.overflow = originalStyles.overflow;
      originalStyles = null;
    } else {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
    }

    // Khôi phục vị trí cuộn ban đầu mượt mà, tức thì
    window.scrollTo({
      top: scrollY,
      left: 0,
      behavior: 'instant' as ScrollBehavior,
    });
  }
}

/**
 * React Hook tự động khóa cuộn nền khi isLocked = true và mở khóa khi false hoặc unmount.
 * 
 * @param isLocked Trạng thái modal/bottom sheet đang mở hay đóng
 */
export function useBodyScrollLock(isLocked: boolean): void {
  useEffect(() => {
    if (!isLocked) return;

    lockBodyScroll();

    return () => {
      unlockBodyScroll();
    };
  }, [isLocked]);
}
