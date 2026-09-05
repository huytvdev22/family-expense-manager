import React, { useState, useEffect } from 'react';
import { Header, type DesktopView } from './components/Header';
import { BalanceCard } from './components/BalanceCard';
import { Numpad } from './components/Numpad';
import { TransactionList } from './components/TransactionList';
import { InviteModal } from './components/InviteModal';
import { MonthlyLetterModal } from './components/MonthlyLetterModal';
import { BottomNav, type MobileTab } from './components/BottomNav';
import { Dashboard } from './components/Dashboard';
import { FamilyHub } from './components/FamilyHub';
import { FinancialFreedom } from './components/FinancialFreedom';
import { MonthPicker } from './components/MonthPicker';
import { UpdateNotification } from './components/UpdateNotification';
import { useApp } from './context/AppContext';

export const App: React.FC = () => {
  const { isLoading } = useApp();

  // Tab di động hiện tại ('ledger' | 'dashboard' | 'numpad' | 'goals' | 'family')
  const [mobileTab, setMobileTab] = useState<MobileTab>('ledger');

  // Chế độ xem Desktop ('ledger' | 'dashboard' | 'categories' | 'family')
  const [desktopView, setDesktopView] = useState<DesktopView>('ledger');

  // Trạng thái mở các Modal
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isLetterOpen, setIsLetterOpen] = useState(false);
  const [joinCodeParam, setJoinCodeParam] = useState<string>('');

  // Kiểm tra link mời tham gia từ URL (?join=CODE) hoặc từ localStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const joinCode = params.get('join');
    if (joinCode) {
      const code = joinCode.trim().toUpperCase();
      localStorage.setItem('pending_invite_code', code);
      setJoinCodeParam(code);
      setIsInviteOpen(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      const savedPending = localStorage.getItem('pending_invite_code');
      if (savedPending) {
        setJoinCodeParam(savedPending);
        setIsInviteOpen(true);
      }
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
        onOpenMonthlyLetter={() => setIsLetterOpen(true)}
        desktopView={desktopView}
        onChangeDesktopView={setDesktopView}
        currentMobileTab={mobileTab}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-4 sm:py-6">
        {/* =========================================================================
            1. GIAO DIỆN DI ĐỘNG (MOBILE - CHUYỂN ĐỔI TAB MƯỢT MÀ)
            ========================================================================= */}
        <div className="sm:hidden">
          {mobileTab === 'ledger' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <MonthPicker className="w-full justify-between" />
              <BalanceCard />
              <TransactionList />
            </div>
          )}

          {mobileTab === 'dashboard' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <MonthPicker className="w-full justify-between" />
              <Dashboard />
            </div>
          )}

          {mobileTab === 'numpad' && (
            <div className="animate-in fade-in duration-150">
              <Numpad onSuccess={() => setMobileTab('ledger')} />
            </div>
          )}

          {mobileTab === 'goals' && (
            <div className="animate-in fade-in duration-150">
              <FinancialFreedom />
            </div>
          )}

          {mobileTab === 'family' && (
            <div className="animate-in fade-in duration-150">
              <FamilyHub
                onOpenInvite={() => setIsInviteOpen(true)}
                onOpenMonthlyLetter={() => setIsLetterOpen(true)}
              />
            </div>
          )}
        </div>

        {/* =========================================================================
            2. GIAO DIỆN MÁY TÍNH (DESKTOP - 4 CHẾ ĐỘ XEM ĐỒNG BỘ)
            ========================================================================= */}
        <div className="hidden sm:block">
          {desktopView === 'ledger' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Thanh tiêu đề trang & Bộ chọn tháng trên Desktop */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[#1C1917] tracking-tight">
                    Sổ cái chi tiêu
                  </h2>
                  <p className="text-xs text-[#78716C]">
                    Theo dõi từng khoản chi và ngân sách thực tế của tổ ấm
                  </p>
                </div>
                <MonthPicker />
              </div>

              {/* Tầng 1: Banner Tổng quan tài chính tháng (Full-width ngang 3 phân khu) */}
              <BalanceCard />

              {/* Tầng 2: Không gian làm việc 2 cột cân đối hoàn hảo */}
              <div className="grid grid-cols-12 gap-6 items-start">
                {/* Cột trái (5 cols): Bàn phím số Numpad xúc giác chuyên nghiệp */}
                <div className="col-span-5 sticky top-20">
                  <Numpad />
                </div>

                {/* Cột phải (7 cols): Sổ cái chi tiết các giao dịch theo ngày */}
                <div className="col-span-7">
                  <TransactionList />
                </div>
              </div>
            </div>
          )}

          {desktopView === 'dashboard' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Thanh tiêu đề trang & Bộ chọn tháng trên Desktop */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[#1C1917] tracking-tight">
                    Báo cáo & Tổng quan tài chính
                  </h2>
                  <p className="text-xs text-[#78716C]">
                    Phân tích chi tiết dòng tiền, cán cân chi tiêu và dự phóng tháng
                  </p>
                </div>
                <MonthPicker />
              </div>
              <Dashboard />
            </div>
          )}

          {desktopView === 'goals' && (
            <div className="animate-in fade-in duration-150">
              <FinancialFreedom />
            </div>
          )}

          {desktopView === 'family' && (
            <div className="animate-in fade-in duration-150">
              <FamilyHub
                onOpenInvite={() => setIsInviteOpen(true)}
                onOpenMonthlyLetter={() => setIsLetterOpen(true)}
              />
            </div>
          )}
        </div>
      </main>

      {/* Thanh điều hướng đáy trên di động */}
      <BottomNav currentTab={mobileTab} onChangeTab={setMobileTab} />

      {/* Modal Mời thành viên */}
      <InviteModal
        isOpen={isInviteOpen}
        onClose={() => {
          setIsInviteOpen(false);
          setJoinCodeParam('');
          localStorage.removeItem('pending_invite_code');
        }}
        initialCode={joinCodeParam}
      />

      {/* Modal Bức thư tháng */}
      <MonthlyLetterModal
        isOpen={isLetterOpen}
        onClose={() => setIsLetterOpen(false)}
      />

      {/* Thông báo cập nhật phiên bản mới tự động */}
      <UpdateNotification />
    </div>
  );
};
