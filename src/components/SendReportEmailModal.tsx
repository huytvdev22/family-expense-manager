import React, { useState, useMemo, useEffect } from 'react';
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
  Settings,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Key,
  HelpCircle,
  ArrowLeft,
  Edit2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from './Toast';
import { 
  generateMonthlyReportHtml, 
  sendMonthlyReportEmail, 
  getEmailJsConfig,
  saveEmailJsConfig,
  removeEmailJsConfig,
  EmailReportData,
  EmailJsConfig
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
  const { activeHousehold, updateMemberEmail } = useApp();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'compose' | 'preview'>('compose');
  const [recipientTarget, setRecipientTarget] = useState<RecipientTarget>('both');
  const [customEmail, setCustomEmail] = useState<string>('');
  
  // Trạng thái cập nhật nhanh email thành viên
  const [editingRole, setEditingRole] = useState<'husband' | 'wife' | null>(null);
  const [editingEmailValue, setEditingEmailValue] = useState<string>('');
  
  // Trạng thái màn hình Cài đặt EmailJS
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [emailConfig, setEmailConfig] = useState<EmailJsConfig | null>(null);
  const [serviceIdInput, setServiceIdInput] = useState<string>('');
  const [templateIdInput, setTemplateIdInput] = useState<string>('');
  const [publicKeyInput, setPublicKeyInput] = useState<string>('');

  // Tải cấu hình EmailJS đã lưu
  useEffect(() => {
    const cfg = getEmailJsConfig();
    setEmailConfig(cfg);
    if (cfg) {
      setServiceIdInput(cfg.serviceId);
      setTemplateIdInput(cfg.templateId);
      setPublicKeyInput(cfg.publicKey);
    }
  }, [isOpen, isSettingsOpen]);

  // Khởi tạo subject an toàn
  const [subject, setSubject] = useState<string>(() => {
    const name = reportData?.householdName || 'Tổ Ấm';
    const ymLabel = formatYearMonthLabel(reportData?.yearMonth);
    return `[${name}] Báo cáo tài chính ${ymLabel}`;
  });

  const [isSending, setIsSending] = useState<boolean>(false);
  const [copiedHtml, setCopiedHtml] = useState<boolean>(false);

  // Nhận diện email Chồng & Vợ từ activeHousehold an toàn
  const { husbandEmail, wifeEmail, husbandName, wifeName, husbandUid, wifeUid } = useMemo(() => {
    let hEmail = '';
    let wEmail = '';
    let hName = 'Chồng';
    let wName = 'Vợ';
    let hUid = '';
    let wUid = '';

    if (activeHousehold?.members && Array.isArray(activeHousehold.members)) {
      activeHousehold.members.forEach((uid) => {
        const role = activeHousehold.memberRoles?.[uid];
        const email = activeHousehold.memberEmails?.[uid] || '';
        const name = activeHousehold.memberNames?.[uid] || '';

        if (role === 'Chồng') {
          hEmail = email;
          hName = name || 'Chồng';
          hUid = uid;
        } else if (role === 'Vợ') {
          wEmail = email;
          wName = name || 'Vợ';
          wUid = uid;
        } else {
          // Fallback nếu chưa chọn vai trò
          if (!hEmail) {
            hEmail = email;
            hName = name || 'Thành viên 1';
            hUid = uid;
          } else if (!wEmail) {
            wEmail = email;
            wName = name || 'Thành viên 2';
            wUid = uid;
          }
        }
      });
    }

    // Fallback nếu lưu dưới key tổng quát 'wife' hoặc 'husband'
    if (!wEmail && activeHousehold?.memberEmails?.['wife']) {
      wEmail = activeHousehold.memberEmails['wife'];
    }
    if (!hEmail && activeHousehold?.memberEmails?.['husband']) {
      hEmail = activeHousehold.memberEmails['husband'];
    }

    return {
      husbandEmail: hEmail,
      wifeEmail: wEmail,
      husbandName: hName,
      wifeName: wName,
      husbandUid: hUid,
      wifeUid: wUid
    };
  }, [activeHousehold]);

  // Xử lý lưu email thành viên ngay tại chỗ
  const handleSaveMemberEmail = async (targetRole: 'husband' | 'wife') => {
    const cleanEmail = editingEmailValue.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      showToast('Vui lòng nhập địa chỉ email hợp lệ!', 'warning');
      return;
    }

    const targetUid = targetRole === 'husband'
      ? (husbandUid || 'husband')
      : (wifeUid || 'wife');

    playActionClick();
    await updateMemberEmail(targetUid, cleanEmail);
    setEditingRole(null);
    setEditingEmailValue('');
    playSuccessChime();
    triggerHaptic(15);
  };

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

  // Lưu cấu hình EmailJS
  const handleSaveConfig = () => {
    if (!serviceIdInput.trim() || !templateIdInput.trim() || !publicKeyInput.trim()) {
      showToast('Vui lòng điền đầy đủ cả 3 thông số của EmailJS!', 'warning');
      return;
    }

    const cfg: EmailJsConfig = {
      serviceId: serviceIdInput.trim(),
      templateId: templateIdInput.trim(),
      publicKey: publicKeyInput.trim()
    };

    saveEmailJsConfig(cfg);
    setEmailConfig(cfg);
    playSuccessChime();
    triggerHaptic(15);
    showToast('Đã lưu cấu hình EmailJS thành công!', 'success');
    setIsSettingsOpen(false);
  };

  // Xóa cấu hình EmailJS
  const handleRemoveConfig = () => {
    removeEmailJsConfig();
    setEmailConfig(null);
    setServiceIdInput('');
    setTemplateIdInput('');
    setPublicKeyInput('');
    playActionClick();
    showToast('Đã xóa cấu hình EmailJS khỏi thiết bị', 'info');
  };

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
      `Xem chi tiết tại: https://toamnho-family.web.app\n` +
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

    // Nếu chưa cấu hình EmailJS, hỏi mở cài đặt
    if (!emailConfig) {
      playActionClick();
      setIsSettingsOpen(true);
      showToast('Bạn cần cài đặt thông số EmailJS để gửi email HTML trực tiếp!', 'info');
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
    <div 
      className="fixed inset-0 z-60 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/55 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          playActionClick();
          onClose();
        }
      }}
    >
      <div className="bg-[#FAF9F6] border border-[#E6E2DA] rounded-t-3xl sm:rounded-3xl w-full max-w-lg shadow-2xl relative max-h-[90vh] sm:max-h-[88vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-3 duration-200">
        {/* Thanh trượt chỉ báo Bottom Sheet trên mobile */}
        <div className="w-12 h-1.5 bg-[#E6E2DA] rounded-full mx-auto mt-2.5 sm:hidden shrink-0" />
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

          <div className="flex items-center gap-1">
            {/* Nút mở Cài đặt EmailJS */}
            <button
              onClick={() => {
                playActionClick();
                setIsSettingsOpen(!isSettingsOpen);
              }}
              title="Cài đặt kết nối EmailJS"
              className={`p-2 rounded-xl transition-all cursor-pointer relative ${
                isSettingsOpen || emailConfig
                  ? 'bg-[#E7EFEF] text-[#0F3D39]'
                  : 'text-[#78716C] hover:text-[#1C1917] hover:bg-[#F5F3EF]'
              }`}
            >
              <Settings className="w-4 h-4" />
              {/* Chấm trạng thái kết nối */}
              <span className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ring-2 ring-white ${
                emailConfig ? 'bg-[#10B981]' : 'bg-[#D6D2CA]'
              }`} />
            </button>

            {/* Nút đóng */}
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
        </div>

        {/* =========================================================================
            MÀN HÌNH CÀI ĐẶT EMAILJS (KHI BẤM NÚT BÁNH RĂNG ⚙️)
            ========================================================================= */}
        {isSettingsOpen ? (
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#E6E2DA]">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="flex items-center gap-1 text-[#0F3D39] font-semibold hover:underline cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Quay lại gửi thư</span>
              </button>
              <span className="text-[10px] font-mono text-[#78716C] uppercase tracking-wider font-semibold">
                Cấu hình EmailJS (Gmail)
              </span>
            </div>

            {/* Hướng dẫn 3 bước cực kỳ dễ hiểu */}
            <div className="p-3.5 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] space-y-2 leading-relaxed">
              <div className="font-bold flex items-center gap-1.5 text-xs text-[#B45309]">
                <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Hướng dẫn kết nối Gmail qua EmailJS (Miễn phí 100%):</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[11px] pl-1">
                <li>Vào <a href="https://www.emailjs.com" target="_blank" rel="noreferrer" className="underline font-bold text-[#B45309]">emailjs.com</a> tạo tài khoản miễn phí.</li>
                <li>Vào <strong>Email Services</strong> ➔ Thêm dịch vụ <strong>Gmail</strong> ➔ Lấy <strong>Service ID</strong>.</li>
                <li>Vào <strong>Email Templates</strong> ➔ Tạo template mới với nội dung là <code>{'{{{html_content}}}'}</code> ➔ Lấy <strong>Template ID</strong>.</li>
                <li>Vào <strong>Account</strong> (góc dưới) ➔ Copy <strong>Public Key</strong>.</li>
              </ol>
            </div>

            {/* Form nhập thông số */}
            <div className="p-4 rounded-2xl bg-white border border-[#E6E2DA] space-y-3 shadow-2xs">
              {/* Service ID */}
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#0F3D39] mb-1">
                  1. Service ID (Ví dụ: service_gmail):
                </label>
                <input
                  type="text"
                  value={serviceIdInput}
                  onChange={(e) => setServiceIdInput(e.target.value)}
                  placeholder="ví dụ: service_g3xxxx"
                  className="w-full text-xs font-mono p-2.5 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] outline-hidden focus:border-[#0F3D39]"
                />
              </div>

              {/* Template ID */}
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#0F3D39] mb-1">
                  2. Template ID (Ví dụ: template_monthly):
                </label>
                <input
                  type="text"
                  value={templateIdInput}
                  onChange={(e) => setTemplateIdInput(e.target.value)}
                  placeholder="ví dụ: template_m8xxxx"
                  className="w-full text-xs font-mono p-2.5 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] outline-hidden focus:border-[#0F3D39]"
                />
              </div>

              {/* Public Key */}
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#0F3D39] mb-1">
                  3. Public Key (User ID):
                </label>
                <input
                  type="text"
                  value={publicKeyInput}
                  onChange={(e) => setPublicKeyInput(e.target.value)}
                  placeholder="ví dụ: pk_xxxxxxxx hoặc user_xxxxxx"
                  className="w-full text-xs font-mono p-2.5 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] outline-hidden focus:border-[#0F3D39]"
                />
              </div>
            </div>

            {/* Nút hành động cài đặt */}
            <div className="flex items-center justify-between gap-2 pt-1">
              {emailConfig ? (
                <button
                  type="button"
                  onClick={handleRemoveConfig}
                  className="py-2.5 px-3 rounded-xl border border-[#EF4444]/30 text-[#DC2626] hover:bg-[#FEF2F2] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa cấu hình</span>
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="py-2.5 px-3.5 rounded-xl border border-[#E6E2DA] text-[#78716C] hover:text-[#1C1917] text-xs font-semibold transition-all cursor-pointer"
                >
                  Hủy
                </button>

                <button
                  type="button"
                  onClick={handleSaveConfig}
                  className="py-2.5 px-5 rounded-xl bg-[#0F3D39] hover:bg-[#174E4A] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs active:scale-98 transition-all cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Lưu cấu hình</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* =========================================================================
              MÀN HÌNH SOẠN THƯ & XEM TRƯỚC BẢN TIN
              ========================================================================= */
          <>
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
                  {/* Trạng thái kết nối EmailJS */}
                  {emailConfig ? (
                    <div className="p-2.5 rounded-2xl bg-[#ECFDF5] border border-[#10B981]/25 text-[#065F46] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                        <span className="text-[11px] font-medium">
                          Đã kết nối Gmail qua EmailJS — Thư sẽ gửi định dạng HTML màu sắc đầy đủ.
                        </span>
                      </div>
                      <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="text-[10px] underline font-bold text-[#0F3D39] shrink-0 ml-2 cursor-pointer"
                      >
                        Sửa
                      </button>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-[#B45309] shrink-0" />
                        <span className="text-[11px]">
                          Chưa kết nối EmailJS. Bạn có thể kết nối trong 1 phút để gửi thư HTML đẹp mắt!
                        </span>
                      </div>
                      <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="text-[10px] font-bold px-2 py-1 rounded-lg bg-[#B45309] text-white hover:bg-[#92400E] transition-all shrink-0 ml-2 cursor-pointer"
                      >
                        Cài đặt ngay ⚙️
                      </button>
                    </div>
                  )}

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
                        editingRole === 'husband' ? (
                          <div className="p-2.5 rounded-xl bg-white border border-[#0F3D39] shadow-xs space-y-2 animate-in fade-in duration-150">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-[#0F3D39]">
                                Cập nhật email cho 👔 {husbandName}:
                              </span>
                              <button
                                type="button"
                                onClick={() => setEditingRole(null)}
                                className="text-[#78716C] hover:text-[#1C1917] p-0.5 rounded cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="email"
                                value={editingEmailValue}
                                onChange={(e) => setEditingEmailValue(e.target.value)}
                                placeholder="email.chong@gmail.com"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveMemberEmail('husband');
                                }}
                                className="flex-1 text-xs p-2 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] outline-hidden focus:border-[#0F3D39]"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveMemberEmail('husband')}
                                className="px-3 py-2 rounded-lg bg-[#0F3D39] text-white text-[11px] font-bold hover:bg-[#174E4A] transition-all cursor-pointer shrink-0"
                              >
                                Lưu
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between p-2 rounded-xl bg-[#FAF9F6] border border-[#F5F3EF]">
                            <div className="flex items-center gap-2 truncate min-w-0 flex-1">
                              <span className="w-2 h-2 rounded-full bg-[#0F3D39] inline-block shrink-0" />
                              <span className="font-semibold text-[#1C1917] shrink-0">
                                👔 {husbandName}:
                              </span>
                              <span 
                                onClick={() => {
                                  if (!husbandEmail) {
                                    setEditingRole('husband');
                                    setEditingEmailValue('');
                                  }
                                }}
                                className={`font-mono truncate ${
                                  husbandEmail 
                                    ? 'text-[#0F3D39]' 
                                    : 'text-[#B45309] italic cursor-pointer hover:underline'
                                }`}
                              >
                                {husbandEmail || '(Chưa cập nhật email)'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 ml-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingRole('husband');
                                  setEditingEmailValue(husbandEmail || '');
                                }}
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 transition-all cursor-pointer ${
                                  husbandEmail 
                                    ? 'text-[#78716C] hover:text-[#0F3D39] hover:bg-[#E7EFEF]' 
                                    : 'text-[#0F3D39] bg-[#E7EFEF] hover:bg-[#0F3D39] hover:text-white font-bold'
                                }`}
                                title="Cập nhật địa chỉ email"
                              >
                                <Edit2 className="w-2.5 h-2.5" />
                                <span>{husbandEmail ? 'Sửa' : 'Thêm email'}</span>
                              </button>
                              <span className="text-[9px] bg-[#E7EFEF] text-[#0F3D39] px-2 py-0.5 rounded-full font-bold">
                                Chồng
                              </span>
                            </div>
                          </div>
                        )
                      )}

                      {/* Email Vợ */}
                      {(recipientTarget === 'both' || recipientTarget === 'wife') && (
                        editingRole === 'wife' ? (
                          <div className="p-2.5 rounded-xl bg-white border border-[#B45309] shadow-xs space-y-2 animate-in fade-in duration-150">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-[#B45309]">
                                Cập nhật email cho 👗 {wifeName}:
                              </span>
                              <button
                                type="button"
                                onClick={() => setEditingRole(null)}
                                className="text-[#78716C] hover:text-[#1C1917] p-0.5 rounded cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="email"
                                value={editingEmailValue}
                                onChange={(e) => setEditingEmailValue(e.target.value)}
                                placeholder="email.vo@gmail.com"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveMemberEmail('wife');
                                }}
                                className="flex-1 text-xs p-2 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] outline-hidden focus:border-[#B45309]"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveMemberEmail('wife')}
                                className="px-3 py-2 rounded-lg bg-[#B45309] text-white text-[11px] font-bold hover:bg-[#92400E] transition-all cursor-pointer shrink-0"
                              >
                                Lưu
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between p-2 rounded-xl bg-[#FAF9F6] border border-[#F5F3EF]">
                            <div className="flex items-center gap-2 truncate min-w-0 flex-1">
                              <span className="w-2 h-2 rounded-full bg-[#B45309] inline-block shrink-0" />
                              <span className="font-semibold text-[#1C1917] shrink-0">
                                👗 {wifeName}:
                              </span>
                              <span 
                                onClick={() => {
                                  if (!wifeEmail) {
                                    setEditingRole('wife');
                                    setEditingEmailValue('');
                                  }
                                }}
                                className={`font-mono truncate ${
                                  wifeEmail 
                                    ? 'text-[#B45309]' 
                                    : 'text-[#B45309] italic cursor-pointer hover:underline font-medium'
                                }`}
                              >
                                {wifeEmail || '(Chưa cập nhật email)'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 ml-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingRole('wife');
                                  setEditingEmailValue(wifeEmail || '');
                                }}
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 transition-all cursor-pointer ${
                                  wifeEmail 
                                    ? 'text-[#78716C] hover:text-[#B45309] hover:bg-[#FEF3C7]' 
                                    : 'text-[#B45309] bg-[#FEF3C7] hover:bg-[#B45309] hover:text-white font-bold'
                                }`}
                                title="Cập nhật địa chỉ email cho vợ"
                              >
                                <Edit2 className="w-2.5 h-2.5" />
                                <span>{wifeEmail ? 'Sửa' : 'Thêm email'}</span>
                              </button>
                              <span className="text-[9px] bg-[#FEF3C7] text-[#B45309] px-2 py-0.5 rounded-full font-bold">
                                Vợ
                              </span>
                            </div>
                          </div>
                        )
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

                  {/* Thẻ tóm tắt nhanh số liệu gửi */}
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
                /* Tab 2: Xem trước Email (Visual Native Preview) */
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

                  {/* Bản mô phỏng giao diện email sang trọng */}
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
        <div className="p-4 bg-white border-t border-[#E6E2DA] flex items-center justify-between gap-2 shrink-0 pb-safe sm:pb-4">
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
                  <span>{emailConfig ? 'Gửi báo cáo qua Gmail' : 'Kết nối & Gửi mail'}</span>
                </>
              )}
            </button>
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  );
};
