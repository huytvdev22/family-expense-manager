import React, { useState, useEffect } from 'react';
import { RefreshCw, X } from 'lucide-react';
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
      className="fixed bottom-[calc(3.75rem+env(safe-area-inset-bottom,16px)+12px)] sm:bottom-6 right-4 sm:right-6 left-4 sm:left-auto sm:w-[380px] z-50 pointer-events-none animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div className="pointer-events-auto bg-white/95 backdrop-blur-md border border-[#E6E2DA] rounded-2xl p-4 shadow-xl shadow-stone-900/10 flex flex-col gap-3.5">
        {/* TẦNG 1: THÔNG TIN BẢN CẬP NHẬT & NÚT ĐÓNG */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            {/* Icon chỉ báo cập nhật cơ học theo chuẩn Design Tokens */}
            <div className="w-10 h-10 rounded-xl bg-[#E7EFEF] text-[#0F3D39] border border-[#0F3D39]/10 flex items-center justify-center shrink-0 mt-0.5">
              <RefreshCw className={`w-5 h-5 stroke-[2] ${isUpdating ? 'animate-spin' : ''}`} />
            </div>

            {/* Nội dung thông báo: Tiêu đề rõ nét, không bị ngắt dòng hẹp */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-bold text-[#1C1917] tracking-tight">
                  Đã có bản cập nhật mới
                </h4>
                {updateInfo.remoteHash && (
                  <span className="text-[10px] font-mono font-medium bg-[#F5F3EF] border border-[#E6E2DA] text-[#78716C] px-1.5 py-0.5 rounded">
                    #{updateInfo.remoteHash}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#78716C] mt-1 truncate">
                {updateInfo.remoteFormattedBuildTime 
                  ? `Đóng gói: ${updateInfo.remoteFormattedBuildTime}` 
                  : 'Nâng cấp để trải nghiệm các tính năng & bản vá mới'}
              </p>
            </div>
          </div>

          {/* Nút Đóng (X) góc phải với Tap Target chuẩn tối thiểu cho iOS */}
          <button
            type="button"
            onClick={() => {
              playActionClick();
              triggerHaptic(10);
              setIsDismissed(true);
            }}
            className="w-9 h-9 -mr-1 -mt-1 rounded-xl text-[#78716C] hover:text-[#1C1917] hover:bg-[#F5F3EF] active:bg-[#EFECE6] flex items-center justify-center shrink-0 transition-colors cursor-pointer"
            title="Bỏ qua thông báo"
            aria-label="Đóng thông báo"
          >
            <X className="w-4 h-4 stroke-[2]" />
          </button>
        </div>

        {/* TẦNG 2: NÚT THAO TÁC 1 TAY (THUMB ZONE CHO MOBILE) */}
        <div className="flex items-center gap-2 pt-1 border-t border-[#F5F3EF]">
          {/* Nút phụ: Để sau */}
          <button
            type="button"
            onClick={() => {
              playActionClick();
              triggerHaptic(10);
              setIsDismissed(true);
            }}
            disabled={isUpdating}
            className="h-10 px-3.5 rounded-xl bg-[#F5F3EF] hover:bg-[#EFECE6] active:scale-[0.98] text-[#78716C] hover:text-[#1C1917] text-xs font-semibold transition-all tactile-btn cursor-pointer disabled:opacity-50"
          >
            Để sau
          </button>

          {/* Nút chính: Cập nhật ngay */}
          <button
            type="button"
            onClick={handleUpdateNow}
            disabled={isUpdating}
            className="flex-1 h-10 px-4 rounded-xl bg-[#0F3D39] hover:bg-[#174E4A] active:scale-[0.98] text-[#FAF9F6] text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all tactile-btn cursor-pointer disabled:opacity-75"
          >
            <RefreshCw className={`w-3.5 h-3.5 stroke-[2.5] ${isUpdating ? 'animate-spin' : ''}`} />
            <span>{isUpdating ? 'Đang làm mới...' : 'Cập nhật ngay'}</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
