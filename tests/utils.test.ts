import { describe, it, expect } from 'vitest';
import { formatDate, toggleClass } from '../src/utils/helpers';

describe('utils', () => {
  describe('formatDate', () => {
    it('should format a date correctly', () => {
      const date = new Date('2024-01-15');
      const result = formatDate(date);
      expect(result).toBe('January 15, 2024');
    });

    it('should handle different dates', () => {
      const date = new Date('2023-12-25');
      const result = formatDate(date);
      expect(result).toBe('December 25, 2023');
    });
  });

  describe('toggleClass', () => {
    it('should not throw when element is null', () => {
      expect(() => toggleClass(null, 'test-class')).not.toThrow();
    });

    it('should not throw when element is undefined', () => {
      expect(() => toggleClass(undefined, 'test-class')).not.toThrow();
    });
  });
});
