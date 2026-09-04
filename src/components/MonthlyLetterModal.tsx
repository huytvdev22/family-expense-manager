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
      <div className="w-full max-w-lg bg-neutral rounded-3xl border border-border shadow-2xl p-6 space-y-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-tertiary text-white flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-primary">Bức Thư Tháng Của Tổ Ấm</h2>
              <p className="text-[11px] text-on-surface-variant">Mẫu email gửi tự động vào 08:00 ngày 01 hàng tháng</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Khung mô phỏng email ấm áp (Warm Letter Theme) */}
        <div className="flex-1 overflow-y-auto space-y-4 p-5 bg-surface rounded-2xl border border-border text-on-surface font-serif text-sm leading-relaxed shadow-inner">
          <div className="text-center pb-3 border-b border-border/60 font-sans">
            <div className="inline-flex items-center gap-1 text-xs font-bold text-tertiary bg-warning-container px-3 py-1 rounded-full mb-1">
              <Heart className="w-3 h-3 text-expense fill-expense" />
              <span>Gửi hai vợ chồng {household.name}</span>
            </div>
            <h3 className="text-base font-bold text-primary">
              Bản Tin Tài Chính Tháng {monthlySummary.yearMonth}
            </h3>
            <p className="text-[11px] text-on-surface-variant">Cùng nhau vun vén — Hạnh phúc nhân đôi</p>
          </div>

          <p>
            Chào hai vợ chồng! Tháng vừa qua là một chặng đường nỗ lực tuyệt vời của cả hai. Dù cuộc sống bận rộn với bao lo toan, hai bạn vẫn luôn sát cánh để xây đắp một tổ ấm vững chãi và ấm áp.
          </p>

          {/* Khối Chỉ Số Vĩ Mô */}
          <div className="grid grid-cols-3 gap-2 py-3 bg-neutral rounded-xl border border-border text-center font-sans">
            <div>
              <div className="text-[10px] text-on-surface-variant">Tổng thu</div>
              <div className="text-xs font-bold font-mono text-income-text">
                {formatVND(monthlySummary.totalIncome)}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-on-surface-variant">Tổng chi</div>
              <div className="text-xs font-bold font-mono text-primary">
                {formatVND(monthlySummary.totalExpense)}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-on-surface-variant">Tích lũy</div>
              <div className="text-xs font-bold font-mono text-tertiary">
                {monthlySummary.savingsPercent}%
              </div>
            </div>
          </div>

          <p>
            Tháng này, cả nhà đã tiết kiệm được <strong className="font-mono text-income-text">{formatVND(monthlySummary.netSavings)}</strong>, đạt tỷ lệ tích lũy <strong>{monthlySummary.savingsPercent}%</strong> trên tổng thu nhập. Đây là một con số rất đáng tự hào!
          </p>

          {/* Cán Cân Đồng Hành */}
          <div className="p-3 bg-surface-container rounded-xl font-sans text-xs space-y-1">
            <div className="font-bold text-primary flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-tertiary" />
              Sự chung tay của hai bạn:
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>👨 Chồng đã chi trả: <strong className="font-mono text-primary">{formatVND(husbandExpense)}</strong></span>
              <span>👩 Vợ đã chi trả: <strong className="font-mono text-tertiary">{formatVND(wifeExpense)}</strong></span>
            </div>
          </div>

          {/* Chi tiết nhóm chi */}
          <div className="font-sans text-xs space-y-1.5 pt-1">
            <div className="font-semibold text-on-surface-variant">Phân bổ các nhóm chi tiêu:</div>
            {categories.map(cat => {
              const spent = monthlySummary.byCategory[cat.id] || 0;
              if (spent <= 0) return null;

              return (
                <div key={cat.id} className="flex justify-between items-center py-1 border-b border-neutral">
                  <span className="flex items-center gap-1.5 text-on-surface">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                    {cat.name}
                  </span>
                  <span className="font-mono font-bold text-primary">{formatVND(spent)}</span>
                </div>
              );
            })}
          </div>

          <p className="pt-2 text-xs italic text-on-surface-variant">
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
          className="w-full py-3 rounded-2xl bg-primary text-on-primary text-xs font-bold flex items-center justify-center gap-2 hover:bg-primary-hover transition-colors shadow-sm"
        >
          <Send className="w-4 h-4" />
          Gửi Thử Nghiệm Bức Thư Tháng Tới 2 Gmail
        </button>
      </div>
    </div>
  );
};
