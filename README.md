# Astro Portfolio

A modern, responsive portfolio website built with Astro, showcasing full-stack development projects and skills. This project emphasizes clean design, fast performance, and informative content without unnecessary animations.

## 🚀 Features

- **Responsive Design**: Optimized for all devices using Tailwind CSS
- **Fast Performance**: Built with Astro for static site generation and optimal loading times
- **SEO Optimized**: Includes sitemap generation and meta tags
- **TypeScript Support**: Type-safe development with TypeScript
- **Component-Based Architecture**: Reusable components for maintainable code
- **Project Showcase**: Dedicated section highlighting development projects

## 🛠️ Technologies Used

- **Astro**: Modern static site generator for fast web applications
- **Tailwind CSS**: Utility-first CSS framework for responsive styling
- **TypeScript**: Typed JavaScript for better development experience
- **Vanilla JavaScript**: For interactive functionality
- **Sharp**: Image optimization service
- **PostCSS & Autoprefixer**: CSS processing and browser compatibility

## 📦 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/akib35/astro-portfolio.git
   cd astro-portfolio
   ```

2. Install dependencies using pnpm:
   ```bash
   pnpm install
   ```

## 🚀 Usage

- **Development Server**: Start the development server with hot reload
  ```bash
  pnpm dev
  ```
  Visit `http://localhost:4321` to view the site.

- **Build for Production**:
  ```bash
  pnpm build
  ```

- **Preview Production Build**:
  ```bash
  pnpm preview
  ```

## 📁 Project Structure

```
astro-portfolio/
├── astro.config.mjs          # Astro configuration
├── package.json              # Project dependencies and scripts
├── tailwind.config.cjs       # Tailwind CSS configuration
├── tsconfig.json             # TypeScript configuration
├── public/                   # Static assets
│   ├── robots.txt
│   └── github-mark/          # Social media icons
├── src/
│   ├── components/           # Reusable Astro components
│   │   ├── Footer.astro
│   │   ├── Header.astro
│   │   ├── Navigation.astro
│   │   └── ProjectCard.astro
│   ├── layouts/
│   │   └── Layout.astro      # Main layout component
│   ├── pages/                # Astro pages
│   │   ├── index.astro       # Home page
│   │   ├── projects.astro    # Projects showcase
│   │   ├── about.astro       # About page
│   │   └── contact.astro     # Contact page
│   ├── scripts/
│   │   └── typewriter.ts     # Typewriter effect script
│   ├── styles/
│   │   └── global.css        # Global styles
│   ├── js/
│   │   └── utils.js          # Utility functions
│   └── config.ts             # Site configuration
└── temp/                     # Temporary files (can be removed)
```

## 🌐 Deployment

This project is configured for deployment on **Cloudflare Pages**:

1. Connect your GitHub repository to Cloudflare Pages
2. Set build settings:
   - **Build command**: `pnpm build`
   - **Build output directory**: `dist`
3. Deploy automatically on push to main branch

The site is live at: [https://akib35.me](https://akib35.me)

## 📋 Projects Showcase

The portfolio features a dedicated projects section displaying various development projects, including:

- **Project One**: Web application with modern technologies
- **Project Two**: Interactive dashboard with data visualization
- **Project Three**: E-commerce platform with payment integration
- **Project Four**: Real-time chat application
- **Project Five**: Productivity tool for team collaboration
- **Project Six**: API service for authentication and user management

Each project card includes technology stack, live demo links, and GitHub repository links.

To add new projects, update the `src/data/projects.json` file with the new project details. The JSON structure for each project includes:
- `title`: Project name
- `description`: Brief description
- `techStack`: Array of technologies used
- `liveLink`: (Optional) URL to live demo
- `githubLink`: URL to GitHub repository

## 👀 Coming Soon

A few features are comming soon as the project grows, including:
- Limit send message option
- refined blog posts

## 🤝 Contributing

Contributions are limited but suggestions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Md Akib Hasan**
- Email: writetoakibhasan@gmail.com
- Phone: +1 234 567 8900
- Location: Dhaka, Bangladesh
- LinkedIn: [akibH](https://linkedin.com/in/akibH)
- GitHub: [akib35](https://github.com/akib35)
- Twitter: [mdakibhasan18](https://twitter.com/mdakibhasan18)

## 📞 Contact

Feel free to reach out for collaborations, opportunities, or just to say hello!
