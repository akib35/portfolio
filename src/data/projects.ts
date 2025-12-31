interface Project {
  featured: boolean;
  title: string;
  description: string;
  techStack: string[];
  liveLink?: string;
  githubLink: string;
}

import projectsData from './projects.json';

export const projects: Project[] = projectsData;