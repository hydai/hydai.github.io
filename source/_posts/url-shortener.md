---
title: 蓋一個簡單的縮網址服務
date: 2024-11-19 13:06:22
tags:
- URL Shortener
categories:
- Note
---

## 前言

之前的縮網址服務我是使用 picsee 來做的，但在免費的方案中，並不支援 HTTPS，這個影響很大，如果在 URL 中存在 HTTPS 的話，轉址服務就會失效。

P.S. 因為我很不滿意 picsee 就不放上連結了，此外，我也非常不建議大家使用。

雖然有段時間可以使用 Cloudflare 的 Proxy 來讓他有 HTTPS 的樣子，可是某次更新後也失效了，而且我發現失效的時候是在演講前，因此當了盤子付了一千台幣買了一年的進階網址服務。

早知道這麼麻煩，當初應該在不緊急的時候先搬遷到 [lihi](https://lihi.io/) 上面，畢竟都要付錢了，當然要找一家好一點的服務商。

然而，過了一段時間，我發現我其實不需要這麼多功能，只是想要一個簡單的縮網址服務而已，我並不需要追蹤成效，也不需要網址的統計，因為我唯一需要的功能就只是讓我的聽眾可以用短一點的網址拿到投影片或者是其他的資料。
在這時意外看到了 [SITCON 的 URL-Shortener](https://github.com/sitcon-tw/URL-Shortener)，我發現這個服務就是我想要的。

在功能上：
- 可以自訂網址
- 可以加上該網址的簡介
- 可以放圖片
- 全部都是 markdown 語法
- 可以用 GitHub workflow 來自動部署

因此我就以他的專案為基礎，自己做了一個[相似的縮網址服務](https://github.com/hydai/URL-Shortener)

<!-- more -->

以下來說明一下整個建立的流程，如果有其他夥伴想架設自己的服務，可以參考。

## 建立縮網址服務

在這個專案中，我使用 Jekyll 來建立重導向的機制，並且使用 GitHub Pages 來部署。

### 安裝 Jekyll

我的環境在 macOS 上，由於不想與 macOS 內建的 Ruby 衝突，因此我使用 chruby 與 ruby-install 來管理與安裝 ruby。

```bash
brew install chruby ruby-install
ruby-install ruby 3.3.6 # 裝了當前最新的版本
```

接著需要在環境裡將路徑加入到 `~/.bashrc` 或者 `~/.zshrc` 中。

```bash
export PATH="$HOME/.rubies/ruby-3.3.6/bin:$PATH" # 請將 3.3.6 換成你安裝的版本
```

接著安裝 Jekyll

```bash
gem install jekyll bundler
```

### 建立專案

```bash
jekyll new url-shortener
```

這時你的目錄應該有以下的檔案：

```
├── 404.html
├── Gemfile
├── Gemfile.lock
├── _config.yml
├── _posts
│   └── 2024-11-19-welcome-to-jekyll.markdown
├── about.markdown
└── index.markdown
```

然而，作為一個短網址服務，實際上我們只需要重導向的機制，因此我們先把不需要的檔案刪掉。

```bash
rm -rf _posts about.markdown
```

刪除完以後會剩這些：

```
├── 404.html
├── Gemfile
├── Gemfile.lock
├── _config.yml
└── index.markdown
```

### 建立重導向的版型與配置

此時，我們需要建立兩個資料夾，一個是 `_layouts` 用來放置版型，另一個是 `_redirects` 用來放置重導向的配置。

```bash
mkdir _layouts _redirects
```

#### 重導向的版型

在 `_layouts` 裡面建立一個 `redirects.html` 的檔案，這個檔案是用來建立重導向的版型，這個版型可以隨意更改，是以 SITCON 的為範本，設定為 0.5 秒後轉到目標網址去。

```html
<!DOCTYPE html>
<html lang="zh-Hant-TW">
<head>
  <meta charset="utf-8">
  <title>{{ page.title }}</title>
  <meta name="description" content="{{ page.description }}">
  <meta name="author" content="hydai">
  <meta property="og:title" content="{{ page.title }}">
  <meta property="og:description" content="{{ page.description }}">
  <meta property="og:image" content="{{ page.image }}">
  <meta property="og:site_name" content="hydai">
  <meta property="og:locale" content="zh_TW">
  <script>
    setTimeout(function() {
      window.location.href = "{{ page.redirect_to }}";
    }, 500);
  </script>
</head>
<body>
  <p>重新導向到 (redirect to) <a href="{{ page.redirect_to }}">{{ page.redirect_to }}</a>⋯⋯</p>
</body>
</html>
```

#### 重導向的配置

在 `_redirects` 裡面建立一個 `template.markdown` 的檔案，這個檔案是用來建立重導向的配置。

```markdown
---
layout: redirects
title: "自定義標題"
description: "自定義描述"
redirect_to: "https://hyd.ai/"
---
```

#### 最終的檔案架構

到這邊就準備好了，整個專案的檔案架構應該是這樣：

```
├── 404.html
├── Gemfile
├── Gemfile.lock
├── _config.yml
├── _layouts
│   └── redirects.html
├── _redirects
│   └── template.markdown
└── index.markdown
```

### 修改設定來提供重導向服務

#### index.markdown

若有人訪問了此服務網站的首頁，我們至少可以將它導向到其他地方，比如個人的部落格。

在 `index.markdown` 裡面加入以下的內容：

```markdown
---
layout: redirects
title: "hydai's blog"
description: "hydaiの空想世界"
redirect_to: "https://hyd.ai/"
---
```

#### 404.html

若有人訪問了不存在的縮網址，我們可以透過 404.html 來讓他轉到首頁或者其他指定的地方，如個人的部落格。

在 `404.html` 裡面加入以下的內容：

```html
---
permalink: /404.html
layout: redirects
title: "hydai's blog"
description: "hydaiの空想世界"
redirect_to: "https://hyd.ai/"
---

<style type="text/css" media="screen">
  .container {
    margin: 10px auto;
    max-width: 600px;
    text-align: center;
  }
  h1 {
    margin: 30px 0;
    font-size: 4em;
    line-height: 1;
    letter-spacing: -1px;
  }
</style>

<div class="container">
  <h1>404</h1>

  <p><strong>Page not found :(</strong></p>
  <p>The requested page could not be found.</p>
</div>
```

#### 清理不需要的相依性

由於這個縮網址服務不需要任何的主題與擴充元件，因此我們可以將 Gemfile 裡面用不到的相依性清除，如 `minima`, `jekyll-feed` 等。

以下是我最後的 Gemfile：

```Gemfile
source "https://rubygems.org"
# Hello! This is where you manage which Jekyll version is used to run.
# When you want to use a different version, change it below, save the
# file and run `bundle install`. Run Jekyll with `bundle exec`, like so:
#
#     bundle exec jekyll serve
#
# This will help ensure the proper Jekyll version is running.
# Happy Jekylling!
gem "jekyll", "~> 4.3.4"
# If you want to use GitHub Pages, remove the "gem "jekyll"" above and
# uncomment the line below. To upgrade, run `bundle update github-pages`.
# gem "github-pages", group: :jekyll_plugins
#
# Windows and JRuby does not include zoneinfo files, so bundle the tzinfo-data gem
# and associated library.
platforms :mingw, :x64_mingw, :mswin, :jruby do
  gem "tzinfo", ">= 1", "< 3"
  gem "tzinfo-data"
end

# Performance-booster for watching directories on Windows
gem "wdm", "~> 0.1", :platforms => [:mingw, :x64_mingw, :mswin]

# Lock `http_parser.rb` gem to `v0.6.x` on JRuby builds since newer versions of the gem
# do not have a Java counterpart.
gem "http_parser.rb", "~> 0.6.0", :platforms => [:jruby]
```

#### 修改 `_config.yml`

把基本的資訊都寫入 `_config.yml` 中，並且加上重導向相關的機制：

```yaml
title: URL shortener
email: hydai@hyd.ai
description: >- # this means to ignore newlines until "baseurl:"
  URL shortener for hyd.ai
baseurl: "" # the subpath of your site, e.g. /blog
url: "https://hyd.ai" # the base hostname & protocol for your site, e.g. http://example.com
twitter_username: hydai_tw
github_username:  hydai

collections:
  redirects:
    output: true
    permalink: /:path/
```

到此為止就是整個縮網址服務的建立流程，接下來就是部署的部分。

### 部署到 GitHub Pages

在這個專案中，新增一個 workflows 的檔案 `jekyll.yml`，你可以取不同的名字，他將用來處理我們部署到 GitHub Pages 所用。

```yaml
# 給個名字
name: Deploy Jekyll site to Pages

on:
  # Runs on pushes targeting the default branch
  # 只有在 commits 被推到 main 分支時才會觸發
  push:
    branches: ["main"]

  # 允許你手動觸發這個 workflow
  workflow_dispatch:

# 設定 GITHUB_TOKEN 的權限，讓他可以部署到 GitHub Pages
permissions:
  contents: read
  pages: write
  id-token: write

# 如果有多個部署在排隊，我們只會保留最新的來執行，但不會取消正在進行的部署
concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        # 將程式碼 checkout 到 runner 上
        uses: actions/checkout@v4
      - name: Setup Ruby
        # 設定 Ruby 環境
        uses: ruby/setup-ruby@v1
        with:
          ruby-version: '3.3'
          bundler-cache: true
          cache-version: 0
      - name: Setup Pages
        id: pages
        uses: actions/configure-pages@v5
      - name: Build with Jekyll
        # 預設會輸出到 './_site' 目錄
        run: bundle exec jekyll build --baseurl "${{ steps.pages.outputs.base_path }}"
        env:
          JEKYLL_ENV: production
      - name: Upload artifact
        # 預設會上傳 './_site' 目錄
        uses: actions/upload-pages-artifact@v3

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### 在 GitHub 上啟用 Pages

要注意的是，當將上面的 workflow 啟用後，如果以前在該 repo 上並沒有啟用過 GitHub Pages 的話，你需要到 `Settings` -> `Pages` 中啟用 GitHub Pages。

因為我們是使用 GitHub Pages 的服務，因此在 `Build and deployment` -> `Source` 中選擇 `GitHub Actions` 即可。

### 使用自己的網域

如果你有自己的網域，同樣在 `Settings` -> `Pages` 中的 `Custom domain` 欄位把自己的子網域放上去。

## 結語

這個縮網址服務的建立流程其實非常簡單，只要有一點點的 HTML 與 markdown 的基礎，就可以輕鬆的建立一個屬於自己的縮網址服務。過程間也不需要去理解 Jekyll 的運作原理，只要知道怎麼建立版型與配置就可以了。
