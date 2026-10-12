import { getPublished } from './content';

/** Published blog posts, newest first. */
export const getPublishedPosts = () => getPublished('blog');
