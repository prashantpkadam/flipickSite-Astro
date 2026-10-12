import { getCollection } from 'astro:content';

export type SectionKey = 'blog' | 'caseStudies' | 'whitePapers';

/**
 * Draft preview. When the SHOW_DRAFTS environment variable is "true" (set it for the
 * Vercel *Preview* environment only, never for Production), drafts and future-dated
 * entries are built too, so editors can see them on staging before publishing.
 */
const showDrafts = () => process.env.SHOW_DRAFTS === 'true';

/** True when an entry is visible to the public: not a draft, and its date has come. */
export function isLive(data: { draft: boolean; publishDate: Date }, now = new Date()) {
  return !data.draft && data.publishDate <= now;
}

/** Published entries of a section, newest first. Hides drafts and future-dated entries
 *  (unless draft preview is on). */
export async function getPublished(section: SectionKey) {
  const now = new Date();
  const entries = await getCollection(
    section as 'blog',
    ({ data }) => showDrafts() || isLive(data, now),
  );
  return entries.sort((a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf());
}
