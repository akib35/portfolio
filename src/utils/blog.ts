/**
 * Blog-related utilities
 */

export interface BlogPostData {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  content: string;
  [key: string]: unknown;
}

interface BlogModule {
  frontmatter?: {
    title?: string;
    date?: string;
    excerpt?: string;
    [key: string]: unknown;
  };
  default?: string;
}

/**
 * Gets all blog posts from the content directory
 */
export async function getBlogPosts(): Promise<BlogPostData[]> {
  const posts: BlogPostData[] = [];
  const modules = import.meta.glob('../content/blog/*.md', { eager: true }) as Record<string, BlogModule>;

  for (const path in modules) {
    const module = modules[path];
    const slug = path.split('/').pop()?.replace('.md', '') || '';

    if (module.frontmatter) {
      posts.push({
        slug,
        title: module.frontmatter.title || 'Untitled',
        date: module.frontmatter.date || new Date().toISOString(),
        excerpt: module.frontmatter.excerpt || '',
        content: module.default || '',
        ...module.frontmatter
      });
    }
  }

  return posts;
}

/**
 * Gets a single blog post by slug
 */
export async function getBlogPost(slug: string): Promise<BlogPostData | undefined> {
  const posts = await getBlogPosts();
  return posts.find(post => post.slug === slug);
}
