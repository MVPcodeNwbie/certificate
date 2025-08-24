import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

// Centralize basic static asset handling tweaks. Most long-term caching headers are set by hosting (Firebase). 
// Here we mainly control inline limit and build hashing.
export default defineConfig({
  plugins: [sveltekit()],
  server: { port: 5173 },
  build: {
    assetsInlineLimit: 4096, // smaller assets get inlined; larger remain separate for caching
    manifest: true
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['tests/setup-test-env.ts']
  }
});

