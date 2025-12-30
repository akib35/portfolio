import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://akib35.me',
  integrations: [tailwind()],
  build: {
    outDir: 'dist',
  },
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp'
    }
  }
});