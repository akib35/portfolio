/**
 * About page data types and exports
 */

export interface SkillCategory {
  label: string;
  items: string[];
  color: string;
}

export interface ProgrammingProfile {
  platform: string;
  username: string;
  link: string;
  icon: string;
  stats: string;
}

export interface Value {
  title: string;
  description: string;
}

export interface Education {
  degree: string;
  institution: string;
  year: string;
  achievements: string[];
}

export interface AboutData {
  intro: {
    greeting: string;
    title: string;
    tagline: string;
  };
  bio: string[];
  education: Education;
  skills: {
    programmingLanguages: SkillCategory;
    frameworks: SkillCategory;
    tools: SkillCategory;
    softwareDesign: SkillCategory;
    interests: SkillCategory;
  };
  programmingProfiles: ProgrammingProfile[];
  values: Value[];
}

import aboutData from '../data/about.json';

export const about: AboutData = aboutData;
