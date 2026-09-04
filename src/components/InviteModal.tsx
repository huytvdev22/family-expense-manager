import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Copy, Check, UserPlus, Clock, ShieldCheck } from 'lucide-react';
import { triggerHaptic } from '../utils/audio';

interface InviteModalProps {
  onClose: () => void;
}

export const InviteModal: React.FC<InviteModalProps> = ({ onClose }) => {
  const { createInviteCode, household } = useApp();
  const [inviteCode] = useState(() => createInviteCode());
  const [copied, setCopied] = useState(false);

  const inviteLink = `${window.location.origin}/join?code=${inviteCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    triggerHaptic([10, 30]);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-[#FAF9F6] rounded-3xl border border-[#D2DDD8] shadow-2xl p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#D2DDD8]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0F3D39] text-[#FAF9F6] flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#0F3D39]">Mời Bạn Đời / Người Thân</h2>
              <p className="text-[11px] text-[#516361]">Gia nhập {household.name}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F0F4F2] flex items-center justify-center text-[#516361] hover:text-[#192423]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Khối hiển thị mã mời */}
        <div className="p-4 bg-[#FFFFFF] rounded-2xl border border-[#D2DDD8] text-center space-y-2">
          <p className="text-xs text-[#516361] font-medium">Mã gia nhập tổ ấm:</p>
          <div className="text-2xl font-black font-mono tracking-widest text-[#0F3D39] bg-[#F0F4F2] py-2 rounded-xl border border-[#D2DDD8]">
            {inviteCode}
          </div>
          <div className="flex items-center justify-center gap-1 text-[11px] text-[#B45309] font-medium">
            <Clock className="w-3.5 h-3.5" />
            <span>Mã có hiệu lực trong vòng 48 giờ</span>
          </div>
        </div>

        {/* Nút Sao Chép Link 1-Chạm */}
        <button
          onClick={handleCopy}
          className={`w-full py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all ${
            copied
              ? 'bg-[#10B981] text-[#FFFFFF]'
              : 'bg-[#0F3D39] text-[#FFFFFF] hover:bg-[#164E48] active:scale-95'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              Đã sao chép liên kết mời!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Sao Chép Link Mời (Gửi qua Zalo/Tin nhắn)
            </>
          )}
        </button>

        {/* Hướng dẫn an toàn */}
        <div className="flex items-start gap-2 bg-[#F0F4F2] p-3 rounded-xl text-[11px] text-[#516361]">
          <ShieldCheck className="w-4 h-4 text-[#0F3D39] shrink-0 mt-0.5" />
          <p>
            Người nhận chỉ cần mở link và đăng nhập tài khoản Google để được tự động thêm vào danh sách thành viên cùng theo dõi tài chính.
          </p>
        </div>
      </div>
    </div>
  );
};
