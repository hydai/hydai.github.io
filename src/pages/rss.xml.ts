import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { getPostSlug } from '../lib/utils';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const allPosts = await getCollection('blog', ({ data }) => !data.draft);
  const posts = allPosts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  return rss({
    title: 'hydaiの空想世界',
    description: 'Open Source Developer — AI/LLM, WebAssembly, Systems Programming',
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description || '',
      link: `/${getPostSlug(post)}/`,
    })),
  });
}
