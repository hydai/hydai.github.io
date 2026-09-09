// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import pagefind from 'astro-pagefind';

export default defineConfig({
  site: 'https://hyd.ai',
  output: 'static',
  compressHTML: true,
  integrations: [mdx(), sitemap(), pagefind()],
  vite: {
    plugins: [tailwindcss()],
    build: { cssTarget: ['chrome111', 'edge111', 'firefox114', 'safari16.4'] },
  },
  markdown: {
    shikiConfig: {
      theme: 'tokyo-night',
    },
  },
});
