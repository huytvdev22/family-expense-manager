import React, { useState, useMemo } from 'react';
import { BarChart3, Calendar, Info } from 'lucide-react';
import type { Transaction } from '../types';
import { formatVND } from '../utils/currency';
import { playKeyClick } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';

interface DailySpendingChartProps {
  transactions: Transaction[];
  currentYearMonth: string; // "YYYY-MM"
}

export const DailySpendingChart: React.FC<DailySpendingChartProps> = ({
  transactions,
  currentYearMonth
}) => {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Tính số ngày trong tháng và dữ liệu chi tiêu từng ngày
  const { dailyData, maxAmount, avgDailyAmount, totalMonthDays, todayDay } = useMemo(() => {
    const [yearStr, monthStr] = currentYearMonth.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr);

    // Số ngày trong tháng (tháng 1-12 trong JS là month - 1)
    const daysInMonth = new Date(year, month, 0).getDate();

    // Xác định xem có phải tháng hiện tại không để đánh dấu hôm nay
    const now = new Date();
    const isCurrentMonth = now.getFullYear() === year && (now.getMonth() + 1) === month;
    const currentDay = isCurrentMonth ? now.getDate() : -1;

    // Tổng hợp chi tiêu theo ngày (1..daysInMonth)
    const dayMap: Record<number, { amount: number; count: number }> = {};
    for (let d = 1; d <= daysInMonth; d++) {
      dayMap[d] = { amount: 0, count: 0 };
    }

    let totalExpense = 0;
    let daysWithSpend = 0;

    transactions.forEach((tx) => {
      if (tx.type === 'EXPENSE' && tx.date) {
        const txDay = Number(tx.date.split('-')[2]);
        if (dayMap[txDay]) {
          dayMap[txDay].amount += tx.amount;
          dayMap[txDay].count += 1;
        }
      }
    });

    let maxVal = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const amt = dayMap[d].amount;
      if (amt > maxVal) maxVal = amt;
      if (amt > 0) {
        totalExpense += amt;
        daysWithSpend += 1;
      }
    }

    // Trung bình chi tiêu mỗi ngày có chi (hoặc trung bình trên số ngày đã qua)
    const activeDays = currentDay > 0 ? Math.max(1, currentDay) : daysInMonth;
    const avg = totalExpense / activeDays;

    return {
      dailyData: dayMap,
      maxAmount: maxVal > 0 ? maxVal : 1,
      avgDailyAmount: avg,
      totalMonthDays: daysInMonth,
      todayDay: currentDay
    };
  }, [transactions, currentYearMonth]);

  const handleSelectDay = (day: number) => {
    playKeyClick();
    triggerHaptic(6);
    setSelectedDay(selectedDay === day ? null : day);
  };

  const selectedData = selectedDay ? dailyData[selectedDay] : null;

  return (
    <div className="bg-white border border-[#E6E2DA] rounded-3xl p-5 shadow-xs flex flex-col gap-4">
      {/* Tiêu đề & Thông số nhanh */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F5F3EF] pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#FAF0E6] text-[#B45309] flex items-center justify-center">
            <BarChart3 className="w-4 h-4 stroke-[2]" />
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#1C1917]">
              Nhịp điệu chi tiêu theo ngày
            </h3>
            <p className="text-[11px] text-[#78716C]">
              Trung bình: <span className="font-mono font-medium text-[#1C1917]">{formatVND(Math.round(avgDailyAmount))}</span>/ngày
            </p>
          </div>
        </div>

        {/* Chú thích màu sắc */}
        <div className="flex items-center gap-3 text-[10px] text-[#78716C] font-mono">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-xs bg-[#0F3D39]" />
            <span>Thường nhật</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-xs bg-[#B45309]" />
            <span>Đột biến (&gt;1.5x)</span>
          </div>
        </div>
      </div>

      {/* Chi tiết ngày được chọn (nếu có tương tác) */}
      {selectedDay && selectedData && (
        <div className="bg-[#FAF9F6] border border-[#E6E2DA] rounded-2xl p-3 flex items-center justify-between text-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#0F3D39]" />
            <span className="font-semibold text-[#1C1917]">
              Ngày {selectedDay.toString().padStart(2, '0')}/{currentYearMonth.split('-')[1]}
            </span>
            {selectedDay === todayDay && (
              <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-full bg-[#E7EFEF] text-[#0F3D39] font-mono font-medium">
                Hôm nay
              </span>
            )}
          </div>

          <div className="text-right">
            <span className="font-mono font-bold text-[#1C1917] tabular-nums">
              {formatVND(selectedData.amount)}
            </span>
            <span className="text-[10px] text-[#78716C] block">
              {selectedData.count > 0 ? `${selectedData.count} giao dịch` : 'Không phát sinh chi tiêu'}
            </span>
          </div>
        </div>
      )}

      {/* Biểu đồ cột SVG / Flex tối giản Dieter Rams */}
      <div className="pt-2">
        <div className="h-32 flex items-end justify-between gap-1 sm:gap-1.5 px-1 relative">
          {/* Đường trung bình ngày (Dashed baseline) */}
          {avgDailyAmount > 0 && maxAmount > 0 && (
            <div
              className="absolute left-0 right-0 border-t border-dashed border-[#B45309]/40 pointer-events-none z-0"
              style={{
                bottom: `${Math.min(95, Math.max(5, (avgDailyAmount / maxAmount) * 100))}%`
              }}
              title={`Trung bình: ${formatVND(Math.round(avgDailyAmount))}`}
            />
          )}

          {Array.from({ length: totalMonthDays }, (_, i) => i + 1).map((day) => {
            const data = dailyData[day];
            const heightPercent = data.amount > 0 ? Math.max(8, (data.amount / maxAmount) * 100) : 2;
            const isSpike = data.amount > avgDailyAmount * 1.5 && data.amount > 0;
            const isSelected = selectedDay === day;
            const isToday = todayDay === day;

            let barColor = data.amount > 0 ? (isSpike ? '#B45309' : '#0F3D39') : '#E6E2DA';
            if (isSelected) barColor = '#1C1917';

            return (
              <button
                key={day}
                type="button"
                onClick={() => handleSelectDay(day)}
                className="flex-1 flex flex-col items-center h-full justify-end group focus:outline-hidden relative z-10 tactile-btn"
                title={`Ngày ${day}: ${formatVND(data.amount)}`}
              >
                {/* Thanh cột */}
                <div
                  className={`w-full rounded-t-xs transition-all duration-200 ${
                    isSelected ? 'ring-2 ring-[#1C1917]' : ''
                  }`}
                  style={{
                    height: `${heightPercent}%`,
                    backgroundColor: barColor
                  }}
                />

                {/* Điểm đánh dấu hôm nay */}
                {isToday && (
                  <div className="w-1.5 h-1.5 rounded-full bg-[#0F3D39] absolute -bottom-2" />
                )}
              </button>
            );
          })}
        </div>

        {/* Trục nhãn ngày: 1, 5, 10, 15, 20, 25, ngày cuối */}
        <div className="flex justify-between text-[9px] font-mono text-[#A8A29E] mt-3 px-1">
          <span>01</span>
          <span>05</span>
          <span>10</span>
          <span>15</span>
          <span>20</span>
          <span>25</span>
          <span>{totalMonthDays}</span>
        </div>
      </div>
    </div>
  );
};
