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
    <header className="sticky top-0 z-30 bg-[#FAF9F6]/95 backdrop-blur-md border-b border-[#D2DDD8] safe-top px-3 sm:px-4 py-2.5 sm:py-3">
      <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
        {/* Tên Tổ Ấm & Icon */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#0F3D39] text-[#FAF9F6] flex items-center justify-center shadow-sm shrink-0">
            <Home className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-base sm:text-lg font-bold text-[#0F3D39] tracking-tight leading-tight truncate">
                {household.name}
              </h1>
              <Sparkles className="w-3.5 h-3.5 text-[#B45309] shrink-0" />
            </div>
            <p className="text-[11px] sm:text-xs text-[#516361] truncate">Quản lý tài chính tổ ấm</p>
          </div>
        </div>

        {/* Các nút hành động & Đổi vai Vợ/Chồng */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Nút chuyển đổi nhanh Vợ / Chồng */}
          <div className="flex items-center bg-[#F0F4F2] p-0.5 sm:p-1 rounded-full border border-[#D2DDD8]">
            <button
              onClick={() => setCurrentMember('Chồng')}
              className={`px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                currentMember === 'Chồng'
                  ? 'bg-[#0F3D39] text-[#FFFFFF] shadow-sm'
                  : 'text-[#516361] hover:text-[#192423]'
              }`}
            >
              Chồng 👨
            </button>
            <button
              onClick={() => setCurrentMember('Vợ')}
              className={`px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                currentMember === 'Vợ'
                  ? 'bg-[#B45309] text-[#FFFFFF] shadow-sm'
                  : 'text-[#516361] hover:text-[#192423]'
              }`}
            >
              Vợ 👩
            </button>
          </div>

          {/* Nút Bức thư tháng */}
          <button
            onClick={onOpenLetter}
            title="Bức thư tháng"
            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-[#F0F4F2] text-[#0F3D39] hover:bg-[#E4ECE7] border border-[#D2DDD8] transition-colors"
          >
            <Mail className="w-4 h-4" />
          </button>

          {/* Nút Mời thành viên */}
          <button
            onClick={onOpenInvite}
            title="Mời bạn đời / người thân"
            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-[#F0F4F2] text-[#0F3D39] hover:bg-[#E4ECE7] border border-[#D2DDD8] transition-colors"
          >
            <UserPlus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
