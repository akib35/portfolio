PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  user_agent TEXT,
  ip_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  read BOOLEAN DEFAULT FALSE
);
INSERT INTO "submissions" ("id","name","email","subject","message","user_agent","ip_address","created_at","read") VALUES(1,'Akib','akib.cdda@gmail.com','test','tesrt','Mozilla/5.0 (X11; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0','103.40.156.47','2026-01-29 16:36:47',0);
INSERT INTO "submissions" ("id","name","email","subject","message","user_agent","ip_address","created_at","read") VALUES(2,'Maris Gonzalez','fezycyfydy@mailinator.com','Officia temporibus e','Mollit quod dolor do','Mozilla/5.0 (X11; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0','103.40.156.47','2026-01-29 16:45:34',0);
INSERT INTO "submissions" ("id","name","email","subject","message","user_agent","ip_address","created_at","read") VALUES(3,'Test','test@test.com','Testing message','Testing messageTesting message','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0','103.84.38.197','2026-02-08 12:17:56',0);
INSERT INTO "submissions" ("id","name","email","subject","message","user_agent","ip_address","created_at","read") VALUES(4,'Final Test','final@test.com','final test','testting formsphere trunstile setup','Mozilla/5.0 (X11; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0','103.40.156.45','2026-02-09 15:17:44',0);
INSERT INTO "submissions" ("id","name","email","subject","message","user_agent","ip_address","created_at","read") VALUES(5,'Test','test@discord.com','testing discord integration','testing discord webhook integration','Mozilla/5.0 (X11; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0','103.40.156.45','2026-02-09 15:28:54',0);
CREATE TABLE admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME
);
INSERT INTO "admin_users" ("id","username","password_hash","display_name","created_at","last_login") VALUES(1,'akib','WqaSXXjtaP_y7qeTc5_Aog:UJPaAB6Ahc8_w5Fc_650rnwsyIYNCvCRePhJN5U5Ruc','Md Akib Hasan','2026-02-28 11:40:34','2026-03-11 16:08:00');
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE
);
CREATE TABLE blog_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  content_html TEXT NOT NULL,
  cover_image TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'published', 'archived')),
  author_id INTEGER,
  allow_comments INTEGER DEFAULT 1,
  comments_close_at DATETIME,
  published_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES admin_users(id) ON DELETE SET NULL
);
INSERT INTO "blog_posts" ("id","slug","title","excerpt","content","content_html","cover_image","status","author_id","allow_comments","comments_close_at","published_at","created_at","updated_at") VALUES(2,'getting-started-with-astro','Getting Started with Astro','Learn the basics of building fast and modern websites with Astro',replace('# Getting Started with Astro\n\nAstro is a modern framework for building fast, optimized websites. In this post, we''ll explore the basics.\n\n## Why Astro?\n\nHere are some reasons to consider Astro:\n\n* Fast performance out of the box\n* Support for multiple frameworks\n* Excellent SEO\n* Great developer experience\n\n## Key Features\n\n### 1. Island Architecture\n\nAstro uses an innovative "island architecture" that sends zero JavaScript to browsers by default. You only ship JavaScript for the interactive components you need.\n\n### 2. Multi-Framework Support\n\nYou can use React, Vue, Svelte, and other frameworks in the same project without bloating your final bundle.\n\n### 3. Content Collections\n\nAstro has built-in support for content collections, making it perfect for blogs, documentation, and content-heavy sites.\n\n## Getting Started\n\nTo create a new Astro project, run:\n\n```\nnpm create astro@latest\n```\n\nThen follow the prompts and start building!\n\n## Conclusion\n\nAstro is an excellent choice for developers looking to build modern, performant websites. Check out the [official documentation](https://astro.build) to learn more.\n\nHappy coding!','\n',char(10)),replace('<h1>Getting Started with Astro</h1>\n<p>Astro is a modern framework for building fast, optimized websites. In this post, we''ll explore the basics.</p>\n<h2>Why Astro?</h2>\n<p>Here are some reasons to consider Astro:</p>\n<ul>\n<li>Fast performance out of the box</li>\n<li>Support for multiple frameworks</li>\n<li>Excellent SEO</li>\n<li>Great developer experience</li>\n</ul>\n<h2>Key Features</h2>\n<h3>1. Island Architecture</h3>\n<p>Astro uses an innovative &quot;island architecture&quot; that sends zero JavaScript to browsers by default. You only ship JavaScript for the interactive components you need.</p>\n<h3>2. Multi-Framework Support</h3>\n<p>You can use React, Vue, Svelte, and other frameworks in the same project without bloating your final bundle.</p>\n<h3>3. Content Collections</h3>\n<p>Astro has built-in support for content collections, making it perfect for blogs, documentation, and content-heavy sites.</p>\n<h2>Getting Started</h2>\n<p>To create a new Astro project, run:</p>\n<pre><code>npm create astro@latest</code></pre>\n<p>Then follow the prompts and start building!</p>\n<h2>Conclusion</h2>\n<p>Astro is an excellent choice for developers looking to build modern, performant websites. Check out the <a href="https://astro.build">official documentation</a> to learn more.</p>\n<p>Happy coding!</p>','\n',char(10)),NULL,'published',NULL,1,NULL,'2024-01-15T00:00:00.000Z','2026-02-28 09:47:10','2026-02-28 09:47:10');
INSERT INTO "blog_posts" ("id","slug","title","excerpt","content","content_html","cover_image","status","author_id","allow_comments","comments_close_at","published_at","created_at","updated_at") VALUES(3,'my-portfolio','How I ended up creating this astro portfolio','A behind-the-scenes look at the journey to building my Astro portfolio.',replace('How I ended up creating this astro portfolio\n\nIn this post, I''ll share the story behind building my Astro portfolio, the challenges I faced, and the lessons I learned along the way.\n\n\n\nAfter completing the CS degree for University, a strong feeling about having a portfolio was always in my back of mind. I just needed a spark, a small step forward. In the meantime I discovered I can have a domain free of charge with my github student account. It was the push I needed. Then choosing , stack, build the simple One page portfolio, then convert it like this using AI, it was awesome.','\n',char(10)),'<h1>How I ended up creating this astro portfolio</h1><p>In this post, I''ll share the story behind building my Astro portfolio, the challenges I faced, and the lessons I learned along the way.</p><p></p><p>After completing the CS degree for University, a strong feeling about having a portfolio was always in my back of mind. I just needed a spark, a small step forward. In the meantime I discovered I can have a domain free of charge with my github student account. It was the push I needed. Then choosing , stack, build the simple One page portfolio, then convert it like this using AI, it was awesome.</p>',NULL,'published',NULL,1,NULL,'2026-01-11T00:00:00.000Z','2026-02-28 09:47:10','2026-02-28 11:46:09');
INSERT INTO "blog_posts" ("id","slug","title","excerpt","content","content_html","cover_image","status","author_id","allow_comments","comments_close_at","published_at","created_at","updated_at") VALUES(6,'secrets-of-creation-look-beond','Secrets of Creation: Look Beond','The Secret''s of creation unvails the path of prosperrity',replace('Book Title: Secrets of Creation \n\nAuthor: Imam Gazzali RA\n\nThe first thing I found from the authors small biography described in the beginning of the book, a small story. It is described as - \n\nOnce the author was traveling with a group and they were robbed by a group of thugs. They took all of the effects of the authors including some manuscripts. These manuscripts are the written notes of the lectures given by his master''s, thus was so precious. Then the author begged to the leader of the robbers to give those manuscripts. Although the leader gave him the scripts, but said, "If you need this then what are you learning". After that Hazrat Imam Gazzali RA always memorized things he learned. \n\nThe oldest and the heavenly way of education: Memorizing.\n\nTBC.','\n',char(10)),'<h1><strong>Book Title: Secrets of Creation </strong></h1><h3><strong>Author: Imam Gazzali RA</strong></h3><p>The first thing I found from the authors small biography described in the beginning of the book, a small story. It is described as - </p><p>Once the author was traveling with a group and they were robbed by a group of thugs. They took all of the effects of the authors including some manuscripts. These manuscripts are the written notes of the lectures given by his master''s, thus was so precious. Then the author begged to the leader of the robbers to give those manuscripts. Although the leader gave him the scripts, but said, "If you need this then what are you learning". After that Hazrat Imam Gazzali RA always memorized things he learned. </p><p>The oldest and the heavenly way of education: Memorizing.</p><p>TBC.</p>','https://www.jeffbullas.com/wp-content/uploads/2019/09/What-Is-The-Secret-To-Creating-Your-Best-Art-and-Work.jpg','published',1,1,NULL,'2026-02-28T11:55:33.457Z','2026-02-28 11:55:33','2026-02-28 11:55:33');
CREATE TABLE tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#3B82F6',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "tags" ("id","name","slug","color","created_at") VALUES(1,'Astro','astro','#3B82F6','2026-02-28 09:47:10');
INSERT INTO "tags" ("id","name","slug","color","created_at") VALUES(2,'Portfolio','portfolio','#3B82F6','2026-02-28 09:47:10');
INSERT INTO "tags" ("id","name","slug","color","created_at") VALUES(3,'Web Development','web-development','#3B82F6','2026-02-28 09:47:10');
INSERT INTO "tags" ("id","name","slug","color","created_at") VALUES(4,'Personal Journey','personal-journey','#3B82F6','2026-02-28 09:47:10');
INSERT INTO "tags" ("id","name","slug","color","created_at") VALUES(13,'Book Review','book-review','#3B82F6','2026-02-28 11:55:33');
CREATE TABLE blog_post_tags (
  blog_post_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (blog_post_id, tag_id),
  FOREIGN KEY (blog_post_id) REFERENCES blog_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);
