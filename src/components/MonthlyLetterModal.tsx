import React, { useEffect } from 'react';
import { X, Heart, Sparkles, MailOpen } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import { formatVND, formatYearMonthLabel } from '../utils/currency';
import { playActionClick } from '../utils/audio';

interface MonthlyLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MonthlyLetterModal: React.FC<MonthlyLetterModalProps> = ({ isOpen, onClose }) => {
  const {
    activeHousehold,
    currentYearMonth,
    totalExpense,
    husbandExpense,
    wifeExpense,
    husbandRatio,
    wifeRatio,
    savingsRatio,
    categories,
    transactions
  } = useApp();

  // Bắn pháo giấy nhẹ nhàng khi mở thư nếu tỷ lệ tiết kiệm > 20%
  useEffect(() => {
    if (isOpen && savingsRatio >= 20) {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#0F3D39', '#B45309', '#10B981', '#FAF9F6']
      });
    }
  }, [isOpen, savingsRatio]);

  if (!isOpen) return null;

  // Tìm danh mục chi nhiều nhất
  const categoryTotals: Record<string, number> = {};
  transactions.forEach((tx) => {
    if (tx.type === 'EXPENSE') {
      categoryTotals[tx.categoryName] = (categoryTotals[tx.categoryName] || 0) + tx.amount;
    }
  });

  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0] || ['Chưa rõ', 0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FAF9F6] border border-[#E6E2DA] rounded-3xl w-full max-w-lg p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Nút đóng */}
        <button
          onClick={() => {
            playActionClick();
            onClose();
          }}
          className="absolute top-4 right-4 w-8 h-8 rounded-xl text-[#78716C] hover:text-[#1C1917] hover:bg-[#F5F3EF] flex items-center justify-center transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Tiêu đề Bức Thư Tháng */}
        <div className="text-center pb-4 border-b border-[#E6E2DA]">
          <div className="w-11 h-11 mx-auto rounded-2xl bg-[#FEF3C7] text-[#B45309] flex items-center justify-center mb-2 shadow-2xs">
            <MailOpen className="w-5 h-5 stroke-[2]" />
          </div>
          <span className="text-[10px] uppercase font-mono tracking-widest text-[#B45309] font-bold">
            Bản tin tổ ấm
          </span>
          <h2 className="text-xl font-serif font-bold text-[#1C1917] mt-0.5 tracking-tight">
            Bức Thư {formatYearMonthLabel(currentYearMonth)}
          </h2>
          <p className="text-xs text-[#78716C] mt-1 font-serif italic">
            Gửi gửi hai vợ chồng {activeHousehold?.name || 'Tổ Ấm'} thân yêu
          </p>
        </div>

        {/* Nội dung thư viết tay */}
        <div className="py-5 space-y-4 text-xs leading-relaxed text-[#1C1917]">
          <p>
            Tháng vừa qua, tổ ấm của chúng ta đã cùng nhau đồng lòng vượt qua những ngày bận rộn. Tổng cộng hai vợ chồng đã cùng chi trả:
          </p>

          <div className="p-4 rounded-2xl bg-white border border-[#E6E2DA] shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[#78716C]">Tổng chi trong tháng:</span>
              <span className="font-mono font-bold text-sm text-[#1C1917] tabular-nums">
                {formatVND(totalExpense)}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-[#F5F3EF] pt-2">
              <span className="text-[#78716C]">Chồng đã chi trả:</span>
              <span className="font-mono font-semibold text-[#0F3D39] tabular-nums">
                {formatVND(husbandExpense)} ({husbandRatio}%)
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-[#F5F3EF] pt-2">
              <span className="text-[#78716C]">Vợ đã chi trả:</span>
              <span className="font-mono font-semibold text-[#B45309] tabular-nums">
                {formatVND(wifeExpense)} ({wifeRatio}%)
              </span>
            </div>
          </div>

          <p>
            Khoản chi tiêu lớn nhất của nhà mình dành cho **{topCategory[0]}** với số tiền là <span className="font-mono font-semibold">{formatVND(topCategory[1])}</span>. Đây đều là những khoản đầu tư thiết thực cho sức khỏe, con cái và sự gắn kết của gia đình.
          </p>

          {/* Lời nhắn nhủ ấm áp */}
          <div className="p-4 rounded-2xl bg-[#E7EFEF] border border-[#0F3D39]/20 text-[#0F3D39] space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-xs">
              <Heart className="w-3.5 h-3.5 fill-[#0F3D39]" />
              <span>Gắn kết gia đình là trên hết</span>
            </div>
            <p className="text-[11px] leading-normal opacity-90">
              Tiền bạc là công cụ để vun đắp tổ ấm. Dù tháng này chi nhiều hay ít, sự minh bạch và đồng lòng của hai vợ chồng chính là tài sản quý giá nhất!
            </p>
          </div>
        </div>

        {/* Chữ ký chân thành */}
        <div className="pt-3 border-t border-[#E6E2DA] flex items-center justify-between text-xs text-[#78716C]">
          <span className="flex items-center gap-1 font-mono text-[11px]">
            <Sparkles className="w-3 h-3 text-[#B45309]" />
            Tổ Ấm Nhỏ Harmony Ledger
          </span>
          <span className="font-serif italic">Hạnh phúc từ sự sẻ chia</span>
        </div>
      </div>
    </div>
  );
};
