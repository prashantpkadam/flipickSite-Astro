import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Fields shared by every content type (blog posts, case studies, white papers).
const base = {
  title: z.string().max(110),
  description: z.string().max(200),
  publishDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  author: z.string().default('Flipick Team'),
  cover: z.string().optional(), // e.g. /assets/blog/grocery-vvp.webp
  coverAlt: z.string().optional(),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
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
      customer: z.string().optional(), // e.g. "Godrej"
      industry: z.string().optional(), // e.g. "Manufacturing"
    })
    .refine(hasAlt, altError),
});

const whitePapers = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/white-papers' }),
  schema: z
    .object({
      ...base,
      downloadUrl: z.string().optional(), // e.g. /assets/white-papers/vvp-guide.pdf
    })
    .refine(hasAlt, altError),
});

export const collections = { blog, caseStudies, whitePapers };
