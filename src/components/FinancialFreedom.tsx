import React, { useState, useMemo } from 'react';
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
  AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatVND } from '../utils/currency';
import { playActionClick, playSuccessChime } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';
import type { FinancialGoal, GoalType } from '../types';
import { useToast } from './Toast';

const GOAL_COLORS = [
  { label: 'Terracotta', hex: '#B45309' },
  { label: 'Pine Emerald', hex: '#0F3D39' },
  { label: 'Warm Amber', hex: '#D97706' },
  { label: 'Emerald Green', hex: '#10B981' },
  { label: 'Muted Sage', hex: '#4A6B68' },
  { label: 'Rose Wine', hex: '#E11D48' }
];

export const FinancialFreedom: React.FC = () => {
  const { financialGoals, createGoal, editGoal, removeGoal, updateGoalAmount, activeHousehold } = useApp();
  const { showToast } = useToast();

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

  // Modal cập nhật nhanh số tiền
  const [quickUpdateGoal, setQuickUpdateGoal] = useState<FinancialGoal | null>(null);
  const [quickAmountStr, setQuickAmountStr] = useState<string>('');

  // Lọc danh sách mục tiêu
  const filteredGoals = useMemo(() => {
    if (filterType === 'ALL') return financialGoals;
    return financialGoals.filter((g) => g.type === filterType);
  }, [financialGoals, filterType]);

  // Thống kê tổng hợp
  const stats = useMemo(() => {
    let totalDebtInitial = 0;
    let totalDebtCurrent = 0;
    let totalSavingsCurrent = 0;
    let totalSavingsTarget = 0;

    financialGoals.forEach((g) => {
      if (g.type === 'DEBT_PAYOFF') {
        totalDebtInitial += g.initialAmount;
        totalDebtCurrent += g.currentAmount;
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
      debtPayoffPercent,
      totalSavingsCurrent,
      totalSavingsTarget,
      savingsPercent
    };
  }, [financialGoals]);

  // Mở modal tạo mới
  const handleOpenCreate = (defaultType: GoalType = 'DEBT_PAYOFF') => {
    playActionClick();
    triggerHaptic(10);
    setEditingGoal(null);
    setFormType(defaultType);
    setFormTitle(defaultType === 'DEBT_PAYOFF' ? 'Khoản vay ngân hàng mua nhà' : 'Quỹ dự phòng khẩn cấp');
    setFormInitialAmount(defaultType === 'DEBT_PAYOFF' ? '1500000000' : '0');
    setFormCurrentAmount(defaultType === 'DEBT_PAYOFF' ? '700000000' : '50000000');
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

  // Lưu cập nhật nhanh số tiền
  const handleSaveQuickAmount = async () => {
    if (!quickUpdateGoal) return;
    const amt = Number(quickAmountStr);
    if (isNaN(amt) || amt < 0) {
      showToast('Số tiền không hợp lệ!', 'warning');
      return;
    }

    await updateGoalAmount(quickUpdateGoal.id, amt);
    setQuickUpdateGoal(null);
  };

  return (
    <div className="space-y-6">
      {/* =========================================================================
          1. HEADER PHÂN HỆ TỰ DO TÀI CHÍNH & BANNER TỔNG QUAN
          ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#0F3D39] text-[#FAF9F6] flex items-center justify-center shadow-xs">
              <Target className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-[#1C1917] tracking-tight">
              Lộ trình Tự do Tài chính
            </h2>
          </div>
          <p className="text-xs text-[#78716C] mt-1">
            Không gian đồng hành của {activeHousehold?.name || 'tổ ấm'} — Xóa nợ bền bỉ & Tích lũy tương lai
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleOpenCreate('DEBT_PAYOFF')}
          className="px-4 py-2.5 rounded-2xl bg-[#0F3D39] hover:bg-[#174E4A] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm mục tiêu mới</span>
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
            <div className="flex items-center justify-between text-[11px] text-[#78716C] mt-1 font-mono">
              <span>Đã thanh toán: <strong className="text-[#0F3D39]">{formatVND(stats.totalDebtPaid)}</strong></span>
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
        {/* Bộ lọc loại mục tiêu */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
          <div className="flex items-center bg-[#F5F3EF] border border-[#E6E2DA] rounded-xl p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => {
                playActionClick();
                setFilterType('ALL');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
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
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
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
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterType === 'SAVINGS'
                  ? 'bg-[#10B981] text-white shadow-2xs font-bold'
                  : 'text-[#78716C] hover:text-[#1C1917]'
              }`}
            >
              <PiggyBank className="w-3.5 h-3.5" />
              <span>Tích lũy ({financialGoals.filter(g => g.type === 'SAVINGS').length})</span>
            </button>
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
              const paidAmount = isDebt ? Math.max(0, goal.initialAmount - goal.currentAmount) : goal.currentAmount;
              const percent = isDebt 
                ? (goal.initialAmount > 0 ? Math.round((paidAmount / goal.initialAmount) * 100) : 0)
                : (goal.targetAmount > 0 ? Math.round((goal.currentAmount / goal.targetAmount) * 100) : 0);

              // Dự báo số kỳ còn lại
              const remainingMonths = (isDebt && goal.monthlyTarget && goal.monthlyTarget > 0)
                ? Math.ceil(goal.currentAmount / goal.monthlyTarget)
                : (goal.monthlyTarget && goal.monthlyTarget > 0)
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
                        {isDebt ? <Landmark className="w-5 h-5" /> : <PiggyBank className="w-5 h-5" />}
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

                    <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(goal)}
                        className="p-1.5 rounded-xl hover:bg-[#FAF9F6] text-[#78716C] hover:text-[#0F3D39] transition-all cursor-pointer"
                        title="Chỉnh sửa mục tiêu"
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
                        className="p-1.5 rounded-xl hover:bg-[#FEF2F2] text-[#78716C] hover:text-[#DC2626] transition-all cursor-pointer"
                        title="Xóa mục tiêu"
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
                    <div className="w-full h-2.5 bg-[#E6E2DA] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, Math.max(0, percent))}%`,
                          backgroundColor: goal.color || (isDebt ? '#B45309' : '#10B981')
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[#78716C] font-mono pt-0.5">
                      <span>{isDebt ? `Đã trả: ${formatVND(paidAmount)}` : `Mục tiêu: ${formatVND(goal.targetAmount)}`}</span>
                      <span className="font-bold text-[#1C1917]">{percent}%</span>
                    </div>
                  </div>

                  {/* Dòng 3: Thông tin bổ sung & Nút cập nhật nhanh */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="text-[11px] text-[#78716C] truncate">
                      {remainingMonths ? (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-[#0F3D39]" />
                          Còn ~<strong>{remainingMonths} kỳ</strong> (khoảng {Math.ceil(remainingMonths / 12)} năm)
                        </span>
                      ) : goal.monthlyTarget ? (
                        <span>Mỗi tháng: {formatVND(goal.monthlyTarget)}</span>
                      ) : (
                        <span>Chưa đặt hạn mức kỳ</span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        playActionClick();
                        setQuickUpdateGoal(goal);
                        setQuickAmountStr(String(goal.currentAmount));
                      }}
                      className="text-[11px] font-semibold text-[#0F3D39] hover:underline flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <span>Cập nhật số tiền</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
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
      {isModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/55 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#FAF9F6] border border-[#E6E2DA] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header Modal */}
            <div className="p-4 border-b border-[#E6E2DA] flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#0F3D39] text-[#FAF9F6] flex items-center justify-center">
                  <Target className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-[#1C1917]">
                  {editingGoal ? 'Chỉnh sửa mục tiêu' : 'Tạo mục tiêu Tự do Tài chính'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-[#78716C] hover:text-[#1C1917] p-1.5 rounded-xl hover:bg-[#F5F3EF] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Nội dung form */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs flex-1">
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
                      if (!editingGoal && formTitle.includes('Quỹ')) {
                        setFormTitle('Khoản vay ngân hàng mua nhà');
                        setFormColor('#B45309');
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
                      if (!editingGoal && formTitle.includes('Khoản vay')) {
                        setFormTitle('Quỹ dự phòng khẩn cấp');
                        setFormColor('#10B981');
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
            </div>

            {/* Footer Modal */}
            <div className="p-4 bg-white border-t border-[#E6E2DA] flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs text-[#78716C] hover:bg-[#F5F3EF] cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveGoal}
                className="px-5 py-2.5 rounded-xl bg-[#0F3D39] text-white text-xs font-bold hover:bg-[#174E4A] flex items-center gap-1.5 shadow-sm active:scale-98 transition-all cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{editingGoal ? 'Lưu thay đổi' : 'Tạo mục tiêu'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          4. MODAL CẬP NHẬT NHANH SỐ TIỀN / DƯ NỢ
          ========================================================================= */}
      {quickUpdateGoal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/55 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-[#E6E2DA] rounded-3xl w-full max-w-sm p-4 sm:p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#1C1917]">
                Cập nhật {quickUpdateGoal.type === 'DEBT_PAYOFF' ? 'dư nợ' : 'số tiền'}
              </h3>
              <button
                type="button"
                onClick={() => setQuickUpdateGoal(null)}
                className="text-[#78716C] hover:text-[#1C1917] p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#78716C]">
              {quickUpdateGoal.title}
            </p>

            <div>
              <label className="block text-[11px] text-[#78716C] mb-1">
                {quickUpdateGoal.type === 'DEBT_PAYOFF' ? 'Dư nợ thực tế mới nhất (VNĐ):' : 'Số tiền tích lũy mới (VNĐ):'}
              </label>
              <input
                type="number"
                value={quickAmountStr}
                onChange={(e) => setQuickAmountStr(e.target.value)}
                autoFocus
                placeholder="VD: 685000000"
                className="w-full text-sm p-2.5 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] outline-hidden focus:border-[#0F3D39] font-mono font-bold"
              />
              <span className="text-[11px] text-[#0F3D39] mt-1 block font-mono">
                {quickAmountStr ? formatVND(Number(quickAmountStr)) : ''}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F5F3EF]">
              <button
                type="button"
                onClick={() => setQuickUpdateGoal(null)}
                className="px-3.5 py-2 rounded-xl text-xs text-[#78716C] hover:bg-[#F5F3EF] cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveQuickAmount}
                className="px-4 py-2 rounded-xl bg-[#0F3D39] text-white text-xs font-bold hover:bg-[#174E4A] cursor-pointer"
              >
                Cập nhật
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
