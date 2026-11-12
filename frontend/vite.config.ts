import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/taskia/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'pwa-icon.svg', 'pwa-192x192.png', 'pwa-512x512.png', 'apple-touch-icon.png', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Taskia — SLA & Habits',
        short_name: 'Taskia',
        description: 'Seguimiento de hábitos con SLAs configurables e inyección de programas',
        theme_color: '#020617',
        background_color: '#020617',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/taskia/',
        start_url: '/taskia/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: 'pwa-icon.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'any'
          }
        ],
        shortcuts: [
          {
            name: 'SOS Calma Rápida',
            short_name: 'SOS',
            description: 'Acceso inmediato a respiración guiada y grounding 5-4-3-2-1',
            url: '/taskia/#sos',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
          },
          {
            name: 'Hub Ansiedad & Zen',
            short_name: 'Ansiedad',
            description: 'Juegos cognitivos Impulse y check-in emocional',
            url: '/taskia/#ansiedad',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
          },
          {
            name: 'Respiración Fisiológica',
            short_name: 'Respirar',
            description: 'Suspiro fisiológico y ritmo 4-7-8 con 528Hz',
            url: '/taskia/#breathe',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
          }
        ]
      },

      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 1 day
              },
              networkTimeoutSeconds: 3
            }
          }
        ]
      }
    })
  ],
  server: {
    allowedHosts: ['.trycloudflare.com'],
  },
})
