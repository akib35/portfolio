# Md Akib Hasan - Portfolio

[![Build and Check](https://github.com/akib35/portfolio/actions/workflows/astro.yml/badge.svg)](https://github.com/akib35/portfolio/actions/workflows/astro.yml)

A modern, responsive portfolio website built with Astro, showcasing full-stack development projects, skills, and blog posts. Features clean design, fast performance, and SEO optimization.

🌐 **Live Site**: [https://akib35.me](https://akib35.me)

## ✨ Features

- **Responsive Design** - Optimized for all devices using Tailwind CSS
- **Fast Performance** - Static site generation with Astro for optimal loading times
- **SEO Optimized** - Meta tags, Open Graph, Twitter cards, sitemap, and robots.txt
- **Blog System** - Markdown-based blog with content collections
- **Contact Form** - Protected with Cloudflare Turnstile CAPTCHA, powered by Formspree
- **TypeScript** - Type-safe development with strict mode
- **Testing** - Unit tests with Vitest
- **CI/CD** - Automated builds and tests with GitHub Actions

## 🛠️ Tech Stack

| Category | Technologies |
|----------|-------------|
| Framework | [Astro](https://astro.build) |
| Styling | [Tailwind CSS](https://tailwindcss.com) |
| Language | TypeScript, JavaScript |
| Testing | [Vitest](https://vitest.dev) |
| Deployment | [Cloudflare Pages](https://pages.cloudflare.com) |
| Form Handling | [Formspree](https://formspree.io) |
| Bot Protection | [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/) |

## 📦 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) (v18 or higher)
- [pnpm](https://pnpm.io) (recommended)

### Installation

```bash
# Clone the repository
git clone https://github.com/akib35/portfolio.git
cd portfolio

# Install dependencies
pnpm install
```

### Development

```bash
# Start development server
pnpm dev
```

Visit `http://localhost:4321` to view the site.

### Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server with hot reload |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview production build locally |
| `pnpm test` | Run tests once |
| `pnpm test:watch` | Run tests in watch mode |

## 📁 Project Structure

```
portfolio/
├── .github/workflows/        # GitHub Actions CI/CD
├── public/                   # Static assets (images, CV, favicon)
├── src/
│   ├── components/           # Reusable Astro components
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   ├── Navigation.astro
│   │   └── ProjectCard.astro
│   ├── content/              # Content collections
│   │   ├── config.ts         # Collection schemas
│   │   └── blog/             # Blog posts (Markdown)
│   ├── data/                 # Data files
│   │   ├── projects.json     # Projects data
│   │   └── projects.ts       # Projects type definitions
│   ├── layouts/
│   │   └── Layout.astro      # Main layout with SEO
│   ├── pages/                # Route pages
│   │   ├── index.astro       # Home
│   │   ├── about.astro       # About
│   │   ├── projects.astro    # Projects
│   │   ├── contact.astro     # Contact form
│   │   ├── 404.astro         # Custom 404 page
│   │   └── blog/             # Blog pages
│   ├── scripts/              # Client-side scripts
│   ├── styles/               # Global styles
│   └── config.ts             # Site configuration
├── tests/                    # Unit tests
├── astro.config.mjs          # Astro configuration
├── tailwind.config.cjs       # Tailwind configuration
├── vitest.config.ts          # Vitest configuration
└── tsconfig.json             # TypeScript configuration
```

## 🌐 Deployment

This project is deployed on **Cloudflare Pages** with automatic deployments on push to main.

### Build Settings

- **Build command**: `pnpm build`
- **Build output directory**: `dist`
- **Node.js version**: 18

## 📋 Adding Content

### New Project

Edit `src/data/projects.json`:

```json
{
  "featured": true,
  "title": "Project Name",
  "description": "Brief description",
  "techStack": ["Tech1", "Tech2"],
  "liveLink": "https://example.com",
  "githubLink": "https://github.com/user/repo"
}
```

### New Blog Post

Create a new `.md` file in `src/content/blog/`:

```markdown
---
title: "Your Post Title"
date: 2026-01-21
excerpt: "Brief excerpt for the post"
---

Your content here...
```

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

## 🚀 Upcoming Features

- **Limit send message option** - Rate limiting for contact form submissions
- **Refined blog posts** - Enhanced blog styling and features
- **Background based on season** - Dynamic seasonal themes

## 👤 Author

**Md Akib Hasan**

- 🌐 Website: [akib35.me](https://akib35.me)
- 📧 Email: [writetoakibhasan@gmail.com](mailto:writetoakibhasan@gmail.com)
- 💼 LinkedIn: [akibH](https://linkedin.com/in/akibH)
- 🐙 GitHub: [akib35](https://github.com/akib35)
- 🐦 Twitter: [mdakibhasan18](https://twitter.com/mdakibhasan18)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
