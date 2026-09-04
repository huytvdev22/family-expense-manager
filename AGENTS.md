# AGENTS.md — Hướng Dẫn & Quy Chuẩn Dành Cho AI Coding Agents

Tài liệu này định nghĩa ngữ cảnh dự án, quy tắc ứng xử, tiêu chuẩn kỹ thuật và quy trình phối hợp dành riêng cho các **AI Coding Agents** (Antigravity, Claude Code, Cursor, Codex, Gemini CLI...) khi làm việc trong repository **Family Expense Manager**.

---

## 1. 📌 Tổng Quan Dự Án & Vai Trò

- **Tên dự án:** Family Expense Manager (Quản lý Chi tiêu Gia đình).
- **Mục tiêu:** Cung cấp trải nghiệm quản lý tài chính tổ ấm ấm áp, minh bạch, rõ ràng, giúp các thành viên cộng tác vui vẻ và giảm áp lực về tiền bạc.
- **Vai trò của Agent:** Là kỹ sư phần mềm cao cấp (Senior Full-stack Engineer) kiêm UI/UX Designer tỉ mỉ, luôn tuân thủ nguyên tắc Clean Code và tôn trọng tuyệt đối hệ thống thiết kế đã được chuẩn hóa.

---

## 2. 🎨 Quy Chuẩn Bắt Buộc Về Giao Diện & Design System

Dự án áp dụng quy chuẩn mở **[Google Labs DESIGN.md](./DESIGN.md)** (`Harmony Ledger`):

### 2.1. Tôn trọng Design Tokens
- **KHÔNG** tự ý chế hoặc hardcode các mã màu ngẫu nhiên (ví dụ: `#ff0000`, `#00ff00`, `blue`, `red`).
- **LUÔN LUÔN** sử dụng biến màu và token đã được định nghĩa trong [src/styles/tokens.css](./src/styles/tokens.css) hoặc [src/styles/theme.css](./src/styles/theme.css):
  - Màu thương hiệu chính: `var(--color-primary)` (`#0F3D39`)
  - Màu nhấn ấm áp: `var(--color-tertiary)` (`#B45309`)
  - Màu nền ấm dịu mắt: `var(--color-neutral)` (`#FAF9F6`)
  - Màu bề mặt thẻ: `var(--color-surface)` (`#FFFFFF`)
  - Thu nhập: Nền `var(--color-income-container)` / Chữ `var(--color-income-text)`
  - Chi tiêu: Nền `var(--color-expense-container)` / Chữ `var(--color-expense-text)`
  - Cảnh báo vượt ngân sách: `var(--color-warning-container)` / `var(--color-warning-text)`

### 2.2. Quy tắc Typography & Bố cục
- Văn bản mô tả và tiêu đề dùng font `Plus Jakarta Sans`.
- **Bắt buộc:** Hiển thị tiền tệ, số dư, tỷ lệ phần trăm và ngày tháng phải dùng font `JetBrains Mono` hoặc CSS `font-variant-numeric: tabular-nums` để số liệu thẳng hàng dọc.
- Sử dụng bo góc chuẩn: `rounded.md` (12px) cho input/button, `rounded.lg` (18px) cho card.

### 2.3. Khả năng tiếp cận (Accessibility - WCAG AA)
- Mọi văn bản hiển thị trên nền màu đều phải đảm bảo độ tương phản tối thiểu **4.5:1** (WCAG AA).
- Khi thêm hoặc sửa đổi token trong `DESIGN.md`, **bắt buộc** phải chạy lệnh kiểm tra linter:
  ```bash
  wsl bash -ic "npm run lint:design"
  ```
  Yêu cầu kết quả: `errors: 0, warnings: 0`.

---

## 3. 💻 Môi Trường Kỹ Thuật & Quy Tắc Thực Thi Command

Hệ điều hành của máy phát triển là **Windows**, các công cụ lập trình (Node.js, npm, Java, Docker) chạy thông qua **WSL2 (Ubuntu)**:

1. **Thực thi lệnh trong WSL:**
   - Luôn sử dụng cú pháp `wsl bash -ic "<command>"` (ví dụ: `wsl bash -ic "npm run lint:design"`, `wsl bash -ic "node -v"`). Cờ `-ic` giúp nạp đầy đủ cấu hình môi trường `.bashrc`, tránh lỗi `command not found`.
2. **Không sử dụng Python:**
   - Môi trường không cài đặt Python. Nếu cần viết script tự động hóa hoặc xử lý dữ liệu, **hãy sử dụng Node.js** và chạy qua WSL.
3. **Giải thích lệnh rõ ràng:**
   - Khi yêu cầu xác nhận một lệnh command, phải gửi kèm giải thích mục đích và tác động của lệnh trước khi chạy.

---

## 4. 📐 Tiêu Chuẩn Viết Code (Coding Standards)

- **Ngôn ngữ:** Luôn tương tác, giải thích, viết kế hoạch và viết comment code bằng **Tiếng Việt**.
- **Chất lượng code:**
  - Viết code sạch (**Clean Code**), phân tách rõ ràng trách nhiệm (**Single Responsibility**), dễ mở rộng và tuân thủ các nguyên tắc **SOLID**.
  - Không viết code spaghetti, tách component nhỏ gọn và tái sử dụng được.
  - Viết **comment đầy đủ** cho các hàm, component và logic nghiệp vụ tính toán chi tiêu quan trọng.
- **Tương tác & Xác nhận:**
  - Không tự suy diễn hay đoán mò các yêu cầu nghiệp vụ chưa rõ; hãy chủ động đặt câu hỏi để làm rõ với người dùng.

---

## 5. 🔄 Quy Trình Phát Triển Tính Năng (Feature Workflow)

Khi được yêu cầu xây dựng một tính năng mới (ví dụ: màn hình Thêm khoản chi, Biểu đồ ngân sách tuần, Quản lý danh mục):

1. **Bước 1: Đối chiếu DESIGN.md**
   - Đọc [DESIGN.md](./DESIGN.md) để chọn đúng component tokens, spacing và màu sắc phù hợp với ngữ cảnh.
2. **Bước 2: Sử dụng Tokens**
   - Sử dụng các biến CSS trong `src/styles/tokens.css` hoặc tiện ích Tailwind trong `src/styles/theme.css`.
   - Nếu cần thêm token mới, cập nhật vào `DESIGN.md`, chạy `npm run lint:design` để kiểm tra, sau đó chạy `npm run export:css` để cập nhật file CSS.
3. **Bước 3: Xây dựng Code & Kiểm thử**
   - Triển khai code theo chuẩn Clean Code, viết comment tiếng Việt.
   - Kiểm tra hiển thị responsive (cả Mobile và Desktop).
4. **Bước 4: Báo cáo**
   - Trình bày kết quả ngắn gọn, súc tích kèm link file trực quan cho người dùng.