INSERT INTO "blog_post_tags" ("blog_post_id","tag_id") VALUES(2,1);
INSERT INTO "blog_post_tags" ("blog_post_id","tag_id") VALUES(3,1);
INSERT INTO "blog_post_tags" ("blog_post_id","tag_id") VALUES(3,2);
INSERT INTO "blog_post_tags" ("blog_post_id","tag_id") VALUES(3,3);
INSERT INTO "blog_post_tags" ("blog_post_id","tag_id") VALUES(3,4);
INSERT INTO "blog_post_tags" ("blog_post_id","tag_id") VALUES(6,13);
CREATE TABLE comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  blog_post_id INTEGER NOT NULL,
  parent_id INTEGER,
  author_name TEXT NOT NULL,
  author_email TEXT NOT NULL,
  content TEXT NOT NULL,
  is_approved INTEGER DEFAULT 0,
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (blog_post_id) REFERENCES blog_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
);
INSERT INTO "comments" ("id","blog_post_id","parent_id","author_name","author_email","content","is_approved","ip_address","user_agent","created_at") VALUES(1,6,NULL,'ayon','u1704127@gmail.com','Great motivation to go paperless.',1,'45.115.113.174','Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36','2026-02-28 12:02:04');
INSERT INTO "comments" ("id","blog_post_id","parent_id","author_name","author_email","content","is_approved","ip_address","user_agent","created_at") VALUES(2,6,1,'akib','akib.cdda@gmail.com','Thank you vai',1,'202.134.10.130','Mozilla/5.0 (Android 16; Mobile; rv:148.0) Gecko/148.0 Firefox/148.0','2026-02-28 12:05:01');
CREATE TABLE auth_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  code TEXT NOT NULL,
  pending_token TEXT NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  used INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP, attempts INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE
);
INSERT INTO "auth_codes" ("id","user_id","code","pending_token","expires_at","used","created_at","attempts") VALUES(6,1,'258214','ip:202.134.10.130:3949ad79-21e1-4343-9f5f-605f9234bfc8','2026-03-11T16:12:34.982Z',1,'2026-03-11 16:07:35',0);
DELETE FROM sqlite_sequence;
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('submissions',5);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('blog_posts',8);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('tags',17);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('admin_users',1);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('auth_codes',6);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('comments',3);
CREATE INDEX idx_submissions_created_at ON submissions(created_at DESC);
CREATE INDEX idx_submissions_read ON submissions(read);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX idx_tags_slug ON tags(slug);
CREATE INDEX idx_blog_post_tags_post ON blog_post_tags(blog_post_id);
CREATE INDEX idx_blog_post_tags_tag ON blog_post_tags(tag_id);
CREATE INDEX idx_comments_blog_post ON comments(blog_post_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);
CREATE INDEX idx_comments_approved ON comments(is_approved);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX idx_auth_codes_pending_token ON auth_codes(pending_token);
CREATE INDEX idx_auth_codes_expires_at ON auth_codes(expires_at);
