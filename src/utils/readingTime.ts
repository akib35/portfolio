/**
 * Calculate reading time for a given text
 * @param text - The text content to calculate reading time for
 * @param wordsPerMinute - Average reading speed (default: 200 wpm)
 * @returns Object containing minutes and word count
 */
export function calculateReadingTime(text: string, wordsPerMinute: number = 200): { minutes: number; wordCount: number } {
  if (!text || typeof text !== 'string') {
    return { minutes: 0, wordCount: 0 };
  }

  // Split by whitespace and filter out empty strings
  const words = text.trim().split(/\s+/).filter(word => word.length > 0);
  const wordCount = words.length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);

  return { minutes, wordCount };
}

/**
 * Format reading time for display
 * @param minutes - Number of minutes
 * @returns Formatted string (e.g., "5 min read")
 */
export function formatReadingTime(minutes: number): string {
  if (minutes <= 0) {
    return '< 1 min read';
  }
  return `${minutes} min read`;
}
