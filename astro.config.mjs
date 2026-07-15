import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  prefetch: true,
  devToolbar: { enabled: false },
  build: {
    assets: 'assets',
  },
});
