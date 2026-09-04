import React, { useState } from 'react';
import { X, Copy, Check, UserPlus, Link as LinkIcon, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { playActionClick } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InviteModal: React.FC<InviteModalProps> = ({ isOpen, onClose }) => {
  const { activeHousehold, generateInviteCode, joinWithInviteCode } = useApp();
  
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [inviteCode, setInviteCode] = useState<string>('');
  const [inputCode, setInputCode] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isJoining, setIsJoining] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      playActionClick();
      triggerHaptic(10);
      const code = await generateInviteCode();
      setInviteCode(code);
    } catch (err) {
      console.error(err);
      alert('Không thể tạo mã mời lúc này.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = () => {
    if (!inviteCode) return;
    const url = `${window.location.origin}/?join=${inviteCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    playActionClick();
    triggerHaptic(10);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoin = async () => {
    if (!inputCode.trim()) {
      alert('Vui lòng nhập mã mời');
      return;
    }

    try {
      setIsJoining(true);
      playActionClick();
      triggerHaptic(10);
      await joinWithInviteCode(inputCode.trim().toUpperCase());
      alert('Đã kết nối vào tổ ấm thành công!');
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Mã mời không hợp lệ hoặc đã hết hạn';
      alert(msg);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-[#E6E2DA] rounded-3xl w-full max-w-md p-5 shadow-xl relative">
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-[#F5F3EF]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#E7EFEF] text-[#0F3D39] flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#1C1917]">Mời thành viên</h3>
              <p className="text-[11px] text-[#78716C]">Kết nối bạn đời vào {activeHousehold?.name || 'tổ ấm'}</p>
            </div>
          </div>
          <button
            onClick={() => {
              playActionClick();
              onClose();
            }}
            className="w-8 h-8 rounded-xl text-[#78716C] hover:text-[#1C1917] hover:bg-[#F5F3EF] flex items-center justify-center transition-all"
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
            className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all ${
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
            className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'join'
                ? 'bg-white text-[#0F3D39] shadow-xs'
                : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            Nhập mã gia nhập
          </button>
        </div>

        {/* Nội dung Tab 1: Tạo mã mời */}
        {activeTab === 'create' ? (
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
                  className="w-full py-2.5 rounded-xl bg-[#0F3D39] text-white text-xs font-semibold flex items-center justify-center gap-2 hover:bg-[#174E4A] active:scale-98 transition-all tactile-btn"
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
                className="w-full py-3 rounded-2xl bg-[#0F3D39] text-white text-xs font-semibold flex items-center justify-center gap-2 hover:bg-[#174E4A] active:scale-98 transition-all tactile-btn shadow-xs"
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>{isGenerating ? 'Đang tạo mã...' : 'Tạo liên kết mời bạn đời'}</span>
              </button>
            )}

            <div className="flex items-center gap-1.5 text-[11px] text-[#A8A29E] pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Dữ liệu được mã hóa và cô lập riêng cho tổ ấm của bạn</span>
            </div>
          </div>
        ) : (
          /* Nội dung Tab 2: Nhập mã gia nhập */
          <div className="space-y-3 py-1">
            <p className="text-xs text-[#78716C] leading-relaxed">
              Nếu bạn nhận được mã mời từ người thân (ví dụ: `TOAM-8868`), hãy nhập mã vào đây để tham gia vào tổ ấm chung.
            </p>

            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="Nhập mã mời (ví dụ: TOAM-8868)"
              className="w-full text-center tracking-widest font-mono text-sm p-3 rounded-2xl border border-[#E6E2DA] bg-[#FAF9F6] outline-hidden focus:border-[#0F3D39]"
            />

            <button
              disabled={isJoining || !inputCode.trim()}
              onClick={handleJoin}
              className={`w-full py-3 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 transition-all tactile-btn ${
                !inputCode.trim() || isJoining
                  ? 'bg-[#E6E2DA] text-[#A8A29E] cursor-not-allowed'
                  : 'bg-[#0F3D39] text-white hover:bg-[#174E4A] active:scale-98 shadow-xs'
              }`}
            >
              <span>{isJoining ? 'Đang kết nối...' : 'Xác nhận gia nhập tổ ấm'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
