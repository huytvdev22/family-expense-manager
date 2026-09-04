import { execSync } from 'child_process';
import fs from 'fs';

// Xuất token từ DESIGN.md thành CSS cho Tailwind v4
try {
  const output = execSync('npx @google/design.md export DESIGN.md --format css-tailwind', {
    encoding: 'utf-8'
  });

  // Loại bỏ các dòng --spacing-* để bảo vệ container scale của Tailwind v4 (tránh lỗi max-w-2xl bị co lại 48px)
  let cleanTheme = output.replace(/\s*--spacing-[^;]+;/g, '');

  // Đảm bảo font mapping chuẩn
  if (!cleanTheme.includes('--font-sans:')) {
    cleanTheme = cleanTheme.replace(
      '@theme {',
      `@theme {\n  --font-sans: "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;\n  --font-mono: "JetBrains Mono", monospace;`
    );
  }

  // Thêm shadow tokens
  if (!cleanTheme.includes('--shadow-sm:')) {
    cleanTheme = cleanTheme.replace(
      '}',
      `  --shadow-sm: 0 1px 3px rgba(15, 61, 57, 0.05);\n  --shadow-md: 0 4px 12px -2px rgba(15, 61, 57, 0.08);\n  --shadow-lg: 0 10px 25px -4px rgba(15, 61, 57, 0.12);\n  --shadow-modal: 0 20px 40px -8px rgba(15, 61, 57, 0.18);\n}`
    );
  }

  fs.writeFileSync('src/styles/theme.css', cleanTheme, 'utf-8');
  console.log('✅ Đã xuất thành công src/styles/theme.css chuẩn hóa từ DESIGN.md');
} catch (error) {
  console.error('❌ Lỗi khi xuất theme:', error);
  process.exit(1);
}
