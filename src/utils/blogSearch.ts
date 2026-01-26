/**
 * Blog search filtering utilities
 */

export interface BlogPost {
  title: string;
  excerpt: string;
}

/**
 * Filters blog posts based on a search query
 * Matches against title and excerpt (case-insensitive)
 */
export function filterBlogPosts(posts: BlogPost[], query: string): BlogPost[] {
  const normalizedQuery = query.toLowerCase().trim();

  if (normalizedQuery === '') {
    return posts;
  }

  return posts.filter((post) => {
    const title = post.title.toLowerCase();
    const excerpt = post.excerpt.toLowerCase();
    return title.includes(normalizedQuery) || excerpt.includes(normalizedQuery);
  });
}

/**
 * Checks if a blog post matches a search query
 */
export function matchesBlogPost(post: BlogPost, query: string): boolean {
  const normalizedQuery = query.toLowerCase().trim();

  if (normalizedQuery === '') {
    return true;
  }

  const title = post.title.toLowerCase();
  const excerpt = post.excerpt.toLowerCase();
  return title.includes(normalizedQuery) || excerpt.includes(normalizedQuery);
}
