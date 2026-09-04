# Family Expense Manager 🏡💰

> Ứng dụng Quản lý Chi tiêu Gia đình với phong cách thiết kế **Harmony Ledger** chuẩn đặc tả **[Google Labs DESIGN.md](https://github.com/google-labs-code/design.md)**.

---

## 📖 Giới thiệu

**Family Expense Manager** hướng đến trải nghiệm tài chính gia đình **ấm cúng, minh bạch, rõ ràng và giảm thiểu áp lực về tiền bạc**. 

Dự án áp dụng định dạng chuẩn mở **`DESIGN.md`** của Google Labs để:
- Lưu trữ toàn bộ Design Tokens (màu sắc, typography, spacing, bo góc, components) ở dạng máy đọc được (YAML frontmatter).
- Định nghĩa triết lý thiết kế (Brand rationale), hướng dẫn trực quan, khả năng tiếp cận WCAG AA và quy tắc Do's & Don'ts cho cả lập trình viên lẫn các **AI Coding Agents** (Antigravity, Cursor, Claude...).
- Tự động hóa việc kiểm tra tính đúng đắn (linter) và xuất các biến CSS / Tailwind `@theme`.

---

## 🎨 Hệ Thống Thiết Kế (Harmony Ledger)

Hệ thống thiết kế chi tiết được định nghĩa tại [DESIGN.md](./DESIGN.md):

| Nhóm Token | Giá trị tiêu biểu | Mục đích sử dụng |
| :--- | :--- | :--- |
| **Primary** | `#0F3D39` (Pine Emerald) | Tông xanh ngọc bích sâu biểu trưng cho sự tăng trưởng, vững vàng tài chính |
| **Secondary** | `#4A6B68` (Muted Sage) | Tông xám xanh dịu mắt cho văn bản phụ, icon phụ |
| **Tertiary** | `#B45309` (Warm Amber) | Tông hổ phách ấm tượng trưng cho tổ ấm gia đình, nút nhấn tương tác |
| **Neutral / Surface** | `#FAF9F6` / `#FFFFFF` | Nền ấm dịu mắt (Warm Alabaster) thay cho màu trắng tinh khôi chói gắt |
| **Income / Expense** | `#10B981` / `#E11D48` | Nhãn thu nhập xanh mát & chi tiêu đỏ cánh sen hài hòa |
| **Typography** | `Plus Jakarta Sans` & `JetBrains Mono` | Chữ đọc thân thiện kết hợp font Monospace/Tabular cho số tiền thẳng cột |
| **Corner Radius** | `6px` (sm) - `12px` (md) - `18px` (lg) - `9999px` (full) | Bo tròn thân thiện, hiện đại |

---

## 🛠️ Các Lệnh Thao Tác (Tooling)

Dự án tích hợp trực tiếp CLI `@google/design.md`:

### 1. Kiểm tra tính hợp lệ và độ tương phản (WCAG AA)
```bash
wsl bash -ic "npm run lint:design"
# hoặc: npx @google/design.md lint DESIGN.md
```

### 2. Xuất tokens sang CSS Custom Properties (`:root`)
```bash
wsl bash -ic "npm run export:css"
# File sinh ra: src/styles/tokens.css
```

### 3. Xuất tokens sang Tailwind CSS v4 (`@theme`)
```bash
wsl bash -ic "npm run export:tailwind"
# File sinh ra: src/styles/theme.css
```

---

## 📁 Cấu Trúc Dự Án Hiện Tại

```text
family-expense-manager/
├── DESIGN.md              # File đặc tả thiết kế chuẩn Google Labs (Tokens + 8 Sections)
├── package.json           # Khởi tạo dự án & các script lint/export
├── src/
│   └── styles/
│       ├── tokens.css     # CSS Custom Properties (:root) tự động xuất từ DESIGN.md
│       └── theme.css      # Tailwind v4 theme (@theme) tự động xuất từ DESIGN.md
└── README.md              # Tài liệu hướng dẫn dự án
```
