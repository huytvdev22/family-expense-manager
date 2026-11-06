import React, { useState, useMemo } from 'react';
import type { FinancialGoal, Transaction } from '../types';
import { formatVND, formatCompactVND } from '../utils/currency';
import { TrendingDown, TrendingUp, Sparkles, AlertCircle, CheckCircle2, Calendar, Clock, Layers } from 'lucide-react';

interface GoalBurndownChartProps {
  goal: FinancialGoal;
  transactions: Transaction[];
  className?: string;
}

interface ChartPoint {
  periodIndex: number; // Kỳ thứ k
  label: string; // "T1/25" hoặc "Bắt đầu" hoặc "Kỳ 120"
  fullLabel: string;
  actual: number | null; // Dư nợ thực tế
  planned: number; // Dư nợ kế hoạch ban đầu
  forecast?: number | null; // Dự phóng từ hiện tại về 0đ
  isCurrent?: boolean;
  isPlannedEnd?: boolean;
  isForecastEnd?: boolean;
}

export const GoalBurndownChart: React.FC<GoalBurndownChartProps> = ({
  goal,
  transactions,
  className = ''
}) => {
  const isDebt = goal.type === 'DEBT_PAYOFF';
  const initialAmt = goal.initialAmount || 0;
  const currentAmt = goal.currentAmount || 0;
  const targetAmt = isDebt ? 0 : (goal.targetAmount || 0);

  // Chế độ xem: 'LIFECYCLE' (Toàn cảnh vòng đời từ bắt đầu -> 0đ) hoặc 'RECENT' (Chi tiết các tháng đã ghi nhận)
  const [viewMode, setViewMode] = useState<'LIFECYCLE' | 'RECENT'>('LIFECYCLE');
  // State cho hover / touch tooltip
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);

  // 1. Phân tích giao dịch & Xác định các tham số cốt lõi
  const analysis = useMemo(() => {
    const goalTxs = transactions
      .filter((tx) => tx.goalId === goal.id)
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    // Gom số tiền trả gốc theo từng tháng "YYYY-MM"
    const monthlyPrincipalMap = new Map<string, number>();
    goalTxs.forEach((tx) => {
      if (!tx.date) return;
      const ym = tx.date.substring(0, 7);
      if (isDebt) {
        if (tx.debtPaymentType !== 'INTEREST') {
          monthlyPrincipalMap.set(ym, (monthlyPrincipalMap.get(ym) || 0) + tx.amount);
        }
      } else {
        monthlyPrincipalMap.set(ym, (monthlyPrincipalMap.get(ym) || 0) + tx.amount);
      }
    });

    // Xác định số tiền trả cố định hàng tháng (monthlyTarget)
    let fixedMonthly = goal.monthlyTarget && goal.monthlyTarget > 0 ? goal.monthlyTarget : 0;
    if (fixedMonthly <= 0) {
      // Nếu chưa có monthlyTarget, thử tìm số tiền trả phổ biến nhất trong các giao dịch gần đây
      const amounts = Array.from(monthlyPrincipalMap.values()).filter((a) => a > 0);
      if (amounts.length > 0) {
        // Lấy trung vị hoặc trung bình
        const sum = amounts.reduce((acc, v) => acc + v, 0);
        fixedMonthly = Math.round(sum / amounts.length);
      } else {
        fixedMonthly = isDebt ? (initialAmt > 0 ? Math.round(initialAmt / 120) : 10_000_000) : 5_000_000;
      }
    }

    // Số kỳ dự kiến ban đầu theo công thức: initialAmount / monthlyTarget
    const totalPlannedPeriods = isDebt
      ? (initialAmt > 0 && fixedMonthly > 0 ? Math.ceil(initialAmt / fixedMonthly) : 12)
      : (targetAmt > 0 && fixedMonthly > 0 ? Math.ceil(targetAmt / fixedMonthly) : 12);

    // Xác định tháng bắt đầu & tháng hiện tại
    let startYearMonth = '';
    if (goalTxs.length > 0 && goalTxs[0].date) {
      startYearMonth = goalTxs[0].date.substring(0, 7);
    }
    if (!startYearMonth && goal.createdAt) {
      startYearMonth = goal.createdAt.substring(0, 7);
    }
    if (!startYearMonth) {
      const now = new Date();
      startYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }

    const today = new Date();
    const currentYearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    const [startYear, startMonth] = startYearMonth.split('-').map(Number);
    const [curYear, curMonth] = currentYearMonth.split('-').map(Number);
    const passedMonths = Math.max(1, (curYear - startYear) * 12 + (curMonth - startMonth));

    // Số kỳ còn lại dự kiến theo thực tế hiện tại
    const remainingPeriods = isDebt
      ? (currentAmt > 0 && fixedMonthly > 0 ? Math.ceil(currentAmt / fixedMonthly) : 0)
      : (targetAmt > currentAmt && fixedMonthly > 0 ? Math.ceil((targetAmt - currentAmt) / fixedMonthly) : 0);

    const finishForecastPeriod = passedMonths + remainingPeriods;

    // So sánh tiến độ tại tháng hiện tại
    const plannedAtCurrent = isDebt
      ? Math.max(0, initialAmt - passedMonths * fixedMonthly)
      : Math.min(targetAmt, initialAmt + passedMonths * fixedMonthly);

    const diff = isDebt ? (plannedAtCurrent - currentAmt) : (currentAmt - plannedAtCurrent);
    let statusType: 'ahead' | 'behind' | 'on_track' = 'on_track';
    let statusText = '';

    if (isDebt) {
      if (diff > fixedMonthly * 0.5) {
        statusType = 'ahead';
        const monthsAhead = Math.round(diff / fixedMonthly);
        const yearsAhead = (monthsAhead / 12).toFixed(1).replace('.0', '');
        statusText = monthsAhead >= 12
          ? `Vượt tiến độ ~${yearsAhead} năm (trả trước ${formatCompactVND(diff)})`
          : `Vượt tiến độ ~${monthsAhead} tháng (trả trước ${formatCompactVND(diff)})`;
      } else if (diff < -fixedMonthly * 0.5) {
        statusType = 'behind';
        const monthsBehind = Math.round(Math.abs(diff) / fixedMonthly);
        statusText = `Chậm tiến độ ~${monthsBehind} tháng`;
      } else {
        statusType = 'on_track';
        statusText = 'Bám sát kế hoạch dự kiến';
      }
    } else {
      if (diff > fixedMonthly * 0.5) {
        statusType = 'ahead';
        statusText = `Vượt tiến độ tích lũy (+${formatCompactVND(diff)})`;
      } else if (diff < -fixedMonthly * 0.5) {
        statusType = 'behind';
        statusText = `Chậm hơn mục tiêu`;
      } else {
        statusType = 'on_track';
        statusText = 'Bám sát kế hoạch tích lũy';
      }
    }

    return {
      goalTxs,
      monthlyPrincipalMap,
      fixedMonthly,
      totalPlannedPeriods,
      startYear,
      startMonth,
      startYearMonth,
      currentYearMonth,
      passedMonths,
      remainingPeriods,
      finishForecastPeriod,
      plannedAtCurrent,
      diff,
      statusType,
      statusText
    };
  }, [goal, transactions, isDebt, initialAmt, currentAmt, targetAmt]);

  // 2. Tạo tập điểm dữ liệu vẽ biểu đồ dựa trên Chế độ xem
  const chartData = useMemo(() => {
    const {
      monthlyPrincipalMap,
      fixedMonthly,
      totalPlannedPeriods,
      startYear,
      startMonth,
      passedMonths,
      finishForecastPeriod,
      statusType,
      statusText
    } = analysis;

    const points: ChartPoint[] = [];

    if (viewMode === 'LIFECYCLE') {
      // =========================================================================
      // CHẾ ĐỘ TOÀN CẢNH VÒNG ĐỜI (LIFECYCLE VIEW):
      // Thể hiện toàn bộ từ Kỳ 0 -> Kỳ hiện tại -> Điểm về 0đ dự phóng -> Kỳ kết thúc hợp đồng ban đầu
      // =========================================================================
      const maxPeriod = Math.max(totalPlannedPeriods, finishForecastPeriod, passedMonths + 2);

      // Điểm 0: Khởi đầu
      points.push({
        periodIndex: 0,
        label: 'Bắt đầu',
        fullLabel: `Kỳ 0 (Khởi đầu vay)`,
        actual: initialAmt,
        planned: initialAmt
      });

      // Các điểm trung gian trong quá khứ (lấy 3-4 điểm đại diện nếu quá dài)
      const pastStep = Math.max(1, Math.floor(passedMonths / 4));
      let runningDebt = initialAmt;
      let cumPaid = 0;

      for (let p = 1; p < passedMonths; p++) {
        const targetDate = new Date(startYear, startMonth - 1 + p, 1);
        const ym = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
        const paidThisMonth = monthlyPrincipalMap.get(ym) || 0;
        cumPaid += paidThisMonth;
        runningDebt = Math.max(0, initialAmt - cumPaid);

        if (p % pastStep === 0) {
          const plannedVal = isDebt
            ? Math.max(0, initialAmt - p * fixedMonthly)
            : Math.min(targetAmt, initialAmt + p * fixedMonthly);

          points.push({
            periodIndex: p,
            label: `T${targetDate.getMonth() + 1}/${String(targetDate.getFullYear()).slice(-2)}`,
            fullLabel: `Kỳ ${p} (${ym})`,
            actual: isDebt ? runningDebt : cumPaid,
            planned: plannedVal
          });
        }
      }

      // Điểm Hiện tại
      const curDate = new Date(startYear, startMonth - 1 + passedMonths, 1);
      const curPlanned = isDebt
        ? Math.max(0, initialAmt - passedMonths * fixedMonthly)
        : Math.min(targetAmt, initialAmt + passedMonths * fixedMonthly);

      points.push({
        periodIndex: passedMonths,
        label: 'Hiện tại',
        fullLabel: `Kỳ ${passedMonths} (Hiện tại)`,
        actual: currentAmt,
        planned: curPlanned,
        forecast: currentAmt,
        isCurrent: true
      });

      // Điểm Cán đích thực tế (Forecast Finish) nếu về đích trước kế hoạch ban đầu
      if (finishForecastPeriod > passedMonths && finishForecastPeriod < totalPlannedPeriods) {
        const forecastFinishDate = new Date(startYear, startMonth - 1 + finishForecastPeriod, 1);
        const finishPlanned = isDebt
          ? Math.max(0, initialAmt - finishForecastPeriod * fixedMonthly)
          : targetAmt;

        points.push({
          periodIndex: finishForecastPeriod,
          label: `T${forecastFinishDate.getMonth() + 1}/${String(forecastFinishDate.getFullYear()).slice(-2)}`,
          fullLabel: `Kỳ ${finishForecastPeriod} (Dự kiến sạch nợ thực tế)`,
          actual: null,
          planned: finishPlanned,
          forecast: 0,
          isForecastEnd: true
        });
      }

      // Điểm Kết thúc theo Kế hoạch ban đầu (Planned End - Kỳ thứ N)
      if (totalPlannedPeriods > passedMonths) {
        const plannedEndDate = new Date(startYear, startMonth - 1 + totalPlannedPeriods, 1);
        points.push({
          periodIndex: totalPlannedPeriods,
          label: `Kỳ ${totalPlannedPeriods}`,
          fullLabel: `Kỳ ${totalPlannedPeriods} (Hết hạn hợp đồng ban đầu - T${plannedEndDate.getMonth() + 1}/${plannedEndDate.getFullYear()})`,
          actual: null,
          planned: 0,
          forecast: finishForecastPeriod >= totalPlannedPeriods ? 0 : null,
          isPlannedEnd: true
        });
      }
    } else {
      // =========================================================================
      // CHẾ ĐỘ CHI TIẾT CÁC THÁNG (RECENT MONTHS VIEW):
      // Hiển thị chi tiết từng tháng từ lúc bắt đầu đến hiện tại
      // =========================================================================
      points.push({
        periodIndex: 0,
        label: 'Bắt đầu',
        fullLabel: 'Thời điểm khởi đầu',
        actual: initialAmt,
        planned: initialAmt
      });

      let runningDebt = initialAmt;
      let cumPaid = 0;

      for (let p = 1; p <= passedMonths; p++) {
        const targetDate = new Date(startYear, startMonth - 1 + p, 1);
        const ym = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
        const paidThisMonth = monthlyPrincipalMap.get(ym) || 0;
        cumPaid += paidThisMonth;
        runningDebt = Math.max(0, initialAmt - cumPaid);

        const isCur = p === passedMonths;
        const plannedVal = isDebt
          ? Math.max(0, initialAmt - p * fixedMonthly)
          : Math.min(targetAmt, initialAmt + p * fixedMonthly);

        points.push({
          periodIndex: p,
          label: `T${targetDate.getMonth() + 1}/${String(targetDate.getFullYear()).slice(-2)}`,
          fullLabel: `${ym} (Kỳ ${p})`,
          actual: isCur ? currentAmt : (isDebt ? runningDebt : cumPaid),
          planned: plannedVal,
          isCurrent: isCur
        });
      }
    }

    // Sắp xếp các điểm theo periodIndex tăng dần
    points.sort((a, b) => a.periodIndex - b.periodIndex);

    // Tính giá trị lớn nhất cho trục Y
    const maxVal = Math.max(
      initialAmt,
      targetAmt,
      ...points.map((p) => Math.max(p.actual ?? 0, p.planned, p.forecast ?? 0))
    );

    return {
      points,
      maxVal: maxVal > 0 ? maxVal : 1,
      statusType,
      statusText
    };
  }, [analysis, viewMode, initialAmt, currentAmt, targetAmt, isDebt]);

  // Kích thước SVG
  const svgWidth = 460;
  const svgHeight = 195;
  const padding = { top: 22, right: 28, bottom: 32, left: 54 };
  const chartW = svgWidth - padding.left - padding.right;
  const chartH = svgHeight - padding.top - padding.bottom;

  const { points, maxVal, statusType, statusText } = chartData;
  const { fixedMonthly, totalPlannedPeriods, finishForecastPeriod, passedMonths } = analysis;

  const minPeriod = points.length > 0 ? points[0].periodIndex : 0;
  const maxPeriod = points.length > 0 ? points[points.length - 1].periodIndex : 1;
  const periodSpan = Math.max(1, maxPeriod - minPeriod);

  // Chuyển đổi giá trị tiền sang tọa độ Y
  const getY = (val: number) => {
    const ratio = Math.max(0, Math.min(1, val / maxVal));
    return padding.top + chartH - ratio * chartH;
  };

  // Chuyển đổi kỳ thứ k sang tọa độ X
  const getX = (periodIndex: number) => {
    const ratio = (periodIndex - minPeriod) / periodSpan;
    return padding.left + ratio * chartW;
  };

  // Tạo đường dẫn SVG Path cho Kế hoạch (Planned Line)
  const plannedPath = useMemo(() => {
    if (points.length === 0) return '';
    return points.reduce((path, pt, idx) => {
      const x = getX(pt.periodIndex);
      const y = getY(pt.planned);
      return idx === 0 ? `M ${x} ${y}` : `${path} L ${x} ${y}`;
    }, '');
  }, [points, minPeriod, periodSpan]);

  // Tạo đường dẫn SVG Path cho Thực tế (Actual Line) & Dự phóng (Forecast Line)
  const { actualPath, actualAreaPath, forecastPath } = useMemo(() => {
    const actualPoints = points.filter((p) => p.actual !== null);
    if (actualPoints.length === 0) {
      return { actualPath: '', actualAreaPath: '', forecastPath: '' };
    }

    let aPath = '';
    let lastX = 0;
    let lastY = 0;

    actualPoints.forEach((pt, idx) => {
      const x = getX(pt.periodIndex);
      const y = getY(pt.actual ?? 0);
      lastX = x;
      lastY = y;
      aPath = idx === 0 ? `M ${x} ${y}` : `${aPath} L ${x} ${y}`;
    });

    // Vùng phủ bóng mờ dưới đường thực tế
    const firstX = getX(actualPoints[0].periodIndex);
    const bottomY = padding.top + chartH;
    const aAreaPath = `${aPath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;

    // Đường dự phóng (Forecast) từ điểm hiện tại dốc tiếp về 0đ
    let fPath = '';
    const forecastPoints = points.filter((p) => p.forecast !== undefined && p.forecast !== null);
    if (forecastPoints.length >= 2) {
      forecastPoints.forEach((pt, idx) => {
        const x = getX(pt.periodIndex);
        const y = getY(pt.forecast ?? 0);
        fPath = idx === 0 ? `M ${x} ${y}` : `${fPath} L ${x} ${y}`;
      });
    }

    return {
      actualPath: aPath,
      actualAreaPath: aAreaPath,
      forecastPath: fPath
    };
  }, [points, chartH, padding.top, minPeriod, periodSpan]);

  // Các vạch trục Y (100%, 50%, 0)
  const yTicks = [
    { value: maxVal, label: formatCompactVND(maxVal) },
    { value: Math.round(maxVal / 2), label: formatCompactVND(maxVal / 2) },
    { value: 0, label: '0 ₫' }
  ];

  const primaryColor = goal.color || (isDebt ? '#B45309' : '#0F3D39');
  const activePoint = activePointIndex !== null ? points[activePointIndex] : null;

  return (
    <div className={`p-4 rounded-3xl bg-[#FAF9F6] border border-[#E6E2DA] space-y-3 relative ${className}`}>
      {/* Header: Tiêu đề + Nút chuyển đổi góc nhìn + Badge tiến độ */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-[#F5F3EF] border border-[#E6E2DA] flex items-center justify-center text-[#B45309] shrink-0">
            {isDebt ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#1C1917] tracking-tight">
              {isDebt ? 'Biểu đồ xóa nợ Burndown' : 'Biểu đồ tích lũy Burnup'}
            </h4>
            <p className="text-[10px] text-[#78716C] font-mono">
              Kế hoạch: {totalPlannedPeriods} kỳ ({formatCompactVND(fixedMonthly)}/tháng)
            </p>
          </div>
        </div>

        {/* Nút toggle chuyển chế độ xem */}
        <div className="flex items-center gap-1 bg-[#EAE7E1] p-0.5 rounded-xl border border-[#DCD7CD]">
          <button
            type="button"
            onClick={() => {
              setViewMode('LIFECYCLE');
              setActivePointIndex(null);
            }}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer ${
              viewMode === 'LIFECYCLE'
                ? 'bg-white text-[#0F3D39] shadow-2xs'
                : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            Toàn cảnh
          </button>
          <button
            type="button"
            onClick={() => {
              setViewMode('RECENT');
              setActivePointIndex(null);
            }}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer ${
              viewMode === 'RECENT'
                ? 'bg-white text-[#0F3D39] shadow-2xs'
                : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            Đã qua ({passedMonths}T)
          </button>
        </div>
      </div>

      {/* Badge đánh giá so sánh Thực tế vs Kế hoạch */}
      <div
        className={`px-3 py-1.5 rounded-2xl text-[11px] font-bold font-mono flex items-center justify-between border ${
          statusType === 'ahead'
            ? 'bg-[#ECFDF5] text-[#065F46] border-[#10B981]/30'
            : statusType === 'behind'
            ? 'bg-[#FEF2F2] text-[#B91C1C] border-[#EF4444]/30'
            : 'bg-[#F5F3EF] text-[#78716C] border-[#E6E2DA]'
        }`}
      >
        <div className="flex items-center gap-1.5">
          {statusType === 'ahead' && <Sparkles className="w-3.5 h-3.5 text-[#10B981]" />}
          {statusType === 'behind' && <AlertCircle className="w-3.5 h-3.5 text-[#EF4444]" />}
          {statusType === 'on_track' && <CheckCircle2 className="w-3.5 h-3.5 text-[#78716C]" />}
          <span>{statusText}</span>
        </div>
        {viewMode === 'LIFECYCLE' && finishForecastPeriod < totalPlannedPeriods && (
          <span className="text-[10px] font-semibold text-[#065F46] hidden xs:inline">
            Sạch nợ kỳ ~{finishForecastPeriod} (thay vì {totalPlannedPeriods})
          </span>
        )}
      </div>

      {/* Chú giải đường biểu đồ (Legend) */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#78716C] font-mono px-1">
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-0.5 rounded-full" style={{ backgroundColor: primaryColor }} />
          <span className="text-[#1C1917] font-semibold">Thực tế</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 border-b-2 border-dashed border-[#A8A29E]" />
          <span>Kế hoạch ({formatCompactVND(fixedMonthly)}/kỳ)</span>
        </div>
        {forecastPath && (
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 border-b border-dotted" style={{ borderColor: primaryColor }} />
            <span>Dự phóng về 0đ</span>
          </div>
        )}
      </div>

      {/* Vùng vẽ biểu đồ SVG */}
      <div className="relative w-full overflow-hidden select-none pt-1">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto overflow-visible touch-pan-x"
        >
          <defs>
            <linearGradient id={`burndown-grad-${goal.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={primaryColor} stopOpacity="0.16" />
              <stop offset="100%" stopColor={primaryColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Lưới ngang & Nhãn trục Y */}
          {yTicks.map((tick, i) => {
            const y = getY(tick.value);
            return (
              <g key={`y-grid-${i}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={svgWidth - padding.right}
                  y2={y}
                  stroke="#E6E2DA"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  className="text-[9px] font-mono font-medium fill-[#78716C]"
                >
                  {tick.label}
                </text>
              </g>
            );
          })}

          {/* Vùng bóng mờ bên dưới đường thực tế */}
          {actualAreaPath && (
            <path d={actualAreaPath} fill={`url(#burndown-grad-${goal.id})`} />
          )}

          {/* 1. Đường Kế hoạch (Planned Line) - Nét đứt màu xám */}
          {plannedPath && (
            <path
              d={plannedPath}
              fill="none"
              stroke="#A8A29E"
              strokeWidth="1.75"
              strokeDasharray="4 4"
              strokeLinecap="round"
            />
          )}

          {/* 2. Đường Dự phóng (Forecast Line) từ hiện tại về 0đ */}
          {forecastPath && (
            <path
              d={forecastPath}
              fill="none"
              stroke={primaryColor}
              strokeWidth="1.5"
              strokeDasharray="2 3"
              strokeOpacity="0.8"
            />
          )}

          {/* 3. Đường Thực tế (Actual Line) - Nét liền Terracotta đậm */}
          {actualPath && (
            <path
              d={actualPath}
              fill="none"
              stroke={primaryColor}
              strokeWidth="2.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Các điểm Nodes trên biểu đồ */}
          {points.map((pt, idx) => {
            const x = getX(pt.periodIndex);
            const yPlanned = getY(pt.planned);
            const yActual = pt.actual !== null ? getY(pt.actual) : null;
            const yForecast = pt.forecast !== undefined && pt.forecast !== null ? getY(pt.forecast) : null;
            const isHovered = activePointIndex === idx;

            return (
              <g
                key={`pt-${pt.periodIndex}-${idx}`}
                className="cursor-pointer"
                onClick={() => setActivePointIndex(activePointIndex === idx ? null : idx)}
                onMouseEnter={() => setActivePointIndex(idx)}
                onMouseLeave={() => setActivePointIndex(null)}
              >
                {/* Vùng touch vô hình mở rộng */}
                <rect
                  x={x - 14}
                  y={padding.top}
                  width={28}
                  height={chartH}
                  fill="transparent"
                />

                {/* Đường dóng dọc khi hover / chạm */}
                {isHovered && (
                  <line
                    x1={x}
                    y1={padding.top}
                    x2={x}
                    y2={padding.top + chartH}
                    stroke="#D6D3D1"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                )}

                {/* Điểm trên đường kế hoạch */}
                <circle
                  cx={x}
                  cy={yPlanned}
                  r="2"
                  fill="#A8A29E"
                  opacity={isHovered ? 1 : 0.6}
                />

                {/* Điểm trên đường thực tế */}
                {yActual !== null && (
                  <g>
                    {pt.isCurrent && (
                      <circle
                        cx={x}
                        cy={yActual}
                        r="6"
                        fill={primaryColor}
                        opacity="0.25"
                        className="animate-pulse"
                      />
                    )}
                    <circle
                      cx={x}
                      cy={yActual}
                      r={isHovered ? "4.5" : pt.isCurrent ? "4" : "3"}
                      fill={primaryColor}
                    />
                  </g>
                )}

                {/* Điểm kết thúc dự phóng về 0đ */}
                {pt.isForecastEnd && yForecast !== null && (
                  <circle
                    cx={x}
                    cy={yForecast}
                    r={isHovered ? "4.5" : "3.5"}
                    fill="#FFFFFF"
                    stroke={primaryColor}
                    strokeWidth="1.5"
                  />
                )}

                {/* Nhãn mốc thời gian trục X */}
                <text
                  x={x}
                  y={padding.top + chartH + 16}
                  textAnchor="middle"
                  className={`text-[9px] font-mono transition-colors ${
                    isHovered
                      ? 'fill-[#0F3D39] font-bold'
                      : pt.isCurrent
                      ? 'fill-[#B45309] font-bold'
                      : 'fill-[#78716C]'
                  }`}
                >
                  {pt.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Tooltip nổi chi tiết khi bấm/chạm */}
        {activePoint && (
          <div
            className="absolute top-1 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-[#E6E2DA] shadow-md text-xs font-mono z-10 pointer-events-none flex items-center gap-2.5 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center gap-1 text-[#78716C]">
              <Clock className="w-3 h-3 text-[#0F3D39]" />
              <span className="font-bold text-[#1C1917]">{activePoint.fullLabel}</span>
            </div>
            <div className="h-3 w-px bg-[#E6E2DA]" />
            <div className="flex items-center gap-2">
              <span>
                Thực tế:{' '}
                <strong className="text-[#B45309]">
                  {activePoint.actual !== null 
                    ? formatVND(activePoint.actual) 
                    : activePoint.forecast !== undefined && activePoint.forecast !== null 
                    ? `~${formatVND(activePoint.forecast)} (Dự phóng)` 
                    : 'Chưa tới'}
                </strong>
              </span>
              <span className="text-[#78716C]">|</span>
              <span className="text-[#78716C]">
                Kế hoạch: <span className="text-[#1C1917]">{formatVND(activePoint.planned)}</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Ghi chú chân biểu đồ */}
      <div className="flex items-center justify-between text-[10px] text-[#A8A29E] font-mono pt-0.5">
        <span>* Chạm vào điểm để xem chi tiết</span>
        {viewMode === 'LIFECYCLE' ? (
          <span>Kế hoạch ban đầu: {totalPlannedPeriods} kỳ ({Math.round(totalPlannedPeriods / 12)} năm)</span>
        ) : (
          <span>Đang hiển thị {passedMonths} tháng đã qua</span>
        )}
      </div>
    </div>
  );
};
