/**
 * Tiện ích âm thanh cơ học (Wood-click) & Rung phản hồi (Haptic feedback)
 * Giúp tạo trải nghiệm gõ số xúc giác thỏa mãn (Tactile Hardware Experience)
 */

class SoundEngine {
  private audioCtx: AudioContext | null = null;

  private init() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
  }

  /**
   * Phát âm thanh gõ gỗ mộc (wood-click) nhẹ nhàng
   */
  public playWoodClick(pitchModifier = 1.0) {
    try {
      this.init();
      if (!this.audioCtx) return;

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      // Âm thanh tần số gỗ tự nhiên (320Hz - 480Hz)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(360 * pitchModifier, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.035);

      // Decay nhanh tạo cảm giác gõ phím cơ học
      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.035);
    } catch {
      // Bỏ qua lỗi nếu trình duyệt chặn audio policy
    }
  }

  /**
   * Âm thanh hoàn thành giao dịch (Thành công nhẹ nhàng)
   */
  public playSuccessTone() {
    try {
      this.init();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.16); // G5

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch {
      // Bỏ qua nếu lỗi
    }
  }
}

export const soundEngine = new SoundEngine();

/**
 * Kích hoạt rung haptic nhẹ trên điện thoại di động
 */
export function triggerHaptic(pattern: number | number[] = 12) {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Bỏ qua nếu không hỗ trợ
    }
  }
}
