import { describe, it, expect } from 'vitest';
import { searchItems, highlightMatch, type SearchItem } from './search';

const mockSearchItems: SearchItem[] = [
  { title: 'Home', url: '/', type: 'page', keywords: ['home', 'portfolio'] },
  { title: 'About', url: '/about', type: 'page', keywords: ['about', 'bio', 'skills'] },
  { title: 'Projects', url: '/projects', type: 'page', keywords: ['projects', 'work'] },
  { title: 'Contact', url: '/contact', type: 'page', keywords: ['contact', 'email'] },
  { title: 'University Management System', url: '/projects', type: 'project', keywords: 'django react postgresql' },
  { title: 'Getting Started with Astro', url: '/blog/astro', type: 'blog', keywords: 'astro framework web' },
];

describe('searchItems', () => {
  it('should return empty array for empty query', () => {
    expect(searchItems(mockSearchItems, '')).toEqual([]);
    expect(searchItems(mockSearchItems, '   ')).toEqual([]);
  });

  it('should find items by title', () => {
    const results = searchItems(mockSearchItems, 'About');
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('About');
  });

  it('should be case insensitive', () => {
    const results1 = searchItems(mockSearchItems, 'HOME');
    const results2 = searchItems(mockSearchItems, 'home');
    const results3 = searchItems(mockSearchItems, 'Home');
    expect(results1).toEqual(results2);
    expect(results2).toEqual(results3);
    expect(results1).toHaveLength(1);
  });

  it('should find items by keywords (array)', () => {
    const results = searchItems(mockSearchItems, 'skills');
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('About');
  });

  it('should find items by keywords (string)', () => {
    const results = searchItems(mockSearchItems, 'django');
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('University Management System');
  });

  it('should find partial matches', () => {
    const results = searchItems(mockSearchItems, 'proj');
    expect(results).toHaveLength(1); // Only Projects page matches 'proj'
    expect(results[0].title).toBe('Projects');
  });

  it('should return multiple matches', () => {
    const results = searchItems(mockSearchItems, 'port');
    expect(results.length).toBeGreaterThan(0);
    // Should match 'portfolio' keyword and possibly 'report' if present
  });
});

describe('highlightMatch', () => {
  it('should return original text for empty query', () => {
    expect(highlightMatch('Hello World', '')).toBe('Hello World');
    expect(highlightMatch('Hello World', '   ')).toBe('Hello World');
  });

  it('should highlight matching text', () => {
    const result = highlightMatch('Hello World', 'World');
    expect(result).toContain('<mark');
    expect(result).toContain('World');
    expect(result).toContain('</mark>');
  });

  it('should be case insensitive', () => {
    const result = highlightMatch('Hello World', 'WORLD');
    expect(result).toContain('<mark');
  });

  it('should highlight multiple occurrences', () => {
    const result = highlightMatch('test test test', 'test');
    const matches = result.match(/<mark/g);
    expect(matches).toHaveLength(3);
  });

  it('should escape special regex characters', () => {
    const result = highlightMatch('test (hello) world', '(hello)');
    expect(result).toContain('<mark');
  });
});
