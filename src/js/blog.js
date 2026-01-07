export async function getBlogPosts() {
  const posts = [];
  const modules = import.meta.glob('../data/blog/*.md', { eager: true });

  for (const path in modules) {
    const module = modules[path];
    const slug = path.split('/').pop().replace('.md', '');

    if (module.frontmatter) {
      posts.push({
        slug,
        title: module.frontmatter.title || 'Untitled',
        date: module.frontmatter.date || new Date().toISOString(),
        excerpt: module.frontmatter.excerpt || '',
        content: module.default || '',
        ...module.frontmatter
      });
    }
  }

  return posts;
}

export async function getBlogPost(slug) {
  const posts = await getBlogPosts();
  return posts.find(post => post.slug === slug);
}
