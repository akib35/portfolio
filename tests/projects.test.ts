import { describe, it, expect } from 'vitest';
import { projects } from '../src/data/projects';

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
    });
  });

  it('techStack should be an array for each project', () => {
    projects.forEach((project) => {
      expect(Array.isArray(project.techStack)).toBe(true);
    });
  });
});
