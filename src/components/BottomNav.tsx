import React from 'react';
import { Receipt, BarChart3, Plus, FolderTree, Heart } from 'lucide-react';
import { playActionClick } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';

export type MobileTab = 'ledger' | 'dashboard' | 'numpad' | 'categories' | 'family';

interface BottomNavProps {
  currentTab: MobileTab;
  onChangeTab: (tab: MobileTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onChangeTab }) => {
  const handleTabClick = (tab: MobileTab) => {
    playActionClick();
    triggerHaptic(10);
    onChangeTab(tab);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#FAF9F6]/95 backdrop-blur-md border-t border-[#E6E2DA] pb-safe sm:hidden isolate">
      <div className="flex items-center justify-between px-3 h-[52px] max-w-md mx-auto">
        {/* Tab 1: Sổ cái */}
        <button
          onClick={() => handleTabClick('ledger')}
          className={`flex-1 flex flex-col items-center justify-center h-full transition-colors tactile-btn ${
            currentTab === 'ledger' ? 'text-[#0F3D39]' : 'text-[#78716C] hover:text-[#1C1917]'
          }`}
          aria-label="Sổ cái chi tiêu"
        >
          <Receipt className="w-5 h-5 stroke-[2]" />
          <span className={`text-[10px] mt-0.5 ${currentTab === 'ledger' ? 'font-bold' : 'font-medium'}`}>Sổ cái</span>
        </button>

        {/* Tab 2: Tổng quan (Dashboard) */}
        <button
          onClick={() => handleTabClick('dashboard')}
          className={`flex-1 flex flex-col items-center justify-center h-full transition-colors tactile-btn ${
            currentTab === 'dashboard' ? 'text-[#0F3D39]' : 'text-[#78716C] hover:text-[#1C1917]'
          }`}
          aria-label="Tổng quan phân tích tài chính"
        >
          <BarChart3 className="w-5 h-5 stroke-[2]" />
          <span className={`text-[10px] mt-0.5 ${currentTab === 'dashboard' ? 'font-bold' : 'font-medium'}`}>Tổng quan</span>
        </button>

        {/* Tab 3 (Nút tròn tâm điểm): Nhập chi tiêu nhanh */}
        <div className="flex items-center justify-center px-1">
          <button
            onClick={() => handleTabClick('numpad')}
            className="relative -top-2.5 w-12 h-12 rounded-full bg-[#0F3D39] text-[#FAF9F6] flex items-center justify-center shadow-md active:scale-95 transition-transform border-[3px] border-[#FAF9F6] tactile-btn shrink-0"
            aria-label="Nhập chi tiêu mới"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Tab 4: Danh mục */}
        <button
          onClick={() => handleTabClick('categories')}
          className={`flex-1 flex flex-col items-center justify-center h-full transition-colors tactile-btn ${
            currentTab === 'categories' ? 'text-[#0F3D39]' : 'text-[#78716C] hover:text-[#1C1917]'
          }`}
          aria-label="Quản lý danh mục"
        >
          <FolderTree className="w-5 h-5 stroke-[2]" />
          <span className={`text-[10px] mt-0.5 ${currentTab === 'categories' ? 'font-bold' : 'font-medium'}`}>Danh mục</span>
        </button>

        {/* Tab 5: Tổ ấm (Family Hub) */}
        <button
          onClick={() => handleTabClick('family')}
          className={`flex-1 flex flex-col items-center justify-center h-full transition-colors tactile-btn ${
            currentTab === 'family' ? 'text-[#0F3D39]' : 'text-[#78716C] hover:text-[#1C1917]'
          }`}
          aria-label="Trung tâm tổ ấm"
        >
          <Heart className={`w-5 h-5 stroke-[2] ${currentTab === 'family' ? 'fill-current text-[#0F3D39]' : ''}`} />
          <span className={`text-[10px] mt-0.5 ${currentTab === 'family' ? 'font-bold' : 'font-medium'}`}>Tổ ấm</span>
        </button>
      </div>
    </nav>
  );
};
