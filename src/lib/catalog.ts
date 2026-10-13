import type { Category, Post } from './cms';

export interface Tool {
  id: number;
  name: string;
  slug: string;
}

export const LEVELS = ['начинающий', 'продвинутый', 'для команды'];

export function flattenCategories(categories: Category[]): Tool[] {
  const tools: Tool[] = [];
  const walk = (items: Category[]) => {
    for (const item of items) {
      tools.push({ id: item.id, name: item.name, slug: item.slug });
      if (item.children?.length) walk(item.children);
    }
  };
  walk(categories);
  return tools;
}

export function toolForPost(post: Post, tools: Tool[]): Tool | undefined {
  const id = post.primary_category_id ?? post.categories[0];
  return tools.find((tool) => tool.id === id);
}

export function cardDescription(post: Post): string {
  const seo = post.seo?.description;
  if (seo) return seo;
  const paragraph = post.body
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .find((part) => part && !part.startsWith('#') && !part.startsWith('```'));
  const text = (paragraph ?? '').replace(/[#*`_[\]()!]/g, '').replace(/\s+/g, ' ').trim();
  return text.length > 200 ? `${text.slice(0, 200)}…` : text;
}

export function pickFeatured(posts: Post[], count: number): Post[] {
  const sorted = [...posts].sort(
    (a, b) => Date.parse(b.published_at ?? '') - Date.parse(a.published_at ?? ''),
  );
  const featured = sorted.filter((post) => post.is_featured);
  const rest = sorted.filter((post) => !post.is_featured);
  return [...featured, ...rest].slice(0, count);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
