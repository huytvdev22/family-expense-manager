import React from 'react';
import { Home, FolderKanban, Plus, Mail, UserPlus } from 'lucide-react';
import { soundEngine, triggerHaptic } from '../utils/audio';

interface BottomNavProps {
  activeTab: 'home' | 'categories';
  setActiveTab: (tab: 'home' | 'categories') => void;
  onOpenNumpad: () => void;
  onOpenLetter: () => void;
  onOpenInvite: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenNumpad,
  onOpenLetter,
  onOpenInvite
}) => {
  const handleNumpadClick = () => {
    soundEngine.playWoodClick(1.2);
    triggerHaptic([15, 30]);
    onOpenNumpad();
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-neutral/95 backdrop-blur-md border-t border-border safe-bottom px-4 py-2">
      <div className="max-w-md mx-auto flex items-center justify-between relative">
        {/* Tab Trang Chủ */}
        <button
          onClick={() => {
            setActiveTab('home');
            triggerHaptic(8);
          }}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors ${
            activeTab === 'home' ? 'text-primary font-bold' : 'text-on-surface-variant'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px]">Tổ Ấm</span>
        </button>

        {/* Tab Danh Mục */}
        <button
          onClick={() => {
            setActiveTab('categories');
            triggerHaptic(8);
          }}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors ${
            activeTab === 'categories' ? 'text-primary font-bold' : 'text-on-surface-variant'
          }`}
        >
          <FolderKanban className="w-5 h-5" />
          <span className="text-[10px]">Nhóm Chi</span>
        </button>

        {/* Nút FAB To Nổi Bật Chính Giữa: Ghi Nhanh 3-5s */}
        <div className="relative -top-4 flex items-center justify-center">
          <button
            onClick={handleNumpadClick}
            className="w-14 h-14 rounded-full bg-primary text-on-primary shadow-lg hover:bg-primary-hover active:scale-95 flex items-center justify-center border-4 border-neutral transition-transform"
            title="Ghi khoản chi siêu tốc (3-5s)"
          >
            <Plus className="w-7 h-7" />
          </button>
        </div>

        {/* Tab Bức Thư Tháng */}
        <button
          onClick={() => {
            triggerHaptic(8);
            onOpenLetter();
          }}
          className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-on-surface-variant hover:text-primary transition-colors"
        >
          <Mail className="w-5 h-5" />
          <span className="text-[10px]">Thư Tháng</span>
        </button>

        {/* Tab Mời Thành Viên */}
        <button
          onClick={() => {
            triggerHaptic(8);
            onOpenInvite();
          }}
          className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-on-surface-variant hover:text-primary transition-colors"
        >
          <UserPlus className="w-5 h-5" />
          <span className="text-[10px]">Mời Bạn</span>
        </button>
      </div>
    </nav>
  );
};
