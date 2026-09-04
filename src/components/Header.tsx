import React from 'react';
import { Home, Mail, UserPlus, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface HeaderProps {
  onOpenInvite: () => void;
  onOpenLetter: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenInvite, onOpenLetter }) => {
  const { household, currentMember, setCurrentMember } = useApp();

  return (
    <header className="sticky top-0 z-30 bg-neutral/95 backdrop-blur-md border-b border-border safe-top px-3 sm:px-4 py-2.5 sm:py-3">
      <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
        {/* Tên Tổ Ấm & Biểu Tượng */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary text-neutral flex items-center justify-center shadow-sm shrink-0">
            <Home className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-base sm:text-lg font-bold text-primary tracking-tight leading-tight truncate">
                {household.name}
              </h1>
              <Sparkles className="w-3.5 h-3.5 text-tertiary shrink-0" />
            </div>
            <p className="text-[11px] sm:text-xs text-on-surface-variant truncate">Quản lý tài chính tổ ấm</p>
          </div>
        </div>

        {/* Các nút hành động & Đổi vai Vợ/Chồng */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Nút chuyển đổi nhanh Vợ / Chồng */}
          <div className="flex items-center bg-surface-container p-0.5 sm:p-1 rounded-full border border-border">
            <button
              onClick={() => setCurrentMember('Chồng')}
              className={`px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                currentMember === 'Chồng'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Chồng 👨
            </button>
            <button
              onClick={() => setCurrentMember('Vợ')}
              className={`px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                currentMember === 'Vợ'
                  ? 'bg-tertiary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Vợ 👩
            </button>
          </div>

          {/* Nút Bức thư tháng */}
          <button
            onClick={onOpenLetter}
            title="Bức thư tháng"
            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-surface-container text-primary hover:bg-surface-container-high border border-border transition-colors"
          >
            <Mail className="w-4 h-4" />
          </button>

          {/* Nút Mời thành viên */}
          <button
            onClick={onOpenInvite}
            title="Mời bạn đời / người thân"
            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-surface-container text-primary hover:bg-surface-container-high border border-border transition-colors"
          >
            <UserPlus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
