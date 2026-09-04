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
    <header className="sticky top-0 z-30 bg-[#FAF9F6]/95 backdrop-blur-md border-b border-[#D2DDD8] safe-top px-4 py-3">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        {/* Tên Tổ Ấm & Icon */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-[#0F3D39] text-[#FAF9F6] flex items-center justify-center shadow-sm">
            <Home className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg font-bold text-[#0F3D39] tracking-tight leading-tight">
                {household.name}
              </h1>
              <Sparkles className="w-3.5 h-3.5 text-[#B45309]" />
            </div>
            <p className="text-xs text-[#516361]">Quản lý tài chính tổ ấm</p>
          </div>
        </div>

        {/* Các nút hành động & Đổi vai Vợ/Chồng */}
        <div className="flex items-center gap-2">
          {/* Nút chuyển đổi nhanh Vợ / Chồng */}
          <div className="flex items-center bg-[#F0F4F2] p-1 rounded-full border border-[#D2DDD8]">
            <button
              onClick={() => setCurrentMember('Chồng')}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                currentMember === 'Chồng'
                  ? 'bg-[#0F3D39] text-[#FFFFFF] shadow-sm'
                  : 'text-[#516361] hover:text-[#192423]'
              }`}
            >
              Chồng 👨
            </button>
            <button
              onClick={() => setCurrentMember('Vợ')}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
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
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#F0F4F2] text-[#0F3D39] hover:bg-[#E4ECE7] border border-[#D2DDD8] transition-colors"
          >
            <Mail className="w-4 h-4" />
          </button>

          {/* Nút Mời thành viên */}
          <button
            onClick={onOpenInvite}
            title="Mời bạn đời / người thân"
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#F0F4F2] text-[#0F3D39] hover:bg-[#E4ECE7] border border-[#D2DDD8] transition-colors"
          >
            <UserPlus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
