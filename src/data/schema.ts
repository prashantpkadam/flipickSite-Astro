const SITE_URL = 'https://flipick.com';

export const organization = {
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: 'Flipick',
  url: SITE_URL,
  logo: {
    '@type': 'ImageObject',
    url: `${SITE_URL}/assets/images/Flipick.webp`,
    width: 120,
    height: 34,
  },
  description:
    'Flipick is an AI-powered learning technology platform that creates studio-grade video, distributes it personally to every viewer, and proves it landed.',
  foundingDate: '2011',
  founder: {
    '@type': 'Person',
    name: 'Ravi Dugal',
    sameAs: 'https://www.linkedin.com/in/ravidugal/',
  },
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Pune',
    addressRegion: 'Maharashtra',
    addressCountry: 'IN',
  },
  email: 'sales@flipick.com',
  contactPoint: [
    {
      '@type': 'ContactPoint',
      contactType: 'sales',
      email: 'sales@flipick.com',
      url: `${SITE_URL}/company#contact`,
    },
    {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'support@flipick.com',
      url: `${SITE_URL}/company#contact`,
    },
  ],
  openingHoursSpecification: {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    opens: '10:00',
    closes: '18:00',
  },
  sameAs: [
    'https://www.linkedin.com/company/flipick/',
    'https://www.youtube.com/@FlipickVideos',
    'https://www.facebook.com/people/Flipick/61592789824471/',
    'https://www.instagram.com/flipickaivideos',
  ],
};

export const website = {
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  url: SITE_URL,
  name: 'Flipick',
  description: 'Create, distribute and prove AI video — one platform, end to end.',
  publisher: { '@id': `${SITE_URL}/#organization` },
};