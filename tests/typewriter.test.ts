import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { initTypewriter } from '../src/utils/typewriter';

describe('typewriter utility', () => {
  let container: { textContent: string | null; id: string } | null;

  beforeEach(() => {
    // Mock document.getElementById
    container = { textContent: 'initial', id: 'typewriter' };
    vi.stubGlobal('document', {
      getElementById: (id: string) => (id === 'typewriter' ? container : null),
    });
    // Use fake timers for setTimeout control
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should return early if typewriter element is not found', () => {
    container = null;
    // Should not throw
    expect(() => initTypewriter()).not.toThrow();
  });

  it('should start typing when element exists', () => {
    initTypewriter();
    // After calling initTypewriter, the element text should be cleared to start typing
    expect(container!.textContent).toBe('');
  });

  it('should type characters one at a time', async () => {
    initTypewriter();

    // After first timer tick (100ms), one character should appear
    await vi.advanceTimersByTimeAsync(100);
    expect(container!.textContent!.length).toBe(1);

    // After more ticks, more characters appear
    await vi.advanceTimersByTimeAsync(400);
    expect(container!.textContent!.length).toBeGreaterThan(1);
  });

  it('should type the full first item from data array', async () => {
    initTypewriter();

    // The first item is siteConfig.name = "Akib Hasan" (10 chars)
    // Advance enough time for all characters: 10 * 100ms = 1000ms
    await vi.advanceTimersByTimeAsync(1200);
    expect(container!.textContent).toBe('Akib Hasan');
  });

  it('should cycle to next item after pause', async () => {
    initTypewriter();

    // Type first item (10 chars * 100ms) + pause (2000ms) + start second item
    await vi.advanceTimersByTimeAsync(1000 + 2000 + 100);

    // After pause, text should reset and start typing next item
    // "Full Stack Developer" starts typing
    expect(container!.textContent!.length).toBeGreaterThanOrEqual(1);
    // The text should no longer be "Akib Hasan" since we cycled
    expect(container!.textContent).not.toBe('Akib Hasan');
  });
});
