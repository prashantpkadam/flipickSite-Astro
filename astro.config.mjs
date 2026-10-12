// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Articles already have their title as the page's single <h1>. If an editor uses a
// first-level heading inside the article body, turn it into an <h2> instead.
function demoteBodyH1() {
  /** @param {any} tree */
  return (tree) => {
    /** @param {any} node */
    const walk = (node) => {
      if (node.type === 'element' && node.tagName === 'h1') node.tagName = 'h2';
      if (node.children) node.children.forEach(walk);
    };
    walk(tree);
  };
}

export default defineConfig({
  site: 'https://flipick.com',
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file' },
  markdown: { rehypePlugins: [demoteBodyH1] },
  integrations: [
    sitemap({
      filter: (page) => !page.endsWith('/e4m'),
    }),
  ],
});
