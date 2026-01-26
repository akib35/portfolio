import { describe, it, expect } from 'vitest';
import { navItems, isNavItemActive, getNavItemsWithState } from './navigation';

describe('navItems', () => {
  it('should export an array of navigation items', () => {
    expect(Array.isArray(navItems)).toBe(true);
    expect(navItems.length).toBeGreaterThan(0);
  });

  it('each nav item should have required properties', () => {
    navItems.forEach(item => {
      expect(item).toHaveProperty('href');
      expect(item).toHaveProperty('label');
      expect(typeof item.href).toBe('string');
      expect(typeof item.label).toBe('string');
    });
  });

  it('should include essential navigation pages', () => {
    const hrefs = navItems.map(item => item.href);
    expect(hrefs).toContain('/');
    expect(hrefs).toContain('/projects');
    expect(hrefs).toContain('/blog');
    expect(hrefs).toContain('/about');
    expect(hrefs).toContain('/contact');
  });
});

describe('isNavItemActive', () => {
  describe('home page', () => {
    it('should be active when on home page', () => {
      expect(isNavItemActive('/', '/')).toBe(true);
    });

    it('should not be active when on other pages', () => {
      expect(isNavItemActive('/', '/about')).toBe(false);
      expect(isNavItemActive('/', '/projects')).toBe(false);
    });
  });

  describe('regular pages', () => {
    it('should be active on exact match', () => {
      expect(isNavItemActive('/about', '/about')).toBe(true);
      expect(isNavItemActive('/projects', '/projects')).toBe(true);
    });

    it('should be active on nested routes', () => {
      expect(isNavItemActive('/blog', '/blog/my-post')).toBe(true);
      expect(isNavItemActive('/projects', '/projects/my-project')).toBe(true);
    });

    it('should not be active when not matching', () => {
      expect(isNavItemActive('/about', '/contact')).toBe(false);
      expect(isNavItemActive('/blog', '/about')).toBe(false);
    });
  });

  describe('trailing slashes', () => {
    it('should handle trailing slashes correctly', () => {
      expect(isNavItemActive('/about/', '/about')).toBe(true);
      expect(isNavItemActive('/about', '/about/')).toBe(true);
      expect(isNavItemActive('/about/', '/about/')).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should return false for empty strings', () => {
      expect(isNavItemActive('', '/')).toBe(false);
      expect(isNavItemActive('/', '')).toBe(false);
    });

    it('should return false for null/undefined', () => {
      // @ts-expect-error - Testing invalid input
      expect(isNavItemActive(null, '/')).toBe(false);
      // @ts-expect-error - Testing invalid input
      expect(isNavItemActive('/', null)).toBe(false);
    });
  });
});

describe('getNavItemsWithState', () => {
  it('should return nav items with isActive property', () => {
    const items = getNavItemsWithState('/');
    items.forEach(item => {
      expect(item).toHaveProperty('isActive');
      expect(typeof item.isActive).toBe('boolean');
    });
  });

  it('should mark home as active when on home page', () => {
    const items = getNavItemsWithState('/');
    const homeItem = items.find(item => item.href === '/');
    expect(homeItem?.isActive).toBe(true);
  });

  it('should mark correct item as active', () => {
    const items = getNavItemsWithState('/about');
    const aboutItem = items.find(item => item.href === '/about');
    const homeItem = items.find(item => item.href === '/');
    expect(aboutItem?.isActive).toBe(true);
    expect(homeItem?.isActive).toBe(false);
  });

  it('should mark blog as active on blog post pages', () => {
    const items = getNavItemsWithState('/blog/my-post');
    const blogItem = items.find(item => item.href === '/blog');
    expect(blogItem?.isActive).toBe(true);
  });
});
