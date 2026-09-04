import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BalanceCard } from './components/BalanceCard';
import { Numpad } from './components/Numpad';
import { TransactionList } from './components/TransactionList';
import { CategoryManager } from './components/CategoryManager';
import { InviteModal } from './components/InviteModal';
import { MonthlyLetterModal } from './components/MonthlyLetterModal';
import { BottomNav, type MobileTab } from './components/BottomNav';
import { Dashboard } from './components/Dashboard';
import { useApp } from './context/AppContext';

export const App: React.FC = () => {
  const { isLoading } = useApp();

  // Tab di động hiện tại ('ledger' | 'dashboard' | 'numpad' | 'categories')
  const [mobileTab, setMobileTab] = useState<MobileTab>('ledger');

  // Chế độ xem Desktop ('ledger' | 'dashboard')
  const [desktopView, setDesktopView] = useState<'ledger' | 'dashboard'>('ledger');

  // Trạng thái mở các Modal
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isLetterOpen, setIsLetterOpen] = useState(false);

  // Kiểm tra link mời tham gia từ URL (?join=CODE)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const joinCode = params.get('join');
    if (joinCode) {
      setIsInviteOpen(true);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 rounded-2xl bg-[#0F3D39] text-[#FAF9F6] flex items-center justify-center animate-pulse mb-3 shadow-md">
          <span className="font-mono font-bold text-sm">🏡</span>
        </div>
        <p className="text-xs font-medium text-[#78716C] font-mono tracking-wider">
          Đang nạp sổ cái tổ ấm...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1C1917] flex flex-col pb-24 sm:pb-8">
      {/* Header cố định */}
      <Header
        onOpenInvite={() => setIsInviteOpen(true)}
        onOpenCategories={() => setIsCategoryOpen(true)}
        onOpenMonthlyLetter={() => setIsLetterOpen(true)}
        desktopView={desktopView}
        onChangeDesktopView={setDesktopView}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-4 sm:py-6">
        {/* =========================================================================
            1. GIAO DIỆN DI ĐỘNG (MOBILE - CHUYỂN ĐỔI TAB MƯỢT MÀ)
            ========================================================================= */}
        <div className="sm:hidden">
          {mobileTab === 'ledger' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <BalanceCard />
              <TransactionList />
            </div>
          )}

          {mobileTab === 'dashboard' && (
            <div className="animate-in fade-in duration-150">
              <Dashboard />
            </div>
          )}

          {mobileTab === 'numpad' && (
            <div className="animate-in fade-in duration-150">
              <Numpad onSuccess={() => setMobileTab('ledger')} />
            </div>
          )}

          {mobileTab === 'categories' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <BalanceCard />
              <div className="bg-white border border-[#E6E2DA] rounded-3xl p-5 shadow-sm">
                <h3 className="text-xs uppercase font-semibold text-[#78716C] tracking-wider mb-3">
                  Tùy chỉnh nhóm chi
                </h3>
                <button
                  onClick={() => setIsCategoryOpen(true)}
                  className="w-full py-3 rounded-2xl bg-[#0F3D39] text-white text-xs font-semibold"
                >
                  Mở trình quản lý danh mục
                </button>
              </div>
            </div>
          )}
        </div>

        {/* =========================================================================
            2. GIAO DIỆN MÁY TÍNH (DESKTOP - CHUYỂN ĐỔI SỔ CÁI / DASHBOARD)
            ========================================================================= */}
        <div className="hidden sm:block">
          {desktopView === 'ledger' ? (
            <div className="grid grid-cols-12 gap-6 items-start">
              {/* Cột trái (5 cols): Thẻ cân bằng tài chính + Bàn phím số Numpad nhanh */}
              <div className="col-span-5 space-y-5 sticky top-20">
                <BalanceCard />
                <Numpad />
              </div>

              {/* Cột phải (7 cols): Sổ cái chi tiết các giao dịch theo ngày */}
              <div className="col-span-7 space-y-5">
                <TransactionList />
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in duration-150">
              <Dashboard />
            </div>
          )}
        </div>
      </main>

      {/* Thanh điều hướng đáy trên di động */}
      <BottomNav currentTab={mobileTab} onChangeTab={setMobileTab} />

      {/* Modal Quản lý danh mục */}
      <CategoryManager
        isOpen={isCategoryOpen}
        onClose={() => setIsCategoryOpen(false)}
      />

      {/* Modal Mời thành viên */}
      <InviteModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
      />

      {/* Modal Bức thư tháng */}
      <MonthlyLetterModal
        isOpen={isLetterOpen}
        onClose={() => setIsLetterOpen(false)}
      />
    </div>
  );
};
