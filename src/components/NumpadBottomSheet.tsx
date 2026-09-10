import React from 'react';
import { BottomSheet } from './BottomSheet';
import { Numpad } from './Numpad';

interface NumpadBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NumpadBottomSheet: React.FC<NumpadBottomSheetProps> = ({ isOpen, onClose }) => {
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Ghi nhận thu chi"
      subtitle="Nhập số tiền hoặc chạm gợi ý nhanh"
      icon={
        <div className="w-7 h-7 rounded-xl bg-[#0F3D39] text-[#FAF9F6] flex items-center justify-center shadow-2xs text-xs font-bold font-mono">
          ₫
        </div>
      }
      maxHeight="max-h-[94dvh]"
      panelClassName="bg-[#FAF9F6]"
      bodyClassName="p-2.5 sm:p-3 pb-4"
    >
      <Numpad
        isBottomSheet
        onSuccess={onClose}
      />
    </BottomSheet>
  );
};
