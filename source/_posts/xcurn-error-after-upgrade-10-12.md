---
title: 每次升級 mac os 總會遇到的 xcrun error invalid active developer path, missing xcurn at ... 
date: 2016-10-01 20:21:30
tags:
- MacOS
- xcurn
categories:
- Note
---


每次升級總會遇上一次的 xcrun error ，
為了不要每次都查資料，
來把它記錄一下吧！

<!-- more -->

上次遇到好像是從 10.10 升級到 10.11 的時候，
同樣的這次從 10.11 升級到 10.12 也是遇到一樣的問題。

每次升級完以後，xcode 跟要抓取的 lib 好像就會跑掉，
當我在跑 `brew update` 的時候就會噴出下面這種 error:

```bash
$ brew update
xcrun: error: invalid active developer path (/Library/Developer/CommandLineTools),
missing xcrun at: /Library/Developer/CommandLineTools/usr/bin/xcrun)
```

要解決的方法很簡單，看到上面的關鍵字 `CommandLineTools`，
我們就把 xcode 的 CommandLineTools 裝上來就能解掉這個問題囉～

```bash
xcode-select --install
```

執行這行以後，他會問你要不要 `取得 xcode`，
如果你只是需要解掉這個問題，並沒有要使用 xcode 做開發的話，
直接選「安裝」即可，不安裝 xcode 的話，可以省下很多空間跟時間呢！
