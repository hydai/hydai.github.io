---
name: writing-blog-post
description: Use when asked to add, draft, preview, or publish a post on the hyd.ai blog (this hydai.github.io repo, branch astro), including posts with images, or when a new post or its images do not show up locally or after deploy. Triggers include 新增文章, 寫一篇, 發佈, 草稿, blog post, publish post.
---

# Writing a blog post for hyd.ai

## Overview

Posts are Markdown files in `src/content/blog/` on branch `astro`; a push to `astro` deploys through GitHub Actions in about a minute. URL: `/YYYY/MM/DD/<slug>/`, date from frontmatter `date`, slug from the file or folder name lowercased. Needs Node 22.12+ (CI uses 22; a newer local Node is fine).

## Recipe

1. Collect: title, tags, one-line description, image paths, and whether to publish now. Body text comes from the user. When asked to draft an intro, write a placeholder that states nothing about the user and mark it with a visible line `> TODO: 佔位文字，發佈前改寫`, removed before publishing.
2. Slug: English kebab-case, 3 to 6 words, like the existing `deploy-flatcar-on-do`, derived from the title when the title is Chinese. State it in the report.
3. Tags: list existing spellings first. Matching is case-sensitive, so `linux` next to `Linux` yields two tag pages:
   ```sh
   find src/content/blog -name '*.md' -exec awk '/^tags:/{f=1;next} /^(---|[A-Za-z])/{f=0} f&&/^ *-/{sub(/^ *- */,"");gsub(/"/,"");print}' {} + | sort -u
   ```
   A user tag that differs only in case takes the existing spelling; a new tag is written like a proper noun (`Fedora`, `RPM`); spaces are allowed.
4. Create the file with the Write tool (shell heredocs are often refused inside agent worktrees). No images: `src/content/blog/<slug>.md`. With images: `src/content/blog/<slug>/index.md` plus the image files in that folder, referenced as `![說明](./file.png)`. Only `.md` is collected; `.mdx` is ignored.
5. Frontmatter from the template below. `description` is optional in the schema but REQUIRED here: post cards, the meta description, and the RSS item text all read it. When the user gave none, derive one sentence from the body and flag it in the report.
6. Verify with a build and two checks, nothing more (`npm ci` first if `node_modules` is missing; npm 11 prints allow-scripts warnings, ignore them):
   ```sh
   npm run build
   ls dist/<yyyy>/<mm>/<dd>/<slug>/index.html
   grep -c '<title>文章標題' dist/rss.xml
   ```
   Report the URL and the preview commands: `npm run dev` (http://localhost:4321) or `npm run preview` for the built `dist/`. Do not start a server yourself.
7. Then one of three outcomes, keyed to what the user asked for:
   - Preview only: stop after step 6, nothing committed. A post awaiting the user's review is not a completed step.
   - Keep or commit without publishing: remove TODO lines, commit as `新增文章：<title>` (the user's own convention for posts; code changes use Conventional Commits) with the `Co-Authored-By` trailer the branch already uses, no push.
   - Publish: the commit above, then push branch `astro`, `gh run watch` the deploy, and curl the URL. From an agent worktree on another branch, push with `git push origin HEAD:astro` and say the main checkout needs `git pull`.

## Frontmatter template

```yaml
---
title: 文章標題
date: YYYY-MM-DD HH:MM:SS      # now, local wall-clock time, no timezone; URL and displayed date are exactly this, RSS pubDate shows it as GMT
tags:
- WasmEdge                     # reuse the existing spelling from step 3
categories:
- Note                         # the only category in use
description: 一句話摘要          # REQUIRED
image: /images/cover.png       # optional, og:image only; file lives in public/images/
draft: true                    # optional; hides the post everywhere, including npm run dev
---
```

## Quick reference

| Want | Do |
|---|---|
| Preview before publishing | leave `draft` unset and do not push; `npm run dev` |
| Keep an unfinished post in the repo | `draft: true`; it is invisible locally as well |
| Images inside the post | files next to `index.md`, relative path; Astro emits hashed webp under `/_astro/` |
| Social share image | `image: /images/x.png` with the file in `public/images/` |
| Code block | fenced with a language; Shiki `tokyo-night` |
| Table of contents, reading time | automatic from `##`/`###` headings |
| Schema source of truth | `src/content.config.ts` |

## Common mistakes

- Post images placed in `public/`: served as-is, never optimized; the pipeline expects the relative-path form.
- `draft: true` used "to preview locally": the post disappears from the dev server too.
- Tags typed in a new casing or with hyphens: duplicate tag pages that collide on case-insensitive filesystems.
- Field names from other Astro templates (`pubDate`, `heroImage`): the schema has `date` and `image`.
- `git push origin astro` from a worktree branch: pushes the old `astro` ref and deploys nothing new.
- Committing or pushing when the user only asked to preview: a push to `astro` deploys immediately.
