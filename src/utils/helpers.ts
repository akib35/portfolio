/**
 * Common utility functions for the portfolio
 */

/**
 * Formats a date to a human-readable string
 */
export function formatDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Intl.DateTimeFormat('en-US', options).format(date);
}

/**
 * Smoothly scrolls to an element by ID
 */
export function scrollToElement(elementId: string): void {
  const element = document.getElementById(elementId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
}

/**
 * Toggles a CSS class on an element
 */
export function toggleClass(element: HTMLElement | null | undefined, className: string): void {
  if (element) {
    element.classList.toggle(className);
  }
}
