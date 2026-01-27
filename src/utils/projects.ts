/**
 * Projects data types and exports
 */

export interface Project {
  featured: boolean;
  ongoing: boolean;
  title: string;
  description: string;
  techStack: string[];
  liveLink?: string;
  githubLink: string;
}

import projectsData from '../data/projects.json';

export const projects: Project[] = projectsData;

/**
 * Get featured projects
 */
export function getFeaturedProjects(): Project[] {
  return projects.filter(project => project.featured);
}

/**
 * Get ongoing projects
 */
export function getOngoingProjects(): Project[] {
  return projects.filter(project => project.ongoing);
}

/**
 * Get completed projects
 */
export function getCompletedProjects(): Project[] {
  return projects.filter(project => !project.ongoing);
}
