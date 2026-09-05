import React from 'react';
import { 
  Home, 
  Coffee, 
  HeartPulse, 
  PiggyBank, 
  Folder, 
  ShoppingCart, 
  Utensils, 
  Car, 
  Baby, 
  Zap, 
  Sparkles,
  BookOpen,
  Plane,
  Dumbbell,
  Gift,
  Phone,
  Shield,
  Briefcase,
  Layers,
  Landmark,
  ShieldCheck,
  Target,
  Wallet,
  Coins,
  Banknote,
  type LucideIcon
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  'home': Home,
  'coffee': Coffee,
  'heart-pulse': HeartPulse,
  'piggy-bank': PiggyBank,
  'folder': Folder,
  'shopping-cart': ShoppingCart,
  'utensils': Utensils,
  'car': Car,
  'baby': Baby,
  'zap': Zap,
  'sparkles': Sparkles,
  'book-open': BookOpen,
  'plane': Plane,
  'dumbbell': Dumbbell,
  'gift': Gift,
  'phone': Phone,
  'shield': Shield,
  'shield-check': ShieldCheck,
  'briefcase': Briefcase,
  'landmark': Landmark,
  'bank': Landmark,
  'target': Target,
  'wallet': Wallet,
  'coins': Coins,
  'banknote': Banknote,
};

/**
 * Render icon cho danh mục:
 * - Nếu icon là key Lucide ('home', 'coffee', 'piggy-bank'...), render component LucideIcon tương ứng
 * - Nếu icon là emoji (ví dụ: '🛒', '🍼'...), render emoji dạng text
 * - Nếu không tìm thấy, fallback về Folder icon
 */
export const renderCategoryIcon = (
  iconName: string | undefined, 
  className: string = "w-4 h-4", 
  color?: string
): React.ReactNode => {
  if (!iconName) {
    return <Layers className={className} style={{ color }} />;
  }

  const normalized = iconName.toLowerCase().trim();
  const IconComponent = ICON_MAP[normalized];

  if (IconComponent) {
    return <IconComponent className={className} style={{ color }} />;
  }

  // Nếu là chuỗi ngắn (emoji, text)
  if (iconName.length <= 4) {
    return <span className="text-sm select-none leading-none">{iconName}</span>;
  }

  return <Folder className={className} style={{ color }} />;
};

/**
 * Render icon cho Mục tiêu tài chính (Financial Goal):
 * - Nếu icon là key Lucide ('landmark', 'piggy-bank', 'shield-check'...), render LucideIcon tương ứng
 * - Nếu icon là emoji (<= 4 ký tự), render emoji dạng text
 * - Fallback theo goalType ('DEBT_PAYOFF' -> Landmark, 'SAVINGS' -> PiggyBank) hoặc Target
 */
export const renderGoalIcon = (
  iconName: string | undefined,
  goalType?: 'DEBT_PAYOFF' | 'SAVINGS',
  className: string = "w-3.5 h-3.5",
  color?: string
): React.ReactNode => {
  if (iconName) {
    const normalized = iconName.toLowerCase().trim();
    const IconComponent = ICON_MAP[normalized];
    if (IconComponent) {
      return <IconComponent className={className} style={{ color }} />;
    }
    // Nếu là emoji hoặc ký tự ngắn
    if (iconName.length <= 4) {
      return <span className="text-xs select-none leading-none">{iconName}</span>;
    }
  }

  // Fallback theo loại mục tiêu
  if (goalType === 'DEBT_PAYOFF') {
    return <Landmark className={className} style={{ color }} />;
  }
  if (goalType === 'SAVINGS') {
    return <PiggyBank className={className} style={{ color }} />;
  }
  return <Target className={className} style={{ color }} />;
};
