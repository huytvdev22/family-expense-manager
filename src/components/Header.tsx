import React, { useState } from 'react';
import { 
  Volume2, 
  VolumeX, 
  UserPlus, 
  LogIn, 
  LogOut, 
  Home, 
  Target,
  MailOpen,
  Loader2,
  Receipt,
  BarChart3,
  Heart,
  Settings
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { playActionClick } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';

import type { MobileTab } from './BottomNav';

export type DesktopView = 'ledger' | 'dashboard' | 'goals' | 'family';

interface HeaderProps {
  onOpenInvite: () => void;
  onOpenMonthlyLetter: () => void;
  onOpenSettings?: () => void;
  desktopView?: DesktopView;
  onChangeDesktopView?: (view: DesktopView) => void;
  currentMobileTab?: MobileTab;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenInvite,
  onOpenMonthlyLetter,
  onOpenSettings,
  desktopView = 'ledger',
  onChangeDesktopView
}) => {
  const {
    activeHousehold,
    soundEnabled,
    toggleSound,
    firebaseUser,
    isAuthenticating,
    loginWithGoogle,
    logout,
    isFirebaseActive
  } = useApp();

  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-[#FAF9F6] border-b border-[#E6E2DA] pt-safe pb-2.5 sm:pb-3 px-3 sm:px-4 isolate">
      <div className="max-w-5xl mx-auto">
        {/* Hàng 1: [Logo & Tên] (trái) - [Bộ chọn tháng] (giữa trên Desktop) - [Cụm hành động & Google] (phải) */}
        <div className="flex items-center justify-between gap-2">
          {/* Logo & Tên Tổ Ấm */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#0F3D39] text-[#FAF9F6] flex items-center justify-center shadow-xs shrink-0">
              <Home className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm sm:text-base font-semibold tracking-tight text-[#1C1917] leading-none whitespace-nowrap">
                  Tổ Ấm Nhỏ
                </h1>
                {activeHousehold?.name && activeHousehold.name !== 'Tổ Ấm Nhỏ' && (
                  <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded-full bg-[#E7EFEF] text-[#0F3D39] font-medium truncate max-w-[90px] sm:max-w-[120px]">
                    {activeHousehold.name}
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-[#78716C] mt-0.5 font-normal truncate hidden sm:block">
                Sổ cái tài chính đồng hành
              </p>
            </div>
          </div>

          {/* Cụm trung tâm Desktop: Bộ chuyển chế độ xem 4 tab [Sổ cái | Tổng quan | Danh mục | Tổ ấm] */}
          <div className="hidden sm:flex items-center shrink-0">
            {/* Chuyển đổi 4 chế độ xem trên Desktop: Sổ cái / Tổng quan / Danh mục / Tổ ấm */}
            {onChangeDesktopView && (
              <div className="flex items-center bg-[#F5F3EF] border border-[#E6E2DA] rounded-full p-1 shadow-2xs shrink-0">
                <button
                  onClick={() => {
                    playActionClick();
                    triggerHaptic(10);
                    onChangeDesktopView('ledger');
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all tactile-btn ${
                    desktopView === 'ledger'
                      ? 'bg-white text-[#0F3D39] shadow-2xs font-bold'
                      : 'text-[#78716C] hover:text-[#1C1917]'
                  }`}
                  title="Xem sổ cái chi tiết"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Sổ cái</span>
                </button>
                <button
                  onClick={() => {
                    playActionClick();
                    triggerHaptic(10);
                    onChangeDesktopView('dashboard');
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all tactile-btn ${
                    desktopView === 'dashboard'
                      ? 'bg-white text-[#0F3D39] shadow-2xs font-bold'
                      : 'text-[#78716C] hover:text-[#1C1917]'
                  }`}
                  title="Xem bảng phân tích tổng quan"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Tổng quan</span>
                </button>
                <button
                  onClick={() => {
                    playActionClick();
                    triggerHaptic(10);
                    onChangeDesktopView('goals');
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all tactile-btn ${
                    desktopView === 'goals'
                      ? 'bg-white text-[#0F3D39] shadow-2xs font-bold'
                      : 'text-[#78716C] hover:text-[#1C1917]'
                  }`}
                  title="Tự do tài chính & mục tiêu"
                >
                  <Target className="w-3.5 h-3.5" />
                  <span>Tự do TC</span>
                </button>
                <button
                  onClick={() => {
                    playActionClick();
                    triggerHaptic(10);
                    onChangeDesktopView('family');
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all tactile-btn ${
                    desktopView === 'family'
                      ? 'bg-white text-[#0F3D39] shadow-2xs font-bold'
                      : 'text-[#78716C] hover:text-[#1C1917]'
                  }`}
                  title="Trung tâm tổ ấm & cài đặt"
                >
                  <Heart className={`w-3.5 h-3.5 ${desktopView === 'family' ? 'fill-current text-[#0F3D39]' : ''}`} />
                  <span>Tổ ấm</span>
                </button>
              </div>
            )}
          </div>

          {/* Cụm công cụ bên phải */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Nút Bức thư tháng */}
            <button
              onClick={() => {
                playActionClick();
                triggerHaptic(10);
                onOpenMonthlyLetter();
              }}
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl border border-[#E6E2DA] bg-white text-[#B45309] hover:bg-[#FEF3C7]/40 active:scale-95 transition-all tactile-btn shadow-2xs shrink-0"
              title="Bức thư tháng tổng kết"
              aria-label="Bức thư tháng"
            >
              <MailOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* Nút Mời thành viên */}
            <button
              onClick={() => {
                playActionClick();
                triggerHaptic(10);
                onOpenInvite();
              }}
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl border border-[#E6E2DA] bg-white text-[#0F3D39] hover:bg-[#E7EFEF] active:scale-95 transition-all tactile-btn shadow-2xs shrink-0"
              title="Mời thành viên gia nhập tổ ấm"
              aria-label="Mời thành viên"
            >
              <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* Nút bật tắt âm thanh */}
            <button
              onClick={toggleSound}
              className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl border transition-all tactile-btn shadow-2xs shrink-0 ${
                soundEnabled 
                  ? 'border-[#0F3D39]/30 bg-[#E7EFEF] text-[#0F3D39]' 
                  : 'border-[#E6E2DA] bg-white text-[#A8A29E]'
              }`}
              title={soundEnabled ? 'Âm thanh gõ gỗ: Đang bật' : 'Âm thanh: Đang tắt'}
              aria-label="Bật tắt âm thanh"
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </button>

            {/* Tài khoản Google & Menu */}
            <div className="relative shrink-0">
              {firebaseUser ? (
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden border border-[#0F3D39]/30 active:scale-95 transition-all shadow-2xs shrink-0"
                >
                  {firebaseUser.photoURL ? (
                    <img src={firebaseUser.photoURL} alt={firebaseUser.displayName || 'Avatar'} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[#0F3D39] text-white flex items-center justify-center text-xs font-semibold">
                      {firebaseUser.displayName?.charAt(0) || 'U'}
                    </div>
                  )}
                </button>
              ) : (
                <button
                  onClick={loginWithGoogle}
                  disabled={isAuthenticating}
                  className={`h-8 sm:h-9 px-2 sm:px-2.5 rounded-xl border border-[#0F3D39] bg-[#0F3D39] text-[#FAF9F6] text-xs font-medium flex items-center gap-1 sm:gap-1.5 transition-all shadow-xs tactile-btn shrink-0 ${
                    isAuthenticating ? 'opacity-70 cursor-wait' : 'active:scale-95'
                  }`}
                  title={isFirebaseActive ? (isAuthenticating ? "Đang kết nối Google..." : "Đăng nhập với Google") : "Chế độ Demo"}
                >
                  {isAuthenticating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <LogIn className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {isAuthenticating ? 'Đang vào...' : 'Google'}
                  </span>
                </button>
              )}

              {/* Dropdown Menu người dùng */}
              {showUserMenu && firebaseUser && (
                <div 
                  className="absolute right-0 mt-2 w-56 bg-white border border-[#E6E2DA] rounded-2xl shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  onClick={() => setShowUserMenu(false)}
                >
                  <div className="px-3 py-2 border-b border-[#F5F3EF]">
                    <p className="text-xs font-semibold text-[#1C1917] truncate">{firebaseUser.displayName}</p>
                    <p className="text-[11px] text-[#78716C] truncate font-mono">{firebaseUser.email}</p>
                  </div>

                  {/* Nút mở Cài đặt ứng dụng */}
                  <button
                    type="button"
                    onClick={() => {
                      playActionClick();
                      triggerHaptic(10);
                      onOpenSettings?.();
                    }}
                    className="w-full mt-1 px-3 py-2 text-left text-xs text-[#1C1917] hover:bg-[#F5F3EF] rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 text-[#0F3D39]" />
                    <span className="font-medium">Cài đặt ứng dụng</span>
                  </button>

                  <button
                    type="button"
                    onClick={logout}
                    className="w-full mt-0.5 px-3 py-2 text-left text-xs text-[#E11D48] hover:bg-[#FFF1F2] rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
