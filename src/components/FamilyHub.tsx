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
}

export const FamilyHub: React.FC<FamilyHubProps> = ({
  onOpenInvite,
  onOpenMonthlyLetter
}) => {
  const {
    activeHousehold,
    currentUser,
    userHouseholds,
    switchHousehold,
    updateBudget,
    soundEnabled,
    toggleSound,
    loginWithGoogle,
    logout,
    isFirebaseActive,
    categories,
    userRole,
    updateUserRole
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

      {/* Bộ chuyển đổi tổ ấm (chỉ hiển thị khi người dùng tham gia nhiều hơn 1 tổ ấm) */}
      {userHouseholds.length > 1 && (
        <div className="bg-[#FAF9F6] border border-[#E6E2DA] rounded-2xl p-3 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[11px] text-[#78716C] font-medium shrink-0">Không gian hiện tại:</span>
            <span className="text-xs font-bold text-[#0F3D39] truncate">{activeHousehold?.name}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <select
              value={activeHousehold?.id}
              onChange={(e) => switchHousehold(e.target.value)}
              className="text-xs bg-white border border-[#E6E2DA] rounded-xl px-2.5 py-1 font-semibold text-[#1C1917] outline-hidden cursor-pointer shadow-2xs"
            >
              {userHouseholds.map((hh) => (
                <option key={hh.id} value={hh.id}>
                  {hh.name} ({(hh.members?.length || 1)}/2 người)
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Lưới 2 cột trên Desktop (md:grid-cols-2) và 1 cột trên Mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        {/* Cột trái: Thành viên & Bức thư tháng */}
        <div className="space-y-4">
          {/* 2. Thành viên tổ ấm (Vợ & Chồng - Tối đa 2 người) */}
          <div className="bg-white border border-[#E6E2DA] rounded-3xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#0F3D39]" />
                <h3 className="text-xs uppercase font-semibold text-[#78716C] tracking-wider">
                  Thành viên đồng hành ({activeHousehold?.members?.length || 1}/2)
                </h3>
              </div>
              {((activeHousehold?.members?.length || 0) < 2) ? (
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
              ) : (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-[#047857] bg-[#ECFDF5] px-2 py-0.5 rounded-full border border-[#10B981]/20">
                  <ShieldCheck className="w-3 h-3 text-[#10B981]" />
                  <span>Đã đủ 2 người</span>
                </span>
              )}
            </div>

            {/* Lưới 2 thành viên */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Thành viên 1 */}
              {(() => {
                const uid1 = activeHousehold?.members?.[0];
                const isMe1 = uid1 === currentUser?.uid;
                const name1 = uid1
                  ? (isMe1 && currentUser?.displayName ? currentUser.displayName : activeHousehold?.memberNames?.[uid1] || 'Thành viên')
                  : 'Thành viên';
                const photo1 = isMe1
                  ? (currentUser?.photoURL || (uid1 ? activeHousehold?.memberPhotos?.[uid1] : undefined))
                  : (uid1 ? activeHousehold?.memberPhotos?.[uid1] : undefined);
                const role1 = isMe1
                  ? userRole
                  : (uid1 && activeHousehold?.memberRoles?.[uid1]) || (userRole === 'Chồng' ? 'Vợ' : 'Chồng');

                return (
                  <div className="p-3 rounded-2xl bg-[#FAF9F6] border border-[#E6E2DA] flex items-center gap-2.5">
                    {photo1 ? (
                      <img
                        src={photo1}
                        alt={name1}
                        className="w-10 h-10 rounded-2xl object-cover border border-[#E6E2DA] shadow-2xs shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className={`w-10 h-10 rounded-2xl ${role1 === 'Chồng' ? 'bg-[#0F3D39]' : 'bg-[#B45309]'} text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs`}>
                        {name1.charAt(0).toUpperCase() || (role1 === 'Chồng' ? 'C' : 'V')}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#1C1917] truncate">
                        {name1} {isMe1 && <span className="font-normal text-[#78716C] text-[10px]">(Bạn)</span>}
                      </p>
                      <p className="text-[10px] text-[#047857] font-mono flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] inline-block" />
                        {role1}
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Thành viên 2: Bạn đời (hoặc ô mời) */}
              {((activeHousehold?.members?.length || 0) >= 2) ? (
                (() => {
                  const uid2 = activeHousehold?.members?.[1];
                  const isMe2 = uid2 === currentUser?.uid;
                  const name2 = uid2
                    ? (isMe2 && currentUser?.displayName ? currentUser.displayName : activeHousehold?.memberNames?.[uid2] || 'Bạn đời')
                    : 'Bạn đời';
                  const photo2 = isMe2
                    ? (currentUser?.photoURL || (uid2 ? activeHousehold?.memberPhotos?.[uid2] : undefined))
                    : (uid2 ? activeHousehold?.memberPhotos?.[uid2] : undefined);
                  const role2 = isMe2
                    ? userRole
                    : (uid2 && activeHousehold?.memberRoles?.[uid2]) || (userRole === 'Chồng' ? 'Vợ' : 'Chồng');

                  return (
                    <div className="p-3 rounded-2xl bg-[#FAF9F6] border border-[#E6E2DA] flex items-center gap-2.5">
                      {photo2 ? (
                        <img
                          src={photo2}
                          alt={name2}
                          className="w-10 h-10 rounded-2xl object-cover border border-[#E6E2DA] shadow-2xs shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className={`w-10 h-10 rounded-2xl ${role2 === 'Chồng' ? 'bg-[#0F3D39]' : 'bg-[#B45309]'} text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs`}>
                          {name2.charAt(0).toUpperCase() || (role2 === 'Chồng' ? 'C' : 'V')}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#1C1917] truncate">
                          {name2} {isMe2 && <span className="font-normal text-[#78716C] text-[10px]">(Bạn)</span>}
                        </p>
                        <p className="text-[10px] text-[#047857] font-mono flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] inline-block" />
                          {role2}
                        </p>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <button
                  onClick={() => {
                    playActionClick();
                    triggerHaptic(10);
                    onOpenInvite();
                  }}
                  className="p-3 rounded-2xl border border-dashed border-[#D6D2CA] bg-[#FAF9F6]/60 hover:bg-[#FAF9F6] flex items-center gap-2.5 text-left transition-all group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-2xl border border-dashed border-[#A8A29E] text-[#A8A29E] group-hover:border-[#0F3D39] group-hover:text-[#0F3D39] flex items-center justify-center font-bold text-xs shrink-0 transition-colors">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#78716C] group-hover:text-[#0F3D39] truncate transition-colors">
                      + Mời bạn đời
                    </p>
                    <p className="text-[10px] text-[#A8A29E] font-mono truncate">
                      Gắn kết 2 người
                    </p>
                  </div>
                </button>
              )}
            </div>

            {/* Bộ chọn vai trò của bạn trong tổ ấm */}
            <div className="mt-3 pt-3 border-t border-[#F5F3EF]">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-medium text-[#78716C]">
                  Vai trò của bạn trong tổ ấm:
                </span>
                <span className="text-[11px] font-bold text-[#0F3D39]">
                  {userRole}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 bg-[#FAF9F6] p-1 rounded-2xl border border-[#E6E2DA]">
                <button
                  type="button"
                  onClick={() => updateUserRole('Chồng')}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    userRole === 'Chồng'
                      ? 'bg-[#0F3D39] text-white shadow-xs'
                      : 'text-[#78716C] hover:text-[#1C1917]'
                  }`}
                >
                  <span>👔 Chồng</span>
                  {userRole === 'Chồng' && <Check className="w-3.5 h-3.5 ml-1" />}
                </button>
                <button
                  type="button"
                  onClick={() => updateUserRole('Vợ')}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    userRole === 'Vợ'
                      ? 'bg-[#B45309] text-white shadow-xs'
                      : 'text-[#78716C] hover:text-[#1C1917]'
                  }`}
                >
                  <span>👗 Vợ</span>
                  {userRole === 'Vợ' && <Check className="w-3.5 h-3.5 ml-1" />}
                </button>
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
        </div>

        {/* Cột phải: Ngân sách & Cài đặt */}
        <div className="space-y-4">
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
  </div>
</div>
);
};
