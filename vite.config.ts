import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import packageJson from './package.json';
const applicationVersion = `${packageJson.version}+${new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 12)}`;

function releasePwa() {
  return {
    name: 'characterforge-pwa',
    apply: 'build' as const,
    generateBundle(this: { emitFile(file: { type: 'asset'; fileName: string; source: string }): void }, _: unknown, bundle: Record<string, { fileName: string }>) {
      const assets = Object.values(bundle).map((entry) => `./${entry.fileName}`);
      const sw = `const CACHE='characterforge-${applicationVersion}';const ASSETS=${JSON.stringify(['./', './index.html', './manifest.webmanifest', './icon.svg', ...assets])};self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k))))));self.addEventListener('message',e=>{if(e.data?.type==='SKIP_WAITING')self.skipWaiting()});self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin)return;e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(r=>{if(r.ok&&['script','style','image','font'].includes(e.request.destination)){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy))}return r}).catch(()=>e.request.mode==='navigate'?caches.match('./index.html'):Response.error())))})`;
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: sw });
    },
  };
}

export default defineConfig({
  // Relative asset URLs work for both project Pages sites and custom domains.
  base: './',
  plugins: [react(), releasePwa()],
  define: { __APP_VERSION__: JSON.stringify(applicationVersion) },
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: './src/test/setup.ts',
    restoreMocks: true,
    clearMocks: true,
    mockReset: true,
    css: true,
  },
});
