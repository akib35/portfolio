-- Seed existing blog posts from content collection into D1

-- Post 1: Getting Started with Astro
INSERT OR IGNORE INTO blog_posts (slug, title, excerpt, content, content_html, status, author_id, allow_comments, published_at)
VALUES (
  'getting-started-with-astro',
  'Getting Started with Astro',
  'Learn the basics of building fast and modern websites with Astro',
  '# Getting Started with Astro

Astro is a modern framework for building fast, optimized websites. In this post, we''ll explore the basics.

## Why Astro?

Here are some reasons to consider Astro:

* Fast performance out of the box
* Support for multiple frameworks
* Excellent SEO
* Great developer experience

## Key Features

### 1. Island Architecture

Astro uses an innovative "island architecture" that sends zero JavaScript to browsers by default. You only ship JavaScript for the interactive components you need.

### 2. Multi-Framework Support

You can use React, Vue, Svelte, and other frameworks in the same project without bloating your final bundle.

### 3. Content Collections

Astro has built-in support for content collections, making it perfect for blogs, documentation, and content-heavy sites.

## Getting Started

To create a new Astro project, run:

```
npm create astro@latest
```

Then follow the prompts and start building!

## Conclusion

Astro is an excellent choice for developers looking to build modern, performant websites. Check out the [official documentation](https://astro.build) to learn more.

Happy coding!',
  '<h1>Getting Started with Astro</h1>
<p>Astro is a modern framework for building fast, optimized websites. In this post, we''ll explore the basics.</p>
<h2>Why Astro?</h2>
<p>Here are some reasons to consider Astro:</p>
<ul>
<li>Fast performance out of the box</li>
<li>Support for multiple frameworks</li>
<li>Excellent SEO</li>
<li>Great developer experience</li>
</ul>
<h2>Key Features</h2>
<h3>1. Island Architecture</h3>
<p>Astro uses an innovative &quot;island architecture&quot; that sends zero JavaScript to browsers by default. You only ship JavaScript for the interactive components you need.</p>
<h3>2. Multi-Framework Support</h3>
<p>You can use React, Vue, Svelte, and other frameworks in the same project without bloating your final bundle.</p>
<h3>3. Content Collections</h3>
<p>Astro has built-in support for content collections, making it perfect for blogs, documentation, and content-heavy sites.</p>
<h2>Getting Started</h2>
<p>To create a new Astro project, run:</p>
<pre><code>npm create astro@latest</code></pre>
<p>Then follow the prompts and start building!</p>
<h2>Conclusion</h2>
<p>Astro is an excellent choice for developers looking to build modern, performant websites. Check out the <a href="https://astro.build">official documentation</a> to learn more.</p>
<p>Happy coding!</p>',
  'published',
  1,
  1,
  '2024-01-15T00:00:00.000Z'
);

-- Post 2: How I ended up creating this astro portfolio
INSERT OR IGNORE INTO blog_posts (slug, title, excerpt, content, content_html, status, author_id, allow_comments, published_at)
VALUES (
  'my-portfolio',
  'How I ended up creating this astro portfolio',
  'A behind-the-scenes look at the journey to building my Astro portfolio.',
  '# How I ended up creating this astro portfolio

In this post, I''ll share the story behind building my Astro portfolio, the challenges I faced, and the lessons I learned along the way.',
  '<h1>How I ended up creating this astro portfolio</h1>
<p>In this post, I''ll share the story behind building my Astro portfolio, the challenges I faced, and the lessons I learned along the way.</p>',
  'published',
  1,
  1,
  '2026-01-11T00:00:00.000Z'
);

-- Tags
INSERT OR IGNORE INTO tags (name, slug) VALUES ('Astro', 'astro');
INSERT OR IGNORE INTO tags (name, slug) VALUES ('Portfolio', 'portfolio');
INSERT OR IGNORE INTO tags (name, slug) VALUES ('Web Development', 'web-development');
INSERT OR IGNORE INTO tags (name, slug) VALUES ('Personal Journey', 'personal-journey');

-- Tag associations for Post 1: getting-started-with-astro -> Astro
INSERT OR IGNORE INTO blog_post_tags (blog_post_id, tag_id)
  SELECT bp.id, t.id FROM blog_posts bp, tags t
  WHERE bp.slug = 'getting-started-with-astro' AND t.slug = 'astro';

-- Tag associations for Post 2: my-portfolio -> Astro, Portfolio, Web Development, Personal Journey
INSERT OR IGNORE INTO blog_post_tags (blog_post_id, tag_id)
  SELECT bp.id, t.id FROM blog_posts bp, tags t
  WHERE bp.slug = 'my-portfolio' AND t.slug = 'astro';

INSERT OR IGNORE INTO blog_post_tags (blog_post_id, tag_id)
  SELECT bp.id, t.id FROM blog_posts bp, tags t
  WHERE bp.slug = 'my-portfolio' AND t.slug = 'portfolio';

INSERT OR IGNORE INTO blog_post_tags (blog_post_id, tag_id)
  SELECT bp.id, t.id FROM blog_posts bp, tags t
  WHERE bp.slug = 'my-portfolio' AND t.slug = 'web-development';

INSERT OR IGNORE INTO blog_post_tags (blog_post_id, tag_id)
  SELECT bp.id, t.id FROM blog_posts bp, tags t
  WHERE bp.slug = 'my-portfolio' AND t.slug = 'personal-journey';
