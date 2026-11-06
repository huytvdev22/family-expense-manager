import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Target, 
  Plus, 
  Landmark, 
  PiggyBank, 
  CheckCircle2, 
  TrendingDown, 
  TrendingUp, 
  Sparkles, 
  Edit3, 
  Trash2, 
  RotateCcw, 
  Calendar, 
  Flag, 
  X, 
  Check, 
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  History,
  Receipt,
  ArrowUpDown,
  ChevronDown,
  Pencil
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatVND, formatDateLabel } from '../utils/currency';
import { playActionClick, playSuccessChime } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';
import { renderGoalIcon } from '../utils/categoryIcons';
import type { FinancialGoal, GoalType, Transaction } from '../types';
import { sortFinancialGoals, type GoalSortOption } from '../utils/goalSorting';
import { useToast } from './Toast';
import { BottomSheet } from './BottomSheet';
import { EditTransactionModal } from './EditTransactionModal';

const GOAL_COLORS = [
  { label: 'Terracotta', hex: '#B45309' },
  { label: 'Pine Emerald', hex: '#0F3D39' },
  { label: 'Warm Amber', hex: '#D97706' },
  { label: 'Emerald Green', hex: '#10B981' },
  { label: 'Muted Sage', hex: '#4A6B68' },
  { label: 'Rose Wine', hex: '#E11D48' }
];

interface FinancialFreedomProps {
  onAddTransactionForGoal?: (goal: FinancialGoal) => void;
}

