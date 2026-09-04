import React, { useState, useMemo } from 'react';
import { 
  X, 
  Mail, 
  Send, 
  Check, 
  Eye, 
  Copy, 
  ExternalLink, 
  Sparkles, 
  User, 
  Users, 
  Loader2,
  TrendingUp,
  Receipt,
  PiggyBank,
  Wallet
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from './Toast';
import { 
  generateMonthlyReportHtml, 
  sendMonthlyReportEmail, 
  EmailReportData 
} from '../services/emailService';
import { formatVND, formatYearMonthLabel } from '../utils/currency';
import { playActionClick, playSuccessChime } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';

interface SendReportEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportData: EmailReportData;
}

type RecipientTarget = 'both' | 'husband' | 'wife' | 'custom';

export const SendReportEmailModal: React.FC<SendReportEmailModalProps> = ({
  isOpen,
  onClose,
  reportData
}) => {
  const { activeHousehold } = useApp();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'compose' | 'preview'>('compose');
  const [recipientTarget, setRecipientTarget] = useState<RecipientTarget>('both');
  const [customEmail, setCustomEmail] = useState<string>('');
  
  // Khởi tạo subject an toàn
  const [subject, setSubject] = useState<string>(() => {
    const name = reportData?.householdName || 'Tổ Ấm';
    const ymLabel = formatYearMonthLabel(reportData?.yearMonth);
    return `[${name}] Báo cáo tài chính ${ymLabel}`;
  });

  const [isSending, setIsSending] = useState<boolean>(false);
  const [copiedHtml, setCopiedHtml] = useState<boolean>(false);

  // Nhận diện email Chồng & Vợ từ activeHousehold an toàn
  const { husbandEmail, wifeEmail, husbandName, wifeName } = useMemo(() => {
    let hEmail = '';
    let wEmail = '';
    let hName = 'Chồng';
    let wName = 'Vợ';

    if (activeHousehold?.members && Array.isArray(activeHousehold.members)) {
      activeHousehold.members.forEach((uid) => {
        const role = activeHousehold.memberRoles?.[uid];
        const email = activeHousehold.memberEmails?.[uid] || '';
        const name = activeHousehold.memberNames?.[uid] || '';

        if (role === 'Chồng') {
          hEmail = email;
          hName = name || 'Chồng';
        } else if (role === 'Vợ') {
          wEmail = email;
          wName = name || 'Vợ';
        } else {
          // Fallback nếu chưa chọn vai trò
          if (!hEmail) {
            hEmail = email;
            hName = name || 'Thành viên 1';
          } else if (!wEmail) {
            wEmail = email;
            wName = name || 'Thành viên 2';
          }
        }
      });
    }

    return {
      husbandEmail: hEmail,
      wifeEmail: wEmail,
      husbandName: hName,
      wifeName: wName
    };
  }, [activeHousehold]);

  // Trích xuất an toàn các chỉ số
  const safeData = useMemo(() => {
    const inc = Number(reportData?.totalIncome) || 0;
    const exp = Number(reportData?.totalExpense) || 0;
    const sav = Number(reportData?.netSavings) || 0;
    const ratio = Number(reportData?.savingsRatio) || 0;
    const hExp = Number(reportData?.husbandExpense) || 0;
    const wExp = Number(reportData?.wifeExpense) || 0;
    const hRatio = Number(reportData?.husbandRatio) || 50;
    const wRatio = Number(reportData?.wifeRatio) || 50;
    const hInc = Number(reportData?.husbandIncome) || 0;
    const wInc = Number(reportData?.wifeIncome) || 0;
    const hIncRatio = Number(reportData?.husbandIncomeRatio) || 50;
    const wIncRatio = Number(reportData?.wifeIncomeRatio) || 50;
    const cats = Array.isArray(reportData?.topCategories) ? reportData.topCategories : [];

    return {
      totalIncome: inc,
      totalExpense: exp,
      netSavings: sav,
      savingsRatio: ratio,
      husbandExpense: hExp,
      wifeExpense: wExp,
      husbandRatio: hRatio,
      wifeRatio: wRatio,
      husbandIncome: hInc,
      wifeIncome: wInc,
      husbandIncomeRatio: hIncRatio,
      wifeIncomeRatio: wIncRatio,
      topCategories: cats
    };
  }, [reportData]);

  // Tạo HTML email preview an toàn với try/catch
  const htmlContent = useMemo(() => {
    try {
      return generateMonthlyReportHtml(reportData);
    } catch (err) {
      console.error('Lỗi khi tạo HTML email:', err);
      return '';
    }
  }, [reportData]);

  // Danh sách người nhận được chọn
  const selectedRecipients = useMemo(() => {
    const list: Array<{ email: string; name: string; role?: string }> = [];

    if (recipientTarget === 'both') {
      if (husbandEmail) list.push({ email: husbandEmail, name: husbandName, role: 'Chồng' });
      if (wifeEmail) list.push({ email: wifeEmail, name: wifeName, role: 'Vợ' });
    } else if (recipientTarget === 'husband') {
      if (husbandEmail) list.push({ email: husbandEmail, name: husbandName, role: 'Chồng' });
    } else if (recipientTarget === 'wife') {
      if (wifeEmail) list.push({ email: wifeEmail, name: wifeName, role: 'Vợ' });
    }

    if (customEmail.trim() && customEmail.includes('@')) {
      list.push({ email: customEmail.trim(), name: 'Người nhận thêm' });
    }

    return list;
  }, [recipientTarget, husbandEmail, wifeEmail, husbandName, wifeName, customEmail]);

  if (!isOpen) return null;

  // Sao chép HTML vào clipboard
  const handleCopyHtml = async () => {
    try {
      await navigator.clipboard.writeText(htmlContent);
      playActionClick();
      setCopiedHtml(true);
      showToast('Đã sao chép toàn bộ mã HTML Email vào clipboard!', 'success');
      setTimeout(() => setCopiedHtml(false), 3000);
    } catch {
      showToast('Không thể sao chép mã HTML', 'error');
    }
  };

  // Mở ứng dụng Mail mặc định với mailto
  const handleOpenMailClient = () => {
    playActionClick();
    const emails = selectedRecipients.map(r => r.email).join(',');
    const mailtoSubject = encodeURIComponent(subject);
    const mailtoBody = encodeURIComponent(
      `Thân gửi hai vợ chồng,\n\nDưới đây là tóm tắt Báo cáo tài chính ${formatYearMonthLabel(reportData?.yearMonth)} của ${reportData?.householdName || 'Tổ Ấm'}:\n` +
      `- Tổng Thu nhập: ${formatVND(safeData.totalIncome)}\n` +
      `- Tổng Chi tiêu: ${formatVND(safeData.totalExpense)}\n` +
      `- Tích lũy: ${formatVND(safeData.netSavings)} (${safeData.savingsRatio}%)\n\n` +
      `Xem chi tiết tại: https://family-expense-manager.web.app\n` +
      `Sổ Cái Gia Đình - Hạnh phúc từ sự sẻ chia!`
    );

    window.open(`mailto:${emails}?subject=${mailtoSubject}&body=${mailtoBody}`, '_blank');
  };

  // Xử lý gửi email
  const handleSend = async () => {
    if (selectedRecipients.length === 0) {
      showToast('Vui lòng chọn hoặc nhập ít nhất một địa chỉ email nhận thư!', 'warning');
      return;
    }

    setIsSending(true);
    playActionClick();
    triggerHaptic(15);

    try {
      const res = await sendMonthlyReportEmail({
        recipients: selectedRecipients,
        subject,
        reportData
      });

      if (res.success) {
        playSuccessChime();
        triggerHaptic(20);
        showToast(res.message, 'success');
        onClose();
      } else {
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      showToast('Có lỗi xảy ra khi gửi email: ' + (err?.message || ''), 'error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/55 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FAF9F6] border border-[#E6E2DA] rounded-3xl w-full max-w-lg shadow-2xl relative max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header Modal */}
        <div className="p-4 border-b border-[#E6E2DA] flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#0F3D39] text-[#FAF9F6] flex items-center justify-center shadow-2xs">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1C1917]">
                Gửi Báo Cáo Tài Chính Qua Email
              </h3>
              <p className="text-[11px] text-[#78716C]">
                {formatYearMonthLabel(reportData?.yearMonth)} • {reportData?.householdName || 'Tổ Ấm'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              playActionClick();
              onClose();
            }}
            className="w-8 h-8 rounded-full text-[#78716C] hover:text-[#1C1917] hover:bg-[#F5F3EF] flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Chuyển Đổi: Cài Đặt Người Nhận vs Xem Trước Email */}
        <div className="px-4 pt-3 pb-1 bg-white border-b border-[#F5F3EF] shrink-0">
          <div className="flex items-center bg-[#F5F3EF] p-1 rounded-full border border-[#E6E2DA]">
            <button
              onClick={() => {
                playActionClick();
                setActiveTab('compose');
              }}
              className={`flex-1 py-1.5 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'compose'
                  ? 'bg-white text-[#0F3D39] shadow-2xs font-bold'
                  : 'text-[#78716C] hover:text-[#1C1917]'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Cài đặt người nhận</span>
            </button>
            <button
              onClick={() => {
                playActionClick();
                setActiveTab('preview');
              }}
              className={`flex-1 py-1.5 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-white text-[#0F3D39] shadow-2xs font-bold'
                  : 'text-[#78716C] hover:text-[#1C1917]'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Xem trước bản tin</span>
            </button>
          </div>
        </div>

        {/* Nội dung theo Tab */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'compose' ? (
            <div className="space-y-4 text-xs">
              {/* Mục 1: Chọn Đối Tượng Nhận */}
              <div>
                <label className="block font-bold text-[#0F3D39] uppercase tracking-wider text-[10px] font-mono mb-2">
                  1. Đối tượng nhận thư:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {/* Cả hai */}
                  <button
                    type="button"
                    onClick={() => {
                      playActionClick();
                      setRecipientTarget('both');
                    }}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      recipientTarget === 'both'
                        ? 'border-[#0F3D39] bg-[#E7EFEF] text-[#0F3D39] font-bold shadow-2xs'
                        : 'border-[#E6E2DA] bg-white text-[#78716C] hover:border-[#0F3D39]/50'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span className="text-[11px]">Cả 2 vợ chồng</span>
                  </button>

                  {/* Chỉ Chồng */}
                  <button
                    type="button"
                    onClick={() => {
                      playActionClick();
                      setRecipientTarget('husband');
                    }}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      recipientTarget === 'husband'
                        ? 'border-[#0F3D39] bg-[#E7EFEF] text-[#0F3D39] font-bold shadow-2xs'
                        : 'border-[#E6E2DA] bg-white text-[#78716C] hover:border-[#0F3D39]/50'
                    }`}
                  >
                    <User className="w-4 h-4 text-[#0F3D39]" />
                    <span className="text-[11px]">Chỉ Chồng 👔</span>
                  </button>

                  {/* Chỉ Vợ */}
                  <button
                    type="button"
                    onClick={() => {
                      playActionClick();
                      setRecipientTarget('wife');
                    }}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      recipientTarget === 'wife'
                        ? 'border-[#B45309] bg-[#FEF3C7] text-[#B45309] font-bold shadow-2xs'
                        : 'border-[#E6E2DA] bg-white text-[#78716C] hover:border-[#B45309]/50'
                    }`}
                  >
                    <User className="w-4 h-4 text-[#B45309]" />
                    <span className="text-[11px]">Chỉ Vợ 👗</span>
                  </button>
                </div>
              </div>

              {/* Danh sách Email sẽ nhận */}
              <div className="p-3.5 rounded-2xl bg-white border border-[#E6E2DA] shadow-2xs space-y-2">
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#78716C] font-semibold">
                  Hòm thư đích sẽ nhận bản tin:
                </span>

                <div className="space-y-1.5">
                  {/* Email Chồng */}
                  {(recipientTarget === 'both' || recipientTarget === 'husband') && (
                    <div className="flex items-center justify-between p-2 rounded-xl bg-[#FAF9F6] border border-[#F5F3EF]">
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-2 h-2 rounded-full bg-[#0F3D39] inline-block shrink-0" />
                        <span className="font-semibold text-[#1C1917] truncate">
                          👔 {husbandName}:
                        </span>
                        <span className="font-mono text-[#0F3D39] truncate">
                          {husbandEmail || '(Chưa cập nhật email)'}
                        </span>
                      </div>
                      <span className="text-[9px] bg-[#E7EFEF] text-[#0F3D39] px-2 py-0.5 rounded-full font-bold shrink-0">
                        Chồng
                      </span>
                    </div>
                  )}

                  {/* Email Vợ */}
                  {(recipientTarget === 'both' || recipientTarget === 'wife') && (
                    <div className="flex items-center justify-between p-2 rounded-xl bg-[#FAF9F6] border border-[#F5F3EF]">
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-2 h-2 rounded-full bg-[#B45309] inline-block shrink-0" />
                        <span className="font-semibold text-[#1C1917] truncate">
                          👗 {wifeName}:
                        </span>
                        <span className="font-mono text-[#B45309] truncate">
                          {wifeEmail || '(Chưa cập nhật email)'}
                        </span>
                      </div>
                      <span className="text-[9px] bg-[#FEF3C7] text-[#B45309] px-2 py-0.5 rounded-full font-bold shrink-0">
                        Vợ
                      </span>
                    </div>
                  )}
                </div>

                {/* Nhập email nhận phụ */}
                <div className="pt-2 border-t border-[#F5F3EF]">
                  <label className="block text-[10px] text-[#78716C] mb-1">
                    Nhập thêm email nhận khác (tùy chọn):
                  </label>
                  <input
                    type="email"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="ví dụ: email.congviec@gmail.com"
                    className="w-full text-xs p-2.5 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] outline-hidden focus:border-[#0F3D39]"
                  />
                </div>
              </div>

              {/* Mục 2: Tiêu đề Email */}
              <div>
                <label className="block font-bold text-[#0F3D39] uppercase tracking-wider text-[10px] font-mono mb-1.5">
                  2. Tiêu đề email:
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#E6E2DA] bg-white outline-hidden focus:border-[#0F3D39] font-medium"
                />
              </div>

              {/* Thẻ tóm tắt nhanh số liệu gửi (An toàn tuyệt đối) */}
              <div className="p-3 rounded-2xl bg-[#E7EFEF]/60 border border-[#0F3D39]/15 flex items-center justify-between text-[11px]">
                <span className="text-[#0F3D39] font-medium flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#B45309]" />
                  Tổng thu: <strong>{formatVND(safeData.totalIncome)}</strong> • Chi: <strong>{formatVND(safeData.totalExpense)}</strong>
                </span>
                <span className="font-mono font-bold text-[#0F3D39] bg-white px-2 py-0.5 rounded-full shadow-2xs">
                  {safeData.netSavings >= 0 ? `+${formatVND(safeData.netSavings)}` : `-${formatVND(Math.abs(safeData.netSavings))}`}
                </span>
              </div>
            </div>
          ) : (
            /* Tab 2: Xem trước Email (Visual Native Preview - An toàn 100% không sợ lỗi iframe trên Mobile) */
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] text-[#78716C] px-1">
                <span>Bản xem trước nội dung sẽ gửi:</span>
                <button
                  onClick={handleCopyHtml}
                  className="flex items-center gap-1 text-[#0F3D39] font-semibold hover:underline cursor-pointer"
                >
                  {copiedHtml ? <Check className="w-3 h-3 text-[#10B981]" /> : <Copy className="w-3 h-3 text-[#0F3D39]" />}
                  <span>{copiedHtml ? 'Đã sao chép HTML' : 'Sao chép mã HTML'}</span>
                </button>
              </div>

              {/* Bản mô phỏng giao diện email sang trọng bằng Native React Components */}
              <div className="border border-[#E6E2DA] rounded-2xl overflow-hidden bg-white shadow-xs p-4 space-y-4">
                {/* Email Header */}
                <div className="bg-[#0F3D39] text-[#FAF9F6] p-4 rounded-xl text-center space-y-1">
                  <span className="inline-block text-[9px] uppercase tracking-widest font-mono bg-[#B45309] text-white px-2 py-0.5 rounded-full font-bold">
                    Bản Tin Tổ Ấm
                  </span>
                  <h4 className="text-base font-bold font-serif">
                    Báo Cáo Tài Chính {formatYearMonthLabel(reportData?.yearMonth)}
                  </h4>
                  <p className="text-[10px] text-[#D1E0DE] italic">
                    Dành riêng cho hai vợ chồng {reportData?.householdName || 'Tổ Ấm'}
                  </p>
                </div>

                {/* 3 Thẻ chỉ số */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-[#ECFDF5] border border-[#10B981]/25">
                    <span className="text-[9px] uppercase font-bold text-[#047857] block">Thu Nhập</span>
                    <span className="text-xs font-mono font-bold text-[#065F46] block mt-0.5">
                      {formatVND(safeData.totalIncome)}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#FFF7ED] border border-[#EA580C]/25">
                    <span className="text-[9px] uppercase font-bold text-[#C2410C] block">Chi Tiêu</span>
                    <span className="text-xs font-mono font-bold text-[#9A3412] block mt-0.5">
                      {formatVND(safeData.totalExpense)}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#E7EFEF] border border-[#0F3D39]/20">
                    <span className="text-[9px] uppercase font-bold text-[#0F3D39] block">Tích Lũy</span>
                    <span className="text-xs font-mono font-bold text-[#0F3D39] block mt-0.5">
                      {safeData.netSavings >= 0 ? `+${formatVND(safeData.netSavings)}` : `-${formatVND(Math.abs(safeData.netSavings))}`}
                    </span>
                  </div>
                </div>

                {/* Tỷ lệ chia sẻ */}
                <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E6E2DA] space-y-2 text-[11px]">
                  <div className="font-bold text-[#0F3D39] uppercase tracking-wider text-[9px] font-mono">
                    Sự Đồng Hành Của Vợ & Chồng
                  </div>
                  
                  {/* Thu nhập */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-[#78716C]">
                      <span>Đóng góp thu nhập:</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#E6E2DA] flex overflow-hidden">
                      <div style={{ width: `${safeData.husbandIncomeRatio}%` }} className="bg-[#0F3D39] h-full" />
                      <div style={{ width: `${safeData.wifeIncomeRatio}%` }} className="bg-[#B45309] h-full" />
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-[#0F3D39] font-medium">👔 Chồng: {formatVND(safeData.husbandIncome)} ({safeData.husbandIncomeRatio}%)</span>
                      <span className="text-[#B45309] font-medium">👗 Vợ: {formatVND(safeData.wifeIncome)} ({safeData.wifeIncomeRatio}%)</span>
                    </div>
                  </div>

                  {/* Chi tiêu */}
                  <div className="space-y-1 pt-1 border-t border-[#F5F3EF]">
                    <div className="flex justify-between text-[10px] text-[#78716C]">
                      <span>Gánh vác chi tiêu:</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#E6E2DA] flex overflow-hidden">
                      <div style={{ width: `${safeData.husbandRatio}%` }} className="bg-[#0F3D39] h-full" />
                      <div style={{ width: `${safeData.wifeRatio}%` }} className="bg-[#B45309] h-full" />
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-[#0F3D39] font-medium">👔 Chồng: {formatVND(safeData.husbandExpense)} ({safeData.husbandRatio}%)</span>
                      <span className="text-[#B45309] font-medium">👗 Vợ: {formatVND(safeData.wifeExpense)} ({safeData.wifeRatio}%)</span>
                    </div>
                  </div>
                </div>

                {/* Top chi tiêu */}
                {safeData.topCategories.length > 0 && (
                  <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E6E2DA] space-y-1.5 text-[11px]">
                    <div className="font-bold text-[#0F3D39] uppercase tracking-wider text-[9px] font-mono">
                      Các Khoản Chi Lớn Nhất
                    </div>
                    {safeData.topCategories.slice(0, 3).map((cat, i) => (
                      <div key={i} className="flex justify-between border-b border-dashed border-[#E6E2DA] pb-1 last:border-0 last:pb-0">
                        <span>{i + 1}. {cat.name}</span>
                        <span className="font-mono font-bold text-[#0F3D39]">{formatVND(cat.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-[#E6E2DA] flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={handleOpenMailClient}
            className="py-2.5 px-3 rounded-xl border border-[#E6E2DA] text-[#57534E] hover:text-[#1C1917] hover:bg-[#F5F3EF] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
            title="Mở sẵn trong ứng dụng Mail của máy"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mở ứng dụng Mail</span>
            <span className="sm:hidden">Mail client</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                playActionClick();
                onClose();
              }}
              className="py-2.5 px-3.5 rounded-xl border border-[#E6E2DA] text-[#78716C] hover:text-[#1C1917] text-xs font-semibold transition-all cursor-pointer"
            >
              Đóng
            </button>

            <button
              type="button"
              disabled={isSending || selectedRecipients.length === 0}
              onClick={handleSend}
              className={`py-2.5 px-5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all tactile-btn cursor-pointer ${
                isSending || selectedRecipients.length === 0
                  ? 'bg-[#E6E2DA] text-[#A8A29E] cursor-not-allowed'
                  : 'bg-[#0F3D39] text-white hover:bg-[#174E4A] shadow-xs active:scale-98'
              }`}
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang gửi...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Gửi báo cáo ngay</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
