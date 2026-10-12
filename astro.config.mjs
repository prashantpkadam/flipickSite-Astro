// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://flipick.com',
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file' },
    integrations: [
    sitemap({
      filter: (page) => !page.endsWith('/e4m'),
    }),
  ],
});
