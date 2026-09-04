import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { playActionClick } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';

interface MonthPickerProps {
  className?: string;
}

export const MonthPicker: React.FC<MonthPickerProps> = ({ className = '' }) => {
  const { currentYearMonth, goToPreviousMonth, goToNextMonth } = useApp();

  const handleNav = (action: () => void) => {
    playActionClick();
    triggerHaptic(10);
    action();
  };

  const formatLabel = (ym: string) => {
    const [year, month] = ym.split('-');
    return `Tháng ${month}/${year}`;
  };

  return (
    <div className={`flex items-center bg-white border border-[#E6E2DA] rounded-2xl p-1 shadow-2xs ${className}`}>
      <button
        onClick={() => handleNav(goToPreviousMonth)}
        className="w-8 h-8 flex items-center justify-center rounded-xl text-[#78716C] hover:text-[#1C1917] hover:bg-[#F5F3EF] active:scale-95 transition-all tactile-btn"
        title="Tháng trước"
        aria-label="Tháng trước"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-1.5 px-3 min-w-[125px] justify-center select-none">
        <Calendar className="w-3.5 h-3.5 text-[#0F3D39]" />
        <span className="text-xs font-bold text-[#1C1917] font-mono tracking-tight whitespace-nowrap">
          {formatLabel(currentYearMonth)}
        </span>
      </div>

      <button
        onClick={() => handleNav(goToNextMonth)}
        className="w-8 h-8 flex items-center justify-center rounded-xl text-[#78716C] hover:text-[#1C1917] hover:bg-[#F5F3EF] active:scale-95 transition-all tactile-btn"
        title="Tháng sau"
        aria-label="Tháng sau"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};
