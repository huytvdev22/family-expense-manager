/**
 * ĐỘNG CƠ ÂM THANH XÚC GIÁC (WEB AUDIO API SYNTHESIZER)
 * Mô phỏng phản hồi cơ học (mechanical click / wood-click) của máy tính tiền cơ và bàn phím Braun
 * Tuân thủ triết lý DESIGN.md & AGENTS.md: Native Browser APIs, Graceful Degradation
 */

let audioCtx: AudioContext | null = null;
const SOUND_STORAGE_KEY = 'toamnho_sound_enabled';

// Kiểm tra trạng thái bật/tắt âm thanh
export function isSoundEnabled(): boolean {
  try {
    const saved = localStorage.getItem(SOUND_STORAGE_KEY);
    return saved === null ? true : saved === 'true';
  } catch {
    return true;
  }
}

// Bật/tắt âm thanh
export function setSoundEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(SOUND_STORAGE_KEY, String(enabled));
  } catch {
    // Fail silently
  }
}

// Khởi tạo hoặc khôi phục AudioContext khi có tương tác người dùng
function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Âm gõ cơ học nhẹ (Mechanical Wood-Click)
 * Dành cho các phím số 0-9 trên Numpad
 */
export function playKeyClick(): void {
  if (!isSoundEnabled()) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Sóng triangle kết hợp sine tạo chất âm mộc mạc như gõ gỗ
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.035);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  } catch {
    // Graceful degradation
  }
}

/**
 * Âm chọn hành động (Action Snap)
 * Dành cho việc chọn Quick Tag, đổi người chi Vợ/Chồng
 */
export function playActionClick(): void {
  if (!isSoundEnabled()) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.045);

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  } catch {
    // Graceful degradation
  }
}

/**
 * Hợp âm chốt sổ nhẹ nhàng (Soft Harmonic Chime)
 * Phát khi hoàn tất lưu 1 khoản chi tiêu
 */
export function playSuccessChime(): void {
  if (!isSoundEnabled()) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    // Chuỗi nốt ngũ cung ấm áp: C5 (523Hz), E5 (659Hz)
    const freqs = [523.25, 659.25];

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(0.08, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.2);
    });
  } catch {
    // Graceful degradation
  }
}
