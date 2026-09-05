import { formatVND, formatYearMonthLabel } from '../utils/currency';

export interface EmailReportData {
  householdName: string;
  yearMonth: string;
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  savingsRatio: number;
  husbandExpense: number;
  wifeExpense: number;
  husbandRatio: number;
  wifeRatio: number;
  husbandIncome: number;
  wifeIncome: number;
  husbandIncomeRatio: number;
  wifeIncomeRatio: number;
  topCategories: Array<{ name: string; amount: number; percent: number }>;
  note?: string;
}

export interface SendEmailOptions {
  recipients: Array<{ email: string; name: string; role?: string }>;
  subject: string;
  reportData: EmailReportData;
}

/**
 * Tạo mã HTML Email Responsive theo ngôn ngữ thiết kế Warm Linen & Deep Pine
 * Tương thích tốt với Gmail, Apple Mail, Outlook trên cả Mobile và Desktop
 */
export const generateMonthlyReportHtml = (data?: EmailReportData): string => {
  const householdName = data?.householdName || 'Tổ Ấm Nhỏ';
  const yearMonth = data?.yearMonth || '';
  const totalIncome = Number(data?.totalIncome) || 0;
  const totalExpense = Number(data?.totalExpense) || 0;
  const netSavings = Number(data?.netSavings) || 0;
  const savingsRatio = Number(data?.savingsRatio) || 0;
  const husbandExpense = Number(data?.husbandExpense) || 0;
  const wifeExpense = Number(data?.wifeExpense) || 0;
  const husbandRatio = Number(data?.husbandRatio) || 50;
  const wifeRatio = Number(data?.wifeRatio) || 50;
  const husbandIncome = Number(data?.husbandIncome) || 0;
  const wifeIncome = Number(data?.wifeIncome) || 0;
  const husbandIncomeRatio = Number(data?.husbandIncomeRatio) || 50;
  const wifeIncomeRatio = Number(data?.wifeIncomeRatio) || 50;
  const topCategories = Array.isArray(data?.topCategories) ? data.topCategories : [];

  const monthLabel = formatYearMonthLabel(yearMonth);
  const isSurplus = netSavings > 0;
  const isDeficit = totalIncome > 0 && netSavings < 0;

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bản Tin Tài Chính Tổ Ấm - ${monthLabel}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #F5F3EF;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1C1917;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #F5F3EF;
      padding: 24px 12px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #FAF9F6;
      border: 1px solid #E6E2DA;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(15, 61, 57, 0.05);
    }
    .header {
      background-color: #0F3D39;
      color: #FAF9F6;
      padding: 32px 24px;
      text-align: center;
    }
    .badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
      background-color: #B45309;
      color: #FAF9F6;
      padding: 4px 12px;
      border-radius: 9999px;
      margin-bottom: 12px;
    }
    .title {
      font-size: 24px;
      font-weight: 700;
      margin: 0;
      letter-spacing: -0.5px;
    }
    .subtitle {
      font-size: 13px;
      color: #D1E0DE;
      margin-top: 6px;
      font-style: italic;
    }
    .content {
      padding: 24px;
    }
    .lead-text {
      font-size: 14px;
      line-height: 1.6;
      color: #44403C;
      margin-bottom: 20px;
    }
    /* 3 Cột chỉ số chính */
    .metrics-grid {
      display: table;
      width: 100%;
      margin-bottom: 24px;
      border-spacing: 8px 0;
    }
    .metric-col {
      display: table-cell;
      width: 33.33%;
      padding: 16px 12px;
      border-radius: 16px;
      vertical-align: top;
    }
    .metric-income {
      background-color: #ECFDF5;
      border: 1px solid #A7F3D0;
    }
    .metric-expense {
      background-color: #FFF7ED;
      border: 1px solid #FED7AA;
    }
    .metric-saving {
      background-color: #E7EFEF;
      border: 1px solid #B8D5D2;
    }
    .metric-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }
    .metric-value {
      font-size: 15px;
      font-weight: 700;
      font-family: 'SF Mono', Consolas, Monaco, monospace;
      white-space: nowrap;
    }
    .metric-sub {
      font-size: 10px;
      margin-top: 4px;
      color: #78716C;
    }
    /* Bảng chi tiết đồng hành */
    .section-card {
      background-color: #FFFFFF;
      border: 1px solid #E6E2DA;
      border-radius: 16px;
      padding: 18px;
      margin-bottom: 20px;
    }
    .section-title {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #0F3D39;
      margin-top: 0;
      margin-bottom: 14px;
      padding-bottom: 8px;
      border-bottom: 1px solid #F5F3EF;
    }
    .share-row {
      margin-bottom: 12px;
    }
    .share-label {
      font-size: 12px;
      font-weight: 600;
      color: #57534E;
      margin-bottom: 4px;
    }
    .share-bar-wrap {
      background-color: #F5F3EF;
      height: 10px;
      border-radius: 9999px;
      overflow: hidden;
      display: flex;
    }
    .bar-husband {
      background-color: #0F3D39;
      height: 100%;
    }
    .bar-wife {
      background-color: #B45309;
      height: 100%;
    }
    .share-stats {
      display: table;
      width: 100%;
      margin-top: 6px;
      font-size: 11px;
    }
    .stat-husband {
      display: table-cell;
      color: #0F3D39;
      font-weight: 600;
    }
    .stat-wife {
      display: table-cell;
      text-align: right;
      color: #B45309;
      font-weight: 600;
    }
    /* Top danh mục */
    .category-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .category-item {
      display: table;
      width: 100%;
      padding: 8px 0;
      border-bottom: 1px dashed #E6E2DA;
      font-size: 12px;
    }
    .category-item:last-child {
      border-bottom: none;
    }
    .cat-name {
      display: table-cell;
      font-weight: 500;
      color: #1C1917;
    }
    .cat-amount {
      display: table-cell;
      text-align: right;
      font-weight: 700;
      font-family: 'SF Mono', Consolas, monospace;
      color: #0F3D39;
    }
    /* Lời nhắn nhủ */
    .note-box {
      background-color: #E7EFEF;
      border-left: 4px solid #0F3D39;
      border-radius: 0 12px 12px 0;
      padding: 14px;
      margin-bottom: 24px;
      font-size: 12px;
      line-height: 1.6;
      color: #0F3D39;
    }
    /* Footer */
    .footer {
      background-color: #FAF9F6;
      border-top: 1px solid #E6E2DA;
      padding: 20px 24px;
      text-align: center;
      font-size: 11px;
      color: #78716C;
    }
    .footer a {
      color: #0F3D39;
      text-decoration: none;
      font-weight: 600;
    }
    .cta-btn {
      display: inline-block;
      background-color: #0F3D39;
      color: #FAF9F6 !important;
      font-size: 12px;
      font-weight: 700;
      padding: 12px 28px;
      border-radius: 9999px;
      text-decoration: none;
      margin: 16px 0 8px 0;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <!-- Header -->
      <div class="header">
        <div class="badge">Bản Tin Tổ Ấm</div>
        <h1 class="title">Báo Cáo Tài Chính ${monthLabel}</h1>
        <div class="subtitle">Dành riêng cho hai vợ chồng ${householdName}</div>
      </div>

      <!-- Content -->
      <div class="content">
        <p class="lead-text">
          Thân gửi hai vợ chồng,<br>
          Tháng vừa qua, gia đình mình đã cùng nhau nỗ lực làm việc và đồng lòng vun vén tổ ấm. Dưới đây là bức tranh tài chính tổng hợp giúp hai bạn luôn an tâm và thấu hiểu lẫn nhau:
        </p>

        <!-- 3 Cột chỉ số chính -->
        <table class="metrics-grid" width="100%" cellpadding="0" cellspacing="8" border="0">
          <tr>
            <!-- Cột 1: Thu Nhập -->
            <td class="metric-col metric-income">
              <div class="metric-label" style="color: #047857;">Thu Nhập</div>
              <div class="metric-value" style="color: #065F46;">${formatVND(totalIncome)}</div>
              <div class="metric-sub" style="color: #059669;">Nguồn lực mang về</div>
            </td>

            <!-- Cột 2: Chi Tiêu -->
            <td class="metric-col metric-expense">
              <div class="metric-label" style="color: #C2410C;">Chi Tiêu</div>
              <div class="metric-value" style="color: #9A3412;">${formatVND(totalExpense)}</div>
              <div class="metric-sub" style="color: #EA580C;">Chăm lo tổ ấm</div>
            </td>

            <!-- Cột 3: Tích Lũy -->
            <td class="metric-col metric-saving">
              <div class="metric-label" style="color: #0F3D39;">
                ${isDeficit ? 'Bội Chi' : 'Tích Lũy'}
              </div>
              <div class="metric-value" style="color: ${isSurplus ? '#0F3D39' : isDeficit ? '#DC2626' : '#78716C'};">
                ${isDeficit ? `-${formatVND(Math.abs(netSavings))}` : formatVND(netSavings)}
              </div>
              <div class="metric-sub" style="color: #0F3D39;">
                ${totalIncome > 0 ? `Tiết kiệm ${savingsRatio}%` : 'Chưa có thu nhập'}
              </div>
            </td>
          </tr>
        </table>

        <!-- Bảng Chi Tiết Sự Đồng Hành -->
        <div class="section-card">
          <div class="section-title">Sự Đồng Hành Của Vợ & Chồng</div>
          
          <!-- Thu nhập -->
          <div class="share-row">
            <div class="share-label">💼 Đóng góp thu nhập (${formatVND(totalIncome)}):</div>
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="background-color: #F5F3EF; height: 8px; border-radius: 9999px; overflow: hidden;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="height: 8px;">
                    <tr>
                      <td width="${husbandIncomeRatio}%" style="background-color: #0F3D39; height: 8px;"></td>
                      <td width="${wifeIncomeRatio}%" style="background-color: #B45309; height: 8px;"></td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            <div class="share-stats">
              <div class="stat-husband">👔 Chồng: ${formatVND(husbandIncome)} (${husbandIncomeRatio}%)</div>
              <div class="stat-wife">👗 Vợ: ${formatVND(wifeIncome)} (${wifeIncomeRatio}%)</div>
            </div>
          </div>

          <!-- Chi tiêu -->
          <div class="share-row" style="margin-top: 14px; margin-bottom: 0;">
            <div class="share-label">🛒 Gánh vác chi trả (${formatVND(totalExpense)}):</div>
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="background-color: #F5F3EF; height: 8px; border-radius: 9999px; overflow: hidden;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="height: 8px;">
                    <tr>
                      <td width="${husbandRatio}%" style="background-color: #0F3D39; height: 8px;"></td>
                      <td width="${wifeRatio}%" style="background-color: #B45309; height: 8px;"></td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            <div class="share-stats">
              <div class="stat-husband">👔 Chồng: ${formatVND(husbandExpense)} (${husbandRatio}%)</div>
              <div class="stat-wife">👗 Vợ: ${formatVND(wifeExpense)} (${wifeRatio}%)</div>
            </div>
          </div>
        </div>

        <!-- Top Danh Mục Chi Tiêu -->
        ${topCategories.length > 0 ? `
        <div class="section-card">
          <div class="section-title">Các Khoản Chi Tiêu Lớn Nhất</div>
          <table class="category-list" width="100%" cellpadding="0" cellspacing="0" border="0">
            ${topCategories.slice(0, 4).map((cat, idx) => `
            <tr class="category-item">
              <td class="cat-name" style="padding: 6px 0; border-bottom: 1px dashed #E6E2DA;">
                <strong>${idx + 1}.</strong> ${cat.name}
              </td>
              <td class="cat-amount" style="padding: 6px 0; border-bottom: 1px dashed #E6E2DA;">
                ${formatVND(cat.amount)} <span style="font-size: 10px; color: #78716C; font-weight: normal;">(${cat.percent}%)</span>
              </td>
            </tr>
            `).join('')}
          </table>
        </div>
        ` : ''}

        <!-- Lời nhắn nhủ ấm áp -->
        <div class="note-box">
          <strong>💌 Lời nhắn nhủ tổ ấm:</strong><br>
          ${isSurplus ? `
            Tháng này gia đình mình đã tích lũy được <strong>${formatVND(netSavings)}</strong> (đạt <strong>${savingsRatio}%</strong> tổng thu nhập). Đây là thành quả tuyệt vời từ sự chăm chỉ và thắt chặt chi tiêu của cả hai vợ chồng. Cùng tiếp tục phát huy để sớm đạt các mục tiêu tương lai nhé!
          ` : isDeficit ? `
            Tháng này gia đình mình có những khoản chi lớn cần lo toan nên chi tiêu có phần nhỉnh hơn thu nhập một chút (-${formatVND(Math.abs(netSavings))}). Không sao cả, có những thời điểm cần đầu tư cho cuộc sống; tháng sau hai vợ chồng lại cùng nhau cân đối nhé!
          ` : `
            Tiền bạc là công cụ để vun đắp tổ ấm. Dù tháng này chi nhiều hay ít, sự minh bạch, thấu hiểu và đồng lòng của hai vợ chồng chính là tài sản quý giá nhất!
          `}
        </div>

        <!-- Nút CTA -->
        <div style="text-align: center;">
          <a href="https://toamnho-family.web.app" class="cta-btn">
            📖 Mở Sổ Cái Gia Đình
          </a>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        Bản tin được gửi tự động từ <strong>Sổ Cái Gia Đình Harmony Ledger</strong>.<br>
        <em>Hạnh phúc từ sự sẻ chia & đồng hành tài chính</em>
      </div>
    </div>
  </div>
</body>
</html>`;
};

/**
 * Gửi email báo cáo tài chính
 * Hỗ trợ Web API hoặc Fallback Mailto client
 */
export interface EmailJsConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
}

const EMAILJS_STORAGE_KEY = 'harmony_emailjs_config';

/**
 * Đọc cấu hình EmailJS từ localStorage hoặc biến môi trường
 */
export const getEmailJsConfig = (): EmailJsConfig | null => {
  try {
    const saved = localStorage.getItem(EMAILJS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.serviceId && parsed.templateId && parsed.publicKey) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Lỗi khi đọc cấu hình EmailJS:', e);
  }

  // Fallback từ biến môi trường Vite
  const envServiceId = (import.meta as any).env?.VITE_EMAILJS_SERVICE_ID;
  const envTemplateId = (import.meta as any).env?.VITE_EMAILJS_TEMPLATE_ID;
  const envPublicKey = (import.meta as any).env?.VITE_EMAILJS_PUBLIC_KEY;

  if (envServiceId && envTemplateId && envPublicKey) {
    return {
      serviceId: envServiceId,
      templateId: envTemplateId,
      publicKey: envPublicKey
    };
  }

  return null;
};

/**
 * Lưu cấu hình EmailJS vào localStorage
 */
export const saveEmailJsConfig = (config: EmailJsConfig): void => {
  localStorage.setItem(EMAILJS_STORAGE_KEY, JSON.stringify(config));
};

/**
 * Xóa cấu hình EmailJS khỏi localStorage
 */
export const removeEmailJsConfig = (): void => {
  localStorage.removeItem(EMAILJS_STORAGE_KEY);
};

/**
 * Gửi email báo cáo tài chính
 * Ưu tiên: EmailJS REST API -> Resend API -> Fallback
 */
export const sendMonthlyReportEmail = async (options: SendEmailOptions): Promise<{ success: boolean; message: string }> => {
  const { recipients, subject, reportData } = options;

  if (recipients.length === 0) {
    return { success: false, message: 'Vui lòng chọn ít nhất một người nhận email.' };
  }

  const emailList = recipients.map(r => r.email).filter(Boolean);
  if (emailList.length === 0) {
    return { success: false, message: 'Không tìm thấy địa chỉ email hợp lệ.' };
  }

  const htmlContent = generateMonthlyReportHtml(reportData);

  try {
    // 1. Ưu tiên hàng đầu: Gửi qua EmailJS (kết nối trực tiếp với Gmail của bạn)
    const emailJsConfig = getEmailJsConfig();

    if (emailJsConfig?.serviceId && emailJsConfig?.templateId && emailJsConfig?.publicKey) {
      // Gửi lần lượt tới từng người nhận bằng EmailJS REST API chính thức
      const sendPromises = recipients.map(async (r) => {
        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            service_id: emailJsConfig.serviceId.trim(),
            template_id: emailJsConfig.templateId.trim(),
            user_id: emailJsConfig.publicKey.trim(),
            template_params: {
              to_email: r.email,
              to_name: r.name || 'Người thương',
              subject,
              html_content: htmlContent,
              household_name: reportData.householdName,
              year_month: formatYearMonthLabel(reportData.yearMonth),
              total_income: formatVND(reportData.totalIncome),
              total_expense: formatVND(reportData.totalExpense),
              net_savings: formatVND(reportData.netSavings),
              savings_ratio: `${reportData.savingsRatio}%`
            }
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(errText || `Lỗi EmailJS HTTP ${response.status}`);
        }
        return response;
      });

      await Promise.all(sendPromises);

      return {
        success: true,
        message: `Đã gửi bản tin tài chính HTML thành công qua Gmail tới ${emailList.join(', ')}!`
      };
    }

    // 2. Kiểm tra nếu có cấu hình Resend API
    const resendApiKey = (import.meta as any).env?.VITE_RESEND_API_KEY;
    if (resendApiKey) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: `${reportData.householdName} <onboarding@resend.dev>`,
          to: emailList,
          subject,
          html: htmlContent
        })
      });

      if (response.ok) {
        return { 
          success: true, 
          message: `Đã gửi báo cáo thành công tới ${emailList.join(', ')} qua Resend!` 
        };
      }
    }

    // 3. Chưa cấu hình EmailJS: Hướng dẫn người dùng cấu hình
    return {
      success: false,
      message: 'Chưa cấu hình EmailJS! Vui lòng bấm vào biểu tượng ⚙️ (Cài đặt) ở góc trên để kết nối Gmail trong 1 phút.'
    };
  } catch (error: any) {
    console.error('Lỗi khi gửi email báo cáo:', error);
    return {
      success: false,
      message: error?.message || 'Có lỗi xảy ra khi gửi email qua EmailJS. Vui lòng kiểm tra lại mã cấu hình.'
    };
  }
};
