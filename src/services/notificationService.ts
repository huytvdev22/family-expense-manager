/**
 * Dịch vụ Quản lý Thông báo (Web Push & Local Notifications) cho PWA Tổ Ấm Nhỏ
 * Tương thích trên cả iOS 16.4+ (Standalone PWA) và Android / Desktop
 */

import { getFirebaseMessaging } from './firebase';
import { triggerHaptic } from '../utils/haptics';

const STORAGE_KEY_NOTIFICATION_ENABLED = 'harmony_push_notification_enabled';
const STORAGE_KEY_DAILY_REMINDER = 'harmony_daily_reminder_enabled';
const STORAGE_KEY_FCM_TOKEN = 'harmony_fcm_token';

/**
 * Kiểm tra xem trình duyệt có hỗ trợ Notification API và Service Worker hay không
 */
export function isNotificationSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'Notification' in window && 'serviceWorker' in navigator;
}

/**
 * Kiểm tra xem thiết bị có phải iPhone / iPad hay không
 */
export function isIOSDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

/**
 * Kiểm tra ứng dụng có đang chạy ở chế độ PWA Standalone (Đã thêm vào màn hình chính) hay không
 */
export function isStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

/**
 * Lấy trạng thái cấp quyền thông báo hiện tại
 */
export function getNotificationPermissionState(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Yêu cầu cấp quyền nhận thông báo từ người dùng
 */
export async function requestNotificationPermission(): Promise<{
  granted: boolean;
  token: string | null;
  error?: string;
}> {
  if (!isNotificationSupported()) {
    return {
      granted: false,
      token: null,
      error: 'Trình duyệt này không hỗ trợ nhận thông báo đẩy.'
    };
  }

  // Trên iOS, Web Push bắt buộc phải được kích hoạt từ PWA Standalone
  if (isIOSDevice() && !isStandaloneMode()) {
    return {
      granted: false,
      token: null,
      error: 'Trên iPhone, vui lòng Thêm app vào Màn hình chính (Share -> Thêm vào MH chính) để bật thông báo.'
    };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return {
        granted: false,
        token: null,
        error: 'Quyền nhận thông báo đã bị từ chối hoặc bỏ qua.'
      };
    }

    localStorage.setItem(STORAGE_KEY_NOTIFICATION_ENABLED, 'true');
    triggerHaptic(15);

    // Lấy token FCM nếu có cấu hình VAPID Key
    let fcmToken: string | null = null;
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

    try {
      const messaging = await getFirebaseMessaging();
      if (messaging && vapidKey) {
        // Đảm bảo Service Worker được đăng ký
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        const { getToken } = await import('firebase/messaging');
        fcmToken = await getToken(messaging, {
          vapidKey,
          serviceWorkerRegistration: registration
        });

        if (fcmToken) {
          localStorage.setItem(STORAGE_KEY_FCM_TOKEN, fcmToken);
        }
      }
    } catch (tokenErr) {
      console.warn('Không thể lấy FCM Token (có thể do chưa cấu hình VAPID Key):', tokenErr);
    }

    return { granted: true, token: fcmToken };
  } catch (err: any) {
    console.error('Lỗi khi xin quyền thông báo:', err);
    return {
      granted: false,
      token: null,
      error: err?.message || 'Có lỗi xảy ra khi xin quyền thông báo'
    };
  }
}

/**
 * Hiển thị thông báo nội bộ (Local Notification)
 */
export async function sendLocalNotification(
  title: string,
  options?: NotificationOptions & { url?: string }
): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  if (Notification.permission !== 'granted') return false;

  const defaultOptions: NotificationOptions = {
    icon: '/vite.svg',
    badge: '/vite.svg',
    data: { url: options?.url || '/' },
    ...options
  };

  try {
    triggerHaptic(20);

    // Ưu tiên hiển thị qua Service Worker registration để đồng bộ với PWA
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration && 'showNotification' in registration) {
        await registration.showNotification(title, defaultOptions);
        return true;
      }
    }

    // Fallback nếu Service Worker chưa sẵn sàng
    new Notification(title, defaultOptions);
    return true;
  } catch (err) {
    console.warn('Không thể gửi thông báo cục bộ:', err);
    return false;
  }
}

/**
 * Gửi thông báo thử nghiệm để người dùng kiểm tra máy có nhận thông báo và rung không
 */
export async function sendTestNotification(): Promise<boolean> {
  return sendLocalNotification('🔔 Kiểm tra thông báo Tổ Ấm Nhỏ', {
    body: 'Tuyệt vời! Thiết bị của bạn đã sẵn sàng nhận thông báo chi tiêu gia đình.',
    tag: 'test-notification'
  });
}

/**
 * Lưu trạng thái bật/tắt nhắc nhở ghi chép hàng ngày
 */
export function setDailyReminderEnabled(enabled: boolean): void {
  localStorage.setItem(STORAGE_KEY_DAILY_REMINDER, enabled ? 'true' : 'false');
}

/**
 * Kiểm tra trạng thái nhắc nhở hàng ngày
 */
export function isDailyReminderEnabled(): boolean {
  return localStorage.getItem(STORAGE_KEY_DAILY_REMINDER) === 'true';
}

/**
 * Kiểm tra và kích hoạt nhắc nhở ghi chép nếu đến buổi tối (sau 20:30) mà hôm nay chưa ghi chép
 */
export function checkAndTriggerDailyReminder(hasTransactionsToday: boolean): void {
  if (!isDailyReminderEnabled()) return;
  if (getNotificationPermissionState() !== 'granted') return;

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Chỉ nhắc sau 20:30 tối
  if (currentHour > 20 || (currentHour === 20 && currentMinute >= 30)) {
    const todayStr = now.toISOString().slice(0, 10);
    const lastReminderDate = localStorage.getItem('harmony_last_reminder_date');

    if (lastReminderDate !== todayStr && !hasTransactionsToday) {
      sendLocalNotification('🌙 Nhắc nhở buổi tối từ Tổ Ấm Nhỏ', {
        body: 'Hôm nay gia đình mình có khoản chi nào chưa ghi chép lại không bạn ơi?',
        tag: 'daily-reminder'
      });
      localStorage.setItem('harmony_last_reminder_date', todayStr);
    }
  }
}
