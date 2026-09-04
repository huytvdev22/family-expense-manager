import React, { useEffect } from 'react';
import { 
  X, 
  Heart, 
  Sparkles, 
  MailOpen, 
  TrendingUp, 
  Receipt, 
  PiggyBank, 
  ArrowUpRight, 
  ArrowDownRight,
  Wallet
} from 'lucide-react';
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
    totalIncome,
    netSavings,
    savingsRatio,
    husbandExpense,
    wifeExpense,
    husbandRatio,
    wifeRatio,
    husbandIncome,
    wifeIncome,
    husbandIncomeRatio,
    wifeIncomeRatio,
    transactions
  } = useApp();

  // Bắn pháo giấy chúc mừng nhẹ nhàng khi mở thư nếu có tích lũy thặng dư >= 15%
  useEffect(() => {
    if (isOpen && netSavings > 0 && savingsRatio >= 15) {
      confetti({
        particleCount: 45,
        spread: 65,
        origin: { y: 0.6 },
        colors: ['#0F3D39', '#B45309', '#10B981', '#FAF9F6', '#C15C3D']
      });
    }
  }, [isOpen, netSavings, savingsRatio]);

  if (!isOpen) return null;

  // Tìm danh mục chi nhiều nhất
  const categoryTotals: Record<string, number> = {};
  transactions.forEach((tx) => {
    if (tx.type === 'EXPENSE') {
      categoryTotals[tx.categoryName] = (categoryTotals[tx.categoryName] || 0) + tx.amount;
    }
  });

  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0] || ['Chưa rõ', 0];

  const hasIncome = totalIncome > 0;
  const isSurplus = netSavings > 0;
  const isDeficit = hasIncome && netSavings < 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/45 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FAF9F6] border border-[#E6E2DA] rounded-3xl w-full max-w-lg p-5 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Nút đóng */}
        <button
          onClick={() => {
            playActionClick();
            onClose();
          }}
          className="absolute top-4 right-4 w-8 h-8 rounded-full text-[#78716C] hover:text-[#1C1917] hover:bg-[#F5F3EF] flex items-center justify-center transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Tiêu đề Bức Thư Tháng */}
        <div className="text-center pb-4 border-b border-[#E6E2DA]">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#FEF3C7] text-[#B45309] flex items-center justify-center mb-2 shadow-2xs">
            <MailOpen className="w-6 h-6 stroke-[2]" />
          </div>
          <span className="text-[10px] uppercase font-mono tracking-widest text-[#B45309] font-bold">
            Bản tin tổ ấm & tài chính
          </span>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1C1917] mt-0.5 tracking-tight">
            Bức Thư {formatYearMonthLabel(currentYearMonth)}
          </h2>
          <p className="text-xs text-[#78716C] mt-1 font-serif italic">
            Gửi gửi hai vợ chồng {activeHousehold?.name || 'Tổ Ấm'} thân yêu
          </p>
        </div>

        {/* Nội dung thư */}
        <div className="py-4 space-y-4 text-xs leading-relaxed text-[#1C1917]">
          {/* Lời mở đầu tình cảm */}
          <p>
            Tháng vừa qua, tổ ấm của chúng ta đã cùng nhau đồng lòng lao động, chăm sóc gia đình và vượt qua những ngày bận rộn. Dưới đây là bức tranh tài chính trọn vẹn mà hai vợ chồng mình đã cùng nhau tạo nên:
          </p>

          {/* 3 Khối Thẻ Tóm Tắt Trụ Cột: Thu Nhập - Chi Tiêu - Tích Lũy */}
          <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
            {/* Cột 1: Thu Nhập */}
            <div className="p-3 rounded-2xl bg-[#ECFDF5] border border-[#10B981]/25 flex flex-col justify-between shadow-2xs">
              <div className="flex items-center justify-between text-[#047857]">
                <span className="text-[10px] font-semibold">Thu nhập</span>
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
              <div className="mt-2">
                <div className="font-mono font-bold text-xs sm:text-sm text-[#065F46] tabular-nums truncate">
                  {formatVND(totalIncome)}
                </div>
                <span className="text-[9px] text-[#059669] font-medium block mt-0.5">
                  {hasIncome ? 'Nguồn lực tạo ra' : 'Chưa ghi nhận'}
                </span>
              </div>
            </div>

            {/* Cột 2: Chi Tiêu */}
            <div className="p-3 rounded-2xl bg-[#FFF7ED] border border-[#EA580C]/25 flex flex-col justify-between shadow-2xs">
              <div className="flex items-center justify-between text-[#C2410C]">
                <span className="text-[10px] font-semibold">Chi tiêu</span>
                <Receipt className="w-3.5 h-3.5" />
              </div>
              <div className="mt-2">
                <div className="font-mono font-bold text-xs sm:text-sm text-[#9A3412] tabular-nums truncate">
                  {formatVND(totalExpense)}
                </div>
                <span className="text-[9px] text-[#C2410C] font-medium block mt-0.5">
                  Chăm lo tổ ấm
                </span>
              </div>
            </div>

            {/* Cột 3: Tích Lũy (Tiết Kiệm) */}
            <div className={`p-3 rounded-2xl border flex flex-col justify-between shadow-2xs ${
              isSurplus 
                ? 'bg-[#E7EFEF] border-[#0F3D39]/25 text-[#0F3D39]' 
                : isDeficit 
                ? 'bg-[#FEF2F2] border-[#EF4444]/25 text-[#991B1B]'
                : 'bg-[#F5F3EF] border-[#E6E2DA] text-[#78716C]'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold">
                  {isDeficit ? 'Bội chi' : 'Tích lũy'}
                </span>
                <PiggyBank className="w-3.5 h-3.5" />
              </div>
              <div className="mt-2">
                <div className={`font-mono font-bold text-xs sm:text-sm tabular-nums truncate ${
                  isSurplus ? 'text-[#0F3D39]' : isDeficit ? 'text-[#DC2626]' : 'text-[#78716C]'
                }`}>
                  {isDeficit ? `-${formatVND(Math.abs(netSavings))}` : formatVND(netSavings)}
                </div>
                <span className="text-[9px] font-medium block mt-0.5">
                  {hasIncome ? `${savingsRatio}% thu nhập` : 'Cần thêm thu nhập'}
                </span>
              </div>
            </div>
          </div>

          {/* Bảng Chi Tiết Sự Gắn Kết & Đóng Góp Của Hai Vợ Chồng */}
          <div className="p-4 rounded-2xl bg-white border border-[#E6E2DA] shadow-2xs space-y-3.5">
            <h4 className="text-[11px] font-bold text-[#0F3D39] uppercase tracking-wider font-mono flex items-center gap-1.5 border-b border-[#F5F3EF] pb-2">
              <Wallet className="w-3.5 h-3.5 text-[#B45309]" />
              <span>Sự đồng hành tài chính của Vợ & Chồng</span>
            </h4>

            {/* 1. Đóng góp Thu Nhập */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-medium text-[#78716C] flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3 text-[#10B981]" /> Đóng góp thu nhập:
                </span>
                <span className="font-mono font-semibold text-[#065F46] tabular-nums">
                  {formatVND(totalIncome)}
                </span>
              </div>
              {hasIncome ? (
                <div className="grid grid-cols-2 gap-2 text-[11px] bg-[#FAF9F6] p-2 rounded-xl border border-[#E6E2DA]">
                  <div>
                    <span className="text-[#78716C]">Chồng nhận: </span>
                    <span className="font-mono font-bold text-[#0F3D39]">
                      {formatVND(husbandIncome)} <span className="text-[10px] font-normal">({husbandIncomeRatio}%)</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[#78716C]">Vợ nhận: </span>
                    <span className="font-mono font-bold text-[#B45309]">
                      {formatVND(wifeIncome)} <span className="text-[10px] font-normal">({wifeIncomeRatio}%)</span>
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-[10px] text-[#A8A29E] italic pl-4">
                  Chưa ghi nhận khoản thu nào trong tháng.
                </p>
              )}
            </div>

            {/* 2. Gánh vác Chi Tiêu */}
            <div className="space-y-1.5 pt-1 border-t border-[#F5F3EF]">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-medium text-[#78716C] flex items-center gap-1">
                  <ArrowDownRight className="w-3 h-3 text-[#C15C3D]" /> Gánh vác chi trả:
                </span>
                <span className="font-mono font-semibold text-[#9A3412] tabular-nums">
                  {formatVND(totalExpense)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] bg-[#FAF9F6] p-2 rounded-xl border border-[#E6E2DA]">
                <div>
                  <span className="text-[#78716C]">Chồng chi: </span>
                  <span className="font-mono font-bold text-[#0F3D39]">
                    {formatVND(husbandExpense)} <span className="text-[10px] font-normal">({husbandRatio}%)</span>
                  </span>
                </div>
                <div>
                  <span className="text-[#78716C]">Vợ chi: </span>
                  <span className="font-mono font-bold text-[#B45309]">
                    {formatVND(wifeExpense)} <span className="text-[10px] font-normal">({wifeRatio}%)</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Điểm nhấn chi tiêu lớn nhất */}
          <p>
            Khoản chi tiêu lớn nhất của gia đình mình trong tháng dành cho <strong className="text-[#0F3D39] font-bold">"{topCategory[0]}"</strong> với số tiền là <span className="font-mono font-bold text-[#C15C3D]">{formatVND(topCategory[1])}</span>. Đây đều là những khoản đầu tư thiết thực cho sức khỏe, con cái và sự gắn kết của tổ ấm.
          </p>

          {/* Lời nhắn nhủ thông minh theo kết quả tháng */}
          {isSurplus ? (
            <div className="p-3.5 rounded-2xl bg-[#ECFDF5] border border-[#10B981]/30 text-[#065F46] space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-xs text-[#047857]">
                <Sparkles className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Thành quả tích lũy tuyệt vời!</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Tổ ấm của chúng ta đã dành dụm được <strong>{formatVND(netSavings)}</strong> (đạt tỷ lệ tiết kiệm <strong>{savingsRatio}%</strong>). Sự vun vén và chăm chỉ của hai vợ chồng chính là nền móng vững chắc cho các mục tiêu tương lai của gia đình!
              </p>
            </div>
          ) : isDeficit ? (
            <div className="p-3.5 rounded-2xl bg-[#FFFBEB] border border-[#F59E0B]/30 text-[#92400E] space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-xs text-[#B45309]">
                <Heart className="w-3.5 h-3.5 fill-[#B45309]" />
                <span>Cùng nhau điều hòa nhịp chi tiêu</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Tháng này nhà mình có những công việc lớn cần lo toan nên tổng chi tiêu nhỉnh hơn thu nhập một chút (-{formatVND(Math.abs(netSavings))}). Không sao cả, có những thời điểm cần đầu tư cho cuộc sống; tháng sau hai vợ chồng lại cùng nhau cân đối nhé!
              </p>
            </div>
          ) : !hasIncome ? (
            <div className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E6E2DA] text-[#78716C] space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-xs text-[#0F3D39]">
                <TrendingUp className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Ghi nhận thêm thu nhập</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Đừng quên ghi nhận các khoản thu nhập (tiền lương, thưởng, kinh doanh) để bức thư tháng có thể tính toán chính xác số tiền tích lũy và tỷ lệ tiết kiệm của tổ ấm nhé.
              </p>
            </div>
          ) : null}

          {/* Lời nhắn nhủ ấm áp triết lý Warm Linen */}
          <div className="p-4 rounded-2xl bg-[#E7EFEF] border border-[#0F3D39]/20 text-[#0F3D39] space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-xs">
              <Heart className="w-3.5 h-3.5 fill-[#0F3D39]" />
              <span>Hạnh phúc từ sự sẻ chia</span>
            </div>
            <p className="text-[11px] leading-relaxed opacity-90">
              Tiền bạc là công cụ để vun đắp tổ ấm. Dù tháng này chi nhiều hay ít, sự minh bạch, thấu hiểu và đồng lòng của hai vợ chồng chính là tài sản quý giá nhất!
            </p>
          </div>
        </div>

        {/* Chữ ký chân thành */}
        <div className="pt-3 border-t border-[#E6E2DA] flex items-center justify-between text-xs text-[#78716C]">
          <span className="flex items-center gap-1 font-mono text-[11px]">
            <Sparkles className="w-3 h-3 text-[#B45309]" />
            Tổ Ấm Nhỏ Harmony Ledger
          </span>
          <span className="font-serif italic text-[11px]">Tình yêu trong từng con số</span>
        </div>
      </div>
    </div>
  );
};
