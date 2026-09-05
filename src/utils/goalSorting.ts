import type { FinancialGoal } from '../types';

export type GoalSortOption = 
  | 'COMPLETION_AND_AMOUNT' // Ưu tiên sắp hoàn thành lên trước, sắp xếp theo số tiền (Mặc định)
  | 'REMAINING_AMOUNT_ASC'  // Số tiền còn lại nhỏ nhất (Snowball)
  | 'REMAINING_AMOUNT_DESC' // Số tiền còn lại lớn nhất (Avalanche)
  | 'NEWEST';               // Mới tạo gần đây

export interface GoalMetrics {
  paidOrSavedAmount: number;
  remainingAmount: number;
  percent: number;
  isCompleted: boolean;
}

/**
 * Tính toán các chỉ số tiến độ và số tiền còn lại của một mục tiêu
 */
export function getGoalMetrics(goal: FinancialGoal): GoalMetrics {
  const isDebt = goal.type === 'DEBT_PAYOFF';

  if (isDebt) {
    const initial = Math.max(0, goal.initialAmount || 0);
    const current = Math.max(0, goal.currentAmount || 0);
    const paid = Math.max(0, initial - current);
    const percent = initial > 0 ? Math.min(100, Math.round((paid / initial) * 100)) : (current === 0 ? 100 : 0);
    const isCompleted = goal.status === 'COMPLETED' || current === 0;

    return {
      paidOrSavedAmount: paid,
      remainingAmount: current,
      percent,
      isCompleted
    };
  } else {
    const target = Math.max(0, goal.targetAmount || 0);
    const current = Math.max(0, goal.currentAmount || 0);
    const hasTarget = target > 0;
    const percent = hasTarget ? Math.min(100, Math.round((current / target) * 100)) : 0;
    const remaining = hasTarget ? Math.max(0, target - current) : 0;
    const isCompleted = goal.status === 'COMPLETED' || (hasTarget && current >= target);

    return {
      paidOrSavedAmount: current,
      remainingAmount: remaining,
      percent,
      isCompleted
    };
  }
}

/**
 * Sắp xếp danh sách mục tiêu tài chính
 * Mặc định: Ưu tiên mục tiêu sắp hoàn thành (% cao hơn) lên trước, 
 * nếu cùng % thì ưu tiên số tiền còn lại nhỏ hơn (dễ dứt điểm sớm hơn).
 */
export function sortFinancialGoals(
  goals: FinancialGoal[],
  sortOption: GoalSortOption = 'COMPLETION_AND_AMOUNT'
): FinancialGoal[] {
  return [...goals].sort((a, b) => {
    // 1. Luôn ưu tiên mục tiêu đang hoạt động (ACTIVE) lên trước mục tiêu đã hoàn tất / lưu trữ
    const statusWeight = (status: string) => {
      if (status === 'ACTIVE') return 1;
      if (status === 'COMPLETED') return 2;
      return 3; // ARCHIVED
    };
    const sDiff = statusWeight(a.status) - statusWeight(b.status);
    if (sDiff !== 0) return sDiff;

    const metricsA = getGoalMetrics(a);
    const metricsB = getGoalMetrics(b);

    // Đối với các mục tiêu đã hoàn thành (COMPLETED): đưa mục tiêu hoàn thành/cập nhật gần đây lên trước
    if (metricsA.isCompleted && metricsB.isCompleted) {
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    }

    switch (sortOption) {
      case 'COMPLETION_AND_AMOUNT': {
        // 1. Ưu tiên % tiến độ cao hơn lên trước (sắp cán mốc 100%)
        const pDiff = metricsB.percent - metricsA.percent;
        if (pDiff !== 0) return pDiff;

        // 2. Nếu cùng % tiến độ: ưu tiên số tiền còn lại nhỏ hơn (dễ hoàn thành sớm hơn)
        const rDiff = metricsA.remainingAmount - metricsB.remainingAmount;
        if (rDiff !== 0) return rDiff;

        // 3. Nếu vẫn bằng: ưu tiên số tiền mục tiêu nhỏ hơn
        const targetA = a.type === 'DEBT_PAYOFF' ? a.initialAmount : a.targetAmount;
        const targetB = b.type === 'DEBT_PAYOFF' ? b.initialAmount : b.targetAmount;
        if (targetA !== targetB) return targetA - targetB;

        return (b.updatedAt || 0) - (a.updatedAt || 0);
      }

      case 'REMAINING_AMOUNT_ASC': {
        // Số tiền còn lại nhỏ nhất lên trước (Phương pháp Snowball)
        const rDiff = metricsA.remainingAmount - metricsB.remainingAmount;
        if (rDiff !== 0) return rDiff;
        return metricsB.percent - metricsA.percent;
      }

      case 'REMAINING_AMOUNT_DESC': {
        // Số tiền còn lại lớn nhất lên trước (Phương pháp Avalanche)
        const rDiff = metricsB.remainingAmount - metricsA.remainingAmount;
        if (rDiff !== 0) return rDiff;
        return metricsB.percent - metricsA.percent;
      }

      case 'NEWEST':
      default: {
        return (b.updatedAt || 0) - (a.updatedAt || 0);
      }
    }
  });
}
