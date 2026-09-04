import React, { useState, useEffect } from 'react';
import { X, Copy, Check, UserPlus, Link as LinkIcon, ShieldCheck, LogIn, Heart, Loader2, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getInvitation } from '../services/firestoreService';
import type { Invitation } from '../types';
import { playActionClick } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';
import { useToast } from './Toast';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
}

export const InviteModal: React.FC<InviteModalProps> = ({ isOpen, onClose, initialCode }) => {
  const { 
    activeHousehold, 
    currentUser,
    firebaseUser, 
    loginWithGoogle, 
    generateInviteCode, 
    joinWithInviteCode,
    switchHousehold,
    isAuthenticating 
  } = useApp();
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'create' | 'join'>(initialCode ? 'join' : 'create');
  const [inviteCode, setInviteCode] = useState<string>('');
  const [inputCode, setInputCode] = useState<string>(initialCode || '');
  const [copied, setCopied] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [previewInvite, setPreviewInvite] = useState<Invitation | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);

  useEffect(() => {
    if (initialCode) {
      setInputCode(initialCode);
      setActiveTab('join');
    }
  }, [initialCode]);

  // Tải thông tin mã mời (nếu có) để hiển thị thiệp mời trực quan
  useEffect(() => {
    const codeToFetch = (initialCode || inputCode).trim().toUpperCase();
    if (codeToFetch.length >= 6) {
      setIsLoadingPreview(true);
      getInvitation(codeToFetch)
        .then((inv) => setPreviewInvite(inv))
        .catch(() => setPreviewInvite(null))
        .finally(() => setIsLoadingPreview(false));
    } else {
      setPreviewInvite(null);
    }
  }, [initialCode, inputCode]);

  if (!isOpen) return null;

  // Chỉ đánh giá tổ ấm đã đầy nếu người dùng đã đăng nhập với dữ liệu tổ ấm thật
  const isHouseholdFull = Boolean(
    firebaseUser && 
    activeHousehold && 
    (activeHousehold.members?.length || 0) >= 2
  );

  const handleGenerate = async () => {
    if (!firebaseUser) {
      showToast('Vui lòng đăng nhập Google để tạo mã mời cho tổ ấm của bạn.', 'info');
      await loginWithGoogle();
      return;
    }

    if (isHouseholdFull) {
      showToast('Tổ ấm đã có đủ 2 thành viên (Vợ & Chồng), không thể tạo thêm mã mời.', 'warning');
      return;
    }

    try {
      setIsGenerating(true);
      playActionClick();
      triggerHaptic(10);
      const code = await generateInviteCode();
      setInviteCode(code);
      showToast('Đã tạo mã mời tổ ấm thành công!', 'success');
    } catch (err: any) {
      console.error(err);
      if (err?.message === 'AUTH_REQUIRED') {
        showToast('Vui lòng đăng nhập Google để tạo mã mời.', 'info');
        await loginWithGoogle();
      } else {
        showToast(err?.message || 'Không thể tạo mã mời lúc này.', 'error');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = () => {
    if (!inviteCode) return;
    const url = `${window.location.origin}/?join=${inviteCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    showToast('Đã sao chép liên kết mời tham gia tổ ấm!', 'success');
    playActionClick();
    triggerHaptic(10);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoin = async () => {
    const code = inputCode.trim().toUpperCase();
    if (!code) {
      showToast('Vui lòng nhập mã mời', 'warning');
      return;
    }

    // Nếu chưa đăng nhập, lưu mã mời và kích hoạt đăng nhập Google
    if (!firebaseUser) {
      localStorage.setItem('pending_invite_code', code);
      playActionClick();
      triggerHaptic(10);
      await loginWithGoogle();
      return;
    }

    try {
      setIsJoining(true);
      playActionClick();
      triggerHaptic(10);
      await joinWithInviteCode(code);
      localStorage.removeItem('pending_invite_code');
      showToast('Đã kết nối vào tổ ấm thành công!', 'success');
      onClose();
    } catch (err: unknown) {
      let msg = 'Mã mời không hợp lệ hoặc đã hết hạn.';
      if (err instanceof Error) {
        if (err.message === 'AUTH_REQUIRED') {
          localStorage.setItem('pending_invite_code', code);
          await loginWithGoogle();
          return;
        }
        if (err.message.includes('permission-denied') || err.message.includes('Missing or insufficient permissions')) {
          msg = '⚠️ Không thể tham gia: Tổ ấm này đã đủ 2 thành viên đồng hành (Vợ & Chồng) hoặc bạn không có quyền truy cập.';
        } else {
          msg = err.message;
        }
      }
      showToast(msg, 'error');
    } finally {
      setIsJoining(false);
    }
  };

  const handleLoginToJoin = async () => {
    const code = (inputCode || initialCode || '').trim().toUpperCase();
    if (code) {
      localStorage.setItem('pending_invite_code', code);
    }
    playActionClick();
    triggerHaptic(10);
    await loginWithGoogle();
  };

  const isCreatorOfInvite = Boolean(
    firebaseUser && 
    previewInvite && 
    previewInvite.createdBy === firebaseUser.uid
  );

  const isAlreadyMember = Boolean(
    firebaseUser && 
    previewInvite && 
    (
      activeHousehold?.id === previewInvite.householdId ||
      currentUser?.householdIds?.includes(previewInvite.householdId) ||
      previewInvite.usedBy === firebaseUser.uid
    )
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-[#E6E2DA] rounded-3xl w-full max-w-md p-5 shadow-xl relative">
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-[#F5F3EF]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#E7EFEF] text-[#0F3D39] flex items-center justify-center">
              {activeTab === 'join' ? <Heart className="w-4 h-4 text-[#C15C3D]" /> : <UserPlus className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#1C1917]">
                {activeTab === 'join' ? 'Gia nhập tổ ấm' : 'Mời thành viên'}
              </h3>
              <p className="text-[11px] text-[#78716C]">
                {!firebaseUser
                  ? 'Đồng hành quản lý tài chính gia đình'
                  : isHouseholdFull
                  ? 'Tổ ấm đã đủ 2 thành viên'
                  : `Kết nối bạn đời vào ${activeHousehold?.name || 'tổ ấm'}`}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              playActionClick();
              onClose();
            }}
            className="w-8 h-8 rounded-xl text-[#78716C] hover:text-[#1C1917] hover:bg-[#F5F3EF] flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab chuyển đổi: Tạo mã mời vs Nhập mã */}
        <div className="flex items-center bg-[#F5F3EF] p-1 rounded-2xl my-3 border border-[#E6E2DA]">
          <button
            onClick={() => {
              playActionClick();
              setActiveTab('create');
            }}
            className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'create'
                ? 'bg-white text-[#0F3D39] shadow-xs'
                : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            Gửi lời mời
          </button>
          <button
            onClick={() => {
              playActionClick();
              setActiveTab('join');
            }}
            className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'join'
                ? 'bg-white text-[#0F3D39] shadow-xs'
                : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            Nhập mã gia nhập
          </button>
        </div>

        {/* =========================================================================
            NỘI DUNG TAB 1: TẠO MÃ MỜI
            ========================================================================= */}
        {activeTab === 'create' ? (
          !firebaseUser ? (
            /* Chưa đăng nhập: Gợi ý đăng nhập để lưu trữ dữ liệu thật */
            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E6E2DA] text-center space-y-3 my-2">
              <div className="w-10 h-10 rounded-2xl bg-[#E7EFEF] text-[#0F3D39] flex items-center justify-center mx-auto text-lg">
                🏡
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#0F3D39]">
                  Chế độ trải nghiệm thử (Demo)
                </h4>
                <p className="text-[11px] text-[#78716C] leading-relaxed mt-1">
                  Đăng nhập tài khoản Google để tạo tổ ấm của riêng bạn và mời bạn đời cùng quản lý chi tiêu gia đình.
                </p>
              </div>
              <button
                disabled={isAuthenticating}
                onClick={async () => {
                  playActionClick();
                  triggerHaptic(10);
                  await loginWithGoogle();
                }}
                className="w-full py-2.5 rounded-xl bg-[#0F3D39] text-white text-xs font-semibold flex items-center justify-center gap-2 hover:bg-[#174E4A] active:scale-98 transition-all tactile-btn cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{isAuthenticating ? 'Đang kết nối...' : 'Đăng nhập Google'}</span>
              </button>
            </div>
          ) : isHouseholdFull ? (
            /* Đã đủ 2 thành viên */
            <div className="p-4 rounded-2xl bg-[#ECFDF5] border border-[#10B981]/20 text-center space-y-2.5 my-2">
              <div className="w-10 h-10 rounded-2xl bg-[#10B981]/15 text-[#047857] flex items-center justify-center mx-auto text-lg">
                🏡
              </div>
              <h4 className="text-xs font-bold text-[#0F3D39]">
                Tổ ấm đã gắn kết trọn vẹn (2/2 thành viên)
              </h4>
              <p className="text-[11px] text-[#047857] leading-relaxed">
                Tổ ấm của bạn hiện đã đủ 2 thành viên đồng hành (Vợ & Chồng). Mỗi tổ ấm được thiết kế riêng tư và bảo mật cho 2 người, không thể mời thêm thành viên thứ 3.
              </p>
            </div>
          ) : (
            /* Chưa đủ 2 thành viên: Tạo mã */
            <div className="space-y-3 py-1">
              <p className="text-xs text-[#78716C] leading-relaxed">
                Mã mời có thời hạn **48 giờ**. Bạn có thể gửi mã hoặc đường dẫn trực tiếp qua Zalo / iMessage cho người thân để cùng quản lý sổ cái.
              </p>

              {inviteCode ? (
                <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E6E2DA] space-y-3">
                  <div className="text-center">
                    <span className="text-[11px] text-[#78716C] uppercase tracking-wider font-mono">
                      Mã mời tổ ấm của bạn
                    </span>
                    <div className="mt-1 text-2xl font-bold font-mono text-[#0F3D39] tracking-widest">
                      {inviteCode}
                    </div>
                  </div>

                  <button
                    onClick={handleCopyLink}
                    className="w-full py-2.5 rounded-xl bg-[#0F3D39] text-white text-xs font-semibold flex items-center justify-center gap-2 hover:bg-[#174E4A] active:scale-98 transition-all tactile-btn cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Đã sao chép liên kết!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Sao chép liên kết 1-chạm</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <button
                  disabled={isGenerating}
                  onClick={handleGenerate}
                  className="w-full py-3 rounded-2xl bg-[#0F3D39] text-white text-xs font-semibold flex items-center justify-center gap-2 hover:bg-[#174E4A] active:scale-98 transition-all tactile-btn shadow-xs cursor-pointer"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>{isGenerating ? 'Đang tạo mã...' : 'Tạo liên kết mời bạn đời'}</span>
                </button>
              )}

              <div className="flex items-center gap-1.5 text-[11px] text-[#A8A29E] pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Giới hạn tối đa 2 người (Vợ & Chồng) để bảo mật tài chính</span>
              </div>
            </div>
          )
        ) : (
          /* =========================================================================
              NỘI DUNG TAB 2: NHẬP MÃ GIA NHẬP TỔ ẤM
              ========================================================================= */
          <div className="space-y-3 py-1">
            {/* THIỆP MỜI TRỰC QUAN (Khi nhận được mã mời) */}
            {previewInvite ? (
              <div className="p-4 rounded-2xl bg-[#FBF7EE] border border-[#EAE0D0] text-center space-y-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#C15C3D]/10 text-[#C15C3D] flex items-center justify-center mx-auto">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#1C1917]">
                    Lời mời đồng hành cùng {previewInvite.householdName}
                  </h4>
                  <p className="text-[11px] text-[#78716C] mt-1 leading-relaxed">
                    <span className="font-semibold text-[#0F3D39]">{previewInvite.createdByName}</span> đã gửi mã mời bạn cùng đồng hành quản lý chi tiêu gia đình.
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#78716C] leading-relaxed">
                Nếu bạn nhận được mã mời từ người thân (ví dụ: `TOAM-8868`), hãy nhập mã vào đây để tham gia vào tổ ấm chung.
              </p>
            )}

            {/* Ô nhập mã mời */}
            <div className="relative">
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="Nhập mã mời (ví dụ: TOAM-8868)"
                className="w-full text-center tracking-widest font-mono text-sm p-3 rounded-2xl border border-[#E6E2DA] bg-[#FAF9F6] outline-hidden focus:border-[#0F3D39] uppercase"
              />
              {isLoadingPreview && (
                <div className="absolute right-3 top-3.5 text-[#A8A29E]">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              )}
            </div>

            {/* Xử lý hành động tương ứng với trạng thái đăng nhập */}
            {!firebaseUser ? (
              /* Người dùng CHƯA đăng nhập: Hiển thị nút đăng nhập Google để kết nối */
              <div className="space-y-2 pt-1">
                <p className="text-[11px] text-center text-[#78716C]">
                  Đăng nhập tài khoản Google của bạn để gia nhập tổ ấm an toàn:
                </p>
                <button
                  disabled={isAuthenticating || !inputCode.trim()}
                  onClick={handleLoginToJoin}
                  className={`w-full py-3 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 transition-all tactile-btn cursor-pointer ${
                    !inputCode.trim() || isAuthenticating
                      ? 'bg-[#E6E2DA] text-[#A8A29E] cursor-not-allowed'
                      : 'bg-[#0F3D39] text-white hover:bg-[#174E4A] active:scale-98 shadow-xs'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{isAuthenticating ? 'Đang kết nối Google...' : 'Đăng nhập Google để gia nhập'}</span>
                </button>
              </div>
            ) : isCreatorOfInvite ? (
              /* Đã đăng nhập nhưng chính là người tạo mã */
              <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E6E2DA] text-center">
                <p className="text-xs text-[#0F3D39] font-medium">
                  Đây là mã mời do chính bạn tạo ra. Hãy gửi cho bạn đời nhé!
                </p>
              </div>
            ) : isAlreadyMember ? (
              /* Đã đăng nhập và đã ở trong tổ ấm này */
              <div className="p-4 rounded-2xl bg-[#ECFDF5] border border-[#10B981]/20 text-center space-y-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#10B981]/15 text-[#047857] flex items-center justify-center mx-auto text-sm">
                  ✓
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#0F3D39]">
                    Bạn đã là thành viên của tổ ấm này rồi!
                  </h4>
                  <p className="text-[11px] text-[#047857] mt-0.5">
                    Tài khoản của bạn đã được kết nối đồng hành cùng người thương.
                  </p>
                </div>
                {previewInvite?.householdId && activeHousehold?.id !== previewInvite.householdId && (
                  <button
                    onClick={async () => {
                      playActionClick();
                      triggerHaptic(10);
                      await switchHousehold(previewInvite.householdId);
                      onClose();
                    }}
                    className="w-full py-2.5 rounded-xl bg-[#0F3D39] text-white text-xs font-semibold hover:bg-[#174E4A] active:scale-98 transition-all cursor-pointer shadow-xs"
                  >
                    Chuyển sang xem tổ ấm này ngay
                  </button>
                )}
              </div>
            ) : (
              /* Đã đăng nhập: Nút Xác nhận gia nhập */
              <button
                disabled={isJoining || !inputCode.trim()}
                onClick={handleJoin}
                className={`w-full py-3 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 transition-all tactile-btn cursor-pointer ${
                  !inputCode.trim() || isJoining
                    ? 'bg-[#E6E2DA] text-[#A8A29E] cursor-not-allowed'
                    : 'bg-[#0F3D39] text-white hover:bg-[#174E4A] active:scale-98 shadow-xs'
                }`}
              >
                <Heart className="w-3.5 h-3.5 text-[#C15C3D]" />
                <span>{isJoining ? 'Đang kết nối...' : 'Xác nhận gia nhập tổ ấm'}</span>
              </button>
            )}

            <div className="flex items-center gap-1.5 text-[11px] text-[#A8A29E] pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Dữ liệu chi tiêu được đồng bộ thời gian thực và bảo mật 2 người</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
