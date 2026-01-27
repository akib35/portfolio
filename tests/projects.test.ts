import { describe, it, expect } from 'vitest';
import { projects } from '../src/utils/projects';

describe('projects data', () => {
  it('should export an array of projects', () => {
    expect(Array.isArray(projects)).toBe(true);
  });

  it('each project should have required properties', () => {
    projects.forEach((project) => {
      expect(project).toHaveProperty('title');
      expect(project).toHaveProperty('description');
      expect(project).toHaveProperty('techStack');
      expect(project).toHaveProperty('githubLink');
      expect(project).toHaveProperty('featured');
      expect(project).toHaveProperty('ongoing');
    });
  });

  it('techStack should be an array for each project', () => {
    projects.forEach((project) => {
      expect(Array.isArray(project.techStack)).toBe(true);
    });
  });

  it('featured and ongoing should be booleans', () => {
    projects.forEach((project) => {
      expect(typeof project.featured).toBe('boolean');
      expect(typeof project.ongoing).toBe('boolean');
    });
  });

  it('should have at least one featured project', () => {
    const featuredProjects = projects.filter(p => p.featured);
    expect(featuredProjects.length).toBeGreaterThan(0);
  });
});
