import { getCollection } from 'astro:content';

export type SectionKey = 'blog' | 'caseStudies' | 'whitePapers';

/** Published entries of a section, newest first. Hides drafts and future-dated entries. */
export async function getPublished(section: SectionKey) {
  const now = new Date();
  const entries = await getCollection(
    section as 'blog',
    ({ data }) => !data.draft && data.publishDate <= now,
  );
  return entries.sort((a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf());
}
