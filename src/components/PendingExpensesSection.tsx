import React, { useState } from 'react';
import { 
  Clock, 
  Check, 
  Calendar, 
  Pencil, 
  CreditCard as CardIcon, 
  ChevronDown, 
  ChevronUp, 
  Receipt, 
  CheckCircle2,
  Plus
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatVND, formatCompactVND, formatDueDateBadge, formatDisplayDate, formatTxMonth } from '../utils/currency';
import { renderCategoryIcon } from '../utils/categoryIcons';
import { playActionClick } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';
import { EditPendingExpenseModal } from './EditPendingExpenseModal';
import { ConfirmPaidBottomSheet } from './ConfirmPaidBottomSheet';
import { SettleCreditCardBottomSheet } from './SettleCreditCardBottomSheet';
import { CardManagerModal } from './CardManagerModal';
import { EditTransactionModal } from './EditTransactionModal';
import type { PendingExpense, CreditCard, Transaction, UnsettledCardGroup } from '../types';

export const PendingExpensesSection: React.FC = () => {
  const { 
    activePendingExpenses, 
    totalPendingAmount, 
    compactCurrency, 
    categories,
    unsettledCardExpenses,
    totalUnsettledCardAmount,
    activeCreditCards,
    currentYearMonth
  } = useApp();

  // Modal chỉnh sửa khoản chờ hóa đơn rời
  const [selectedItem, setSelectedItem] = useState<PendingExpense | null>(null);
  const [confirmingItem, setConfirmingItem] = useState<PendingExpense | null>(null);

  // Modal chỉnh sửa khoản quẹt thẻ tín dụng
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Bottom Sheet quyết toán thẻ tín dụng
  const [settlingGroup, setSettlingGroup] = useState<UnsettledCardGroup | null>(null);

  // Modal quản lý thẻ tín dụng
  const [isCardManagerOpen, setIsCardManagerOpen] = useState<boolean>(false);

  // Trạng thái mở rộng accordion danh sách giao dịch con của từng thẻ
  const [expandedCardIds, setExpandedCardIds] = useState<Record<string, boolean>>({});

  const displayAmount = (amount: number) => {
    return compactCurrency ? formatCompactVND(amount) : formatVND(amount);
  };

  const toggleExpandCard = (cardId: string) => {
    playActionClick();
    triggerHaptic(6);
    setExpandedCardIds((prev) => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  const handleOpenItem = (item: PendingExpense) => {
    playActionClick();
    triggerHaptic(8);
    setSelectedItem(item);
  };

  const handleOpenTransaction = (tx: Transaction) => {
    playActionClick();
    triggerHaptic(8);
    setEditingTransaction(tx);
  };

  const handleQuickConfirmPaid = (e: React.MouseEvent, item: PendingExpense) => {
    e.stopPropagation();
    playActionClick();
    triggerHaptic(10);
    setConfirmingItem(item);
  };

  const handleOpenSettleSheet = (
    e: React.MouseEvent,
    group: UnsettledCardGroup
  ) => {
    e.stopPropagation();
    playActionClick();
    triggerHaptic(10);
    setSettlingGroup(group);
  };

  const hasCreditCards = activeCreditCards.length > 0;
  const hasDirectExpenses = activePendingExpenses.length > 0;
  const totalAllPending = totalPendingAmount + totalUnsettledCardAmount;

  // Render một dòng giao dịch quẹt thẻ
  const renderCardTxRow = (tx: Transaction) => {
    const cat = categories.find((c) => c.id === tx.categoryId);
    const isPastMonth = (tx.date || '') < `${currentYearMonth}-01`;

    return (
      <div
        key={tx.id}
        onClick={() => handleOpenTransaction(tx)}
        className="py-2.5 px-2 -mx-1 rounded-xl flex items-center justify-between gap-2 text-xs hover:bg-white active:bg-[#F5F3EF] transition-all cursor-pointer group select-none"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border border-[#E6E2DA] bg-white shadow-2xs group-hover:border-[#0F3D39]/40 transition-colors">
            {renderCategoryIcon(cat?.icon, "w-3.5 h-3.5", cat?.color || '#0F3D39')}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <p className="font-semibold text-[#1C1917] truncate group-hover:text-[#0F3D39] transition-colors">
                {tx.note || tx.categoryName}
              </p>
              {isPastMonth && (
                <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-[#FEF3C7] text-[#92400E] font-medium border border-[#FDE68A] shrink-0 font-mono">
                  {formatTxMonth(tx.date)}
                </span>
              )}
            </div>
            <p className="text-[10px] text-[#78716C] font-mono mt-0.5">
              {formatDisplayDate(tx.date)} • {tx.paidBy} quẹt
              {tx.goalName && (
                <span className="text-[#0F3D39] ml-1 truncate">
                  • 🎯 {tx.goalName}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="font-mono font-bold text-[#1C1917] tabular-nums">
            {formatVND(tx.amount)}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenTransaction(tx);
            }}
            className="text-[#A8A29E] hover:text-[#0F3D39] p-1 rounded-lg hover:bg-[#F5F3EF] opacity-70 group-hover:opacity-100 transition-all cursor-pointer"
            title="Chỉnh sửa khoản quẹt thẻ"
            aria-label="Chỉnh sửa"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  // TRƯỜNG HỢP 1: Gia đình chưa kết nối thẻ tín dụng VÀ cũng không có hóa đơn chờ chi
  if (!hasCreditCards && !hasDirectExpenses) {
    return (
      <>
        <section className="bg-white border border-[#E6E2DA] rounded-3xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#B45309]" />
              <h2 className="text-xs uppercase tracking-wider font-semibold text-[#78716C]">
                Khoản chờ thanh toán
              </h2>
            </div>
            <button
              type="button"
              onClick={() => {
                playActionClick();
                setIsCardManagerOpen(true);
              }}
              className="text-[11px] text-[#0F3D39] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <CardIcon className="w-3.5 h-3.5" />
              <span>+ Thẻ tín dụng</span>
            </button>
          </div>
          <p className="text-xs text-[#A8A29E] mt-2 text-center py-2">
            Không có hóa đơn hay khoản chi nào đang chờ đến hạn.
          </p>
        </section>

        {/* Modal Quản lý thẻ tín dụng gia đình */}
        <CardManagerModal
          isOpen={isCardManagerOpen}
          onClose={() => setIsCardManagerOpen(false)}
        />
      </>
    );
  }

  // TRƯỜNG HỢP 2: Có thẻ tín dụng HOẶC có hóa đơn chờ chi
  return (
    <>
      <section className="bg-white border border-[#E6E2DA] rounded-3xl p-4 sm:p-5 shadow-sm space-y-3">
        {/* Header Section */}
        <div className="flex items-center justify-between pb-2.5 border-b border-[#F5F3EF]">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-5 h-5 rounded-lg bg-[#FEF3C7] text-[#B45309] flex items-center justify-center shrink-0">
              <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <h2 className="text-xs uppercase tracking-wider font-bold text-[#1C1917] truncate">
              Khoản chờ thanh toán
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {totalAllPending > 0 && (
              <div className="flex items-center gap-1 font-mono text-xs text-[#B45309] font-bold">
                <span className="text-[11px] text-[#78716C] font-normal hidden sm:inline">Tổng chờ:</span>
                <span>{displayAmount(totalAllPending)}</span>
              </div>
            )}

            {/* Nút truy cập nhanh Quản lý thẻ */}
            <button
              type="button"
              onClick={() => {
                playActionClick();
                setIsCardManagerOpen(true);
              }}
              className="text-[11px] text-[#0F3D39] hover:text-[#134E48] hover:bg-[#F5F3EF] px-2 py-1 rounded-xl flex items-center gap-1 font-semibold transition-colors cursor-pointer"
              title="Quản lý thẻ tín dụng"
            >
              <CardIcon className="w-3.5 h-3.5" />
              <span>{hasCreditCards ? 'Thẻ' : '+ Thẻ'}</span>
            </button>
          </div>
        </div>

        {/* PHÂN KHU 1: THẺ TÍN DỤNG (Chỉ hiển thị khi đã có thẻ tín dụng) */}
        {hasCreditCards && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-0.5">
              <span className="text-[11px] font-bold text-[#78716C] uppercase tracking-wider flex items-center gap-1.5">
                <CardIcon className="w-3.5 h-3.5 text-[#0F3D39]" />
                Thẻ tín dụng ({unsettledCardExpenses.length})
              </span>
            </div>

            <div className="space-y-2">
              {unsettledCardExpenses.map((group) => {
                const { card, statementTxs, statementAmount, nextCycleTxs, nextCycleAmount, transactions: cardTxs, totalAmount, currentDueDate, nextDueDate } = group;
                const isExpanded = Boolean(expandedCardIds[card.id]);
                const activeDueDate = statementAmount > 0 ? currentDueDate : nextDueDate;
                const dueBadge = formatDueDateBadge(activeDueDate);
                const hasStatementDue = statementAmount > 0;
                const hasAnyBalance = totalAmount > 0;

                return (
                  <div
                    key={card.id}
                    className="border border-[#E6E2DA] rounded-2xl overflow-hidden bg-white shadow-2xs transition-all hover:border-[#0F3D39]/30"
                  >
                    {/* Header Thẻ tinh gọn */}
                    <div
                      onClick={() => toggleExpandCard(card.id)}
                      className="p-3 sm:p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-[#FAF9F6]/60 transition-colors select-none"
                    >
                      {/* Cột trái: Icon thẻ & Tên thẻ + 4 số cuối */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-2xs shrink-0"
                          style={{ backgroundColor: card.color || '#0F3D39' }}
                        >
                          <CardIcon className="w-4 h-4" />
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#1C1917] truncate">
                            {card.name} •••• {card.last4Digits}
                          </p>

                          {/* Badge Hạn sao kê & Dòng phụ kỳ tới */}
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5 min-w-0">
                            <span
                              className={`text-[10px] font-medium px-1.5 py-0.2 rounded-md font-mono flex items-center gap-1 min-w-0 ${
                                dueBadge.status === 'OVERDUE'
                                  ? 'bg-[#FEF2F2] text-[#B91C1C] border border-[#FCA5A5]'
                                  : dueBadge.status === 'DUE_SOON'
                                  ? 'bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]'
                                  : 'bg-[#FAF9F6] text-[#78716C] border border-[#E6E2DA]'
                              }`}
                            >
                              <Calendar className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate">
                                <span className="hidden sm:inline">Hạn: {formatDisplayDate(activeDueDate)} • </span>
                                {dueBadge.label}
                              </span>
                            </span>

                            {nextCycleAmount > 0 && statementAmount > 0 && (
                              <span className="text-[10px] text-[#78716C] font-mono hidden sm:inline">
                                (+{displayAmount(nextCycleAmount)} kỳ tới)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Cột phải: Dư nợ & Nút quyết toán */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right min-w-[72px]">
                          <span
                            title={formatVND(hasStatementDue ? statementAmount : nextCycleAmount)}
                            className={`text-xs sm:text-sm font-bold font-mono tabular-nums ${
                              hasStatementDue
                                ? 'text-[#B45309]'
                                : hasAnyBalance
                                ? 'text-[#0F3D39]'
                                : 'text-[#059669]'
                            }`}
                          >
                            {displayAmount(hasStatementDue ? statementAmount : nextCycleAmount)}
                          </span>
                          <p className="text-[9px] text-[#A8A29E]">
                            {hasStatementDue ? `${statementTxs.length} khoản sao kê` : hasAnyBalance ? `${nextCycleTxs.length} quẹt kỳ tới` : 'Đã tất toán'}
                          </p>
                        </div>

                        {/* Nút Quyết toán thẻ 1-chạm nếu có dư nợ */}
                        {hasAnyBalance ? (
                          <button
                            type="button"
                            onClick={(e) => handleOpenSettleSheet(e, group)}
                            className="h-8 px-2.5 sm:px-3 rounded-xl bg-[#0F3D39] hover:bg-[#134E48] text-white text-[11px] font-semibold flex items-center justify-center gap-1 transition-all shadow-2xs cursor-pointer active:scale-95 shrink-0"
                            title="Quyết toán thẻ này"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span className="hidden sm:inline">Trả thẻ</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-[#059669] bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-1 rounded-xl font-medium flex items-center gap-0.5 shrink-0">
                            <CheckCircle2 className="w-3 h-3" />
                            <span className="hidden sm:inline">Đã tất toán</span>
                          </span>
                        )}

                        {/* Mũi tên bung accordion */}
                        <div className="text-[#A8A29E] p-0.5">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>
                    </div>

                    {/* Danh sách các khoản quẹt thẻ con: Phân chia 2 nhóm kỳ sao kê */}
                    {isExpanded && (
                      <div className="border-t border-[#F5F3EF] bg-[#FAF9F6]/80 px-3 py-2 animate-in fade-in duration-150 space-y-2.5">
                        {cardTxs.length === 0 ? (
                          <p className="text-xs text-[#A8A29E] py-2 text-center">
                            Không có khoản quẹt thẻ nào đang chờ quyết toán.
                          </p>
                        ) : (
                          <>
                            {/* NHÓM 1: KỲ SAO KÊ ĐẾN HẠN ĐỢT NÀY */}
                            {statementTxs.length > 0 && (
                              <div>
                                <div className="flex items-center justify-between pb-1 mb-1 border-b border-[#E6E2DA]/60">
                                  <span className="text-[10px] font-bold text-[#B45309] uppercase tracking-wider flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#B45309]" />
                                    Kỳ sao kê đến hạn ({formatDisplayDate(currentDueDate)})
                                  </span>
                                  <span className="text-[10px] font-mono font-bold text-[#B45309]">
                                    {displayAmount(statementAmount)}
                                  </span>
                                </div>
                                <div className="divide-y divide-[#F5F3EF]">
                                  {statementTxs.map(renderCardTxRow)}
                                </div>
                              </div>
                            )}

                            {/* NHÓM 2: KỲ TÍCH LŨY KẾ TIẾP (CHƯA CHỐT SAO KÊ) */}
                            {nextCycleTxs.length > 0 && (
                              <div className={statementTxs.length > 0 ? "pt-2 border-t border-[#E6E2DA]/60" : ""}>
                                <div className="flex items-center justify-between pb-1 mb-1 border-b border-[#E6E2DA]/60">
                                  <span className="text-[10px] font-bold text-[#0F3D39] uppercase tracking-wider flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-[#0F3D39]" />
                                    Kỳ kế tiếp ({formatDisplayDate(nextDueDate)}) • Chưa chốt
                                  </span>
                                  <span className="text-[10px] font-mono font-bold text-[#0F3D39]">
                                    {displayAmount(nextCycleAmount)}
                                  </span>
                                </div>
                                <div className="divide-y divide-[#F5F3EF]">
                                  {nextCycleTxs.map(renderCardTxRow)}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PHÂN KHU 2: HÓA ĐƠN & CHI TRẢ TRỰC TIẾP */}
        {hasDirectExpenses && (
          <div className={`space-y-2 ${hasCreditCards ? 'pt-2 border-t border-[#F5F3EF]' : ''}`}>
            {hasCreditCards && (
              <div className="flex items-center justify-between px-0.5">
                <span className="text-[11px] font-bold text-[#78716C] uppercase tracking-wider flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-[#B45309]" />
                  Hóa đơn trực tiếp ({activePendingExpenses.length})
                </span>
                <span className="text-[11px] font-mono font-bold text-[#B45309]">
                  {displayAmount(totalPendingAmount)}
                </span>
              </div>
            )}

            <div className="divide-y divide-[#F5F3EF] border border-[#F5F3EF] rounded-2xl overflow-hidden bg-[#FAF9F6]/60">
              {activePendingExpenses.map((item) => {
                const dueBadge = formatDueDateBadge(item.dueDate);
                const isOverdue = dueBadge.status === 'OVERDUE';
                const isDueSoon = dueBadge.status === 'DUE_SOON';
                const cat = categories.find((c) => c.id === item.categoryId);

                return (
                  <div
                    key={item.id}
                    onClick={() => handleOpenItem(item)}
                    className="flex items-center justify-between gap-3 p-3 hover:bg-white transition-colors group cursor-pointer"
                  >
                    {/* Cột trái */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border border-[#E6E2DA]/80 bg-white shadow-2xs">
                        {renderCategoryIcon(cat?.icon, "w-4 h-4", cat?.color || (isOverdue ? '#DC2626' : '#B45309'))}
                      </span>

                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#1C1917] truncate group-hover:text-[#B45309] transition-colors">
                          {item.note || item.categoryName}
                        </p>

                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span
                            className={`text-[10px] font-medium px-1.5 py-0.2 rounded-md font-mono flex items-center gap-1 ${
                              isOverdue
                                ? 'bg-[#FEF2F2] text-[#B91C1C] border border-[#FCA5A5]'
                                : isDueSoon
                                ? 'bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]'
                                : 'bg-white text-[#78716C] border border-[#E6E2DA]'
                            }`}
                          >
                            <Calendar className="w-2.5 h-2.5" />
                            <span>{dueBadge.label}</span>
                          </span>

                          {item.goalName && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-[#ECFDF5] text-[#047857] flex items-center gap-0.5 max-w-[120px] truncate">
                              🎯 {item.goalName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Cột phải */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        title={formatVND(item.amount)}
                        className="text-xs font-bold font-mono tabular-nums text-[#B45309]"
                      >
                        {displayAmount(item.amount)}
                      </span>

                      {/* Nút Xác nhận đã chi nhanh */}
                      <button
                        type="button"
                        onClick={(e) => handleQuickConfirmPaid(e, item)}
                        className="w-7 h-7 rounded-xl flex items-center justify-center text-[#059669] hover:text-white bg-[#ECFDF5] hover:bg-[#059669] border border-[#A7F3D0] transition-all shadow-2xs cursor-pointer active:scale-95"
                        title="Xác nhận đã thanh toán khoản này"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>

                      {/* Icon chỉnh sửa */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenItem(item);
                        }}
                        className="text-[#A8A29E] hover:text-[#0F3D39] p-1 rounded-lg hover:bg-[#F5F3EF] opacity-70 group-hover:opacity-100 transition-all cursor-pointer"
                        title="Chỉnh sửa chi tiết"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Modal Chỉnh sửa chi tiết hóa đơn rời */}
      <EditPendingExpenseModal
        isOpen={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        pendingExpense={selectedItem}
      />

      {/* Bottom Sheet Xác nhận khoản chi nhanh 1-chạm */}
      <ConfirmPaidBottomSheet
        isOpen={Boolean(confirmingItem)}
        onClose={() => setConfirmingItem(null)}
        pendingExpense={confirmingItem}
      />

      {/* Bottom Sheet Quyết toán thẻ tín dụng 1-chạm */}
      {settlingGroup && (
        <SettleCreditCardBottomSheet
          isOpen={Boolean(settlingGroup)}
          onClose={() => setSettlingGroup(null)}
          card={settlingGroup.card}
          group={settlingGroup}
          transactions={settlingGroup.transactions}
          totalAmount={settlingGroup.totalAmount}
          dueDate={settlingGroup.statementAmount > 0 ? settlingGroup.currentDueDate : settlingGroup.nextDueDate}
        />
      )}

      {/* Modal Quản lý thẻ tín dụng gia đình */}
      <CardManagerModal
        isOpen={isCardManagerOpen}
        onClose={() => setIsCardManagerOpen(false)}
      />

      {/* Modal Chỉnh sửa giao dịch quẹt thẻ tín dụng */}
      {editingTransaction && (
        <EditTransactionModal
          isOpen={Boolean(editingTransaction)}
          onClose={() => setEditingTransaction(null)}
          transaction={editingTransaction}
        />
      )}
    </>
  );
};
