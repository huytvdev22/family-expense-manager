---
version: alpha
name: Harmony Ledger
description: Hệ thống thiết kế cho ứng dụng Quản lý Chi tiêu Gia đình (Family Expense Manager) mang phong cách FinTech ấm cúng, trực quan, đáng tin cậy và minh bạch tài chính.
colors:
  primary: "#0F3D39"
  primary-hover: "#164E48"
  on-primary: "#FFFFFF"
  secondary: "#4A6B68"
  tertiary: "#B45309"
  surface: "#FFFFFF"
  surface-container: "#F0F4F2"
  surface-container-high: "#E4ECE7"
  on-surface: "#192423"
  on-surface-variant: "#516361"
  neutral: "#FAF9F6"
  border: "#D2DDD8"
  income: "#10B981"
  income-container: "#DCFCE7"
  income-text: "#14532D"
  expense: "#E11D48"
  expense-container: "#FFE4E6"
  expense-text: "#881337"
  warning: "#92400E"
  warning-container: "#FEF3C7"
  warning-text: "#78350F"
typography:
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.35
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.5
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.45
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: 500
    lineHeight: 1
  tabular-num:
    fontFamily: JetBrains Mono
    fontSize: 15px
    fontWeight: 500
    lineHeight: 1.4
rounded:
  none: 0px
  sm: 6px
  md: 12px
  lg: 18px
  xl: 24px
  full: 9999px
spacing:
  2xs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    padding: 12px
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.on-primary}"
  button-secondary:
    backgroundColor: "{colors.surface-container}"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: 12px
  card-surface:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.lg}"
    padding: 24px
  badge-income:
    backgroundColor: "{colors.income-container}"
    textColor: "{colors.income-text}"
    rounded: "{rounded.full}"
    padding: 4px
  badge-expense:
    backgroundColor: "{colors.expense-container}"
    textColor: "{colors.expense-text}"
    rounded: "{rounded.full}"
    padding: 4px
  badge-warning:
    backgroundColor: "{colors.warning-container}"
    textColor: "{colors.warning-text}"
    rounded: "{rounded.full}"
    padding: 4px
  banner-alert:
    backgroundColor: "{colors.warning}"
    textColor: "{colors.surface}"
    rounded: "{rounded.sm}"
    padding: 12px
  page-container:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.on-surface}"
    padding: 32px
  divider:
    backgroundColor: "{colors.border}"
    height: 1px
  input-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
    padding: 10px
---

## Overview

**Harmony Ledger** là ngôn ngữ thiết kế hướng đến sự an tâm, gắn kết và minh bạch trong quản lý tài chính tổ ấm.

Khác với các phần mềm kế toán doanh nghiệp khô khan hay ứng dụng ngân hàng thuần số liệu gây áp lực, **Family Expense Manager** mang hơi thở hiện đại kết hợp sự ấm áp gia đình. Giao diện ưu tiên giảm tải căng thẳng tâm lý khi nhìn vào chi tiêu hàng tháng, biến việc theo dõi ngân sách thành hoạt động cộng tác vui vẻ, rõ ràng giữa các thành viên.

## Colors

Hệ màu của Harmony Ledger được cân bằng giữa sắc thái tự nhiên vững chãi và điểm nhấn năng động:

