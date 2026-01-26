/**
 * Search utilities for the portfolio site
 */

export interface SearchItem {
  title: string;
  url: string;
  type: 'page' | 'project' | 'blog';
  keywords: string | string[];
}

/**
 * Search through items using a query
 * @param items - Array of search items
 * @param query - Search query
 * @returns Filtered array of matching items
 */
export function searchItems(items: SearchItem[], query: string): SearchItem[] {
  if (!query || !query.trim()) {
    return [];
  }

  const q = query.toLowerCase().trim();

  return items.filter(item => {
    const titleMatch = item.title.toLowerCase().includes(q);

    let keywordsMatch = false;
    if (typeof item.keywords === 'string') {
      keywordsMatch = item.keywords.toLowerCase().includes(q);
    } else if (Array.isArray(item.keywords)) {
      keywordsMatch = item.keywords.some(k => k.toLowerCase().includes(q));
    }

    return titleMatch || keywordsMatch;
  });
}

/**
 * Highlight matching text in a string
 * @param text - Original text
 * @param query - Search query to highlight
 * @returns Text with HTML highlighting
 */
export function highlightMatch(text: string, query: string): string {
  if (!query || !query.trim()) {
    return text;
  }

  const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>');
}

/**
 * Escape special regex characters in a string
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
