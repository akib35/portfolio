/**
 * Central exports for all utilities
 */

// Data exports
export { projects, getFeaturedProjects, getOngoingProjects, getCompletedProjects } from './projects';
export type { Project } from './projects';

export { about } from './about';
export type { AboutData, SkillCategory, ProgrammingProfile, Value, Education } from './about';

// Utility functions
export { formatDate, scrollToElement, toggleClass } from './helpers';
export { filterBlogPosts, matchesBlogPost } from './blogSearch';
export type { BlogPost } from './blogSearch';

export { getBlogPosts, getBlogPost } from './blog';
export type { BlogPostData } from './blog';

export { initTypewriter } from './typewriter';
