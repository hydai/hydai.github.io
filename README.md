# hydaiの空想世界

[hyd.ai](https://hyd.ai) 的原始碼。使用 [Astro](https://astro.build) 產生靜態網站，搭配 Tailwind CSS v4、MDX、Pagefind 站內搜尋與 utterances 留言。

## 分支

| 分支 | 用途 |
|---|---|
| `astro` | 網站原始碼，也是部署來源。push 之後 GitHub Actions 會自動 build 並部署到 GitHub Pages。 |
| `hexo`、`master` | 2025 年以前的 Hexo 原始碼與產出物，只保留歷史，不再更新。 |

## 本機開發

需要 Node.js 22.12 以上。

```sh
npm ci
npm run dev       # 開發伺服器 http://localhost:4321
npm run build     # 產出靜態檔到 dist/
npm run preview   # 預覽 dist/ 的內容
```

## 寫文章

文章放在 `src/content/blog/`。純文字用單一檔案 `slug.md`；有圖片時建立資料夾 `slug/index.md`，圖片放在同一個資料夾內以相對路徑引用。網址為 `/YYYY/MM/DD/slug/`，日期取自 frontmatter，slug 取自檔名並轉為小寫。

```yaml
---
title: 文章標題
date: 2026-09-09 14:30:00
tags: [AI, Claude]
categories: [Note]
description: 一句話摘要        # 選填，用於 SEO 與 RSS
image: /images/cover.png     # 選填，社群分享預覽圖，檔案放在 public/images/
draft: true                  # 選填，true 時不會出現在網站與 RSS
---
```

## 部署

```sh
git push origin astro
```

流程定義在 `.github/workflows/deploy.yml`，大約一分鐘後上線。RSS 位於 `/rss.xml`，`/atom.xml` 提供同一份內容給舊訂閱者。
