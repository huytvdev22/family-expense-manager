import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Đọc thông tin package.json
const pkg = JSON.parse(fs.readFileSync(new URL('./package.json', import.meta.url), 'utf-8'));

// Lấy mã git commit hash ngắn
let commitHash = 'unknown';
try {
  commitHash = execSync('git rev-parse --short HEAD').toString().trim();
} catch (e) {
  console.warn('Không thể lấy git commit hash, gán giá trị mặc định "dev":', e);
  commitHash = 'dev';
}

const buildTime = new Date().toISOString();

/**
 * Plugin Vite tự động sinh tệp version.json vào cả public/ và dist/
 */
function versionFilePlugin() {
  const versionData = JSON.stringify(
    {
      version: pkg.version || '1.0.0',
      commitHash,
      buildTime
    },
    null,
    2
  );

  return {
    name: 'generate-version-file',
    buildStart() {
      const publicDir = path.resolve(__dirname, 'public');
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }
      fs.writeFileSync(path.resolve(publicDir, 'version.json'), versionData);
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: versionData
      });
    }
  };
}

/**
 * Cấu hình Vite cho ứng dụng PWA Quản lý Chi tiêu "Tổ Ấm Nhỏ"
 * - Hỗ trợ Tailwind CSS v4 qua Vite plugin chính thức
 * - Cấu hình PWA Web App Manifest, Service Worker auto update và offline caching
 * - Tích hợp mã Git commit hash & thời gian build
 */
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version || '1.0.0'),
    __COMMIT_HASH__: JSON.stringify(commitHash),
    __BUILD_TIME__: JSON.stringify(buildTime)
  },
  plugins: [
    tailwindcss(),
    react(),
    versionFilePlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['vite.svg'],
      manifest: {
        name: 'Tổ Ấm Nhỏ - Quản Lý Chi Tiêu Gia Đình',
        short_name: 'Tổ Ấm Nhỏ',
        description: 'Ứng dụng quản lý tài chính gia đình ấm áp, minh bạch và gắn kết',
        theme_color: '#FAF9F6',
        background_color: '#FAF9F6',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: '/vite.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: '/vite.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true
      }
    })
  ],
  server: {
    port: 3000,
    host: true
  }
});

