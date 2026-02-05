/**
 * Generate a URL-compatible slug for a blog post matching the Hexo format: YYYY/MM/DD/slug
 * Uses UTC dates since the YAML parser treats frontmatter dates as UTC.
 */
export function getPostSlug(post: { id: string; data: { date: Date } }): string {
  const date = post.data.date;
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  const slug = post.id.replace(/\/index$/, '').replace(/\//g, '-');
  return `${y}/${m}/${d}/${slug}`;
}
