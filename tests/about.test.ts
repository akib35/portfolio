import { describe, it, expect } from 'vitest';
import { about } from '../src/utils/about';

describe('about data', () => {
  it('should export about data object', () => {
    expect(about).toBeDefined();
    expect(typeof about).toBe('object');
  });

  it('should have intro section', () => {
    expect(about.intro).toHaveProperty('greeting');
    expect(about.intro).toHaveProperty('title');
    expect(about.intro).toHaveProperty('tagline');
  });

  it('should have bio as array of paragraphs', () => {
    expect(Array.isArray(about.bio)).toBe(true);
    expect(about.bio.length).toBeGreaterThan(0);
  });

  it('should have education information', () => {
    expect(about.education).toHaveProperty('degree');
    expect(about.education).toHaveProperty('institution');
    expect(about.education).toHaveProperty('year');
    expect(Array.isArray(about.education.achievements)).toBe(true);
  });

  it('should have skills categories', () => {
    expect(about.skills).toHaveProperty('programmingLanguages');
    expect(about.skills).toHaveProperty('frameworks');
    expect(about.skills).toHaveProperty('tools');
    expect(about.skills).toHaveProperty('softwareDesign');
    expect(about.skills).toHaveProperty('interests');
  });

  it('each skill category should have label, items, and color', () => {
    Object.values(about.skills).forEach((category) => {
      expect(category).toHaveProperty('label');
      expect(category).toHaveProperty('items');
      expect(category).toHaveProperty('color');
      expect(Array.isArray(category.items)).toBe(true);
    });
  });

  it('should have programming profiles', () => {
    expect(Array.isArray(about.programmingProfiles)).toBe(true);
    expect(about.programmingProfiles.length).toBeGreaterThan(0);

    about.programmingProfiles.forEach((profile) => {
      expect(profile).toHaveProperty('platform');
      expect(profile).toHaveProperty('username');
      expect(profile).toHaveProperty('link');
      expect(profile).toHaveProperty('stats');
    });
  });

  it('should have values', () => {
    expect(Array.isArray(about.values)).toBe(true);
    expect(about.values.length).toBeGreaterThan(0);

    about.values.forEach((value) => {
      expect(value).toHaveProperty('title');
      expect(value).toHaveProperty('description');
    });
  });
});
