// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// GitHub Pages: set SITE / BASE once the repo name is decided.
// - Repo "<user>.github.io"  -> base '/'
// - Any other repo name      -> base '/<repo-name>/'
export default defineConfig({
  site: process.env.SITE ?? 'https://andressev.github.io',
  base: process.env.BASE ?? '/',
  vite: { plugins: [tailwindcss()] },
});