- **Primary (#0F3D39 - Pine Emerald):** Sắc xanh thông thẳm tượng trưng cho sự tăng trưởng, bền vững và an toàn tài chính. Được sử dụng cho thanh tiêu đề chính, các nút hành động quan trọng nhất (Add Expense, Save Budget) và điểm nhận diện thương hiệu.
- **Secondary (#4A6B68 - Muted Sage):** Tông xanh xám nhẹ nhàng dành cho phụ đề, icon phụ trợ và trạng thái hover nhẹ.
- **Tertiary (#B45309 - Warm Amber):** Màu hổ phách ấm tượng trưng cho ánh đèn tổ ấm, dùng làm điểm nhấn tương tác thứ cấp, huy hiệu thành tích tiết kiệm gia đình.
- **Neutral (#FAF9F6 - Warm Alabaster):** Nền tảng giao diện thay cho màu trắng tinh khiết, tạo cảm giác êm dịu cho mắt khi sử dụng trong thời gian dài.
- **Surface (#FFFFFF) & Surface Container (#F0F4F2):** Bề mặt của các thẻ widget, bảng giao dịch và form nhập liệu.
- **On-Surface (#192423) & On-Surface-Variant (#516361):** Màu chữ chính và phụ đạt độ tương phản chuẩn WCAG AAA trên nền sáng, chống mỏi mắt.
- **Income (#10B981) / Expense (#E11D48) / Warning (#D97706):** Bộ ba màu trạng thái tài chính được lựa chọn chuẩn mực, đi kèm các container màu nhạt tương ứng để làm nổi bật nhãn thu chi mà không gây cảm giác chói gắt.

## Typography

Hệ thống kiểu chữ phân tách rõ giữa văn bản giao tiếp và dữ liệu định lượng:

- **Plus Jakarta Sans:** Phông chữ không chân hiện đại với độ mở chữ rộng, mang lại tính thân thiện, dễ tiếp cận cho toàn bộ tiêu đề (headlines), nội dung mô tả (body) và nhãn nút (labels).
- **JetBrains Mono (Tabular Num):** Dành riêng cho việc hiển thị tiền tệ (VND, USD), tỷ lệ phần trăm ngân sách và ngày giờ giao dịch. Các con số có độ rộng đồng đều giúp các cột số liệu trong bảng chi tiêu luôn thẳng hàng, không bị thụt thò khi cập nhật giá trị.

## Layout

Hệ thống lưới (Grid) linh hoạt hỗ trợ trải nghiệm liền mạch từ điện thoại của người nội trợ đến màn hình máy tính làm việc:

- **Mobile First:** Màn hình di động hiển thị theo bố cục thẻ đơn (Single-column card stack), các nút tương tác nhanh (Quick Action Bar) đặt ở vùng chạm ngón tay cái dưới đáy màn hình.
- **Desktop Dashboard:** Bố cục 12 cột với chiều rộng tối đa 1280px. Cột bên trái hiển thị tóm tắt ngân sách gia đình và biểu đồ danh mục, khu vực trung tâm hiển thị dòng thời gian giao dịch gần đây.
- **Spacing Rhythm:** Áp dụng hệ số nhịp 4px/8px nhất quán (`xs: 8px`, `sm: 12px`, `md: 16px`, `lg: 24px`, `xl: 32px`) đảm bảo khoảng cách giữa các phần tử luôn hài hòa và thông thoáng.

## Elevation & Depth

Chiều sâu được xây dựng thông qua **phân lớp mềm (Soft Layering)** và đường viền tinh tế, tránh sử dụng bóng đổ thô nặng:

- **Tầng 0 (Background):** Nền Warm Alabaster (`#FAF9F6`).
- **Tầng 1 (Cards & Containers):** Bề mặt thẻ màu trắng (`#FFFFFF`), viền nhẹ 1px màu `#D2DDD8`, bóng đổ khuếch tán rộng `0 2px 8px -2px rgba(15, 61, 57, 0.06)`.
- **Tầng 2 (Hover & Active States):** Thẻ được nhấc lên nhẹ nhàng khi rê chuột với bóng đổ `0 8px 20px -4px rgba(15, 61, 57, 0.1)`.
- **Tầng 3 (Modals, Drawers & Popovers):** Hộp thoại thêm giao dịch và menu trượt nổi bật trên lớp màng phủ bán trong suốt (backdrop blur), đổ bóng sâu `0 20px 35px -8px rgba(15, 61, 57, 0.16)`.

## Shapes

Ngôn ngữ hình khối đề cao sự **thân thiện và hiện đại**:

- **Corner Radius:** Sử dụng góc bo `12px` (`rounded.md`) cho các nút bấm và ô nhập dữ liệu, `18px` (`rounded.lg`) cho các khối thẻ chính (Cards). Sự bo tròn vừa phải tạo cảm giác mềm mại, ấm cúng nhưng vẫn giữ được tính chuẩn mực của ứng dụng quản lý tiền bạc.
- **Pill Shape (`rounded.full`):** Áp dụng cho các nhãn phân loại danh mục (Ăn uống, Học phí, Điện nước, Mua sắm) và avatar thành viên gia đình.

## Components

Quy định cấu trúc và phong cách cho các thành phần UI cốt lõi:

- **Button Primary:** Nền Pine Emerald (`#0F3D39`), chữ trắng, padding 12px, bo góc 12px. Dành cho hành động chính duy nhất như "Thêm khoản chi" hoặc "Lưu kế hoạch".
- **Button Secondary:** Nền container dịu nhẹ (`#F0F4F2`), chữ màu Pine Emerald, dùng cho các nút phụ như "Hủy bỏ", "Xuất báo cáo Excel".
- **Card Surface:** Khối chứa thông tin như Thẻ tổng số dư, Biểu đồ chi tiêu tuần. Có viền thanh mảnh, padding 24px giúp nội dung không bị chen chúc.
- **Badge Income & Expense:** Huy hiệu hiển thị loại giao dịch với nền màu phấn (pastel container) và chữ màu đậm tương phản cao đạt chuẩn WCAG AA.
- **Input Field:** Ô nhập số tiền và diễn giải chi tiêu với nền trắng, viền thanh thoát, khi focus chuyển viền sang màu Primary kèm vòng sáng nhẹ (subtle focus ring).

## Do's and Don'ts

- **DO:** Luôn sử dụng `JetBrains Mono` hoặc thuộc tính `font-variant-numeric: tabular-nums` khi hiển thị các cột số tiền để số liệu luôn thẳng hàng.
- **DO:** Luôn duy trì độ tương phản tối thiểu 4.5:1 (WCAG AA) cho toàn bộ văn bản và 3:1 cho các biểu tượng tương tác.
- **DO:** Sử dụng màu phấn nhạt (`income-container`, `expense-container`) cho nền nhãn thay vì dùng trực tiếp màu đỏ hay xanh thuần túy dễ gây nhức mắt.
- **DON'T:** Không sử dụng quá nhiều màu sắc cảnh báo đỏ (`#E11D48`) trên cùng một màn hình để tránh làm người dùng cảm thấy lo âu, hoảng loạn về chi tiêu.
- **DON'T:** Không pha trộn nhiều kiểu bo góc ngẫu nhiên (ví dụ thẻ thì góc vuông 0px, nút thì bo tròn 20px) trong cùng một khung nhìn.
- **DON'T:** Không đặt hai nút Primary cạnh nhau gây phân tán quyết định của người dùng.
