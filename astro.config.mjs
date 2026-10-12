// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { satteri } from '@astrojs/markdown-satteri';

// Articles already have their title as the page's single <h1>. If an editor uses a
// first-level heading inside the article body, turn it into a second-level one.
const demoteBodyH1 = {
  name: 'demote-body-h1',
  /** @param {any} node @param {any} ctx */
  heading(node, ctx) {
    if (node.depth === 1) ctx.replaceNode(node, { ...node, depth: 2 });
  },
};

export default defineConfig({
  site: 'https://flipick.com',
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file' },
  markdown: { processor: satteri({ mdastPlugins: [demoteBodyH1] }) },
  integrations: [
    sitemap({
      filter: (page) => !page.endsWith('/e4m'),
    }),
  ],
});
