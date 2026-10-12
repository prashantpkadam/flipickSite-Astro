import type { SectionKey } from './content';

// Text and URLs for each content section. The shared templates read from here,
// so adding a section means adding one entry plus a collection in content.config.ts.
export interface SectionConfig {
  base: string; // URL prefix, no trailing slash
  navKey: string; // matches data-navlink in the header
  name: string; // breadcrumb and nav label
  ldName: string; // schema.org name of the index page
  ldItem: 'BlogPosting' | 'Article';
  eyebrow: string;
  indexTitle: string;
  indexDescription: string;
  hero: [string, string]; // [plain text, accented text]
  heroSub: string;
  empty: string;
  back: string;
  titleSuffix: string; // appended to article titles
  closing: [string, string, string]; // [plain, accented, paragraph]
  articleClosing: [string, string, string];
}

export const SECTIONS: Record<SectionKey, SectionConfig> = {
  blog: {
    base: '/blog',
    navKey: 'blog',
    name: 'Blog',
    ldName: 'Flipick Blog',
    ldItem: 'BlogPosting',
    eyebrow: 'Flipick Blog',
    indexTitle: 'Flipick Blog: AI video, VVP and learning technology',
    indexDescription:
      'Guides and ideas on AI video, Variable Video Production and enterprise learning technology from the Flipick team.',
    hero: ['Ideas on AI video, ', 'personalisation and learning.'],
    heroSub: 'Practical guides from the Flipick team on creating, distributing and proving video at scale.',
    empty: 'New articles are coming soon.',
    back: 'All articles',
    titleSuffix: 'Flipick Blog',
    closing: [
      'Ready to see it ',
      'on your own campaign?',
      'Bring a brief and watch Flipick take it from screenplay to a measured campaign.',
    ],
    articleClosing: [
      'Want this for ',
      'your campaigns?',
      'See how Flipick creates, distributes and proves video at scale.',
    ],
  },
  caseStudies: {
    base: '/case-studies',
    navKey: 'case-studies',
    name: 'Case Studies',
    ldName: 'Flipick Case Studies',
    ldItem: 'Article',
    eyebrow: 'Case Studies',
    indexTitle: 'Flipick Case Studies: AI video results from real teams',
    indexDescription:
      'See how learning, marketing and retail teams use Flipick to create, personalise and prove video at scale.',
    hero: ['Real teams. ', 'Measured results.'],
    heroSub: 'How organisations use Flipick to create, distribute and prove video at scale.',
    empty: 'New case studies are coming soon.',
    back: 'All case studies',
    titleSuffix: 'Flipick Case Study',
    closing: [
      'Want results like ',
      'these?',
      'Book a short call and we will show how it would work for your campaigns.',
    ],
    articleClosing: [
      'Want results like ',
      'these?',
      'Book a short call and we will show how it would work for your campaigns.',
    ],
  },
  whitePapers: {
    base: '/white-papers',
    navKey: 'white-papers',
    name: 'Whitepapers',
    ldName: 'Flipick Whitepapers',
    ldItem: 'Article',
    eyebrow: 'Whitepapers',
    indexTitle: 'Flipick Whitepapers: research and guides on AI video',
    indexDescription:
      'In-depth whitepapers on AI video, Variable Video Production and learning technology from the Flipick team.',
    hero: ['In-depth research on ', 'AI video and learning.'],
    heroSub: 'Whitepapers and guides for teams planning video at scale.',
    empty: 'New whitepapers are coming soon.',
    back: 'All whitepapers',
    titleSuffix: 'Flipick Whitepaper',
    closing: [
      'Questions about ',
      'what you just read?',
      'Talk to the Flipick team about how this applies to your campaigns.',
    ],
    articleClosing: [
      'Questions about ',
      'what you just read?',
      'Talk to the Flipick team about how this applies to your campaigns.',
    ],
  },
};
