import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Volume2, 
  VolumeX, 
  UserPlus, 
  LogIn, 
  LogOut, 
  Home, 
  FolderTree,
  MailOpen,
  Loader2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatYearMonthLabel } from '../utils/currency';
import { playActionClick } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';

interface HeaderProps {
  onOpenInvite: () => void;
  onOpenCategories: () => void;
  onOpenMonthlyLetter: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenInvite,
  onOpenCategories,
  onOpenMonthlyLetter
}) => {
  const {
    activeHousehold,
    currentYearMonth,
    goToPreviousMonth,
    goToNextMonth,
    soundEnabled,
    toggleSound,
    firebaseUser,
    isAuthenticating,
    loginWithGoogle,
    logout,
    isFirebaseActive
  } = useApp();

  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleMonthNav = (action: () => void) => {
    playActionClick();
    triggerHaptic(10);
    action();
  };

  return (
    <header className="sticky top-0 z-30 bg-[#FAF9F6]/95 backdrop-blur-md border-b border-[#E6E2DA] pt-safe px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
        {/* Logo & Tên Tổ Ấm */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#0F3D39] text-[#FAF9F6] flex items-center justify-center shadow-xs">
            <Home className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-semibold tracking-tight text-[#1C1917] leading-none">
                Tổ Ấm Nhỏ
              </h1>
              <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded-full bg-[#E7EFEF] text-[#0F3D39] font-medium">
                {activeHousehold?.name || 'Gia đình'}
              </span>
            </div>
            <p className="text-xs text-[#78716C] mt-0.5 font-normal">
              Sổ cái tài chính đồng hành
            </p>
          </div>
        </div>

        {/* Bộ chuyển đổi Tháng trung tâm */}
        <div className="flex items-center bg-[#F5F3EF] border border-[#E6E2DA] rounded-xl p-0.5 shadow-2xs">
          <button
            onClick={() => handleMonthNav(goToPreviousMonth)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#78716C] hover:text-[#1C1917] hover:bg-white/80 active:scale-95 transition-all tactile-btn"
            title="Tháng trước"
            aria-label="Tháng trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <span className="text-xs font-semibold px-2 text-[#1C1917] font-mono tracking-tight select-none min-w-[96px] text-center">
            {formatYearMonthLabel(currentYearMonth)}
          </span>

          <button
            onClick={() => handleMonthNav(goToNextMonth)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#78716C] hover:text-[#1C1917] hover:bg-white/80 active:scale-95 transition-all tactile-btn"
            title="Tháng sau"
            aria-label="Tháng sau"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Cụm công cụ bên phải */}
        <div className="flex items-center gap-1.5">
          {/* Nút Bức thư tháng */}
          <button
            onClick={() => {
              playActionClick();
              triggerHaptic(10);
              onOpenMonthlyLetter();
            }}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-[#E6E2DA] bg-white text-[#B45309] hover:bg-[#FEF3C7]/40 active:scale-95 transition-all tactile-btn shadow-2xs"
            title="Bức thư tháng tổng kết"
            aria-label="Bức thư tháng"
          >
            <MailOpen className="w-4 h-4" />
          </button>

          {/* Nút Quản lý danh mục */}
          <button
            onClick={() => {
              playActionClick();
              triggerHaptic(10);
              onOpenCategories();
            }}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-[#E6E2DA] bg-white text-[#4A6B68] hover:bg-[#F5F3EF] active:scale-95 transition-all tactile-btn shadow-2xs hidden sm:flex"
            title="Quản lý danh mục"
            aria-label="Danh mục"
          >
            <FolderTree className="w-4 h-4" />
          </button>

          {/* Nút Mời thành viên */}
          <button
            onClick={() => {
              playActionClick();
              triggerHaptic(10);
              onOpenInvite();
            }}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-[#E6E2DA] bg-white text-[#0F3D39] hover:bg-[#E7EFEF] active:scale-95 transition-all tactile-btn shadow-2xs"
            title="Mời thành viên gia nhập tổ ấm"
            aria-label="Mời thành viên"
          >
            <UserPlus className="w-4 h-4" />
          </button>

          {/* Nút bật tắt âm thanh */}
          <button
            onClick={toggleSound}
            className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-all tactile-btn shadow-2xs ${
              soundEnabled 
                ? 'border-[#0F3D39]/30 bg-[#E7EFEF] text-[#0F3D39]' 
                : 'border-[#E6E2DA] bg-white text-[#A8A29E]'
            }`}
            title={soundEnabled ? 'Âm thanh gõ gỗ: Đang bật' : 'Âm thanh: Đang tắt'}
            aria-label="Bật tắt âm thanh"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Tài khoản Google & Menu */}
          <div className="relative">
            {firebaseUser ? (
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-9 h-9 rounded-xl overflow-hidden border border-[#0F3D39]/30 active:scale-95 transition-all shadow-2xs"
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
                className={`h-9 px-2.5 rounded-xl border border-[#0F3D39] bg-[#0F3D39] text-[#FAF9F6] text-xs font-medium flex items-center gap-1.5 transition-all shadow-xs tactile-btn ${
                  isAuthenticating ? 'opacity-70 cursor-wait' : 'active:scale-95'
                }`}
                title={isFirebaseActive ? (isAuthenticating ? "Đang kết nối Google..." : "Đăng nhập với Google") : "Chế độ Demo"}
              >
                {isAuthenticating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <LogIn className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">
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
                  <p className="text-[11px] text-[#78716C] truncate">{firebaseUser.email}</p>
                </div>
                <button
                  onClick={logout}
                  className="w-full mt-1 px-3 py-2 text-left text-xs text-[#E11D48] hover:bg-[#FFF1F2] rounded-xl flex items-center gap-2 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
