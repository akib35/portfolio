import { describe, it, expect } from 'vitest';
import { filterBlogPosts, matchesBlogPost, type BlogPost } from './blogSearch';

const mockPosts: BlogPost[] = [
  {
    title: 'Getting Started with Astro',
    excerpt: 'Learn how to build fast websites with Astro framework',
  },
  {
    title: 'Understanding TypeScript Generics',
    excerpt: 'A deep dive into TypeScript generic types and patterns',
  },
  {
    title: 'React vs Vue: A Comparison',
    excerpt: 'Comparing two popular frontend frameworks for web development',
  },
  {
    title: 'Building a Portfolio Website',
    excerpt: 'Tips and tricks for creating an impressive developer portfolio',
  },
];

describe('filterBlogPosts', () => {
  it('returns all posts when query is empty', () => {
    const result = filterBlogPosts(mockPosts, '');
    expect(result).toHaveLength(4);
  });

  it('returns all posts when query is whitespace only', () => {
    const result = filterBlogPosts(mockPosts, '   ');
    expect(result).toHaveLength(4);
  });

  it('filters posts by title match', () => {
    const result = filterBlogPosts(mockPosts, 'astro');
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Getting Started with Astro');
  });

  it('filters posts by excerpt match', () => {
    const result = filterBlogPosts(mockPosts, 'frontend');
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('React vs Vue: A Comparison');
  });

  it('is case-insensitive', () => {
    const result = filterBlogPosts(mockPosts, 'TYPESCRIPT');
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Understanding TypeScript Generics');
  });

  it('matches partial words', () => {
    const result = filterBlogPosts(mockPosts, 'port');
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Building a Portfolio Website');
  });

  it('returns empty array when no matches', () => {
    const result = filterBlogPosts(mockPosts, 'python');
    expect(result).toHaveLength(0);
  });

  it('matches multiple posts', () => {
    const result = filterBlogPosts(mockPosts, 'web');
    // Matches: "websites" in excerpt, "web development" in excerpt, "Website" in title
    expect(result).toHaveLength(3);
  });

  it('handles empty posts array', () => {
    const result = filterBlogPosts([], 'test');
    expect(result).toHaveLength(0);
  });
});

describe('matchesBlogPost', () => {
  const post: BlogPost = {
    title: 'Getting Started with Astro',
    excerpt: 'Learn how to build fast websites with Astro framework',
  };

  it('returns true when query is empty', () => {
    expect(matchesBlogPost(post, '')).toBe(true);
  });

  it('returns true when query matches title', () => {
    expect(matchesBlogPost(post, 'astro')).toBe(true);
  });

  it('returns true when query matches excerpt', () => {
    expect(matchesBlogPost(post, 'framework')).toBe(true);
  });

  it('returns false when no match', () => {
    expect(matchesBlogPost(post, 'react')).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(matchesBlogPost(post, 'ASTRO')).toBe(true);
    expect(matchesBlogPost(post, 'FRAMEWORK')).toBe(true);
  });

  it('handles whitespace-only query', () => {
    expect(matchesBlogPost(post, '   ')).toBe(true);
  });
});
