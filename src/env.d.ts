/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

type D1Database = import('@cloudflare/workers-types').D1Database;
type KVNamespace = import('@cloudflare/workers-types').KVNamespace;
type R2Bucket = import('@cloudflare/workers-types').R2Bucket;

interface CloudflareEnv {
  DB: D1Database;
  ADMIN_TOKEN?: string;
  ADMIN_PASSWORD_HASH?: string;
  JWT_SECRET?: string;
  RESEND_API_KEY?: string;
  CONTACT_EMAIL?: string;
  SITE_URL?: string;
  PUBLIC_TURNSTILE_SITE_KEY?: string;
  PUBLIC_FORMSPREE_ID?: string;
  ADMIN_USERNAME?: string;
  ADMIN_PASSWORD?: string;
  ADMIN_DISPLAY_NAME?: string;
}

type Runtime = import('@astrojs/cloudflare').Runtime<CloudflareEnv>;

declare namespace App {
  interface Locals extends Runtime { }
}