/**
 * TIỆN ÍCH PHẢN HỒI RUNG XÚC GIÁC (HAPTIC FEEDBACK)
 * Tái tạo cảm giác bấm phím cơ học trên thiết bị di động
 */

export function triggerHaptic(duration = 10): void {
  try {
    if (typeof window !== 'undefined' && 'navigator' in window && typeof navigator.vibrate === 'function') {
      navigator.vibrate(duration);
    }
  } catch {
    // Graceful degradation nếu bị hạn chế quyền hoặc không hỗ trợ
  }
}
