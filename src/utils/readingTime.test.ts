import { describe, it, expect } from 'vitest';
import { calculateReadingTime, formatReadingTime } from './readingTime';

describe('calculateReadingTime', () => {
  it('should return 0 for empty string', () => {
    const result = calculateReadingTime('');
    expect(result.minutes).toBe(0);
    expect(result.wordCount).toBe(0);
  });

  it('should return 0 for null/undefined input', () => {
    // @ts-expect-error - Testing invalid input
    expect(calculateReadingTime(null).minutes).toBe(0);
    // @ts-expect-error - Testing invalid input
    expect(calculateReadingTime(undefined).minutes).toBe(0);
  });

  it('should calculate reading time for short text', () => {
    const text = 'Hello world'; // 2 words
    const result = calculateReadingTime(text, 200);
    expect(result.wordCount).toBe(2);
    expect(result.minutes).toBe(1); // Rounded up
  });

  it('should calculate reading time for medium text', () => {
    // Create a text with exactly 200 words
    const words = Array(200).fill('word').join(' ');
    const result = calculateReadingTime(words, 200);
    expect(result.wordCount).toBe(200);
    expect(result.minutes).toBe(1);
  });

  it('should calculate reading time for longer text', () => {
    // Create a text with 450 words (should be ~2.25 min, rounded up to 3)
    const words = Array(450).fill('word').join(' ');
    const result = calculateReadingTime(words, 200);
    expect(result.wordCount).toBe(450);
    expect(result.minutes).toBe(3); // 450/200 = 2.25, rounded up
  });

  it('should handle different wordsPerMinute values', () => {
    const words = Array(300).fill('word').join(' ');
    const result = calculateReadingTime(words, 100);
    expect(result.minutes).toBe(3); // 300/100 = 3
  });

  it('should handle text with multiple spaces', () => {
    const text = 'Hello    world   test'; // 3 words with extra spaces
    const result = calculateReadingTime(text);
    expect(result.wordCount).toBe(3);
  });

  it('should handle text with newlines', () => {
    const text = 'Hello\nworld\ntest'; // 3 words with newlines
    const result = calculateReadingTime(text);
    expect(result.wordCount).toBe(3);
  });

  it('should handle text with tabs', () => {
    const text = 'Hello\tworld\ttest'; // 3 words with tabs
    const result = calculateReadingTime(text);
    expect(result.wordCount).toBe(3);
  });
});

describe('formatReadingTime', () => {
  it('should format 0 minutes correctly', () => {
    expect(formatReadingTime(0)).toBe('< 1 min read');
  });

  it('should format negative minutes correctly', () => {
    expect(formatReadingTime(-5)).toBe('< 1 min read');
  });

  it('should format 1 minute correctly', () => {
    expect(formatReadingTime(1)).toBe('1 min read');
  });

  it('should format multiple minutes correctly', () => {
    expect(formatReadingTime(5)).toBe('5 min read');
    expect(formatReadingTime(10)).toBe('10 min read');
  });
});
