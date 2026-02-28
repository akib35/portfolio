import { describe, it, expect } from 'vitest';
import {
  projects,
  getFeaturedProjects,
  getOngoingProjects,
  getCompletedProjects,
} from '../src/utils/projects';

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

describe('getFeaturedProjects', () => {
  it('should return only featured projects', () => {
    const featured = getFeaturedProjects();
    expect(featured.length).toBeGreaterThan(0);
    featured.forEach((p) => {
      expect(p.featured).toBe(true);
    });
  });

  it('should return a subset of all projects', () => {
    const featured = getFeaturedProjects();
    expect(featured.length).toBeLessThanOrEqual(projects.length);
  });
});

describe('getOngoingProjects', () => {
  it('should return only ongoing projects', () => {
    const ongoing = getOngoingProjects();
    ongoing.forEach((p) => {
      expect(p.ongoing).toBe(true);
    });
  });

  it('should not include completed projects', () => {
    const ongoing = getOngoingProjects();
    ongoing.forEach((p) => {
      expect(p.ongoing).not.toBe(false);
    });
  });
});

describe('getCompletedProjects', () => {
  it('should return only completed (non-ongoing) projects', () => {
    const completed = getCompletedProjects();
    completed.forEach((p) => {
      expect(p.ongoing).toBe(false);
    });
  });

  it('completed + ongoing should equal total projects', () => {
    const completed = getCompletedProjects();
    const ongoing = getOngoingProjects();
    expect(completed.length + ongoing.length).toBe(projects.length);
  });
});
