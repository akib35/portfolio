# Astro Portfolio

This is a simple portfolio project built with Astro, Tailwind CSS, and vanilla JavaScript, focusing on good color schemes and informative content without unnecessary animations.

## Technologies Used

- **Astro**: A modern static site generator.
- **Tailwind CSS**: A utility-first CSS framework for styling.
- **Vanilla JavaScript**: For any interactive functionality.

## Deployment

This project is prepared for deployment on **Cloudflare Pages**. Follow the Cloudflare Pages documentation to deploy your Astro project. Ensure your build command is set to `npm run build` and the output directory is `dist`.

## Project Structure

- **src**: Contains the main source code.
  - **components**: Reusable components for header, footer, navigation, and project cards.
  - **pages**: Different pages of the portfolio including home, projects, about, and contact.
  - **layouts**: Main layout structure for consistent styling across pages.
  - **styles**: Global styles including Tailwind CSS and custom styles.
  - **js**: Utility functions for JavaScript functionality.
  
- **public**: Static files like `robots.txt`.

- **config**:
  - **astro**: Configuration for Astro project.
  - **tailwind**: Configuration for Tailwind CSS.
  - **package**: NPM dependencies and scripts.
  - **tsconfig**: TypeScript configuration.
  - **readme**: Documentation for project setup and usage.