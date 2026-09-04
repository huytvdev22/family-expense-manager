import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShoppingCart, 
  Baby, 
  Zap, 
  Coffee, 
  Fuel, 
  Pill, 
  Armchair, 
  Coins,
  Plus
} from 'lucide-react';
import { soundEngine, triggerHaptic } from '../utils/audio';
import type { QuickTag } from '../types';

const ICON_MAP: Record<string, React.ElementType> = {
  ShoppingCart,
  Baby,
  Zap,
  Coffee,
  Fuel,
  Pill,
  Armchair,
  Coins
};

interface QuickTagsProps {
  onSelectTag: (tag: QuickTag) => void;
  onOpenCustomModal: () => void;
}

export const QuickTags: React.FC<QuickTagsProps> = ({ onSelectTag, onOpenCustomModal }) => {
  const { quickTags } = useApp();

  const handleTagClick = (tag: QuickTag) => {
    soundEngine.playWoodClick(1.1);
    triggerHaptic(10);
    onSelectTag(tag);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#516361]">
          Quick Tags 1-Chạm (Nhập siêu nhanh)
        </h2>
        <button
          onClick={onOpenCustomModal}
          className="text-xs text-[#0F3D39] hover:underline font-medium flex items-center gap-0.5"
        >
          <Plus className="w-3.5 h-3.5" />
          Nhập tùy chỉnh
        </button>
      </div>

      {/* Dải cuộn ngang */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-1">
        {quickTags.map((tag) => {
          const IconComponent = ICON_MAP[tag.icon] || ShoppingCart;
          return (
            <button
              key={tag.id}
              onClick={() => handleTagClick(tag)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-[#FFFFFF] border border-[#D2DDD8] shadow-sm hover:border-[#0F3D39] hover:bg-[#F0F4F2] transition-all shrink-0 active:scale-95"
            >
              <div className="w-6 h-6 rounded-lg bg-[#FAF9F6] border border-[#D2DDD8] flex items-center justify-center text-[#0F3D39]">
                <IconComponent className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-semibold text-[#192423] whitespace-nowrap">
                {tag.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
