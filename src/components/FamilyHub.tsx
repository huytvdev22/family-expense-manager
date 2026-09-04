import React, { useState } from 'react';
import {
  Heart,
  Users,
  UserPlus,
  Mail,
  Target,
  Volume2,
  VolumeX,
  LogIn,
  LogOut,
  FolderTree,
  Edit3,
  Check,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatVND } from '../utils/currency';
import { playActionClick } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';

interface FamilyHubProps {
  onOpenInvite: () => void;
  onOpenMonthlyLetter: () => void;
  onOpenCategories: () => void;
}

export const FamilyHub: React.FC<FamilyHubProps> = ({
  onOpenInvite,
  onOpenMonthlyLetter,
  onOpenCategories
}) => {
  const {
    activeHousehold,
    currentUser,
    updateBudget,
    soundEnabled,
    toggleSound,
    loginWithGoogle,
    logout,
    isFirebaseActive,
    categories
  } = useApp();

  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState(String(activeHousehold?.monthlyBudget || 30000000));

  const monthlyBudget = activeHousehold?.monthlyBudget || 30000000;

  const handleSaveBudget = async () => {
    const val = Number(budgetInput);
    if (!isNaN(val) && val > 0) {
      await updateBudget(val);
      setIsEditingBudget(false);
      playActionClick();
      triggerHaptic(10);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* 1. Header Tổ Ấm: Thẻ danh thiếp gia đình */}
      <div className="bg-white border border-[#E6E2DA] rounded-3xl p-5 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#0F3D39]/5 rounded-full -mr-10 -mt-10 pointer-events-none" />
        
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-[#0F3D39] text-[#FAF9F6] flex items-center justify-center shadow-xs">
            <Heart className="w-6 h-6 fill-current text-[#FAF9F6]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#1C1917]">
                {activeHousehold?.name || 'Tổ Ấm Nhỏ'}
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#047857] font-semibold border border-[#10B981]/20">
                Đồng hành
              </span>
            </div>
            <p className="text-xs text-[#78716C] font-mono mt-0.5">
              Mã tổ ấm: <span className="font-semibold text-[#0F3D39]">{activeHousehold?.id || 'hh_demo_family'}</span>
            </p>
          </div>
        </div>

        <p className="text-xs text-[#78716C] leading-relaxed italic border-t border-[#F5F3EF] pt-3">
          "Cùng nhau vun đắp từng bữa cơm, sẻ chia từng gánh nặng tài chính để tổ ấm luôn ngập tràn bình yên."
        </p>
      </div>

      {/* 2. Thành viên tổ ấm (Vợ & Chồng) */}
      <div className="bg-white border border-[#E6E2DA] rounded-3xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#0F3D39]" />
            <h3 className="text-xs uppercase font-semibold text-[#78716C] tracking-wider">
              Thành viên đồng hành
            </h3>
          </div>
          <button
            onClick={() => {
              playActionClick();
              triggerHaptic(10);
              onOpenInvite();
            }}
            className="flex items-center gap-1 text-xs font-semibold text-[#0F3D39] hover:underline"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Mời bạn đời</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Người thứ 1: Chồng */}
          <div className="p-3 rounded-2xl bg-[#FAF9F6] border border-[#E6E2DA] flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0F3D39] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
              👨
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#1C1917] truncate">Chồng</p>
              <p className="text-[10px] text-[#047857] font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] inline-block" />
                Đang trực tuyến
              </p>
            </div>
          </div>

          {/* Người thứ 2: Vợ */}
          <div className="p-3 rounded-2xl bg-[#FAF9F6] border border-[#E6E2DA] flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#B45309] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
              👩
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#1C1917] truncate">Vợ</p>
              <p className="text-[10px] text-[#78716C] font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] inline-block" />
                Đồng hành
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Góc Bức thư tháng & Kỷ niệm */}
      <div className="bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7] border border-[#FDE68A] rounded-3xl p-5 shadow-xs">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#B45309] text-white flex items-center justify-center shadow-xs">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-[#92400E]">Bức thư tổ ấm tháng này</h3>
                <Sparkles className="w-3.5 h-3.5 text-[#B45309]" />
              </div>
              <p className="text-xs text-[#B45309]/80 mt-0.5">
                Lời tâm tình và đúc kết chi tiêu của hai vợ chồng
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            playActionClick();
            triggerHaptic(10);
            onOpenMonthlyLetter();
          }}
          className="mt-3.5 w-full py-2.5 rounded-xl bg-[#B45309] hover:bg-[#92400E] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-98"
        >
          <span>Mở đọc thư tháng</span>
        </button>
      </div>

      {/* 4. Quản trị ngân sách mục tiêu */}
      <div className="bg-white border border-[#E6E2DA] rounded-3xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-[#B45309]" />
            <h3 className="text-xs uppercase font-semibold text-[#78716C] tracking-wider">
              Hạn mức ngân sách tháng
            </h3>
          </div>
          {isEditingBudget ? (
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                className="w-24 text-xs font-mono font-medium px-1.5 py-0.5 border border-[#0F3D39] rounded-md outline-hidden bg-[#FAF9F6]"
                autoFocus
              />
              <button
                onClick={handleSaveBudget}
                className="p-1 rounded-md bg-[#0F3D39] text-white"
                title="Lưu"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setBudgetInput(String(monthlyBudget));
                setIsEditingBudget(true);
              }}
              className="flex items-center gap-1 text-xs font-mono font-semibold text-[#0F3D39]"
            >
              <span>{formatVND(monthlyBudget)}</span>
              <Edit3 className="w-3 h-3 text-[#78716C]" />
            </button>
          )}
        </div>
        <p className="text-xs text-[#78716C] leading-relaxed">
          Ngân sách dự tính cho sinh hoạt chung cả tháng, giúp duy trì kỷ luật tích lũy.
        </p>
      </div>

      {/* 5. Menu cài đặt & Tiện ích */}
      <div className="bg-white border border-[#E6E2DA] rounded-3xl p-4 shadow-sm divide-y divide-[#F5F3EF]">
        {/* Nút mở quản lý danh mục */}
        <button
          onClick={() => {
            playActionClick();
            triggerHaptic(10);
            onOpenCategories();
          }}
          className="w-full py-3 flex items-center justify-between text-left hover:bg-[#FAF9F6] px-2 rounded-xl transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#E7EFEF] text-[#0F3D39] flex items-center justify-center">
              <FolderTree className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#1C1917]">Quản lý nhóm chi & nguồn thu</p>
              <p className="text-[10px] text-[#78716C]">{categories.length} nhóm danh mục hiện có</p>
            </div>
          </div>
          <span className="text-xs text-[#A8A29E]">&rarr;</span>
        </button>

        {/* Cài đặt âm thanh phản hồi */}
        <div className="py-3 flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#F5F3EF] text-[#78716C] flex items-center justify-center">
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </div>
            <div>
              <p className="text-xs font-semibold text-[#1C1917]">Âm thanh xúc giác cơ học</p>
              <p className="text-[10px] text-[#78716C]">Tiếng click bàn phím khi ghi sổ</p>
            </div>
          </div>
          <button
            onClick={() => {
              toggleSound();
              triggerHaptic(10);
            }}
            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
              soundEnabled ? 'bg-[#0F3D39]' : 'bg-[#E6E2DA]'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform shadow-xs ${
                soundEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Trạng thái tài khoản */}
        <div className="pt-3 flex items-center justify-between px-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#FAF9F6] border border-[#E6E2DA] flex items-center justify-center text-xs font-bold text-[#0F3D39]">
              {currentUser?.photoURL ? (
                <img src={currentUser.photoURL} alt="" className="w-full h-full rounded-xl object-cover" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-[#0F3D39]" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#1C1917] truncate">
                {currentUser ? currentUser.displayName || currentUser.email : 'Chế độ Demo (Nội bộ)'}
              </p>
              <p className="text-[10px] text-[#78716C] font-mono">
                {isFirebaseActive ? 'Firebase Cloud Sync' : 'Local Storage'}
              </p>
            </div>
          </div>

          {currentUser ? (
            <button
              onClick={() => {
                playActionClick();
                logout();
              }}
              className="px-2.5 py-1.5 rounded-lg border border-[#E6E2DA] text-[11px] font-semibold text-[#78716C] hover:text-[#E11D48] flex items-center gap-1"
            >
              <LogOut className="w-3 h-3" />
              <span>Đăng xuất</span>
            </button>
          ) : (
            <button
              onClick={() => {
                playActionClick();
                loginWithGoogle();
              }}
              className="px-2.5 py-1.5 rounded-lg bg-[#0F3D39] text-[11px] font-semibold text-white flex items-center gap-1"
            >
              <LogIn className="w-3 h-3" />
              <span>Google</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
