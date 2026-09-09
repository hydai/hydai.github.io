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
  // Hexo-era URLs that no longer exist as pages (static output renders these as meta-refresh pages)
  redirects: {
    '/categories': '/archives',
    '/categories/Note': '/archives',
    '/archives/2016': '/archives/#2016',
    '/archives/2016/05': '/archives/#2016',
    '/archives/2016/08': '/archives/#2016',
    '/archives/2016/10': '/archives/#2016',
    '/archives/2024': '/archives/#2024',
    '/archives/2024/11': '/archives/#2024',
    '/archives/2024/12': '/archives/#2024',
    '/archives/2025': '/archives/#2025',
    '/archives/2025/03': '/archives/#2025',
    '/archives/2025/07': '/archives/#2025',
    '/archives/2025/08': '/archives/#2025',
    // Tag URLs with spaces, used between the Astro migration and the switch to hyphenated slugs
    '/tags/PC Build': '/tags/PC-Build',
    '/tags/Pull Request': '/tags/Pull-Request',
    '/tags/Time Machine': '/tags/Time-Machine',
    '/tags/URL Shortener': '/tags/URL-Shortener',
  },
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
