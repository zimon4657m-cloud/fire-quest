import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/fire-quest/',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'assets/*.png'],
      manifest: {
        name: 'FIRE QUEST',
        short_name: 'FIRE QUEST',
        description: '資産形成をドラクエ風の冒険にする羅針盤アプリ(投資助言ではありません)',
        lang: 'ja',
        theme_color: '#0b2545',
        background_color: '#0b2545',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,png,ico,svg}'], maximumFileSizeToCacheInBytes: 5 * 1024 * 1024 },
    }),
  ],
  test: { include: ['src/**/*.test.ts'], environment: 'node' },
});
