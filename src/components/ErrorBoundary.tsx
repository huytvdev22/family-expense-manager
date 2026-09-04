import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Lỗi giao diện (ErrorBoundary caught):', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF9F6] text-[#1C1917] flex items-center justify-center p-4">
          <div className="bg-white border border-[#E6E2DA] rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-lg space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF1F2] text-[#E11D48] flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1C1917]">
                Đã xảy ra gián đoạn giao diện
              </h3>
              <p className="text-xs text-[#78716C] mt-1 leading-relaxed">
                Ứng dụng vừa gặp một lỗi hiển thị nhỏ. Đừng lo lắng, dữ liệu thu chi của bạn vẫn được lưu trữ an toàn trên hệ thống.
              </p>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 rounded-2xl bg-[#0F3D39] text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#174E4A] transition-all cursor-pointer shadow-xs"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Tải lại trang ngay</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
