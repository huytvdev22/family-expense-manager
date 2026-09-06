import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { CheckCircle2, AlertCircle, XCircle, Info, X } from 'lucide-react';
import { playActionClick, playSuccessChime } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    if (!message) return;

    // Kích hoạt âm thanh và xúc giác tinh tế
    try {
      if (type === 'success') {
        playSuccessChime();
      } else {
        playActionClick();
      }
      triggerHaptic(10);
    } catch {
      // Bỏ qua nếu browser chưa cấp quyền
    }

    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newToast: ToastItem = { id, message, type };

    setToasts((prev) => [...prev.slice(-2), newToast]); // Giữ tối đa 3 thông báo đồng thời

    // Tự động đóng sau 3.5 giây
    setTimeout(() => {
      removeToast(id);
    }, 3500);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Container hiển thị thông báo Toast cố định phía trên */}
      <div 
        aria-live="polite" 
        className="fixed top-3 sm:top-5 left-1/2 -translate-x-1/2 z-100 max-w-sm sm:max-w-md w-[92%] flex flex-col items-center gap-2 pointer-events-none pt-safe"
      >
        {toasts.map((toast) => {
          let icon = <Info className="w-4 h-4 text-[#0F3D39] shrink-0" />;
          let borderStyle = 'border-[#E6E2DA]';
          let textStyle = 'text-[#1C1917]';
          let bgIconStyle = 'bg-[#FAF9F6]';

          if (toast.type === 'success') {
            icon = <CheckCircle2 className="w-4 h-4 text-[#047857] shrink-0" />;
            borderStyle = 'border-[#10B981]/25';
            textStyle = 'text-[#047857]';
            bgIconStyle = 'bg-[#ECFDF5]';
          } else if (toast.type === 'warning') {
            icon = <AlertCircle className="w-4 h-4 text-[#B45309] shrink-0" />;
            borderStyle = 'border-[#F59E0B]/30';
            textStyle = 'text-[#92400E]';
            bgIconStyle = 'bg-[#FEF3C7]';
          } else if (toast.type === 'error') {
            icon = <XCircle className="w-4 h-4 text-[#C15C3D] shrink-0" />;
            borderStyle = 'border-[#EF4444]/30';
            textStyle = 'text-[#991B1B]';
            bgIconStyle = 'bg-[#FEE2E2]';
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto w-full flex items-center justify-between gap-3 px-3.5 py-2.5 sm:py-3 rounded-2xl bg-white/95 border ${borderStyle} shadow-lg shadow-black/5 backdrop-blur-xs transition-all animate-in fade-in slide-in-from-top-3 duration-200`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-7 h-7 rounded-xl ${bgIconStyle} flex items-center justify-center shrink-0`}>
                  {icon}
                </div>
                <p className={`text-xs font-semibold ${textStyle} leading-snug break-words line-clamp-2`}>
                  {toast.message}
                </p>
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="w-6 h-6 rounded-lg text-[#A8A29E] hover:text-[#1C1917] hover:bg-[#F5F3EF] flex items-center justify-center shrink-0 transition-all cursor-pointer"
                title="Đóng"
                aria-label="Đóng thông báo"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast phải được sử dụng bên trong ToastProvider');
  }
  return context;
};
