import React, { useState, useEffect } from 'react';
import { RefreshCw, Sparkles, X } from 'lucide-react';
import {
  checkForUpdates,
  forceClearCacheAndReload,
  type UpdateCheckResult
} from '../services/versionService';
import { playActionClick } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';

export const UpdateNotification: React.FC = () => {
  const [updateInfo, setUpdateInfo] = useState<UpdateCheckResult | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const performCheck = async () => {
      try {
        const result = await checkForUpdates();
        if (result.hasUpdate) {
          setUpdateInfo(result);
        }
      } catch (err) {
        // Yên lặng bỏ qua lỗi mạng nền
      }
    };

    // Kiểm tra sau khi ứng dụng nạp xong 3 giây
    timer = setTimeout(performCheck, 3000);

    // Tự động kiểm tra lại khi người dùng quay lại tab trình duyệt
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        performCheck();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  if (!updateInfo?.hasUpdate || isDismissed) {
    return null;
  }

  const handleUpdateNow = async () => {
    playActionClick();
    triggerHaptic(20);
    setIsUpdating(true);
    await forceClearCacheAndReload();
  };

  return (
    <aside
      aria-label="Thông báo bản cập nhật mới"
      className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 left-4 sm:left-auto sm:max-w-md z-50 animate-in slide-in-from-bottom-5 duration-300"
    >
      <div className="bg-[#0F3D39] text-white border border-[#165650] rounded-2xl p-3.5 shadow-2xl flex items-center gap-3 backdrop-blur-md">
        <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-[#FBBF24] animate-pulse" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-bold text-white tracking-tight">
              Đã có bản cập nhật mới
            </p>
            <span className="text-[10px] font-mono bg-white/20 px-1.5 py-0.5 rounded text-white/90">
              #{updateInfo.remoteHash}
            </span>
          </div>
          <p className="text-[11px] text-white/80 truncate mt-0.5">
            {updateInfo.remoteFormattedBuildTime 
              ? `Đóng gói: ${updateInfo.remoteFormattedBuildTime}` 
              : 'Làm mới để trải nghiệm các tính năng vừa cập nhật'}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleUpdateNow}
            disabled={isUpdating}
            className="px-3 py-1.5 rounded-xl bg-white text-[#0F3D39] hover:bg-[#FAF9F6] active:scale-95 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all tactile-btn cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
            <span>{isUpdating ? 'Đang cập nhật...' : 'Cập nhật ngay'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playActionClick();
              setIsDismissed(true);
            }}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            title="Bỏ qua"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
