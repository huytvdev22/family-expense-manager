import React, { useState } from 'react';
import { 
  Settings, 
  X, 
  Volume2, 
  VolumeX, 
  LogOut, 
  LogIn, 
  GitCommit, 
  Clock, 
  RefreshCw, 
  Sparkles, 
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { playActionClick } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';
import { 
  getCurrentVersionInfo, 
  checkForUpdates, 
  forceClearCacheAndReload,
  type UpdateCheckResult 
} from '../services/versionService';
import { useToast } from './Toast';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    soundEnabled,
    toggleSound,
    firebaseUser,
    isFirebaseActive,
    logout,
    loginWithGoogle,
    isAuthenticating
  } = useApp();
  const { showToast } = useToast();

  const versionInfo = getCurrentVersionInfo();
  const [isCheckingUpdate, setIsCheckingUpdate] = useState<boolean>(false);
  const [updateResult, setUpdateResult] = useState<UpdateCheckResult | null>(null);

  if (!isOpen) return null;

  // Kiểm tra cập nhật thủ công
  const handleCheckUpdate = async () => {
    setIsCheckingUpdate(true);
    setUpdateResult(null);
    playActionClick();
    triggerHaptic(10);

    try {
      const result = await checkForUpdates();
      setUpdateResult(result);
      if (result.hasUpdate) {
        showToast(`Có bản cập nhật mới (#${result.remoteHash})!`, 'info');
      } else {
        showToast('Ứng dụng đang ở phiên bản mới nhất!', 'success');
      }
    } catch (err: any) {
      console.warn('Lỗi kiểm tra cập nhật:', err);
      showToast('Không thể kết nối máy chủ để kiểm tra bản mới', 'warning');
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const handleClearCacheAndReload = async () => {
    playActionClick();
    triggerHaptic(15);
    showToast('Đang làm mới cache ứng dụng...', 'info');
    await forceClearCacheAndReload();
  };

  return (
    <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/55 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-[#FAF9F6] border border-[#E6E2DA] rounded-t-3xl sm:rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in slide-in-from-bottom-3 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="p-4 border-b border-[#E6E2DA] flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0F3D39] text-[#FAF9F6] flex items-center justify-center shadow-xs">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1C1917]">Cài đặt ứng dụng</h3>
              <p className="text-[11px] text-[#78716C]">Trải nghiệm, tài khoản và hệ thống</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl text-[#78716C] hover:text-[#1C1917] hover:bg-[#F5F3EF] flex items-center justify-center transition-colors cursor-pointer"
            title="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Thân Modal */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* =========================================================================
              1. ÂM THANH XÚC GIÁC CƠ HỌC
              ========================================================================= */}
          <div className="bg-white border border-[#E6E2DA] rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                  soundEnabled ? 'bg-[#E7EFEF] text-[#0F3D39]' : 'bg-[#F5F3EF] text-[#A8A29E]'
                }`}>
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#1C1917]">Âm thanh xúc giác cơ học</p>
                  <p className="text-[11px] text-[#78716C] mt-0.5">Tiếng click bàn phím khi ghi sổ</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  toggleSound();
                  triggerHaptic(10);
                }}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0 ${
                  soundEnabled ? 'bg-[#0F3D39]' : 'bg-[#E6E2DA]'
                }`}
                title={soundEnabled ? 'Đang bật âm thanh' : 'Đang tắt âm thanh'}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform shadow-xs ${
                    soundEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* =========================================================================
              2. TÀI KHOẢN NGƯỜI DÙNG & FIREBASE CLOUD SYNC
              ========================================================================= */}
          <div className="bg-white border border-[#E6E2DA] rounded-2xl p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-[#FAF9F6] border border-[#E6E2DA] flex items-center justify-center text-xs font-bold text-[#0F3D39] shrink-0 overflow-hidden shadow-2xs">
                  {firebaseUser?.photoURL ? (
                    <img src={firebaseUser.photoURL} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-semibold text-sm">
                      {firebaseUser?.displayName?.charAt(0) || 'U'}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#1C1917] truncate">
                    {firebaseUser ? (firebaseUser.displayName || 'Huy Trịnh Văn') : 'Chế độ Demo (Nội bộ)'}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] shrink-0" />
                    <span className="text-[10px] font-mono text-[#78716C] font-medium truncate">
                      {isFirebaseActive ? 'Firebase Cloud Sync' : 'Local Storage'}
                    </span>
                  </div>
                </div>
              </div>

              {firebaseUser ? (
                <button
                  type="button"
                  onClick={() => {
                    playActionClick();
                    logout();
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-xl border border-[#FCA5A5]/60 text-xs font-semibold text-[#E11D48] hover:bg-[#FFF1F2] active:scale-95 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Đăng xuất</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    playActionClick();
                    loginWithGoogle();
                  }}
                  disabled={isAuthenticating}
                  className="px-3 py-1.5 rounded-xl bg-[#0F3D39] text-xs font-semibold text-white hover:bg-[#174E4A] active:scale-95 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-70"
                >
                  {isAuthenticating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <LogIn className="w-3.5 h-3.5" />
                  )}
                  <span>Google</span>
                </button>
              )}
            </div>

            {firebaseUser?.email && (
              <div className="pt-2 border-t border-[#F5F3EF] text-[11px] text-[#78716C] truncate font-mono">
                Email: {firebaseUser.email}
              </div>
            )}
          </div>

          {/* =========================================================================
              3. THÔNG TIN PHIÊN BẢN HỆ THỐNG
              ========================================================================= */}
          <div className="bg-white border border-[#E6E2DA] rounded-2xl p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#E7EFEF] text-[#0F3D39] flex items-center justify-center shrink-0">
                  <GitCommit className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs uppercase font-semibold text-[#78716C] tracking-wider">
                    Phiên bản hệ thống
                  </h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs font-bold text-[#1C1917]">
                      v{versionInfo.version}
                    </span>
                    <span className="font-mono text-[10px] font-semibold bg-[#FAF9F6] border border-[#E6E2DA] text-[#0F3D39] px-1.5 py-0.5 rounded-md shadow-2xs">
                      #{versionInfo.commitHash}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center gap-1 text-[10px] text-[#78716C] justify-end">
                  <Clock className="w-3 h-3 text-[#A8A29E]" />
                  <span>Đóng gói:</span>
                </div>
                <p className="font-mono text-[10px] text-[#57534E] font-medium mt-0.5">
                  {versionInfo.formattedBuildTime || versionInfo.buildTime}
                </p>
              </div>
            </div>

            {/* Trạng thái cập nhật nếu vừa kiểm tra */}
            {updateResult && (
              <div
                className={`p-2.5 rounded-xl text-xs flex items-center justify-between gap-2 animate-in fade-in duration-200 ${
                  updateResult.hasUpdate
                    ? 'bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E]'
                    : 'bg-[#F0FDF4] border border-[#DCFCE7] text-[#166534]'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  {updateResult.hasUpdate ? (
                    <Sparkles className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                  )}
                  <span className="truncate">
                    {updateResult.hasUpdate
                      ? `Có bản mới (#${updateResult.remoteHash})!`
                      : 'Ứng dụng đang ở bản mới nhất.'}
                  </span>
                </div>
                {updateResult.hasUpdate && (
                  <button
                    type="button"
                    onClick={handleClearCacheAndReload}
                    className="px-2.5 py-1 rounded-lg bg-[#0F3D39] text-white text-[11px] font-bold shadow-xs shrink-0 cursor-pointer"
                  >
                    Tải lại
                  </button>
                )}
              </div>
            )}

            {/* Nút kiểm tra cập nhật */}
            <button
              type="button"
              onClick={handleCheckUpdate}
              disabled={isCheckingUpdate}
              className="w-full py-2 px-3 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] hover:bg-white text-xs font-semibold text-[#0F3D39] flex items-center justify-center gap-1.5 active:scale-98 transition-all cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCheckingUpdate ? 'animate-spin text-[#0F3D39]' : ''}`} />
              <span>{isCheckingUpdate ? 'Đang kiểm tra...' : 'Kiểm tra bản cập nhật'}</span>
            </button>
          </div>
        </div>

        {/* Footer Modal */}
        <div className="p-3 sm:p-4 bg-white border-t border-[#E6E2DA] flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#0F3D39] text-white text-xs font-bold hover:bg-[#174E4A] transition-colors cursor-pointer text-center"
          >
            Hoàn tất
          </button>
        </div>
      </div>
    </div>
  );
};
