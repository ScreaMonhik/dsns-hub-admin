import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'X-DNS-Prefetch-Control': 'off',
}

const previewCsp = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' http: https: ws: wss:",
  "media-src 'self' blob:",
  "frame-src https://www.youtube.com https://www.youtube-nocookie.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ')

function cspPlugin() {
  return {
    name: 'dsns-csp-meta',
    transformIndexHtml(html: string) {
      if (html.includes('Content-Security-Policy')) {
        return html;
      }
      return html.replace(
        '<head>',
        `<head>\n    <meta http-equiv="Content-Security-Policy" content="${previewCsp}" />`,
      );
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), cspPlugin()],
  server: {
    headers: securityHeaders,
  },
  preview: {
    headers: {
      ...securityHeaders,
      'Content-Security-Policy': previewCsp,
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    css: true,
  },
})
