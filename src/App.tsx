import React, { useState } from 'react';
import { useApp } from './context/AppContext';
import { Header } from './components/Header';
import { BalanceCard } from './components/BalanceCard';
import { QuickTags } from './components/QuickTags';
import { TransactionList } from './components/TransactionList';
import { Numpad } from './components/Numpad';
import { CategoryManager } from './components/CategoryManager';
import { InviteModal } from './components/InviteModal';
import { MonthlyLetterModal } from './components/MonthlyLetterModal';
import { BottomNav } from './components/BottomNav';
import type { QuickTag } from './types';
import confetti from 'canvas-confetti';
import { getTodayISO } from './utils/currency';

export const App: React.FC = () => {
  const {
    categories,
    currentMember,
    addTransaction,
    isNumpadOpen,
    setIsNumpadOpen,
    selectedQuickTag,
    setSelectedQuickTag
  } = useApp();

  const [activeTab, setActiveTab] = useState<'home' | 'categories'>('home');
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isLetterOpen, setIsLetterOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);

  // Khi chọn một Quick Tag
  const handleSelectQuickTag = (tag: QuickTag) => {
    setSelectedQuickTag(tag);
    setIsNumpadOpen(true);
  };

  // Mở Numpad trống
  const handleOpenGeneralNumpad = () => {
    setSelectedQuickTag(null);
    setIsNumpadOpen(true);
  };

  // Xử lý lưu giao dịch từ Numpad
  const handleNumpadSubmit = (data: {
    amount: number;
    categoryId: string;
    note: string;
    type: 'EXPENSE' | 'INCOME';
  }) => {
    addTransaction({
      ...data,
      date: getTodayISO()
    });

    // Bắn pháo hoa nhỏ nếu gửi tiết kiệm
    if (data.categoryId === 'cat_saving' || data.type === 'INCOME') {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#0F3D39', '#10B981', '#B45309']
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#192423] pb-28">
      {/* Header */}
      <Header
        onOpenInvite={() => setIsInviteOpen(true)}
        onOpenLetter={() => setIsLetterOpen(true)}
      />

      {/* Main Container */}
      <main className="max-w-2xl mx-auto px-4 py-4 space-y-5">
        {activeTab === 'home' && (
          <>
            {/* 1. Thẻ Cán Cân & Tích Lũy */}
            <BalanceCard />

            {/* 2. Dải Quick Tags 1-Chạm */}
            <QuickTags
              onSelectTag={handleSelectQuickTag}
              onOpenCustomModal={handleOpenGeneralNumpad}
            />

            {/* 3. Dòng Thời Gian Giao Dịch */}
            <TransactionList />
          </>
        )}

        {activeTab === 'categories' && (
          <div className="surface-card p-5">
            <CategoryManager onClose={() => setActiveTab('home')} />
          </div>
        )}
      </main>

      {/* Numpad Nhập Siêu Nhanh 3-5 Giây */}
      {isNumpadOpen && (
        <Numpad
          initialTag={selectedQuickTag}
          categories={categories}
          currentMember={currentMember}
          onClose={() => {
            setIsNumpadOpen(false);
            setSelectedQuickTag(null);
          }}
          onSubmit={handleNumpadSubmit}
        />
      )}

      {/* Modal Mời Bạn Đời */}
      {isInviteOpen && (
        <InviteModal onClose={() => setIsInviteOpen(false)} />
      )}

      {/* Modal Bức Thư Tháng */}
      {isLetterOpen && (
        <MonthlyLetterModal onClose={() => setIsLetterOpen(false)} />
      )}

      {/* Modal Quản Lý Danh Mục (Khi bấm từ nút khác) */}
      {isCategoryManagerOpen && (
        <CategoryManager onClose={() => setIsCategoryManagerOpen(false)} />
      )}

      {/* Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNumpad={handleOpenGeneralNumpad}
        onOpenLetter={() => setIsLetterOpen(true)}
        onOpenInvite={() => setIsInviteOpen(true)}
      />
    </div>
  );
};
export default App;
