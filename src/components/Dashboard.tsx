import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Scale, 
  Flame, 
  ShieldCheck, 
  AlertCircle, 
  Sparkles,
  ReceiptText,
  PiggyBank,
  Wallet,
  SlidersHorizontal,
  RotateCcw,
  Info
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatVND } from '../utils/currency';
import { playActionClick } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';
import { DailySpendingChart } from './DailySpendingChart';
import { CategoryBreakdown } from './CategoryBreakdown';
import { ReportCategoryFilterModal } from './ReportCategoryFilterModal';

export const Dashboard: React.FC = () => {
  const {
    transactions,
    categories,
    currentYearMonth,
    activeHousehold,
    totalExpense,
    totalIncome,
    netSavings,
    savingsRatio,
    husbandExpense,
    wifeExpense,
    husbandRatio,
    wifeRatio
  } = useApp();

  const monthlyBudget = activeHousehold?.monthlyBudget || 30000000;

  // Trạng thái modal và danh mục bị loại trừ khỏi Báo cáo & Dự phóng
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const storageKey = `harmony_report_excluded_categories_${activeHousehold?.id || 'default'}`;

  const [excludedCategoryIds, setExcludedCategoryIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Đồng bộ lại khi đổi hộ gia đình
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`harmony_report_excluded_categories_${activeHousehold?.id || 'default'}`);
      setExcludedCategoryIds(saved ? JSON.parse(saved) : []);
    } catch {
      setExcludedCategoryIds([]);
    }
  }, [activeHousehold?.id]);

  const updateExcludedCategoryIds = (newIds: string[]) => {
    setExcludedCategoryIds(newIds);
    try {
      localStorage.setItem(storageKey, JSON.stringify(newIds));
    } catch (e) {
      console.error('Lỗi lưu excludedCategoryIds', e);
    }
  };

  const handleToggleCategory = (categoryId: string) => {
    const updated = excludedCategoryIds.includes(categoryId)
      ? excludedCategoryIds.filter((id) => id !== categoryId)
      : [...excludedCategoryIds, categoryId];
    updateExcludedCategoryIds(updated);
  };

  const handleSelectAll = () => {
    updateExcludedCategoryIds([]);
  };

  const handleExcludeDebtAndSavings = () => {
    const debtOrSavingCatIds = categories
      .filter((c) => c.type === 'EXPENSE' && (
        c.categoryKey === 'SAVING' || 
        c.id === 'cat_debt' || 
        c.name.toLowerCase().includes('nợ') || 
        c.name.toLowerCase().includes('ngân hàng') ||
        c.name.toLowerCase().includes('vay')
      ))
      .map((c) => c.id);
    updateExcludedCategoryIds(Array.from(new Set([...excludedCategoryIds, ...debtOrSavingCatIds])));
  };

  // 1. Phân loại giao dịch theo bộ lọc danh mục
  const {
    includedExpenseTransactions,
    excludedExpenseTransactions,
    reportTotalExpense,
    excludedTotalExpense,
    excludedCategoryNames
  } = useMemo(() => {
    const included: typeof transactions = [];
    const excluded: typeof transactions = [];
    let incTotal = 0;
    let excTotal = 0;

    transactions.forEach((tx) => {
      if (tx.type === 'EXPENSE') {
        if (excludedCategoryIds.includes(tx.categoryId)) {
          excluded.push(tx);
          excTotal += tx.amount;
        } else {
          included.push(tx);
          incTotal += tx.amount;
        }
      }
    });

    const names = categories
      .filter((c) => excludedCategoryIds.includes(c.id))
      .map((c) => c.name);

    return {
      includedExpenseTransactions: included,
      excludedExpenseTransactions: excluded,
      reportTotalExpense: incTotal,
      excludedTotalExpense: excTotal,
      excludedCategoryNames: names
    };
  }, [transactions, categories, excludedCategoryIds]);

  const hasExcludedCategories = excludedCategoryIds.length > 0;

  // 2. Tính toán Tốc độ đốt tiền (Burn Rate) & Dự phóng chi cuối tháng dựa trên số liệu đã lọc
  const {
    dailyBurnRate,
    projectedExpense,
    isProjectedOver,
    projectedDiff,
    husbandTxCount,
    wifeTxCount,
    husbandReportExpense,
    wifeReportExpense,
    husbandReportRatio,
    wifeReportRatio,
    husbandAvgTx,
    wifeAvgTx,
    topExpenses,
    essentialRatio
  } = useMemo(() => {
    const [yearStr, monthStr] = currentYearMonth.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr);
    const daysInMonth = new Date(year, month, 0).getDate();

    const now = new Date();
    const isCurrentMonth = now.getFullYear() === year && (now.getMonth() + 1) === month;
    const currentDay = isCurrentMonth ? now.getDate() : daysInMonth;

    const daysCounted = Math.max(1, currentDay);
    // Tốc độ đốt tiền tính theo số tiền chi tiêu được đưa vào báo cáo
    const burnRate = Math.round(reportTotalExpense / daysCounted);
    const projected = Math.round(burnRate * daysInMonth);
    const isOver = projected > monthlyBudget;
    const diff = Math.abs(projected - monthlyBudget);

    // Thống kê chi tiết Vợ - Chồng trên các khoản chi được tính
    let hCount = 0;
    let wCount = 0;
    let hSum = 0;
    let wSum = 0;
    let essentialSum = 0;

    includedExpenseTransactions.forEach((tx) => {
      if (tx.paidBy === 'Chồng') {
        hCount += 1;
        hSum += tx.amount;
      } else {
        wCount += 1;
        wSum += tx.amount;
      }

      if (tx.categoryKey === 'ESSENTIAL') {
        essentialSum += tx.amount;
      }
    });

    const hAvg = hCount > 0 ? Math.round(hSum / hCount) : 0;
    const wAvg = wCount > 0 ? Math.round(wSum / wCount) : 0;

    const hRatio = reportTotalExpense > 0 ? Math.round((hSum / reportTotalExpense) * 100) : 50;
    const wRatio = reportTotalExpense > 0 ? 100 - hRatio : 50;

    // Top 5 khoản chi lớn nhất trong các khoản chi được đưa vào báo cáo
    const top5 = [...includedExpenseTransactions]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    const essRatio = reportTotalExpense > 0 ? Math.round((essentialSum / reportTotalExpense) * 100) : 0;

    return {
      dailyBurnRate: burnRate,
      projectedExpense: projected,
      isProjectedOver: isOver,
      projectedDiff: diff,
      husbandTxCount: hCount,
      wifeTxCount: wCount,
      husbandReportExpense: hSum,
      wifeReportExpense: wSum,
      husbandReportRatio: hRatio,
      wifeReportRatio: wRatio,
      husbandAvgTx: hAvg,
      wifeAvgTx: wAvg,
      topExpenses: top5,
      essentialRatio: essRatio
    };
  }, [includedExpenseTransactions, currentYearMonth, reportTotalExpense, monthlyBudget]);

  // Giao dịch truyền vào biểu đồ ngày: các khoản chi bị loại trừ sẽ không làm bẹp dí các ngày sinh hoạt
  const transactionsForChart = useMemo(() => {
    return transactions.filter(
      (tx) => tx.type !== 'EXPENSE' || !excludedCategoryIds.includes(tx.categoryId)
    );
  }, [transactions, excludedCategoryIds]);

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* =========================================================================
          THANH CÔNG CỤ & BỘ LỌC DANH MỤC BÁO CÁO & DỰ PHÓNG
          ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white border border-[#E6E2DA] rounded-2xl p-3 shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#FAF9F6] text-[#1C1917] border border-[#E6E2DA] flex items-center justify-center">
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#1C1917]">
                Danh mục tính Báo cáo & Dự phóng
              </span>
              {hasExcludedCategories ? (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#B45309] font-bold border border-[#FDE68A]">
                  Đang loại trừ {excludedCategoryIds.length} nhóm
                </span>
              ) : (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#E7EFEF] text-[#0F3D39] font-medium border border-[#D1E2E0]">
                  Tính toàn bộ danh mục
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#78716C] mt-0.5">
              {hasExcludedCategories 
                ? `Đã trừ ${formatVND(excludedTotalExpense)} để nhịp chi và dự phòng phản ánh đúng sinh hoạt`
                : 'Bấm cài đặt để loại trừ các khoản trả nợ ngân hàng hoặc chi đột biến lớn'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {hasExcludedCategories && (
            <button
              onClick={() => {
                playActionClick();
                triggerHaptic(6);
                handleSelectAll();
              }}
              className="py-1.5 px-2.5 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] hover:bg-[#F5F3EF] text-[11px] font-medium text-[#78716C] hover:text-[#1C1917] flex items-center gap-1 transition-colors active:scale-95"
              title="Tính toán toàn bộ các danh mục"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Tính tất cả</span>
            </button>
          )}

          <button
            onClick={() => {
              playActionClick();
              triggerHaptic(8);
              setIsFilterModalOpen(true);
            }}
            className="py-1.5 px-3 rounded-xl bg-[#0F3D39] text-white text-xs font-semibold hover:bg-[#174E4A] flex items-center gap-1.5 transition-all shadow-xs active:scale-95"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Tùy chọn nhóm</span>
          </button>
        </div>
      </div>

      {/* Banner thông báo chi tiết nếu đang có danh mục bị loại trừ */}
      {hasExcludedCategories && (
        <div className="bg-[#FEF3C7]/60 border border-[#FDE68A] rounded-2xl p-3 text-xs text-[#92400E] flex items-center justify-between gap-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 min-w-0">
            <Info className="w-4 h-4 shrink-0 text-[#B45309]" />
            <p className="truncate text-[11px] sm:text-xs">
              Đang bỏ qua: <strong>{excludedCategoryNames.join(', ')}</strong> ({formatVND(excludedTotalExpense)}). Sổ cái gốc vẫn giữ nguyên.
            </p>
          </div>
          <button
            onClick={() => setIsFilterModalOpen(true)}
            className="text-[11px] font-bold text-[#B45309] hover:underline shrink-0 font-mono"
          >
            Đổi bộ lọc
          </button>
        </div>
      )}

      {/* =========================================================================
          KHỐI 1: TỔNG QUAN DÒNG TIỀN & THẶNG DƯ TÍCH LŨY (FINANCIAL HEALTH)
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Thẻ 1: Tổng chi tiêu & Dự phóng */}
        <div className="bg-white border border-[#E6E2DA] rounded-3xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#78716C] flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-[#0F3D39]" />
              Chi tiêu tính báo cáo
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FAF9F6] text-[#78716C] border border-[#E6E2DA]">
              {includedExpenseTransactions.length} giao dịch
            </span>
          </div>

          <div className="mt-2.5">
            <div className="text-2xl font-bold font-mono text-[#1C1917] tracking-tight tabular-nums">
              {formatVND(reportTotalExpense)}
            </div>
            {hasExcludedCategories ? (
              <p className="text-[10px] text-[#B45309] mt-0.5 font-mono">
                Sổ cái gốc: {formatVND(totalExpense)}
              </p>
            ) : (
              <p className="text-[11px] text-[#78716C] mt-1 flex items-center gap-1">
                Hạn mức: <span className="font-mono font-medium">{formatVND(monthlyBudget)}</span>
              </p>
            )}
          </div>

          <div className="mt-3 pt-2.5 border-t border-[#F5F3EF] flex items-center justify-between text-[11px]">
            <span className="text-[#78716C]">Tốc độ chi:</span>
            <span className="font-mono font-semibold text-[#1C1917] flex items-center gap-1">
              <Flame className="w-3 h-3 text-[#B45309]" />
              {formatVND(dailyBurnRate)}/ngày
            </span>
          </div>
        </div>

        {/* Thẻ 2: Thu nhập & Thặng dư tiết kiệm */}
        <div className="bg-white border border-[#E6E2DA] rounded-3xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#78716C] flex items-center gap-1.5">
              <PiggyBank className="w-3.5 h-3.5 text-[#B45309]" />
              Tích lũy & Thu nhập
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#B45309] font-medium">
              {savingsRatio}% tích lũy
            </span>
          </div>

          <div className="mt-2.5">
            <div className="text-2xl font-bold font-mono text-[#0F3D39] tracking-tight tabular-nums">
              {formatVND(netSavings)}
            </div>
            <p className="text-[11px] text-[#78716C] mt-1">
              Tổng thu: <span className="font-mono font-medium">{formatVND(totalIncome)}</span>
            </p>
          </div>

          <div className="mt-3 pt-2.5 border-t border-[#F5F3EF] flex items-center justify-between text-[11px]">
            <span className="text-[#78716C]">Tỷ lệ thiết yếu:</span>
            <span className="font-mono font-semibold text-[#1C1917]">
              {essentialRatio}% tổng chi
            </span>
          </div>
        </div>

        {/* Thẻ 3: Dự phóng cuối tháng */}
        <div className="bg-white border border-[#E6E2DA] rounded-3xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#78716C] flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[#4A6B68]" />
              Dự phóng cuối tháng
            </span>
            {isProjectedOver ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FFF1F2] text-[#E11D48] font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Nguy cơ vượt
              </span>
            ) : (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#E7EFEF] text-[#0F3D39] font-medium flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Trong tầm kiểm soát
              </span>
            )}
          </div>

          <div className="mt-2.5">
            <div className={`text-2xl font-bold font-mono tracking-tight tabular-nums ${isProjectedOver ? 'text-[#E11D48]' : 'text-[#1C1917]'}`}>
              {formatVND(projectedExpense)}
            </div>
            <p className="text-[11px] text-[#78716C] mt-1">
              {isProjectedOver ? (
                <span>Dự kiến vượt hạn mức: <strong className="text-[#E11D48] font-mono">{formatVND(projectedDiff)}</strong></span>
              ) : (
                <span>Dự kiến dư hạn mức: <strong className="text-[#0F3D39] font-mono">{formatVND(projectedDiff)}</strong></span>
              )}
            </p>
          </div>

          <div className="mt-3 pt-2.5 border-t border-[#F5F3EF] flex items-center justify-between text-[11px] text-[#78716C]">
            <span>Mục tiêu ngân sách:</span>
            <span className="font-mono font-medium text-[#1C1917]">
              {formatVND(monthlyBudget)}
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          KHỐI 2: CÁN CÂN ĐỒNG HÀNH VỢ — CHỒNG (BILATERAL EXPENSES)
          ========================================================================= */}
      <div className="bg-white border border-[#E6E2DA] rounded-3xl p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-[#F5F3EF] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#E7EFEF] text-[#0F3D39] flex items-center justify-center">
              <Scale className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#1C1917]">
                Cán cân đồng hành Vợ — Chồng
              </h3>
              <p className="text-[11px] text-[#78716C]">
                Tỷ trọng chi trả và tần suất giao dịch trong tháng {hasExcludedCategories && '(sau lọc)'}
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-[#1C1917]">
            {husbandReportRatio}% / {wifeReportRatio}%
          </span>
        </div>

        {/* Thanh tỷ lệ song phương */}
        <div className="h-3 w-full rounded-full overflow-hidden flex bg-[#F5F3EF] border border-[#E6E2DA]/60 mb-4">
          <div
            style={{ width: `${husbandReportRatio}%` }}
            className="h-full bg-[#0F3D39] transition-all duration-300"
            title={`Chồng: ${husbandReportRatio}%`}
          />
          <div
            style={{ width: `${wifeReportRatio}%` }}
            className="h-full bg-[#B45309] transition-all duration-300"
            title={`Vợ: ${wifeReportRatio}%`}
          />
        </div>

        {/* Bảng so sánh chi tiết hai bên */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          {/* Cột Chồng */}
          <div className="bg-[#FAF9F6] border border-[#E6E2DA] rounded-2xl p-3.5 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0F3D39]" />
              <span className="text-xs font-semibold text-[#1C1917]">Chồng</span>
              <span className="text-[10px] font-mono text-[#0F3D39] ml-auto font-medium">
                {husbandReportRatio}%
              </span>
            </div>
            <div className="text-lg font-bold font-mono text-[#1C1917] tabular-nums">
              {formatVND(husbandReportExpense)}
            </div>
            <div className="text-[11px] text-[#78716C] flex justify-between border-t border-[#E6E2DA]/40 pt-1.5 font-mono">
              <span>{husbandTxCount} lần chi</span>
              <span>TB: {formatVND(husbandAvgTx)}</span>
            </div>
          </div>

          {/* Cột Vợ */}
          <div className="bg-[#FAF9F6] border border-[#E6E2DA] rounded-2xl p-3.5 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#B45309]" />
              <span className="text-xs font-semibold text-[#1C1917]">Vợ</span>
              <span className="text-[10px] font-mono text-[#B45309] ml-auto font-medium">
                {wifeReportRatio}%
              </span>
            </div>
            <div className="text-lg font-bold font-mono text-[#1C1917] tabular-nums">
              {formatVND(wifeReportExpense)}
            </div>
            <div className="text-[11px] text-[#78716C] flex justify-between border-t border-[#E6E2DA]/40 pt-1.5 font-mono">
              <span>{wifeTxCount} lần chi</span>
              <span>TB: {formatVND(wifeAvgTx)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          KHỐI 3: BIỂU ĐỒ NHỊP ĐIỆU THEO NGÀY (DAILY RHYTHM CHART)
          ========================================================================= */}
      <DailySpendingChart
        transactions={transactionsForChart}
        currentYearMonth={currentYearMonth}
      />

      {/* =========================================================================
          KHỐI 4: PHÂN BỔ CƠ CẤU THEO NHÓM CHI (CATEGORY BREAKDOWN)
          ========================================================================= */}
      <CategoryBreakdown
        transactions={includedExpenseTransactions}
        categories={categories}
        totalExpense={reportTotalExpense}
      />

      {/* =========================================================================
          KHỐI 5: TOP 5 KHOẢN CHI LỚN NHẤT & LỜI KHUYÊN TỔ ẤM
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-start">
        {/* Top 5 khoản chi lớn nhất (7 cols) */}
        <div className="sm:col-span-7 bg-white border border-[#E6E2DA] rounded-3xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#F5F3EF] pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#FAF9F6] text-[#1C1917] border border-[#E6E2DA] flex items-center justify-center">
                <ReceiptText className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#1C1917]">
                Top 5 khoản chi tính báo cáo
              </h3>
            </div>
            <span className="text-[11px] text-[#78716C] font-mono">Tháng này</span>
          </div>

          {topExpenses.length === 0 ? (
            <p className="text-xs text-[#78716C] py-4 text-center font-mono">
              Chưa có giao dịch nào phát sinh.
            </p>
          ) : (
            <div className="divide-y divide-[#F5F3EF]">
              {topExpenses.map((tx, idx) => (
                <div key={tx.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded-md bg-[#F5F3EF] text-[#78716C] flex items-center justify-center text-[10px] font-mono font-bold shrink-0">
                      0{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#1C1917] truncate">
                        {tx.note || tx.categoryName}
                      </p>
                      <p className="text-[10px] text-[#78716C] font-mono">
                        {tx.date} • {tx.categoryName} • <span className={tx.paidBy === 'Chồng' ? 'text-[#0F3D39] font-medium' : 'text-[#B45309] font-medium'}>{tx.paidBy}</span>
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-bold font-mono text-[#1C1917] tabular-nums shrink-0">
                    {formatVND(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lời khuyên tổ ấm thông minh (5 cols) */}
        <div className="sm:col-span-5 bg-[#FAF9F6] border border-[#E6E2DA] rounded-3xl p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 border-b border-[#E6E2DA]/60 pb-3">
            <div className="w-7 h-7 rounded-lg bg-[#FEF3C7] text-[#B45309] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#1C1917]">
              Góc nhìn tổ ấm
            </h3>
          </div>

          <div className="space-y-2.5 text-xs text-[#57534E] leading-relaxed">
            <p>
              🏡 <strong>Chi tiêu thiết yếu:</strong> Đang chiếm{' '}
              <strong className="text-[#1C1917] font-mono">{essentialRatio}%</strong> chi tiêu báo cáo.
              {essentialRatio <= 70 ? (
                ' Mức này nằm trong ngưỡng an toàn lý tưởng của quy tắc ngân sách gia đình.'
              ) : (
                ' Khoản thiết yếu đang chiếm phần lớn, hãy cân nhắc tối ưu các hóa đơn sinh hoạt định kỳ.'
              )}
            </p>

            <p>
              ⚖️ <strong>Cán cân đồng hành:</strong>{' '}
              {husbandReportRatio > 65 ? (
                'Chồng đang gánh vác phần lớn chi phí tháng này. Hai vợ chồng có thể cùng xem lại để san sẻ thêm.'
              ) : wifeReportRatio > 65 ? (
                'Vợ đang chi trả phần lớn các khoản trong tháng. Hãy cùng nhau rà soát lại các mục chung nhé.'
              ) : (
                'Hai vợ chồng đang cùng nhau san sẻ chi tiêu rất cân bằng và gắn kết!'
              )}
            </p>

            <p>
              💡 <strong>Tốc độ chi tiêu:</strong> Với nhịp chi{' '}
              <strong className="text-[#1C1917] font-mono">{formatVND(dailyBurnRate)}</strong>/ngày,{' '}
              {isProjectedOver ? (
                <span className="text-[#E11D48] font-medium">
                  gia đình nên giảm bớt các khoản chi ngẫu hứng để không vượt hạn mức tháng.
                </span>
              ) : (
                <span className="text-[#0F3D39] font-medium">
                  tổ ấm đang duy trì kỷ luật tài chính rất tốt!
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Modal Cài đặt Danh mục tính Báo cáo & Dự phóng */}
      <ReportCategoryFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        categories={categories}
        transactions={transactions}
        excludedCategoryIds={excludedCategoryIds}
        onToggleCategory={handleToggleCategory}
        onSelectAll={handleSelectAll}
        onExcludeDebtAndSavings={handleExcludeDebtAndSavings}
      />
    </div>
  );
};

