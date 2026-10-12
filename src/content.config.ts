import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// A content editor (Pages CMS) saves empty form inputs as "" or null. Treat those
// as "not set" so optional fields stay optional and defaults still apply.
const blankToUndefined = (value: unknown) => (value === '' || value === null ? undefined : value);
const optionalText = z.preprocess(blankToUndefined, z.string().optional());
const optionalDate = z.preprocess(blankToUndefined, z.coerce.date().optional());

// Fields shared by every content type (blog posts, case studies, whitepapers).
const base = {
  title: z.string().max(110),
  description: z.string().max(200),
  publishDate: z.coerce.date(),
  updatedDate: optionalDate,
  author: z.preprocess(blankToUndefined, z.string().default('Flipick Team')),
  cover: optionalText, // e.g. /assets/blog/grocery-vvp.webp
  coverAlt: optionalText,
  tags: z.preprocess((v) => (v === '' || v === null ? [] : v), z.array(z.string()).default([])),
  draft: z.boolean().default(false),
  seoTitle: optionalText,
  seoDescription: optionalText,
};

// A cover image needs alt text (accessibility and SEO).
const hasAlt = (post: { cover?: string; coverAlt?: string }) => !post.cover || !!post.coverAlt;
const altError = { message: 'coverAlt is required when a cover image is set', path: ['coverAlt'] };

// Every .md file in the folder becomes one entry. The file name is the URL slug.
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({ ...base }).refine(hasAlt, altError),
});

const caseStudies = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/case-studies' }),
  schema: z
    .object({
      ...base,
      customer: optionalText, // e.g. "Godrej"
      industry: optionalText, // e.g. "Manufacturing"
    })
    .refine(hasAlt, altError),
});

const whitePapers = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/white-papers' }),
  schema: z
    .object({
      ...base,
      downloadUrl: optionalText, // e.g. /assets/white-papers/vvp-guide.pdf
    })
    .refine(hasAlt, altError),
});

export const collections = { blog, caseStudies, whitePapers };
