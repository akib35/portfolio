/**
 * Navigation configuration and utilities
 */

export interface NavItem {
  href: string;
  label: string;
  icon?: string;
}

/**
 * Main navigation items for the site
 */
export const navItems: NavItem[] = [
  { href: '/', label: 'Home' },
  { href: '/projects', label: 'Projects' },
  { href: '/blog', label: 'Blog' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

/**
 * Check if a nav item is active based on current path
 * @param href - The navigation item's href
 * @param currentPath - The current page path
 * @returns boolean indicating if the nav item is active
 */
export function isNavItemActive(href: string, currentPath: string): boolean {
  if (!href || !currentPath) {
    return false;
  }

  // Normalize paths by removing trailing slashes
  const normalizedHref = href.replace(/\/$/, '') || '/';
  const normalizedPath = currentPath.replace(/\/$/, '') || '/';

  // Exact match for home
  if (normalizedHref === '/') {
    return normalizedPath === '/';
  }

  // For other routes, check if current path starts with href (for nested routes)
  return normalizedPath === normalizedHref || normalizedPath.startsWith(`${normalizedHref}/`);
}

/**
 * Get navigation items with active state
 * @param currentPath - The current page path
 * @returns Array of nav items with isActive property
 */
export function getNavItemsWithState(currentPath: string): (NavItem & { isActive: boolean })[] {
  return navItems.map(item => ({
    ...item,
    isActive: isNavItemActive(item.href, currentPath),
  }));
}
