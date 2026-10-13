export interface PostBlock {
  id: string;
  title: string;
  markdown: string;
}

export interface PostSeo {
  title: string | null;
  description: string | null;
  keywords: string | null;
  canonical: string | null;
  robots: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  twitter_card: string | null;
  json_ld: string | null;
}

export interface Post {
  id: number;
  title: string;
  slug: string;
  body: string;
  locale: string;
  translation_group: number | null;
  status: string;
  scheduled_at: string | null;
  published_at: string | null;
  is_index: boolean;
  is_featured: boolean;
  primary_category_id: number | null;
  path: string;
  url: string | null;
  blocks: PostBlock[];
  categories: number[];
  tags: string[];
  seo: PostSeo;
  cover: string | null;
  banner: string | null;
}

export interface PostsMeta {
  per_page: number;
  next_cursor: string | null;
  prev_cursor: string | null;
}

export interface PostsPage {
  data: Post[];
  meta: PostsMeta;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  children?: Category[] | null;
}

const baseUrl = import.meta.env.BACKEND_API as string | undefined;
const apiKey = import.meta.env.BACKEND_KEY as string | undefined;

async function requestJson(path: string): Promise<unknown | null> {
  if (!baseUrl || !apiKey) {
    console.warn('CMS: BACKEND_API or BACKEND_KEY is not set');
    return null;
  }

  try {
    const url = `${baseUrl.replace(/\/$/, '')}${path}`;
    const response = await fetch(url, { headers: { 'X-Api-Key': apiKey } });

    if (!response.ok) {
      console.warn(`CMS: request failed with ${response.status}: ${path}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.warn(`CMS: request error: ${path}`, error);
    return null;
  }
}

export async function fetchPosts(locale = 'ru'): Promise<Post[]> {
  if (!baseUrl || !apiKey) {
    console.warn('CMS: BACKEND_API or BACKEND_KEY is not set');
    return [];
  }

  try {
    const url = `${baseUrl.replace(/\/$/, '')}/v1/content/posts?locale=${encodeURIComponent(locale)}`;
    const response = await fetch(url, { headers: { 'X-Api-Key': apiKey } });

    if (!response.ok) {
      console.warn(`CMS: posts request failed with ${response.status}`);
      return [];
    }

    const page = (await response.json()) as PostsPage;
    return page.data;
  } catch (error) {
    console.warn('CMS: posts request error', error);
    return [];
  }
}

export interface PostsParams {
  locale?: string;
  category?: number;
  tag?: string;
}

export async function fetchPostsByParams(params: PostsParams = {}): Promise<Post[]> {
  const posts: Post[] = [];
  let cursor: string | null = null;
  let pages = 0;

  do {
    const query = new URLSearchParams({ locale: params.locale ?? 'ru' });
    if (params.category !== undefined) query.set('category', String(params.category));
    if (params.tag) query.set('tag', params.tag);
    if (cursor) query.set('cursor', cursor);

    const page = (await requestJson(`/v1/content/posts?${query.toString()}`)) as PostsPage | null;
    if (!page || !Array.isArray(page.data)) break;

    posts.push(...page.data);
    cursor = page.meta?.next_cursor ?? null;
    pages += 1;
  } while (cursor && pages < 50);

  return posts;
}

export async function fetchCategories(): Promise<Category[]> {
  const payload = (await requestJson('/v1/content/categories')) as { data?: Category[] } | null;
  if (!payload || !Array.isArray(payload.data)) return [];
  return payload.data;
}

export type InstructionMedia = string | number | null;

export interface InstructionValues {
  short_description?: string | null;
  full_description?: string | null;
  cover?: InstructionMedia;
  memory_json?: InstructionMedia;
  mcp_example?: string | null;
  category?: string | null;
}

export interface Instruction {
  id: number;
  title: string;
  slug: string;
  status: string;
  published_at: string | null;
  position: number;
  values: InstructionValues;
  path: string;
  url: string | null;
  seo_title: string | null;
  seo_description: string | null;
}

export interface InstructionsMeta {
  per_page: number;
  current_page: number;
  last_page: number;
  total: number;
}

export interface InstructionsPage {
  data: Instruction[];
  meta?: InstructionsMeta;
}

const INSTRUCTIONS_PATH = '/v1/content/collections/instructions/entries';
const INSTRUCTIONS_MAX_PAGES = 50;

export async function fetchInstructions(): Promise<Instruction[]> {
  const entries: Instruction[] = [];
  let page = 1;
  let lastPage = 1;

  for (;;) {
    if (page > INSTRUCTIONS_MAX_PAGES) {
      if (page <= lastPage) {
        console.error(
          `CMS: instructions list exceeds ${INSTRUCTIONS_MAX_PAGES} pages; the instructions list is incomplete (${entries.length} entries loaded)`,
        );
      }
      break;
    }

    const payload = (await requestJson(`${INSTRUCTIONS_PATH}?page=${page}`)) as InstructionsPage | null;
    if (!payload || !Array.isArray(payload.data)) {
      console.error(
        page === 1
          ? 'CMS: instructions list request failed on page 1; the instructions list is empty'
          : `CMS: instructions list request failed on page ${page}; the instructions list is incomplete (${entries.length} entries loaded)`,
      );
      break;
    }

    entries.push(...payload.data);

    if (page === 1) {
      lastPage = payload.meta?.last_page ?? 1;
    } else if (payload.meta?.last_page !== undefined && payload.meta.last_page !== lastPage) {
      console.error(
        `CMS: instructions list last_page changed from ${lastPage} to ${payload.meta.last_page} on page ${page}`,
      );
    }

    if (page >= lastPage) break;
    page += 1;
  }

  return entries;
}

function compareInstructions(a: Instruction, b: Instruction): number {
  const byPosition = (a.position ?? 0) - (b.position ?? 0);
  return byPosition !== 0 ? byPosition : a.slug.localeCompare(b.slug);
}

/**
 * Returns the instructions shown on the site: status "published", one entry per slug
 * (first occurrence wins), sorted by position with slug as the tie-breaker.
 * Used by both the list page and the detail route generation.
 */
export async function fetchPublishedInstructions(): Promise<Instruction[]> {
  const seenSlugs = new Set<string>();

  const published = (await fetchInstructions()).filter((instruction) => {
    if (instruction.status !== 'published' || seenSlugs.has(instruction.slug)) return false;
    seenSlugs.add(instruction.slug);
    return true;
  });

  return published.sort(compareInstructions);
}

/**
 * Returns a usable URL for a CMS media value.
 * Accepted: absolute https:// or http:// URLs, and root-relative paths that start with a single "/"
 * (protocol-relative "//host" and "/\host" are rejected).
 * Numeric values (media IDs) are not resolved here and return null.
 */
export function mediaUrl(value: InstructionMedia | undefined): string | null {
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  return /^(https?:\/\/|\/(?![\/\\]))/.test(trimmed) ? trimmed : null;
}
