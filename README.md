# Akib35 Blog

Standalone blog repository for deployment at https://blog.akib35.me.

This project contains the complete blog stack migrated from the portfolio codebase:

- Markdown content collection posts
- D1-backed blog posts with tags
- Admin login and blog management routes
- Comment and moderation API and UI
- Auth verification flow for admin endpoints

## Tech Stack

- Astro 5
- Tailwind CSS 4
- Cloudflare Pages + Functions
- Cloudflare D1
- Vitest

## Local Development

1. Install dependencies

```bash
pnpm install
```

2. Start Astro dev server

```bash
pnpm dev
```

3. Build production output

```bash
pnpm build
```

## D1 Migrations

Run all migrations against local D1:

```bash
pnpm db:migrate:local:all
```

Run all migrations against remote D1:

```bash
pnpm db:migrate:remote:all
```

## Deployment Notes

- Astro site URL is configured as https://blog.akib35.me.
- Wrangler project name is set to akib35-blog.
- Configure your DNS CNAME for blog.akib35.me to the Cloudflare Pages project.

## License

MIT