export const FinancialFreedom: React.FC<FinancialFreedomProps> = ({ onAddTransactionForGoal }) => {
  const { 
    isFirebaseActive,
    financialGoals, 
    goalTransactions, 
    transactions, 
    createGoal, 
    editGoal, 
    removeGoal, 
    activeHousehold, 
    prepareNumpadForGoal 
  } = useApp();
  const { showToast } = useToast();

  // Danh sách giao dịch mục tiêu xuyên suốt toàn bộ các tháng (lấy từ toàn bộ lịch sử, không bị giới hạn bởi tháng đang chọn)
  const allGoalTransactions = useMemo(() => {
    if (isFirebaseActive) {
      return goalTransactions || [];
    }
    return transactions.filter((tx) => Boolean(tx.goalId));
  }, [isFirebaseActive, goalTransactions, transactions]);

  // Bộ lọc loại mục tiêu: 'ALL' | 'DEBT_PAYOFF' | 'SAVINGS'
  const [filterType, setFilterType] = useState<'ALL' | GoalType>('ALL');

  // Modal tạo / chỉnh sửa mục tiêu
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);

  // Form states cho Modal
  const [formType, setFormType] = useState<GoalType>('DEBT_PAYOFF');
  const [formTitle, setFormTitle] = useState<string>('');
  const [formInitialAmount, setFormInitialAmount] = useState<string>('');
  const [formCurrentAmount, setFormCurrentAmount] = useState<string>('');
  const [formTargetAmount, setFormTargetAmount] = useState<string>('');
  const [formMonthlyTarget, setFormMonthlyTarget] = useState<string>('');
  const [formColor, setFormColor] = useState<string>(GOAL_COLORS[0].hex);
  const [formNote, setFormNote] = useState<string>('');

  // Modal xem lịch sử tích lũy / trả nợ của mục tiêu
  const [selectedHistoryGoal, setSelectedHistoryGoal] = useState<FinancialGoal | null>(null);

  // Giao dịch được chọn để chỉnh sửa trong modal lịch sử
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // Đối tượng mục tiêu đang xem lịch sử được đồng bộ realtime theo financialGoals
  const activeHistoryGoal = useMemo(() => {
    if (!selectedHistoryGoal) return null;
    return financialGoals.find((g) => g.id === selectedHistoryGoal.id) || selectedHistoryGoal;
  }, [financialGoals, selectedHistoryGoal]);

  // Thống kê số lượng giao dịch, tiền gốc và tiền lãi đã gắn với từng mục tiêu (toàn bộ lịch sử các tháng)
  const goalLedgerStats = useMemo(() => {
    const map: Record<string, { count: number; principalPaid: number; interestPaid: number; totalAmount: number }> = {};
    allGoalTransactions.forEach((tx) => {
      if (tx.goalId) {
        if (!map[tx.goalId]) {
          map[tx.goalId] = { count: 0, principalPaid: 0, interestPaid: 0, totalAmount: 0 };
        }
        map[tx.goalId].count += 1;
        map[tx.goalId].totalAmount += tx.amount;
        if (tx.debtPaymentType === 'INTEREST') {
          map[tx.goalId].interestPaid += tx.amount;
        } else {
          map[tx.goalId].principalPaid += tx.amount;
        }
      }
    });
    return map;
  }, [allGoalTransactions]);

  // Thống kê số lượng giao dịch đã gắn với từng mục tiêu
  const goalTxCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.entries(goalLedgerStats).forEach(([goalId, s]) => {
      counts[goalId] = s.count;
    });
    return counts;
  }, [goalLedgerStats]);

  // Danh sách giao dịch của mục tiêu được chọn xem lịch sử (toàn bộ lịch sử các tháng)
  const historyTransactions = useMemo(() => {
    if (!selectedHistoryGoal) return [];
    return allGoalTransactions
      .filter((tx) => tx.goalId === selectedHistoryGoal.id)
      .sort((a, b) => {
        const dateDiff = (b.date || '').localeCompare(a.date || '');
        if (dateDiff !== 0) return dateDiff;
        return (b.timestamp || 0) - (a.timestamp || 0);
      });
  }, [allGoalTransactions, selectedHistoryGoal]);

  // Tổng số tiền đã thanh toán (chia gốc & lãi) / tích lũy qua các giao dịch
  const { historyTotalRecordedAmount, historyPrincipalPaid, historyInterestPaid } = useMemo(() => {
    let total = 0;
    let principal = 0;
    let interest = 0;
    historyTransactions.forEach((tx) => {
      total += tx.amount;
      if (tx.debtPaymentType === 'INTEREST') {
        interest += tx.amount;
      } else {
        principal += tx.amount;
      }
    });
    return {
      historyTotalRecordedAmount: total,
      historyPrincipalPaid: principal,
      historyInterestPaid: interest
    };
  }, [historyTransactions]);

  // Nhóm danh sách giao dịch lịch sử theo từng tháng (YYYY-MM)
  const groupedHistoryByMonth = useMemo(() => {
    if (!historyTransactions.length) return [];

    const groups: Record<string, {
      monthKey: string;
      monthLabel: string;
      items: Transaction[];
      monthTotal: number;
      monthPrincipalPaid: number;
      monthInterestPaid: number;
    }> = {};

    historyTransactions.forEach((tx) => {
      const monthKey = tx.date ? tx.date.substring(0, 7) : 'other';
      if (!groups[monthKey]) {
        let label = 'Khác';
        if (monthKey !== 'other' && monthKey.includes('-')) {
          const [y, m] = monthKey.split('-');
          label = `Tháng ${parseInt(m, 10)}/${y}`;
        }
        groups[monthKey] = {
          monthKey,
          monthLabel: label,
          items: [],
          monthTotal: 0,
          monthPrincipalPaid: 0,
          monthInterestPaid: 0,
        };
      }
      groups[monthKey].items.push(tx);
      groups[monthKey].monthTotal += tx.amount;
      if (tx.debtPaymentType === 'INTEREST') {
        groups[monthKey].monthInterestPaid += tx.amount;
      } else {
        groups[monthKey].monthPrincipalPaid += tx.amount;
      }
    });

    // Sắp xếp các tháng giảm dần (tháng gần nhất lên trước)
    return Object.keys(groups)
      .sort((a, b) => b.localeCompare(a))
      .map((key) => groups[key]);
  }, [historyTransactions]);

  // Thứ tự sắp xếp mục tiêu: Mặc định ưu tiên sắp hoàn thành lên trước, theo số tiền
  const [sortBy, setSortBy] = useState<GoalSortOption>('COMPLETION_AND_AMOUNT');
  const [isSortOpen, setIsSortOpen] = useState<boolean>(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  // Đóng dropdown khi bấm ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    };

    if (isSortOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isSortOpen]);

  const SORT_OPTIONS: { value: GoalSortOption; label: string }[] = [
    { value: 'COMPLETION_AND_AMOUNT', label: 'Sắp hoàn thành nhất' },
    { value: 'REMAINING_AMOUNT_ASC', label: 'Số tiền ít nhất (Snowball)' },
    { value: 'REMAINING_AMOUNT_DESC', label: 'Số tiền nhiều nhất (Avalanche)' },
    { value: 'NEWEST', label: 'Mới tạo gần đây' }
  ];

  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label || 'Sắp xếp';

  // Lọc và sắp xếp danh sách mục tiêu
  const filteredGoals = useMemo(() => {
    const list = filterType === 'ALL' 
      ? financialGoals 
      : financialGoals.filter((g) => g.type === filterType);
    return sortFinancialGoals(list, sortBy);
  }, [financialGoals, filterType, sortBy]);

  // Thống kê tổng hợp
  const stats = useMemo(() => {
    let totalDebtInitial = 0;
    let totalDebtCurrent = 0;
    let totalDebtInterestRecorded = 0;
    let totalSavingsCurrent = 0;
    let totalSavingsTarget = 0;

    financialGoals.forEach((g) => {
      if (g.type === 'DEBT_PAYOFF') {
        totalDebtInitial += g.initialAmount;
        totalDebtCurrent += g.currentAmount;
        totalDebtInterestRecorded += goalLedgerStats[g.id]?.interestPaid || 0;
      } else {
        totalSavingsCurrent += g.currentAmount;
        totalSavingsTarget += g.targetAmount;
      }
    });

    const totalDebtPaid = Math.max(0, totalDebtInitial - totalDebtCurrent);
    const debtPayoffPercent = totalDebtInitial > 0 ? Math.round((totalDebtPaid / totalDebtInitial) * 100) : 0;
    const savingsPercent = totalSavingsTarget > 0 ? Math.round((totalSavingsCurrent / totalSavingsTarget) * 100) : 0;

    return {
      totalDebtInitial,
      totalDebtCurrent,
      totalDebtPaid,
      totalDebtInterestRecorded,
      debtPayoffPercent,
      totalSavingsCurrent,
      totalSavingsTarget,
      savingsPercent
    };
  }, [financialGoals, goalLedgerStats]);

  // Mở modal tạo mới
  const handleOpenCreate = (defaultType: GoalType = 'DEBT_PAYOFF') => {
    playActionClick();
    triggerHaptic(10);
    setEditingGoal(null);
    setFormType(defaultType);
    setFormTitle(defaultType === 'DEBT_PAYOFF' ? 'Khoản vay ngân hàng mua nhà' : 'Quỹ dự phòng khẩn cấp');
    setFormInitialAmount(defaultType === 'DEBT_PAYOFF' ? '1500000000' : '0');
    setFormCurrentAmount(defaultType === 'DEBT_PAYOFF' ? '700000000' : '0');
    setFormTargetAmount(defaultType === 'DEBT_PAYOFF' ? '0' : '100000000');
    setFormMonthlyTarget('15000000');
    setFormColor(defaultType === 'DEBT_PAYOFF' ? '#B45309' : '#10B981');
    setFormNote('');
    setIsModalOpen(true);
  };

  // Mở modal chỉnh sửa
  const handleOpenEdit = (goal: FinancialGoal) => {
    playActionClick();
    triggerHaptic(10);
    setEditingGoal(goal);
    setFormType(goal.type);
    setFormTitle(goal.title);
    setFormInitialAmount(String(goal.initialAmount));
    setFormCurrentAmount(String(goal.currentAmount));
    setFormTargetAmount(String(goal.targetAmount));
    setFormMonthlyTarget(goal.monthlyTarget ? String(goal.monthlyTarget) : '');
    setFormColor(goal.color || GOAL_COLORS[0].hex);
    setFormNote(goal.note || '');
    setIsModalOpen(true);
  };

  // Lưu Form
  const handleSaveGoal = async () => {
    if (!formTitle.trim()) {
      showToast('Vui lòng nhập tên mục tiêu!', 'warning');
      return;
    }

    const initAmt = Number(formInitialAmount) || 0;
    const currAmt = Number(formCurrentAmount) || 0;
    const targAmt = formType === 'DEBT_PAYOFF' ? 0 : (Number(formTargetAmount) || 0);
    const monthTarg = Number(formMonthlyTarget) || undefined;

    if (formType === 'SAVINGS' && targAmt <= 0) {
      showToast('Vui lòng nhập mục tiêu muốn đạt được lớn hơn 0 đ!', 'warning');
      return;
    }

    if (formType === 'DEBT_PAYOFF' && initAmt <= 0) {
      showToast('Vui lòng nhập tổng nợ gốc ban đầu lớn hơn 0 đ!', 'warning');
      return;
    }

    playSuccessChime();
    triggerHaptic(15);

    if (editingGoal) {
      await editGoal(editingGoal.id, {
        title: formTitle.trim(),
        type: formType,
        initialAmount: initAmt,
        currentAmount: currAmt,
        targetAmount: targAmt,
        monthlyTarget: monthTarg,
        color: formColor,
        note: formNote.trim()
      });
    } else {
      await createGoal({
        title: formTitle.trim(),
        type: formType,
        initialAmount: initAmt,
        currentAmount: currAmt,
        targetAmount: targAmt,
        monthlyTarget: monthTarg,
        color: formColor,
        icon: formType === 'DEBT_PAYOFF' ? 'landmark' : 'piggy-bank',
        note: formNote.trim(),
        status: 'ACTIVE'
      });
    }

    setIsModalOpen(false);
  };

  // Xử lý thêm nhanh giao dịch trực tiếp từ mục tiêu (Trả nợ / Tích lũy)
  const handleAddForGoal = (goal: FinancialGoal) => {
    playActionClick();
    triggerHaptic(12);
    if (onAddTransactionForGoal) {
      onAddTransactionForGoal(goal);
    } else if (prepareNumpadForGoal) {
      prepareNumpadForGoal(goal);
    }
  };


  return (
    <div className="space-y-4">
      {/* =========================================================================
          1. HEADER PHÂN HỆ TỰ DO TÀI CHÍNH & BANNER TỔNG QUAN
          ========================================================================= */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-[#1C1917] tracking-tight">
              Mục tiêu tài chính
            </h2>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#B45309] border border-[#B45309]/20 shrink-0 inline-flex items-center">
              {financialGoals.length} mục tiêu
            </span>
          </div>
          <p className="text-xs text-[#78716C] mt-0.5 hidden sm:block">
            Kế hoạch xóa nợ bền bỉ & tích lũy tài sản đồng hành cùng {activeHousehold?.name || 'tổ ấm'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleOpenCreate('DEBT_PAYOFF')}
          className="h-8 sm:h-9 px-3 sm:px-3.5 rounded-xl bg-[#0F3D39] hover:bg-[#174E4A] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">Thêm mục tiêu</span>
          <span className="xs:hidden">Thêm</span>
        </button>
      </div>

      {/* BANNER 2 CỘT TỔNG HỢP: KHOẢN NỢ & QUỸ TÍCH LŨY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Cột 1: Bức tranh Khoản nợ & Tự do */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#E6E2DA] shadow-2xs space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#B45309]/5 rounded-full -mr-10 -mt-10 pointer-events-none" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#FEF3C7] text-[#B45309] flex items-center justify-center">
                <TrendingDown className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-[#1C1917] uppercase tracking-wider font-mono">
                Tổng dư nợ cần thanh toán
              </span>
            </div>
            <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#065F46] border border-[#10B981]/30">
              Đã trả {stats.debtPayoffPercent}%
            </span>
          </div>

          <div>
            <p className="text-2xl sm:text-3xl font-bold font-mono text-[#B45309] tracking-tight">
              {formatVND(stats.totalDebtCurrent)}
            </p>
            <div className="flex items-center justify-between text-[11px] text-[#78716C] mt-1 font-mono flex-wrap gap-x-2 gap-y-0.5">
              <span>Đã trả gốc: <strong className="text-[#0F3D39]">{formatVND(stats.totalDebtPaid)}</strong></span>
              {stats.totalDebtInterestRecorded > 0 && (
                <span>Đã trả lãi: <strong className="text-[#B45309]">{formatVND(stats.totalDebtInterestRecorded)}</strong></span>
              )}
              <span>Gốc ban đầu: {formatVND(stats.totalDebtInitial)}</span>
            </div>
          </div>

          {/* Thanh đo tiến độ xóa nợ */}
          <div className="space-y-1 pt-1">
            <div className="w-full h-3 bg-[#F5F3EF] rounded-full overflow-hidden p-0.5 border border-[#E6E2DA]">
              <div 
                className="h-full bg-[#0F3D39] rounded-full transition-all duration-500 relative"
                style={{ width: `${Math.min(100, stats.debtPayoffPercent)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-[#78716C]">
              <span>Khởi đầu (100% nợ)</span>
              <span className="font-bold text-[#0F3D39] flex items-center gap-0.5">
                <Flag className="w-2.5 h-2.5" />
                Đích đến: 0 đ (Tự do tài chính)
              </span>
            </div>
          </div>
        </div>

        {/* Cột 2: Bức tranh Quỹ tích lũy */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#E6E2DA] shadow-2xs space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#10B981]/5 rounded-full -mr-10 -mt-10 pointer-events-none" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#ECFDF5] text-[#10B981] flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-[#1C1917] uppercase tracking-wider font-mono">
                Tổng quỹ tích lũy tương lai
              </span>
            </div>
            <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-[#E7EFEF] text-[#0F3D39]">
              {stats.savingsPercent}% mục tiêu
            </span>
          </div>

          <div>
            <p className="text-2xl sm:text-3xl font-bold font-mono text-[#0F3D39] tracking-tight">
              {formatVND(stats.totalSavingsCurrent)}
            </p>
            <div className="flex items-center justify-between text-[11px] text-[#78716C] mt-1 font-mono">
              <span>Đang tích lũy</span>
              <span>Mục tiêu: {formatVND(stats.totalSavingsTarget)}</span>
            </div>
          </div>

          {/* Thanh đo tiến độ tích lũy */}
          <div className="space-y-1 pt-1">
            <div className="w-full h-3 bg-[#F5F3EF] rounded-full overflow-hidden p-0.5 border border-[#E6E2DA]">
              <div 
                className="h-full bg-[#10B981] rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, stats.savingsPercent)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-[#78716C]">
              <span>0 đ</span>
              <span className="font-bold text-[#10B981]">
                Cán mốc: {formatVND(stats.totalSavingsTarget)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. BỘ LỌC VÀ DANH SÁCH THẺ MỤC TIÊU (GOAL CARDS)
          ========================================================================= */}
      <div className="space-y-3">
        {/* Bộ lọc loại mục tiêu và Sắp xếp */}
        <div className="space-y-2 pb-0.5">
          {/* Hàng 1: Tabs Segmented Control phân bổ đều, cuộn ngang mượt mà */}
          <div className="flex items-center bg-[#F5F3EF] border border-[#E6E2DA] rounded-2xl p-1 shadow-2xs overflow-x-auto">
            <button
              type="button"
              onClick={() => {
                playActionClick();
                setFilterType('ALL');
              }}
              className={`flex-1 min-w-[76px] py-2 px-3 rounded-xl text-xs font-semibold transition-all tactile-btn cursor-pointer text-center whitespace-nowrap ${
                filterType === 'ALL'
                  ? 'bg-white text-[#1C1917] shadow-2xs font-bold'
                  : 'text-[#78716C] hover:text-[#1C1917]'
              }`}
            >
              Tất cả ({financialGoals.length})
            </button>
            <button
              type="button"
              onClick={() => {
                playActionClick();
                setFilterType('DEBT_PAYOFF');
              }}
              className={`flex-1 min-w-[96px] py-2 px-3 rounded-xl text-xs font-semibold transition-all tactile-btn cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                filterType === 'DEBT_PAYOFF'
                  ? 'bg-[#B45309] text-white shadow-2xs font-bold'
                  : 'text-[#78716C] hover:text-[#1C1917]'
              }`}
            >
              <Landmark className="w-3.5 h-3.5" />
              <span>Khoản nợ ({financialGoals.filter(g => g.type === 'DEBT_PAYOFF').length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playActionClick();
                setFilterType('SAVINGS');
              }}
              className={`flex-1 min-w-[88px] py-2 px-3 rounded-xl text-xs font-semibold transition-all tactile-btn cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                filterType === 'SAVINGS'
                  ? 'bg-[#10B981] text-white shadow-2xs font-bold'
                  : 'text-[#78716C] hover:text-[#1C1917]'
              }`}
            >
              <PiggyBank className="w-3.5 h-3.5" />
              <span>Tích lũy ({financialGoals.filter(g => g.type === 'SAVINGS').length})</span>
            </button>
          </div>

          {/* Hàng 2: Thanh thông tin & Bộ chọn sắp xếp cân đối 2 bên */}
          <div className="flex items-center justify-between px-1 text-xs text-[#78716C]">
            <span className="text-[11px] font-medium">
              Đang hiển thị <strong className="font-mono text-[#1C1917]">{filteredGoals.length}</strong> mục tiêu
            </span>

            {/* Custom Dropdown sắp xếp đồng nhất với hệ thống */}
            <div className="relative" ref={sortDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  playActionClick();
                  triggerHaptic(6);
                  setIsSortOpen((prev) => !prev);
                }}
                className={`flex items-center gap-1.5 bg-white border rounded-xl px-2.5 py-1.5 text-[11px] font-semibold transition-all cursor-pointer shadow-2xs ${
                  isSortOpen
                    ? 'border-[#0F3D39] ring-2 ring-[#0F3D39]/15 text-[#0F3D39]'
                    : 'border-[#E6E2DA] text-[#1C1917] hover:border-[#0F3D39]/40 hover:bg-[#FAF9F6]'
                }`}
              >
                <ArrowUpDown className="w-3 h-3 text-[#0F3D39] shrink-0" />
                <span className="truncate max-w-[140px] sm:max-w-none">{currentSortLabel}</span>
                <ChevronDown
                  className={`w-3 h-3 text-[#78716C] transition-transform duration-200 shrink-0 ${
                    isSortOpen ? 'rotate-180 text-[#0F3D39]' : ''
                  }`}
                />
              </button>

              {/* Menu thả xuống */}
              {isSortOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-60 bg-white border border-[#E6E2DA] rounded-2xl shadow-xl p-1.5 z-40 space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
                  {SORT_OPTIONS.map((option) => {
                    const isSelected = sortBy === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          playActionClick();
                          triggerHaptic(8);
                          setSortBy(option.value);
                          setIsSortOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#E7EFEF] text-[#0F3D39] font-bold'
                            : 'text-[#1C1917] hover:bg-[#FAF9F6] font-medium'
                        }`}
                      >
                        <span className="truncate">{option.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#0F3D39] shrink-0 stroke-[2.5]" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Danh sách mục tiêu */}
        {filteredGoals.length === 0 ? (
          <div className="p-8 rounded-3xl border-2 border-dashed border-[#E6E2DA] bg-white text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FAF9F6] border border-[#E6E2DA] flex items-center justify-center mx-auto text-[#78716C]">
              <Target className="w-6 h-6 opacity-60" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#1C1917]">
                Chưa có mục tiêu {filterType === 'DEBT_PAYOFF' ? 'trả nợ' : filterType === 'SAVINGS' ? 'tích lũy' : ''} nào
              </p>
              <p className="text-[11px] text-[#78716C] max-w-sm mx-auto mt-0.5">
                Hãy bắt đầu tạo mục tiêu đầu tiên (như khoản nợ ngân hàng hoặc quỹ khẩn cấp) để cả hai vợ chồng cùng theo dõi tiến độ mỗi ngày!
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenCreate(filterType === 'SAVINGS' ? 'SAVINGS' : 'DEBT_PAYOFF')}
              className="px-4 py-2 bg-[#0F3D39] text-white text-xs font-semibold rounded-xl hover:bg-[#174E4A] transition-all cursor-pointer shadow-xs inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tạo mục tiêu ngay</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredGoals.map((goal) => {
              const isDebt = goal.type === 'DEBT_PAYOFF';
              const isSavingsNoTarget = !isDebt && (!goal.targetAmount || goal.targetAmount <= 0);
              const paidAmount = isDebt ? Math.max(0, goal.initialAmount - goal.currentAmount) : goal.currentAmount;
              const percent = isDebt 
                ? (goal.initialAmount > 0 ? Math.round((paidAmount / goal.initialAmount) * 100) : 0)
                : (!isSavingsNoTarget ? Math.round((goal.currentAmount / goal.targetAmount) * 100) : 0);

              // Dự báo số kỳ còn lại
              const remainingMonths = (isDebt && goal.monthlyTarget && goal.monthlyTarget > 0)
                ? Math.ceil(goal.currentAmount / goal.monthlyTarget)
                : (!isDebt && goal.targetAmount > 0 && goal.monthlyTarget && goal.monthlyTarget > 0)
                  ? Math.ceil(Math.max(0, goal.targetAmount - goal.currentAmount) / goal.monthlyTarget)
                  : null;

              return (
                <div
                  key={goal.id}
                  className="p-4 sm:p-5 rounded-3xl bg-white border border-[#E6E2DA] shadow-2xs hover:shadow-sm transition-all space-y-3.5 flex flex-col justify-between group"
                >
                  {/* Dòng 1: Tiêu đề & Nút thao tác */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div 
                        className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-2xs"
                        style={{ backgroundColor: goal.color || (isDebt ? '#B45309' : '#10B981') }}
                      >
                        {renderGoalIcon(goal.icon, goal.type, "w-5 h-5 text-white")}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded-full ${
                            isDebt ? 'bg-[#FEF3C7] text-[#B45309]' : 'bg-[#ECFDF5] text-[#047857]'
                          }`}>
                            {isDebt ? 'Khoản nợ' : 'Tích lũy'}
                          </span>
                          {goal.status === 'COMPLETED' && (
                            <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#065F46] flex items-center gap-0.5">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              Đã hoàn thành!
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-[#1C1917] truncate mt-0.5">
                          {goal.title}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(goal)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-[#FAF9F6] text-[#78716C] hover:text-[#0F3D39] active:scale-90 transition-all cursor-pointer"
                        title="Chỉnh sửa mục tiêu"
                        aria-label="Chỉnh sửa mục tiêu"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Bạn có chắc chắn muốn xóa mục tiêu "${goal.title}"?`)) {
                            removeGoal(goal.id);
                          }
                        }}
                        className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-[#FEF2F2] text-[#78716C] hover:text-[#DC2626] active:scale-90 transition-all cursor-pointer"
                        title="Xóa mục tiêu"
                        aria-label="Xóa mục tiêu"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Dòng 2: Số tiền & Tiến độ */}
                  <div className="space-y-1.5 bg-[#FAF9F6] p-3 rounded-2xl border border-[#F5F3EF]">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[11px] text-[#78716C]">
                        {isDebt ? 'Dư nợ còn lại:' : 'Hiện có:'}
                      </span>
                      <span className={`text-lg sm:text-xl font-bold font-mono ${isDebt ? 'text-[#B45309]' : 'text-[#0F3D39]'}`}>
                        {formatVND(goal.currentAmount)}
                      </span>
                    </div>

                    {/* Progress bar */}
                    {isSavingsNoTarget ? (
                      <div className="space-y-1">
                        <div className="w-full h-2.5 bg-[#FEF3C7] rounded-full overflow-hidden border border-dashed border-[#B45309]/30">
                          <div className="h-full bg-[#B45309]/15 w-full" />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-[#B45309] font-mono pt-0.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(goal)}
                            className="underline font-semibold hover:text-[#92400E] cursor-pointer"
                          >
                            ⚠️ Chưa đặt mức mục tiêu (chạm để đặt)
                          </button>
                          <span className="font-bold">--%</span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="w-full h-2.5 bg-[#E6E2DA] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(100, Math.max(0, percent))}%`,
                              backgroundColor: goal.color || (isDebt ? '#B45309' : '#10B981')
                            }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-[#78716C] font-mono pt-0.5 gap-2">
                          <span className="truncate">
                            {isDebt
                              ? `Đã trả gốc: ${formatVND(paidAmount)}${
                                  (goalLedgerStats[goal.id]?.interestPaid || 0) > 0
                                    ? ` • Lãi: ${formatVND(goalLedgerStats[goal.id].interestPaid)}`
                                    : ''
                                }`
                              : `Mục tiêu: ${formatVND(goal.targetAmount)}`}
                          </span>
                          <span className="font-bold text-[#1C1917] shrink-0">{percent}%</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Dòng 3: Thông tin bổ sung & Nút hành động trực tiếp */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#F5F3EF]">
                    <div className="text-[11px] text-[#78716C] truncate min-w-0">
                      {remainingMonths ? (
                        <span className="flex items-center gap-1 truncate">
                          <Calendar className="w-3 h-3 text-[#0F3D39] shrink-0" />
                          <span>Còn ~<strong>{remainingMonths} kỳ</strong></span>
                        </span>
                      ) : goal.monthlyTarget ? (
                        <span>Mỗi tháng: {formatVND(goal.monthlyTarget)}</span>
                      ) : (
                        <span>Chưa đặt hạn mức kỳ</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          playActionClick();
                          setSelectedHistoryGoal(goal);
                        }}
                        className="text-[11px] font-semibold text-[#78716C] hover:text-[#0F3D39] flex items-center gap-1 cursor-pointer py-1.5 px-2 rounded-xl hover:bg-[#FAF9F6] transition-colors"
                        title="Xem lịch sử ghi nhận"
                      >
                        <History className="w-3.5 h-3.5 text-[#0F3D39]" />
                        <span>Lịch sử</span>
                        {(goalTxCounts[goal.id] || 0) > 0 && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[#0F3D39]/10 text-[#0F3D39] font-bold">
                            {goalTxCounts[goal.id]}
                          </span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAddForGoal(goal)}
                        className={`h-7 sm:h-8 px-2.5 sm:px-3 rounded-xl text-white text-xs font-bold flex items-center gap-1 shadow-2xs active:scale-95 transition-all cursor-pointer ${
                          isDebt ? 'bg-[#B45309] hover:bg-[#9A3412]' : 'bg-[#0F3D39] hover:bg-[#174E4A]'
                        }`}
                        title={isDebt ? 'Ghi nhận trả nợ trực tiếp cho mục tiêu này' : 'Ghi nhận tích lũy trực tiếp cho mục tiêu này'}
                      >
                        <Plus className="w-3 h-3 stroke-[2.5]" />
                        <span>{isDebt ? 'Trả nợ' : 'Tích lũy'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =========================================================================
          3. MODAL TẠO / SỬA MỤC TIÊU TỰ DO TÀI CHÍNH
          ========================================================================= */}
      <BottomSheet
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingGoal ? 'Chỉnh sửa mục tiêu' : 'Tạo mục tiêu Tự do Tài chính'}
        subtitle={editingGoal ? 'Cập nhật lộ trình tài chính' : 'Thiết lập cột mốc tự do tài chính'}
        icon={
          <div className="w-8 h-8 rounded-xl bg-[#0F3D39] text-[#FAF9F6] flex items-center justify-center shadow-2xs font-bold shrink-0">
            <Target className="w-4 h-4" />
          </div>
        }
        maxHeight="max-h-[92dvh] sm:max-h-[88vh]"
        bodyClassName="p-4 sm:p-5 space-y-4 text-xs"
        footer={
          <div className="p-3 sm:p-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-[#E6E2DA] text-xs font-semibold text-[#78716C] hover:bg-[#F5F3EF] cursor-pointer min-h-[40px]"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSaveGoal}
              className="px-5 py-2.5 rounded-xl bg-[#0F3D39] text-white text-xs font-bold hover:bg-[#174E4A] flex items-center gap-1.5 shadow-sm active:scale-98 transition-all cursor-pointer min-h-[40px]"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{editingGoal ? 'Lưu thay đổi' : 'Tạo mục tiêu'}</span>
            </button>
          </div>
        }
      >
        {/* Chọn loại mục tiêu: Khoản nợ vs Tích lũy */}
              <div>
                <label className="block font-bold text-[#0F3D39] uppercase tracking-wider text-[10px] font-mono mb-1.5">
                  Loại mục tiêu:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      playActionClick();
                      setFormType('DEBT_PAYOFF');
                      if (!editingGoal) {
                        if (formTitle.includes('Quỹ')) {
                          setFormTitle('Khoản vay ngân hàng mua nhà');
                          setFormColor('#B45309');
                        }
                        if (!formInitialAmount || formInitialAmount === '0') {
                          setFormInitialAmount('1500000000');
                        }
                        if (!formCurrentAmount || formCurrentAmount === '0') {
                          setFormCurrentAmount('700000000');
                        }
                        setFormTargetAmount('0');
                      } else {
                        setFormTargetAmount('0');
                      }
                    }}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      formType === 'DEBT_PAYOFF'
                        ? 'border-[#B45309] bg-[#FEF3C7] text-[#B45309] font-bold shadow-2xs'
                        : 'border-[#E6E2DA] bg-white text-[#78716C] hover:border-[#B45309]/50'
                    }`}
                  >
                    <Landmark className="w-4 h-4" />
                    <span className="text-[11px]">Khoản nợ cần thanh toán 🏦</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playActionClick();
                      setFormType('SAVINGS');
                      if (!editingGoal) {
                        if (formTitle.includes('Khoản vay')) {
                          setFormTitle('Quỹ dự phòng khẩn cấp');
                          setFormColor('#10B981');
                        }
                        if (!formTargetAmount || formTargetAmount === '0') {
                          setFormTargetAmount('100000000');
                        }
                        if (formCurrentAmount === '700000000') {
                          setFormCurrentAmount('0');
                        }
                      } else {
                        if (!formTargetAmount || formTargetAmount === '0') {
                          setFormTargetAmount('100000000');
                        }
                      }
                    }}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      formType === 'SAVINGS'
                        ? 'border-[#10B981] bg-[#ECFDF5] text-[#065F46] font-bold shadow-2xs'
                        : 'border-[#E6E2DA] bg-white text-[#78716C] hover:border-[#10B981]/50'
                    }`}
                  >
                    <PiggyBank className="w-4 h-4" />
                    <span className="text-[11px]">Quỹ tích lũy tương lai 🌱</span>
                  </button>
                </div>
              </div>

              {/* Tên mục tiêu */}
              <div>
                <label className="block text-[11px] text-[#78716C] font-semibold mb-1">
                  Tên mục tiêu:
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder={formType === 'DEBT_PAYOFF' ? 'VD: Vay ngân hàng mua nhà' : 'VD: Quỹ khẩn cấp 6 tháng'}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#E6E2DA] bg-white outline-hidden focus:border-[#0F3D39]"
                />
              </div>

              {/* Các trường số tiền tùy theo loại */}
              {formType === 'DEBT_PAYOFF' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-[#78716C] font-semibold mb-1">
                      Tổng nợ gốc ban đầu (VNĐ):
                    </label>
                    <input
                      type="number"
                      value={formInitialAmount}
                      onChange={(e) => setFormInitialAmount(e.target.value)}
                      placeholder="VD: 1500000000 (1.5 tỷ)"
                      className="w-full text-xs p-2.5 rounded-xl border border-[#E6E2DA] bg-white outline-hidden focus:border-[#0F3D39] font-mono"
                    />
                    <span className="text-[10px] text-[#78716C] mt-0.5 block">
                      {formInitialAmount ? formatVND(Number(formInitialAmount)) : ''}
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#78716C] font-semibold mb-1">
                      Dư nợ hiện tại (VNĐ):
                    </label>
                    <input
                      type="number"
                      value={formCurrentAmount}
                      onChange={(e) => setFormCurrentAmount(e.target.value)}
                      placeholder="VD: 700000000 (700 triệu)"
                      className="w-full text-xs p-2.5 rounded-xl border border-[#E6E2DA] bg-white outline-hidden focus:border-[#0F3D39] font-mono font-bold text-[#B45309]"
                    />
                    <span className="text-[10px] text-[#B45309] mt-0.5 block font-bold">
                      {formCurrentAmount ? formatVND(Number(formCurrentAmount)) : ''}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-[#78716C] font-semibold mb-1">
                      Số tiền đã tích lũy hiện có (VNĐ):
                    </label>
                    <input
                      type="number"
                      value={formCurrentAmount}
                      onChange={(e) => setFormCurrentAmount(e.target.value)}
                      placeholder="VD: 50000000"
                      className="w-full text-xs p-2.5 rounded-xl border border-[#E6E2DA] bg-white outline-hidden focus:border-[#0F3D39] font-mono"
                    />
                    <span className="text-[10px] text-[#78716C] mt-0.5 block">
                      {formCurrentAmount ? formatVND(Number(formCurrentAmount)) : ''}
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#78716C] font-semibold mb-1">
                      Mục tiêu muốn đạt được (VNĐ):
                    </label>
                    <input
                      type="number"
                      value={formTargetAmount}
                      onChange={(e) => setFormTargetAmount(e.target.value)}
                      placeholder="VD: 120000000"
                      className="w-full text-xs p-2.5 rounded-xl border border-[#E6E2DA] bg-white outline-hidden focus:border-[#0F3D39] font-mono font-bold text-[#10B981]"
                    />
                    <span className="text-[10px] text-[#10B981] mt-0.5 block font-bold">
                      {formTargetAmount ? formatVND(Number(formTargetAmount)) : ''}
                    </span>
                  </div>
                </div>
              )}

              {/* Dự kiến trả / tích lũy hàng tháng */}
              <div>
                <label className="block text-[11px] text-[#78716C] font-semibold mb-1">
                  Dự kiến {formType === 'DEBT_PAYOFF' ? 'trả gốc' : 'tích lũy'} mỗi tháng (VNĐ - tùy chọn):
                </label>
                <input
                  type="number"
                  value={formMonthlyTarget}
                  onChange={(e) => setFormMonthlyTarget(e.target.value)}
                  placeholder="VD: 15000000"
                  className="w-full text-xs p-2.5 rounded-xl border border-[#E6E2DA] bg-white outline-hidden focus:border-[#0F3D39] font-mono"
                />
                <span className="text-[10px] text-[#78716C] mt-0.5 block">
                  {formMonthlyTarget ? `${formatVND(Number(formMonthlyTarget))} / tháng (Dùng để ước tính số kỳ về đích)` : ''}
                </span>
              </div>

              {/* Chọn màu sắc */}
              <div>
                <label className="block text-[11px] text-[#78716C] font-semibold mb-1.5">
                  Màu sắc nhận diện:
                </label>
                <div className="flex items-center gap-2">
                  {GOAL_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setFormColor(c.hex)}
                      className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                        formColor === c.hex ? 'scale-115 ring-2 ring-[#0F3D39] ring-offset-2' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              {/* Ghi chú */}
              <div>
                <label className="block text-[11px] text-[#78716C] font-semibold mb-1">
                  Ghi chú hoặc lời nhắc nhở tổ ấm:
                </label>
                <input
                  type="text"
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  placeholder="VD: Kỳ trả vào ngày 15 hàng tháng, cố gắng tất toán sớm!"
                  className="w-full text-xs p-2.5 rounded-xl border border-[#E6E2DA] bg-white outline-hidden focus:border-[#0F3D39]"
                />
              </div>
      </BottomSheet>

      {/* =========================================================================
          4. MODAL XEM LỊCH SỬ TÍCH LŨY / TRẢ NỢ CỦA MỤC TIÊU
          ========================================================================= */}
      {activeHistoryGoal && (
        <BottomSheet
          isOpen={Boolean(activeHistoryGoal)}
          onClose={() => setSelectedHistoryGoal(null)}
          title={activeHistoryGoal.title}
          subtitle={
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                activeHistoryGoal.type === 'DEBT_PAYOFF'
                  ? 'bg-[#FEF3C7] text-[#B45309]'
                  : 'bg-[#ECFDF5] text-[#047857]'
              }`}
            >
              {activeHistoryGoal.type === 'DEBT_PAYOFF' ? 'Lịch sử trả nợ' : 'Lịch sử tích lũy'}
            </span>
          }
          icon={
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs"
              style={{ backgroundColor: activeHistoryGoal.color || '#0F3D39' }}
            >
              {renderGoalIcon(activeHistoryGoal.icon, activeHistoryGoal.type, 'w-5 h-5')}
            </div>
          }
          maxHeight="max-h-[90dvh] sm:max-h-[85vh]"
          bodyClassName="p-0 flex flex-col"
          footer={
            <div className="p-3 sm:p-4 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedHistoryGoal(null);
                  handleAddForGoal(activeHistoryGoal);
                }}
                className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 transition-all cursor-pointer min-h-[40px] ${
                  activeHistoryGoal.type === 'DEBT_PAYOFF' ? 'bg-[#B45309] hover:bg-[#9A3412]' : 'bg-[#0F3D39] hover:bg-[#174E4A]'
                }`}
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{activeHistoryGoal.type === 'DEBT_PAYOFF' ? 'Ghi nhận trả nợ' : 'Ghi nhận tích lũy'}</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedHistoryGoal(null)}
                className="px-5 py-2.5 rounded-xl border border-[#E6E2DA] hover:bg-[#FAF9F6] text-[#78716C] text-xs font-semibold transition-colors cursor-pointer text-center min-h-[40px]"
              >
                Đóng
              </button>
            </div>
          }
        >

            {/* Thống kê tóm tắt nhanh */}
            {activeHistoryGoal.type === 'DEBT_PAYOFF' ? (
              <div className="px-4 sm:px-5 py-3 bg-[#FAF9F6] border-b border-[#F5F3EF] space-y-2 shrink-0">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-[10.5px] text-[#78716C] block">
                      Đã trả gốc
                    </span>
                    <span className="text-xs sm:text-sm font-bold font-mono text-[#0F3D39]">
                      -{formatVND(historyPrincipalPaid)}
                    </span>
                    <span className="text-[10px] text-[#78716C] block mt-0.5 font-mono">
                      Giảm dư nợ gốc
                    </span>
                  </div>
                  <div>
                    <span className="text-[10.5px] text-[#78716C] block">
                      Đã trả lãi
                    </span>
                    <span className="text-xs sm:text-sm font-bold font-mono text-[#B45309]">
                      {formatVND(historyInterestPaid)}
                    </span>
                    <span className="text-[10px] text-[#78716C] block mt-0.5 font-mono">
                      Không trừ gốc
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10.5px] text-[#78716C] block">
                      Dư nợ hiện tại
                    </span>
                    <span className="text-xs sm:text-sm font-bold font-mono text-[#B45309]">
                      {formatVND(activeHistoryGoal.currentAmount)}
                    </span>
                    {historyPrincipalPaid > 0 &&
                      activeHistoryGoal.currentAmount !== Math.max(0, activeHistoryGoal.initialAmount - historyPrincipalPaid) && (
                        <button
                          type="button"
                          onClick={async () => {
                            const targetDebt = Math.max(0, activeHistoryGoal.initialAmount - historyPrincipalPaid);
                            const countPrincipalTxs = historyTransactions.filter((t) => t.debtPaymentType !== 'INTEREST').length;
                            if (
                              confirm(
                                `Cân chỉnh "Dư nợ hiện tại" theo toàn bộ lịch sử trả nợ:\n\n` +
                                `• Vốn nợ ban đầu: ${formatVND(activeHistoryGoal.initialAmount)}\n` +
                                `• Tổng tiền trả gốc trong toàn bộ lịch sử (${countPrincipalTxs} kỳ): -${formatVND(historyPrincipalPaid)}\n` +
                                `• Dư nợ chuẩn xác: ${formatVND(targetDebt)}\n\n` +
                                `Bạn có xác nhận đồng bộ số dư nợ thành ${formatVND(targetDebt)}?`
                              )
                            ) {
                              await editGoal(activeHistoryGoal.id, { currentAmount: targetDebt });
                              setSelectedHistoryGoal((prev) => (prev ? { ...prev, currentAmount: targetDebt } : null));
                              showToast('Đã cân chỉnh dư nợ gốc theo toàn bộ lịch sử sổ cái!', 'success');
                            }
                          }}
                          className="text-[10px] text-[#0F3D39] hover:underline font-semibold cursor-pointer flex items-center justify-end gap-1 mt-0.5 ml-auto"
                          title="Đồng bộ dư nợ gốc hiện tại khớp với tổng tiền trả gốc trong toàn bộ lịch sử"
                        >
                          <RotateCcw className="w-2.5 h-2.5" />
                          <span>Khớp theo sổ cái</span>
                        </button>
                      )}
                  </div>
                </div>

                {/* Thông tin nợ ban đầu & Tổng tiền đã thanh toán */}
                <div className="flex items-center justify-between pt-2 border-t border-[#E6E2DA]/60 text-[10.5px] font-mono text-[#78716C]">
                  <span>Vốn nợ ban đầu: <strong className="text-[#1C1917]">{formatVND(activeHistoryGoal.initialAmount)}</strong></span>
                  <span>Tổng đã trả (Gốc + Lãi): <strong className="text-[#1C1917]">{formatVND(historyTotalRecordedAmount)}</strong> ({historyTransactions.length} kỳ)</span>
                </div>
              </div>
            ) : (
              <div className="px-4 sm:px-5 py-3 bg-[#FAF9F6] border-b border-[#F5F3EF] space-y-2 shrink-0">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-[#78716C] block">
                      Đã tích lũy qua sổ cái
                    </span>
                    <span className="text-sm font-bold font-mono text-[#0F3D39]">
                      +{formatVND(historyTotalRecordedAmount)}
                    </span>
                    <span className="text-[10px] text-[#78716C] block mt-0.5 font-mono">
                      (Toàn bộ {historyTransactions.length} lần ghi nhận)
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-[#78716C] block">
                      Số tiền hiện có
                    </span>
                    <span className="text-sm font-bold font-mono text-[#0F3D39]">
                      {formatVND(activeHistoryGoal.currentAmount)}
                    </span>
                    {activeHistoryGoal.currentAmount !== historyTotalRecordedAmount && (
                      <button
                        type="button"
                        onClick={async () => {
                          if (
                            confirm(
                              `Cân chỉnh "Số tiền hiện có" của quỹ theo toàn bộ lịch sử tích lũy:\n\n` +
                              `• Tổng tích lũy từ trước đến nay (${historyTransactions.length} lần): +${formatVND(historyTotalRecordedAmount)}\n` +
                              `• Số tiền hiện tại của quỹ: ${formatVND(activeHistoryGoal.currentAmount)}\n\n` +
                              `Bạn có muốn đồng bộ số tiền hiện có thành ${formatVND(historyTotalRecordedAmount)}?`
                            )
                          ) {
                            await editGoal(activeHistoryGoal.id, { currentAmount: historyTotalRecordedAmount });
                            setSelectedHistoryGoal((prev) => prev ? { ...prev, currentAmount: historyTotalRecordedAmount } : null);
                            showToast('Đã cân chỉnh số tiền theo toàn bộ lịch sử!', 'success');
                          }
                        }}
                        className="text-[10px] text-[#0F3D39] hover:underline font-semibold cursor-pointer flex items-center justify-end gap-1 mt-0.5 ml-auto"
                        title="Đồng bộ số dư mục tiêu khớp với tổng các lần tích lũy trong toàn bộ lịch sử"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                        <span>Khớp theo sổ cái</span>
                      </button>
                    )}
                  </div>
                </div>

                {activeHistoryGoal.targetAmount > 0 && (
                  <div className="flex items-center justify-between pt-1.5 border-t border-[#E6E2DA]/60 text-[10.5px] font-mono text-[#78716C]">
                    <span>Mục tiêu tích lũy: <strong className="text-[#0F3D39]">{formatVND(activeHistoryGoal.targetAmount)}</strong></span>
                    <span>Tiến độ: <strong className="text-[#0F3D39]">{Math.min(100, Math.round((activeHistoryGoal.currentAmount / activeHistoryGoal.targetAmount) * 100))}%</strong></span>
                  </div>
                )}
              </div>
            )}

            {/* Danh sách các lần ghi nhận (cho phép bấm vào từng khoản để sửa) */}
            <div className="p-4 sm:p-5 overflow-y-auto overscroll-contain touch-pan-y flex-1 space-y-2.5">
              {historyTransactions.length === 0 ? (
                <div className="text-center py-8 px-4 bg-[#FAF9F6] rounded-2xl border border-dashed border-[#E6E2DA]">
                  <div className="w-10 h-10 mx-auto rounded-xl bg-white border border-[#E6E2DA] flex items-center justify-center text-[#78716C] mb-2.5 shadow-2xs">
                    <Receipt className="w-5 h-5 stroke-[1.5]" />
                  </div>
                  <p className="text-xs font-semibold text-[#1C1917]">
                    Chưa có giao dịch nào được gắn vào mục tiêu này
                  </p>
                  <p className="text-[11px] text-[#78716C] mt-1 max-w-xs mx-auto leading-relaxed">
                    Khi bạn ghi nhận khoản chi (trả nợ) hoặc thu nhập (tích lũy), hãy chọn mục{' '}
                    <span className="font-semibold text-[#0F3D39]">"Gắn vào mục tiêu Tự do Tài chính"</span> để lịch sử từng lần tự động hiển thị tại đây nhé!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-[11px] text-[#78716C] px-1">
                    <span>Lịch sử ghi nhận qua các tháng (Chạm để chỉnh sửa)</span>
                    <span className="font-mono font-medium">{historyTransactions.length} giao dịch</span>
                  </div>

                  {groupedHistoryByMonth.map((group) => (
                    <div key={group.monthKey} className="space-y-1.5">
                      {/* Header ngăn cách từng tháng */}
                      <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#F5F3EF] border border-[#E6E2DA]/80">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Calendar className="w-3.5 h-3.5 text-[#0F3D39] shrink-0" />
                          <span className="text-xs font-bold text-[#1C1917] font-mono">
                            {group.monthLabel}
                          </span>
                          <span className="text-[10px] text-[#78716C] font-mono">
                            ({group.items.length} lần)
                          </span>
                        </div>

                        <div className="text-right font-mono text-xs font-bold shrink-0">
                          {activeHistoryGoal.type === 'SAVINGS' ? (
                            <span className="text-[#059669]">
                              +{formatVND(group.monthTotal)}
                            </span>
                          ) : (
                            <div className="flex items-center gap-1.5 text-[11px]">
                              {group.monthPrincipalPaid > 0 && (
                                <span className="text-[#0F3D39]" title="Tiền trả gốc trong tháng">
                                  Gốc: -{formatVND(group.monthPrincipalPaid)}
                                </span>
                              )}
                              {group.monthPrincipalPaid > 0 && group.monthInterestPaid > 0 && (
                                <span className="text-[#A8A29E]">•</span>
                              )}
                              {group.monthInterestPaid > 0 && (
                                <span className="text-[#B45309]" title="Tiền trả lãi trong tháng">
                                  Lãi: {formatVND(group.monthInterestPaid)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Danh sách các lần ghi nhận trong tháng đó */}
                      <div className="divide-y divide-[#F5F3EF] border border-[#E6E2DA]/80 rounded-2xl overflow-hidden bg-white shadow-2xs">
                        {group.items.map((tx) => {
                          const isIncome = tx.type === 'INCOME';
                          const isInterestPayment = activeHistoryGoal.type === 'DEBT_PAYOFF' && tx.debtPaymentType === 'INTEREST';
                          return (
                            <div
                              key={tx.id}
                              onClick={() => {
                                playActionClick();
                                triggerHaptic(10);
                                setEditingTx(tx);
                              }}
                              className="p-3 hover:bg-[#FAF9F6] transition-colors flex items-center justify-between gap-3 cursor-pointer group"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-xs font-semibold text-[#1C1917] truncate group-hover:text-[#0F3D39] transition-colors">
                                    {tx.note || tx.categoryName}
                                  </span>
                                  {activeHistoryGoal.type === 'DEBT_PAYOFF' && (
                                    <span
                                      className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-md border shrink-0 ${
                                        isInterestPayment
                                          ? 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]'
                                          : 'bg-[#E7EFEF] text-[#0F3D39] border-[#0F3D39]/20'
                                      }`}
                                    >
                                      {isInterestPayment ? 'Trả lãi' : 'Trả gốc'}
                                    </span>
                                  )}
                                  <span
                                    className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full font-medium shrink-0 ${
                                      isIncome
                                        ? 'bg-[#ECFDF5] text-[#047857]'
                                        : tx.paidBy === 'Chồng'
                                        ? 'bg-[#E7EFEF] text-[#0F3D39]'
                                        : 'bg-[#FEF3C7] text-[#B45309]'
                                    }`}
                                  >
                                    {isIncome ? `${tx.paidBy} nhận` : tx.paidBy}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-[#78716C] mt-0.5">
                                  <span>{formatDateLabel(tx.date)}</span>
                                  <span>•</span>
                                  <span className="truncate">{tx.categoryName}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                                <div className="text-right shrink-0">
                                  <span
                                    className={`text-xs sm:text-sm font-bold font-mono block ${
                                      activeHistoryGoal.type === 'SAVINGS'
                                        ? 'text-[#059669]'
                                        : isInterestPayment
                                        ? 'text-[#B45309]'
                                        : 'text-[#0F3D39]'
                                    }`}
                                  >
                                    {activeHistoryGoal.type === 'SAVINGS'
                                      ? `+${formatVND(tx.amount)}`
                                      : isInterestPayment
                                      ? formatVND(tx.amount)
                                      : `-${formatVND(tx.amount)}`}
                                  </span>
                                  {activeHistoryGoal.type === 'DEBT_PAYOFF' && (
                                    <span className="text-[9.5px] font-mono text-[#78716C] block">
                                      {isInterestPayment ? 'Không trừ gốc' : 'Giảm nợ gốc'}
                                    </span>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    playActionClick();
                                    triggerHaptic(10);
                                    setEditingTx(tx);
                                  }}
                                  className="text-[#A8A29E] hover:text-[#0F3D39] p-1.5 rounded-lg hover:bg-[#F5F3EF] opacity-70 group-hover:opacity-100 transition-all cursor-pointer"
                                  title={`Chỉnh sửa ${isIncome ? 'khoản thu' : 'khoản chi'}`}
                                  aria-label={`Chỉnh sửa ${tx.note || tx.categoryName}`}
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
        </BottomSheet>
      )}

      {/* Modal Chỉnh sửa giao dịch khi click vào dòng lịch sử */}
      <EditTransactionModal
        isOpen={Boolean(editingTx)}
        onClose={() => setEditingTx(null)}
        transaction={editingTx}
        zIndex="z-70"
      />
    </div>
  );
};
