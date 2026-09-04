import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * Cấu hình Vite cho ứng dụng PWA Quản lý Chi tiêu "Tổ Ấm Nhỏ"
 * - Hỗ trợ Tailwind CSS v4 qua Vite plugin chính thức
 * - Cấu hình PWA Web App Manifest, Service Worker auto update và offline caching
 */
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['vite.svg'],
      manifest: {
        name: 'Tổ Ấm Nhỏ - Quản Lý Chi Tiêu Gia Đình',
        short_name: 'Tổ Ấm Nhỏ',
        description: 'Ứng dụng quản lý tài chính gia đình ấm áp, minh bạch và gắn kết',
        theme_color: '#0F3D39',
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
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
      }
    })
  ],
  server: {
    port: 3000,
    host: true
  }
});
