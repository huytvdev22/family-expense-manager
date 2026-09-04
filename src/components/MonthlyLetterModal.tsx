import React from 'react';
import { useApp } from '../context/AppContext';
import { X, Mail, Heart, Sparkles, Send } from 'lucide-react';
import { formatVND } from '../utils/currency';
import { triggerHaptic } from '../utils/audio';

interface MonthlyLetterModalProps {
  onClose: () => void;
}

export const MonthlyLetterModal: React.FC<MonthlyLetterModalProps> = ({ onClose }) => {
  const { household, monthlySummary, categories } = useApp();

  const husbandExpense = monthlySummary.byMember['Chồng'] || 0;
  const wifeExpense = monthlySummary.byMember['Vợ'] || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-[#FAF9F6] rounded-3xl border border-[#D2DDD8] shadow-2xl p-6 space-y-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#D2DDD8]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#B45309] text-white flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#0F3D39]">Bức Thư Tháng Của Tổ Ấm</h2>
              <p className="text-[11px] text-[#516361]">Mẫu email gửi tự động vào 08:00 ngày 01 hàng tháng</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F0F4F2] flex items-center justify-center text-[#516361] hover:text-[#192423]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Khung mô phỏng email ấm áp (Warm Letter Theme) */}
        <div className="flex-1 overflow-y-auto space-y-4 p-5 bg-[#FFFFFF] rounded-2xl border border-[#D2DDD8] text-[#192423] font-serif text-sm leading-relaxed shadow-inner">
          <div className="text-center pb-3 border-b border-[#D2DDD8]/60 font-sans">
            <div className="inline-flex items-center gap-1 text-xs font-bold text-[#B45309] bg-[#FEF3C7] px-3 py-1 rounded-full mb-1">
              <Heart className="w-3 h-3 text-[#E11D48] fill-[#E11D48]" />
              <span>Gửi hai vợ chồng {household.name}</span>
            </div>
            <h3 className="text-base font-bold text-[#0F3D39]">
              Bản Tin Tài Chính Tháng {monthlySummary.yearMonth}
            </h3>
            <p className="text-[11px] text-[#516361]">Cùng nhau vun vén — Hạnh phúc nhân đôi</p>
          </div>

          <p>
            Chào hai vợ chồng! Tháng vừa qua là một chặng đường nỗ lực tuyệt vời của cả hai. Dù cuộc sống bận rộn với bao lo toan, hai bạn vẫn luôn sát cánh để xây đắp một tổ ấm vững chãi và ấm áp.
          </p>

          {/* Khối Chỉ Số Vĩ Mô */}
          <div className="grid grid-cols-3 gap-2 py-3 bg-[#FAF9F6] rounded-xl border border-[#D2DDD8] text-center font-sans">
            <div>
              <div className="text-[10px] text-[#516361]">Tổng thu</div>
              <div className="text-xs font-bold font-mono text-[#14532D]">
                {formatVND(monthlySummary.totalIncome)}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-[#516361]">Tổng chi</div>
              <div className="text-xs font-bold font-mono text-[#0F3D39]">
                {formatVND(monthlySummary.totalExpense)}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-[#516361]">Tích lũy</div>
              <div className="text-xs font-bold font-mono text-[#B45309]">
                {monthlySummary.savingsPercent}%
              </div>
            </div>
          </div>

          <p>
            Tháng này, cả nhà đã tiết kiệm được <strong className="font-mono text-[#14532D]">{formatVND(monthlySummary.netSavings)}</strong>, đạt tỷ lệ tích lũy <strong>{monthlySummary.savingsPercent}%</strong> trên tổng thu nhập. Đây là một con số rất đáng tự hào!
          </p>

          {/* Cán Cân Đồng Hành */}
          <div className="p-3 bg-[#F0F4F2] rounded-xl font-sans text-xs space-y-1">
            <div className="font-bold text-[#0F3D39] flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#B45309]" />
              Sự chung tay của hai bạn:
            </div>
            <div className="flex justify-between text-[#516361]">
              <span>👨 Chồng đã chi trả: <strong className="font-mono text-[#0F3D39]">{formatVND(husbandExpense)}</strong></span>
              <span>👩 Vợ đã chi trả: <strong className="font-mono text-[#B45309]">{formatVND(wifeExpense)}</strong></span>
            </div>
          </div>

          {/* Chi tiết nhóm chi */}
          <div className="font-sans text-xs space-y-1.5 pt-1">
            <div className="font-semibold text-[#516361]">Phân bổ các nhóm chi tiêu:</div>
            {categories.map(cat => {
              const spent = monthlySummary.byCategory[cat.id] || 0;
              if (spent <= 0) return null;
              return (
                <div key={cat.id} className="flex justify-between items-center py-1 border-b border-[#FAF9F6]">
                  <span className="flex items-center gap-1.5 text-[#192423]">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                    {cat.name}
                  </span>
                  <span className="font-mono font-bold text-[#0F3D39]">{formatVND(spent)}</span>
                </div>
              );
            })}
          </div>

          <p className="pt-2 text-xs italic text-[#516361]">
            "Hạnh phúc không nằm ở số tiền ta kiếm được, mà ở cách hai vợ chồng cùng nhau biến từng đồng tiền thành niềm vui và sự an tâm cho gia đình."
          </p>
        </div>

        {/* Footer Nút bấm */}
        <button
          onClick={() => {
            alert('Đã gửi thử nghiệm mẫu Bức thư tháng tới Gmail của hai vợ chồng!');
            triggerHaptic(15);
            onClose();
          }}
          className="w-full py-3 rounded-2xl bg-[#0F3D39] text-[#FFFFFF] text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#164E48] transition-colors shadow-sm"
        >
          <Send className="w-4 h-4" />
          Gửi Thử Nghiệm Bức Thư Tháng Tới 2 Gmail
        </button>
      </div>
    </div>
  );
};
