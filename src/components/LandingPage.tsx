import React from 'react';
import { Home, LogIn, Loader2, ShieldCheck, CreditCard, Calculator, HeartHandshake } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { playActionClick } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';

interface LandingPageProps {
  pendingInviteCode?: string;
}

export const LandingPage: React.FC<LandingPageProps> = ({ pendingInviteCode }) => {
  const { loginWithGoogle, isAuthenticating } = useApp();

  const handleLogin = () => {
    playActionClick();
    triggerHaptic(10);
    loginWithGoogle();
  };

  return (
    <div className="min-h-[100dvh] bg-[#FAF9F6] text-[#1C1917] flex flex-col justify-between">
      {/* Header đơn giản */}
      <header className="w-full border-b border-[#E6E2DA] bg-[#FAF9F6]/90 backdrop-blur-xs pt-safe">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0F3D39] text-[#FAF9F6] flex items-center justify-center shadow-xs">
              <Home className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-[#1C1917] leading-none">
                Tổ Ấm Nhỏ
              </h1>
              <p className="text-[11px] text-[#78716C] mt-0.5">
                Sổ cái tài chính gia đình
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogin}
            disabled={isAuthenticating}
            className="min-h-[40px] px-3.5 py-2 rounded-xl border border-[#E6E2DA] bg-white hover:bg-[#F5F3EF] text-xs font-semibold text-[#1C1917] flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95 disabled:opacity-60"
          >
            {isAuthenticating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0F3D39]" />
            ) : (
              <LogIn className="w-3.5 h-3.5 text-[#0F3D39]" />
            )}
            <span>Đăng nhập</span>
          </button>
        </div>
      </header>

      {/* Nội dung trung tâm */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="max-w-xl w-full space-y-6">
          {/* Thông báo mã mời chờ kết nối (nếu có) */}
          {pendingInviteCode && (
            <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-2xl p-3.5 flex items-center gap-3 shadow-2xs">
              <div className="w-8 h-8 rounded-xl bg-[#059669] text-white flex items-center justify-center shrink-0">
                <HeartHandshake className="w-4 h-4" />
              </div>
              <div className="min-w-0 text-xs">
                <p className="font-bold text-[#065F46]">
                  Lời mời đồng hành tổ ấm ({pendingInviteCode})
                </p>
                <p className="text-[#047857] text-[11px] mt-0.5">
                  Đăng nhập bằng tài khoản Google của bạn để tự động kết nối vào sổ cái gia đình.
                </p>
              </div>
            </div>
          )}

          {/* Hero Card */}
          <div className="bg-white border border-[#E6E2DA] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F5F3EF] border border-[#E6E2DA] text-[11px] font-mono font-semibold text-[#0F3D39]">
              <span>🏡 DÀNH RIÊNG CHO VỢ & CHỒNG</span>
            </div>

            <div className="space-y-2.5">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1C1917] leading-snug">
                Quản lý chi tiêu, sao kê thẻ & mục tiêu chung trong một chạm.
              </h2>
              <p className="text-xs sm:text-sm text-[#78716C] leading-relaxed">
                Ghi chép thu chi tối giản, tự động đối soát chu kỳ sao kê & hoàn tiền (Cashback) thẻ tín dụng, đồng bộ thời gian thực giữa hai vợ chồng.
              </p>
            </div>

            {/* Nút CTA Đăng nhập Google */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleLogin}
                disabled={isAuthenticating}
                className="w-full sm:w-auto min-h-[48px] px-6 py-3.5 rounded-2xl bg-[#0F3D39] hover:bg-[#134E48] text-[#FAF9F6] text-xs sm:text-sm font-bold flex items-center justify-center gap-2.5 transition-all shadow-sm cursor-pointer active:scale-[0.99] disabled:opacity-60"
              >
                {isAuthenticating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang xác thực với Google...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 stroke-[2.2]" />
                    <span>Đăng nhập với Google để bắt đầu</span>
                  </>
                )}
              </button>
              <p className="text-[11px] text-[#A8A29E] mt-2.5 flex items-center justify-center sm:justify-start gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0F3D39]" />
                <span>Dữ liệu được bảo mật và đồng bộ riêng tư trên đám mây của gia đình bạn.</span>
              </p>
            </div>
          </div>

          {/* 3 Điểm nhấn tính năng */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white border border-[#E6E2DA] rounded-2xl p-4 space-y-1.5 shadow-2xs">
              <div className="w-8 h-8 rounded-xl bg-[#E7EFEF] text-[#0F3D39] flex items-center justify-center">
                <Calculator className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-[#1C1917]">Ghi sổ 1-chạm</h3>
              <p className="text-[11px] text-[#78716C] leading-relaxed">
                Bàn phím số xúc giác kèm phím tắt gợi ý giúp nhập khoản thu chi chỉ trong 3 giây.
              </p>
            </div>

            <div className="bg-white border border-[#E6E2DA] rounded-2xl p-4 space-y-1.5 shadow-2xs">
              <div className="w-8 h-8 rounded-xl bg-[#FEF3C7] text-[#B45309] flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-[#1C1917]">Sao kê & Cashback thẻ</h3>
              <p className="text-[11px] text-[#78716C] leading-relaxed">
                Tự động tách kỳ sao kê, quyết toán 1-chạm và khấu trừ tiền hoàn (Cashback) của từng thẻ.
              </p>
            </div>

            <div className="bg-white border border-[#E6E2DA] rounded-2xl p-4 space-y-1.5 shadow-2xs">
              <div className="w-8 h-8 rounded-xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center">
                <HeartHandshake className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-[#1C1917]">Đồng hành Vợ & Chồng</h3>
              <p className="text-[11px] text-[#78716C] leading-relaxed">
                Theo dõi cán cân đóng góp, lộ trình trả nợ và quỹ tích lũy chung theo thời gian thực.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer nhỏ gọn */}
      <footer className="py-4 px-4 text-center text-[11px] text-[#A8A29E] border-t border-[#E6E2DA]/60 pb-safe">
        Tổ Ấm Nhỏ • Sổ cái tài chính gia đình
      </footer>
    </div>
  );
};

