import React from 'react';
import { DEFAULT_QUICK_TAGS } from '../services/mockData';
import type { QuickTagItem } from '../types';
import { playActionClick } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';

interface QuickTagsProps {
  onSelectTag: (tag: QuickTagItem) => void;
  selectedTagId?: string | null;
  tags?: QuickTagItem[];
}

export const QuickTags: React.FC<QuickTagsProps> = ({ onSelectTag, selectedTagId, tags }) => {
  const displayTags = tags || DEFAULT_QUICK_TAGS;
  const handleClick = (tag: QuickTagItem) => {
    playActionClick();
    triggerHaptic(10);
    onSelectTag(tag);
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5 px-0.5">
        <span className="text-[11px] uppercase tracking-wider font-semibold text-[#78716C]">
          Gợi ý 1-chạm (Quick Tags)
        </span>
        <span className="text-[10px] text-[#A8A29E] sm:hidden">Vuốt ngang &rarr;</span>
        <span className="text-[10px] text-[#A8A29E] hidden sm:inline">Chọn nhanh 1 chạm</span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar select-none">
        {displayTags.map((tag) => {
          const isSelected = selectedTagId === tag.id;
          return (
            <button
              key={tag.id}
              onClick={() => handleClick(tag)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all tactile-btn shadow-2xs ${
                isSelected
                  ? 'bg-[#0F3D39] text-[#FAF9F6] border-[#0F3D39] shadow-xs'
                  : 'bg-white text-[#1C1917] border-[#E6E2DA] hover:bg-[#F5F3EF]'
              }`}
            >
              <span className="text-sm">{tag.emoji}</span>
              <span className="whitespace-nowrap">{tag.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
